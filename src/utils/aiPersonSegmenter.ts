const MODULE_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/vision_bundle.mjs';
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite';

export interface AiSegmentationFrame {
  width: number;
  height: number;
  categories: Uint8Array;
  whiteClothingDetected: boolean;
}

interface SegmenterResult {
  categoryMask?: {
    width: number;
    height: number;
    getAsUint8Array: () => Uint8Array;
  };
}

interface SegmenterLike {
  segmentForVideo: (
    video: HTMLVideoElement,
    timestampMs: number,
    callback: (result: SegmenterResult) => void
  ) => void;
}

let segmenterPromise: Promise<SegmenterLike> | null = null;

async function getSegmenter(): Promise<SegmenterLike> {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      const visionModule = await import(/* @vite-ignore */ MODULE_URL);
      const vision = await visionModule.FilesetResolver.forVisionTasks(WASM_URL);
      return visionModule.ImageSegmenter.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: 'CPU',
        },
        runningMode: 'VIDEO',
        outputCategoryMask: true,
        outputConfidenceMasks: false,
      }) as Promise<SegmenterLike>;
    })();
  }
  return segmenterPromise;
}

export async function prepareAiPersonSegmenter(): Promise<void> {
  await getSegmenter();
}

function detectWhiteClothing(
  video: HTMLVideoElement,
  categories: Uint8Array,
  maskWidth: number,
  maskHeight: number
): boolean {
  if (maskWidth <= 0 || maskHeight <= 0) return false;

  const sample = document.createElement('canvas');
  sample.width = maskWidth;
  sample.height = maskHeight;
  const ctx = sample.getContext('2d', { willReadFrequently: true });
  if (!ctx) return false;

  ctx.drawImage(video, 0, 0, maskWidth, maskHeight);
  const pixels = ctx.getImageData(0, 0, maskWidth, maskHeight).data;

  let clothingPixels = 0;
  let brightClothingPixels = 0;

  for (let i = 0; i < categories.length; i += 1) {
    // Selfie Multiclass labels:
    // 0 background, 1 hair, 2 body/skin, 3 face/skin, 4 clothes, 5 accessories/other.
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

  if (clothingPixels < 50) return false;
  return brightClothingPixels / clothingPixels > 0.45;
}

export async function segmentPersonFrame(
  video: HTMLVideoElement,
  timestampMs: number
): Promise<AiSegmentationFrame | null> {
  const segmenter = await getSegmenter();

  return new Promise((resolve) => {
    segmenter.segmentForVideo(video, timestampMs, (result) => {
      const mask = result.categoryMask;
      if (!mask) {
        resolve(null);
        return;
      }

      const categories = new Uint8Array(mask.getAsUint8Array());
      resolve({
        width: mask.width,
        height: mask.height,
        categories,
        whiteClothingDetected: detectWhiteClothing(video, categories, mask.width, mask.height),
      });
    });
  });
}
