export interface AiSegmentationFrame {
  width: number;
  height: number;
  categories: Uint8Array;
  whiteClothingDetected: boolean;
}

interface PendingRequest {
  resolve: (value: AiSegmentationFrame | null) => void;
  reject: (reason?: unknown) => void;
}

let worker: Worker | null = null;
let readyPromise: Promise<void> | null = null;
let requestId = 0;
const pending = new Map<number, PendingRequest>();

function getWorker(): Worker {
  if (worker) return worker;

  worker = new Worker(new URL('../workers/aiSegmentation.worker.ts', import.meta.url), {
    type: 'module',
    name: 'momslive-ai-segmentation',
  });

  worker.onmessage = (event: MessageEvent) => {
    const message = event.data;

    if (message?.type === 'ready') return;

    if (message?.type === 'result') {
      const request = pending.get(message.id);
      if (!request) return;
      pending.delete(message.id);

      if (message.empty) {
        request.resolve(null);
        return;
      }

      request.resolve({
        width: message.width,
        height: message.height,
        categories: new Uint8Array(message.categories),
        whiteClothingDetected: Boolean(message.whiteClothingDetected),
      });
      return;
    }

    if (message?.type === 'error') {
      const request = pending.get(message.id);
      if (request) {
        pending.delete(message.id);
        request.reject(new Error(message.error || 'AI segmentation worker error'));
      }
    }
  };

  worker.onerror = (event) => {
    for (const request of pending.values()) {
      request.reject(event.error || new Error('AI segmentation worker crashed'));
    }
    pending.clear();
    readyPromise = null;
    worker?.terminate();
    worker = null;
  };

  return worker;
}

export function prepareAiPersonSegmenter(): Promise<void> {
  if (readyPromise) return readyPromise;

  readyPromise = new Promise<void>((resolve, reject) => {
    const instance = getWorker();
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'ready') {
        instance.removeEventListener('message', onMessage);
        resolve();
      } else if (event.data?.type === 'error' && event.data?.id == null) {
        instance.removeEventListener('message', onMessage);
        readyPromise = null;
        reject(new Error(event.data.error || 'AI worker initialization failed'));
      }
    };

    instance.addEventListener('message', onMessage);
    instance.postMessage({ type: 'init' });
  });

  return readyPromise;
}

export async function segmentPersonFrame(
  video: HTMLVideoElement
): Promise<AiSegmentationFrame | null> {
  await prepareAiPersonSegmenter();

  const bitmap = await createImageBitmap(video);
  const id = ++requestId;

  return new Promise<AiSegmentationFrame | null>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    getWorker().postMessage(
      {
        type: 'segment',
        id,
        bitmap,
      },
      [bitmap]
    );
  });
}
