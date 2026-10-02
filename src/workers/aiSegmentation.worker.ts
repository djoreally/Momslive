const MODULE_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/vision_bundle.mjs';
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite';

let segmenterPromise: Promise<any> | null = null;

async function getSegmenter() {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      const visionModule = await import(/* @vite-ignore */ MODULE_URL);
      const vision = await visionModule.FilesetResolver.forVisionTasks(WASM_URL);

      const create = (delegate: 'GPU' | 'CPU') =>
        visionModule.ImageSegmenter.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate,
          },
          runningMode: 'IMAGE',
          outputCategoryMask: true,
          outputConfidenceMasks: false,
        });

      try {
        return await create('GPU');
      } catch {
        return create('CPU');
      }
    })();
  }

  try {
    return await segmenterPromise;
  } catch (err) {
    segmenterPromise = null;
    throw err;
  }
}

function detectWhiteClothing(
  bitmap: ImageBitmap,
  categories: Uint8Array,
  width: number,
  height: number
): boolean {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return false;

  ctx.drawImage(bitmap, 0, 0, width, height);
  const pixels = ctx.getImageData(0, 0, width, height).data;

  let clothingPixels = 0;
  let brightClothingPixels = 0;

  for (let i = 0; i < categories.length; i += 1) {
    if (categories[i] !== 4) continue;
    clothingPixels += 1;

    const p = i * 4;
    const r = pixels[p];
    const g = pixels[p + 1];
    const b = pixels[p + 2];
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    const saturation = maxC === 0 ? 0 : (maxC - minC) / maxC;

    if (luminance > 0.82 && saturation < 0.18) {
      brightClothingPixels += 1;
    }
  }

  return clothingPixels >= 50 && brightClothingPixels / clothingPixels > 0.45;
}

self.onmessage = async (event: MessageEvent) => {
  const message = event.data;

  if (message?.type === 'init') {
    try {
      await getSegmenter();
      self.postMessage({ type: 'ready' });
    } catch (err) {
      self.postMessage({
        type: 'error',
        id: message.id,
        error: err instanceof Error ? err.message : 'AI worker initialization failed',
      });
    }
    return;
  }

  if (message?.type !== 'segment' || !message.bitmap) return;

  const bitmap = message.bitmap as ImageBitmap;

  try {
    const segmenter = await getSegmenter();

    segmenter.segment(bitmap, (result: any) => {
      const mask = result.categoryMask;
      if (!mask) {
        bitmap.close();
        self.postMessage({ type: 'result', id: message.id, empty: true });
        return;
      }

      const categories = new Uint8Array(mask.getAsUint8Array());
      const whiteClothingDetected = detectWhiteClothing(
        bitmap,
        categories,
        mask.width,
        mask.height
      );

      bitmap.close();

      self.postMessage(
        {
          type: 'result',
          id: message.id,
          width: mask.width,
          height: mask.height,
          categories,
          whiteClothingDetected,
        },
        [categories.buffer]
      );
    });
  } catch (err) {
    bitmap.close();
    self.postMessage({
      type: 'error',
      id: message.id,
      error: err instanceof Error ? err.message : 'AI segmentation failed',
    });
  }
};
