import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  AspectRatio,
  MicConfig,
  ResolutionPreset,
  StudioSetting,
  TargetFrameRate,
  UserFraming,
} from '../types';
import { getTargetDimensions } from '../utils/camera';
import { drawStudioMicrophone } from '../utils/drawMicrophone';
import { prepareAiPersonSegmenter, segmentPersonFrame } from '../utils/aiPersonSegmenter';
import { StudioCanvasHandle } from './StudioCanvas';

interface AiPersonStudioCanvasProps {
  stream: MediaStream | null;
  framing: UserFraming;
  micConfig: MicConfig;
  studioSetting: StudioSetting;
  aspectRatio: AspectRatio;
  resolution: ResolutionPreset;
  frameRate: TargetFrameRate;
  showBrandedOverlays: boolean;
  showMomsOverlay?: boolean;
  audioLevel: number;
  isRecording: boolean;
}

export const AiPersonStudioCanvas = forwardRef<StudioCanvasHandle, AiPersonStudioCanvasProps>(({
  stream,
  framing,
  micConfig,
  studioSetting,
  aspectRatio,
  resolution,
  frameRate,
  showBrandedOverlays,
  showMomsOverlay = true,
  audioLevel,
  isRecording,
}, ref) => {
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const personMaskRef = useRef<HTMLCanvasElement | null>(null);
  const clothingTintRef = useRef<HTMLCanvasElement | null>(null);
  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const momsOverlayImgRef = useRef<HTMLImageElement | null>(null);
  const workingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const processingRef = useRef(false);
  const lastInferenceRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { width: canvasWidth, height: canvasHeight } = getTargetDimensions(
    resolution,
    aspectRatio,
    videoRef.current?.videoWidth || 1920,
    videoRef.current?.videoHeight || 1080
  );

  useEffect(() => {
    let active = true;
    setError(null);
    prepareAiPersonSegmenter()
      .then(() => {
        if (active) setReady(true);
      })
      .catch((err) => {
        console.error('AI person segmentation failed to initialize:', err);
        if (active) setError('AI cutout failed to load');
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = studioSetting.bgImageUrl;
    img.onload = () => {
      bgImgRef.current = img;
    };
  }, [studioSetting.bgImageUrl]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/moms_overlay.png';
    img.onload = () => {
      momsOverlayImgRef.current = img;
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    if (stream) video.play().catch(() => undefined);
    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  const updateMask = useCallback((video: HTMLVideoElement) => {
    if (!ready || processingRef.current) return;
    const now = performance.now();
    if (now - lastInferenceRef.current < 90) return;

    lastInferenceRef.current = now;
    processingRef.current = true;

    segmentPersonFrame(video, now)
      .then((frame) => {
        if (!frame) return;

        if (!personMaskRef.current) personMaskRef.current = document.createElement('canvas');
        if (!clothingTintRef.current) clothingTintRef.current = document.createElement('canvas');

        const maskCanvas = personMaskRef.current;
        const clothesCanvas = clothingTintRef.current;
        maskCanvas.width = frame.width;
        maskCanvas.height = frame.height;
        clothesCanvas.width = frame.width;
        clothesCanvas.height = frame.height;

        const maskCtx = maskCanvas.getContext('2d');
        const clothesCtx = clothesCanvas.getContext('2d');
        if (!maskCtx || !clothesCtx) return;

        const mask = maskCtx.createImageData(frame.width, frame.height);
        const clothes = clothesCtx.createImageData(frame.width, frame.height);

        for (let i = 0; i < frame.categories.length; i += 1) {
          const category = frame.categories[i];
          const p = i * 4;

          if (category !== 0) {
            mask.data[p] = 255;
            mask.data[p + 1] = 255;
            mask.data[p + 2] = 255;
            mask.data[p + 3] = 255;
          }

          if (frame.whiteClothingDetected && category === 4) {
            clothes.data[p] = 0;
            clothes.data[p + 1] = 67;
            clothes.data[p + 2] = 147;
            clothes.data[p + 3] = 180;
          }
        }

        maskCtx.putImageData(mask, 0, 0);
        clothesCtx.putImageData(clothes, 0, 0);
      })
      .catch((err) => console.warn('AI segmentation frame failed:', err))
      .finally(() => {
        processingRef.current = false;
      });
  }, [ready]);

  const takeSnapshot = useCallback((): string | null => {
    return mainCanvasRef.current?.toDataURL('image/jpeg', 0.95) || null;
  }, []);

  useImperativeHandle(ref, () => ({
    getCanvasStream: () => mainCanvasRef.current?.captureStream(frameRate) || null,
    captureEmptyWallSnapshot: () => undefined,
    clearEmptyWallSnapshot: () => undefined,
    hasEmptyWallCapture: false,
    takeSnapshot,
    autoSampleWall: () => null,
  }), [frameRate, takeSnapshot]);

  useEffect(() => {
    let raf = 0;
    let active = true;

    const render = () => {
      if (!active) return;

      const canvas = mainCanvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) {
        raf = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        raf = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      const bg = bgImgRef.current;
      if (bg && bg.complete && bg.naturalWidth > 0) {
        ctx.save();
        ctx.filter = studioSetting.blur > 0
          ? `blur(${studioSetting.blur}px) brightness(${studioSetting.brightness})`
          : `brightness(${studioSetting.brightness})`;

        const imgRatio = bg.width / bg.height;
        const targetRatio = canvasWidth / canvasHeight;
        let w = canvasWidth;
        let h = canvasHeight;
        let x = 0;
        let y = 0;

        if (imgRatio > targetRatio) {
          w = canvasHeight * imgRatio;
          x = (canvasWidth - w) / 2;
        } else {
          h = canvasWidth / imgRatio;
          y = (canvasHeight - h) / 2;
        }
        ctx.drawImage(bg, x, y, w, h);
        ctx.restore();
      }

      if (video.readyState >= 2 && video.videoWidth > 0) {
        updateMask(video);

        if (!workingCanvasRef.current) workingCanvasRef.current = document.createElement('canvas');
        const working = workingCanvasRef.current;
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        working.width = vw;
        working.height = vh;
        const workCtx = working.getContext('2d');

        if (workCtx) {
          workCtx.clearRect(0, 0, vw, vh);
          workCtx.drawImage(video, 0, 0, vw, vh);

          const mask = personMaskRef.current;
          if (ready && mask) {
            workCtx.save();
            workCtx.globalCompositeOperation = 'destination-in';
            workCtx.drawImage(mask, 0, 0, vw, vh);
            workCtx.restore();

            if (studioSetting.id === 'clean_white' && clothingTintRef.current) {
              workCtx.save();
              workCtx.globalCompositeOperation = 'source-atop';
              workCtx.drawImage(clothingTintRef.current, 0, 0, vw, vh);
              workCtx.restore();
            }
          }

          const targetUserWidth = canvasWidth * 1.15 * framing.scale;
          const targetUserHeight = (vh / vw) * targetUserWidth;
          const centerX = canvasWidth * 0.5 + (framing.offsetX / 100) * canvasWidth;
          const bottomY = canvasHeight * 1.05 + (framing.offsetY / 100) * canvasHeight;
          const drawX = centerX - targetUserWidth / 2;
          const drawY = bottomY - targetUserHeight;

          ctx.save();
          if (framing.mirror) {
            ctx.translate(canvasWidth, 0);
            ctx.scale(-1, 1);
            const mirroredX = canvasWidth - drawX - targetUserWidth;
            ctx.drawImage(working, mirroredX, drawY, targetUserWidth, targetUserHeight);
          } else {
            ctx.drawImage(working, drawX, drawY, targetUserWidth, targetUserHeight);
          }
          ctx.restore();
        }
      }

      drawStudioMicrophone(ctx, canvasWidth, canvasHeight, micConfig, audioLevel);

      if (showMomsOverlay && momsOverlayImgRef.current?.complete) {
        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.drawImage(momsOverlayImgRef.current, 0, 0, canvasWidth, canvasHeight);
        ctx.restore();
      }

      if (showBrandedOverlays && isRecording) {
        ctx.save();
        const scale = Math.max(1, canvasHeight / 1080);
        ctx.fillStyle = 'rgba(239,68,68,.95)';
        ctx.beginPath();
        ctx.roundRect(24 * scale, 24 * scale, 96 * scale, 32 * scale, 16 * scale);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = `700 ${Math.round(13 * scale)}px Arial, sans-serif`;
        ctx.fillText('● REC', 38 * scale, 45 * scale);
        ctx.restore();
      }

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => {
      active = false;
      cancelAnimationFrame(raf);
    };
  }, [
    canvasWidth,
    canvasHeight,
    framing,
    micConfig,
    studioSetting,
    showBrandedOverlays,
    showMomsOverlay,
    audioLevel,
    isRecording,
    ready,
    updateMask,
  ]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black flex items-center justify-center">
      <video ref={videoRef} playsInline muted autoPlay className="hidden" />
      <canvas
        ref={mainCanvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
        style={{ aspectRatio: aspectRatio === '9:16' ? '9/16' : '16/9' }}
      />
      <div className="absolute top-4 left-4 rounded-full bg-black/70 border border-blue-500/40 px-3 py-1.5 text-[10px] font-bold text-blue-100 backdrop-blur pointer-events-none">
        {error ? 'AI CUTOUT · FALLBACK' : ready ? 'AI CUTOUT · NO WHITE WALL NEEDED' : 'AI CUTOUT · LOADING'}
      </div>
    </div>
  );
});

AiPersonStudioCanvas.displayName = 'AiPersonStudioCanvas';
