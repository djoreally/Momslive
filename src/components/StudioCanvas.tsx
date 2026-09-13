import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { ChromaKeyConfig, UserFraming, MicConfig, StudioSetting, AspectRatio, ResolutionPreset, TargetFrameRate } from '../types';
import { applyWhiteScreenKey, sampleWallColor } from '../utils/chromaKey';
import { drawStudioMicrophone } from '../utils/drawMicrophone';
import { getTargetDimensions } from '../utils/camera';

export interface StudioCanvasHandle {
  getCanvasStream: () => MediaStream | null;
  captureEmptyWallSnapshot: () => void;
  clearEmptyWallSnapshot: () => void;
  hasEmptyWallCapture: boolean;
  takeSnapshot: () => string | null;
  autoSampleWall: () => { r: number; g: number; b: number; luminance: number; saturation: number } | null;
}

interface StudioCanvasProps {
  stream: MediaStream | null;
  chromaConfig: ChromaKeyConfig;
  framing: UserFraming;
  micConfig: MicConfig;
  studioSetting: StudioSetting;
  aspectRatio: AspectRatio;
  resolution: ResolutionPreset;
  frameRate: TargetFrameRate;
  showBrandedOverlays: boolean;
  audioLevel: number;
  isSamplingColor: boolean;
  onSampledColor: (color: { r: number; g: number; b: number; luminance: number; saturation: number }) => void;
  isRecording: boolean;
}

export const StudioCanvas = forwardRef<StudioCanvasHandle, StudioCanvasProps>(({
  stream,
  chromaConfig,
  framing,
  micConfig,
  studioSetting,
  aspectRatio,
  resolution,
  frameRate,
  showBrandedOverlays,
  audioLevel,
  isSamplingColor,
  onSampledColor,
  isRecording,
}, ref) => {
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const emptyWallDataRef = useRef<ImageData | null>(null);
  const [hasEmptyWallCapture, setHasEmptyWallCapture] = useState(false);

  // Dynamic canvas dimensions based on chosen resolution (4K, 8K, 2K, 1080p) and aspect ratio
  const { width: canvasWidth, height: canvasHeight } = getTargetDimensions(
    resolution,
    aspectRatio,
    videoRef.current?.videoWidth || 3840,
    videoRef.current?.videoHeight || 2160
  );

  // Load background image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = studioSetting.bgImageUrl;
    img.onload = () => {
      bgImgRef.current = img;
    };
  }, [studioSetting.bgImageUrl]);

  // Connect video element to user's webcam stream
  useEffect(() => {
    if (!videoRef.current) return;
    if (stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        console.warn('Camera video play error:', err);
      });
    } else {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  // Capture empty wall snapshot for difference matting
  const captureEmptyWallSnapshot = useCallback(() => {
    if (!videoRef.current || !offscreenCanvasRef.current) return;
    const video = videoRef.current;
    if (video.readyState < 2) return;

    const offCanvas = offscreenCanvasRef.current;
    const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
    if (!offCtx) return;

    offCanvas.width = video.videoWidth || 640;
    offCanvas.height = video.videoHeight || 480;
    offCtx.drawImage(video, 0, 0, offCanvas.width, offCanvas.height);
    emptyWallDataRef.current = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
    setHasEmptyWallCapture(true);
  }, []);

  const clearEmptyWallSnapshot = useCallback(() => {
    emptyWallDataRef.current = null;
    setHasEmptyWallCapture(false);
  }, []);

  // Take full-resolution snapshot
  const takeSnapshot = useCallback((): string | null => {
    if (!mainCanvasRef.current) return null;
    return mainCanvasRef.current.toDataURL('image/jpeg', 0.95);
  }, []);

  // Auto-sample wall color by inspecting the four corners
  const autoSampleWall = useCallback(() => {
    if (!videoRef.current || !offscreenCanvasRef.current) return null;
    const video = videoRef.current;
    if (video.readyState < 2) return null;

    const offCanvas = offscreenCanvasRef.current;
    const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
    if (!offCtx) return null;

    offCanvas.width = video.videoWidth || 640;
    offCanvas.height = video.videoHeight || 480;
    offCtx.drawImage(video, 0, 0, offCanvas.width, offCanvas.height);

    // Sample top corner (usually wall)
    const result = sampleWallColor(offCtx, offCanvas.width * 0.15, offCanvas.height * 0.15, 12);
    onSampledColor(result);
    return result;
  }, [onSampledColor]);

  // Expose methods via ref - captureStream at selected target frameRate (60 or 30 fps)
  useImperativeHandle(ref, () => ({
    getCanvasStream: () => {
      if (!mainCanvasRef.current) return null;
      return mainCanvasRef.current.captureStream(frameRate);
    },
    captureEmptyWallSnapshot,
    clearEmptyWallSnapshot,
    hasEmptyWallCapture,
    takeSnapshot,
    autoSampleWall,
  }), [captureEmptyWallSnapshot, clearEmptyWallSnapshot, hasEmptyWallCapture, takeSnapshot, autoSampleWall, frameRate]);

  // Click on canvas to sample wall color (eyedropper tool)
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isSamplingColor || !mainCanvasRef.current || !offscreenCanvasRef.current) return;
    const canvas = mainCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * offscreenCanvasRef.current.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * offscreenCanvasRef.current.height;

    const offCtx = offscreenCanvasRef.current.getContext('2d', { willReadFrequently: true });
    if (offCtx) {
      const sampled = sampleWallColor(offCtx, clickX, clickY, 8);
      onSampledColor(sampled);
    }
  };

  // Main Render Loop
  useEffect(() => {
    let animationId: number;
    let isMounted = true;

    // Create a temporary canvas for holding the segmented user frame
    const userProcessedCanvas = document.createElement('canvas');
    const userProcessedCtx = userProcessedCanvas.getContext('2d');

    const render = () => {
      if (!isMounted) return;

      const mainCanvas = mainCanvasRef.current;
      const video = videoRef.current;
      if (!mainCanvas || !video) {
        animationId = requestAnimationFrame(render);
        return;
      }

      const ctx = mainCanvas.getContext('2d', { alpha: false });
      if (!ctx) {
        animationId = requestAnimationFrame(render);
        return;
      }

      // 1. CLEAR & DRAW BACKGROUND LAYER
      ctx.fillStyle = '#171717';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      if (bgImgRef.current && bgImgRef.current.complete && bgImgRef.current.naturalWidth > 0) {
        ctx.save();
        if (studioSetting.blur > 0) {
          ctx.filter = `blur(${studioSetting.blur}px) brightness(${studioSetting.brightness})`;
        } else if (studioSetting.brightness !== 1.0) {
          ctx.filter = `brightness(${studioSetting.brightness})`;
        }

        // Draw background fitted to cover canvas
        const img = bgImgRef.current;
        const imgRatio = img.width / img.height;
        const targetRatio = canvasWidth / canvasHeight;

        let drawW = canvasWidth;
        let drawH = canvasHeight;
        let drawX = 0;
        let drawY = 0;

        if (imgRatio > targetRatio) {
          drawW = canvasHeight * imgRatio;
          drawX = (canvasWidth - drawW) / 2;
        } else {
          drawH = canvasWidth / imgRatio;
          drawY = (canvasHeight - drawH) / 2;
        }

        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        ctx.restore();
      } else {
        // Fallback stylish studio backdrop
        const grad = ctx.createRadialGradient(
          canvasWidth * 0.5, canvasHeight * 0.4, 100,
          canvasWidth * 0.5, canvasHeight * 0.5, canvasWidth * 0.8
        );
        grad.addColorStop(0, '#f8fafc');
        grad.addColorStop(0.6, '#e2e8f0');
        grad.addColorStop(1, '#94a3b8');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }

      // 2. PROCESS USER WEBCAM VIDEO WITH WHITE SCREEN CHROMA KEY
      if (video.readyState >= 2 && video.videoWidth > 0) {
        const vw = video.videoWidth;
        const vh = video.videoHeight;

        if (!offscreenCanvasRef.current) {
          offscreenCanvasRef.current = document.createElement('canvas');
        }
        const offCanvas = offscreenCanvasRef.current;
        if (offCanvas.width !== vw || offCanvas.height !== vh) {
          offCanvas.width = vw;
          offCanvas.height = vh;
        }

        const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
        if (offCtx) {
          offCtx.drawImage(video, 0, 0, vw, vh);

          // Apply white-screen keying
          const keyedImageData = applyWhiteScreenKey(
            offCtx,
            vw,
            vh,
            chromaConfig,
            emptyWallDataRef.current
          );

          if (userProcessedCanvas.width !== vw || userProcessedCanvas.height !== vh) {
            userProcessedCanvas.width = vw;
            userProcessedCanvas.height = vh;
          }
          if (userProcessedCtx) {
            userProcessedCtx.putImageData(keyedImageData, 0, 0);

            // 3. DRAW USER INTO THE SCENE (BEHIND THE MICROPHONE)
            ctx.save();

            // Framing adjustments: Scale & Position
            const targetUserWidth = canvasWidth * 1.15 * framing.scale;
            const targetUserHeight = (vh / vw) * targetUserWidth;

            const userCenterX = canvasWidth * 0.5 + (framing.offsetX / 100) * canvasWidth;
            const userBottomY = canvasHeight * 1.05 + (framing.offsetY / 100) * canvasHeight;
            const userDrawX = userCenterX - targetUserWidth / 2;
            const userDrawY = userBottomY - targetUserHeight;

            // Mirror video option
            if (framing.mirror) {
              ctx.translate(canvasWidth, 0);
              ctx.scale(-1, 1);
              const mirroredDrawX = canvasWidth - userDrawX - targetUserWidth;
              ctx.drawImage(userProcessedCanvas, mirroredDrawX, userDrawY, targetUserWidth, targetUserHeight);
            } else {
              ctx.drawImage(userProcessedCanvas, userDrawX, userDrawY, targetUserWidth, targetUserHeight);
            }

            ctx.restore();
          }
        }
      }

      // 4. DRAW FOREGROUND STUDIO MICROPHONE & STAND WITH WRAP
      drawStudioMicrophone(ctx, canvasWidth, canvasHeight, micConfig, audioLevel);

      // 5. DRAW BRANDED OVERLAYS (MOMS LOGO, WEBSITE, QR CODE)
      if (showBrandedOverlays) {
        ctx.save();
        // If studio backdrop already has graphics, draw subtle complementary lower third or live badge
        if (isRecording) {
          const scaleFactor = Math.max(1, canvasHeight / 1080);
          const badgeX = 24 * scaleFactor;
          const badgeY = 24 * scaleFactor;
          const badgeW = 92 * scaleFactor;
          const badgeH = 32 * scaleFactor;
          const badgeR = 16 * scaleFactor;

          // Recording Live Pill Top Left
          ctx.fillStyle = 'rgba(239, 68, 68, 0.95)';
          ctx.beginPath();
          ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeR);
          ctx.fill();

          // Blinking white circle
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(badgeX + 16 * scaleFactor, badgeY + badgeH / 2, 5 * scaleFactor, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = `700 ${Math.round(13 * scaleFactor)}px 'Plus Jakarta Sans', sans-serif`;
          ctx.fillStyle = '#ffffff';
          ctx.fillText('REC', badgeX + 28 * scaleFactor, badgeY + badgeH / 2 + 4.5 * scaleFactor);

          // Resolution tag badge in recording indicator
          const resTag = resolution.toUpperCase();
          ctx.font = `600 ${Math.round(10 * scaleFactor)}px 'Plus Jakarta Sans', sans-serif`;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
          ctx.fillText(resTag, badgeX + 60 * scaleFactor, badgeY + badgeH / 2 + 4 * scaleFactor);
        }
        ctx.restore();
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      isMounted = false;
      cancelAnimationFrame(animationId);
    };
  }, [
    canvasWidth,
    canvasHeight,
    chromaConfig,
    framing,
    micConfig,
    studioSetting,
    showBrandedOverlays,
    audioLevel,
    isRecording,
  ]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black/90 overflow-hidden select-none">
      {/* Hidden webcam video stream element */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="hidden"
      />

      {/* Main Studio Composite Canvas */}
      <canvas
        id="studio-viewport-canvas"
        ref={mainCanvasRef}
        width={canvasWidth}
        height={canvasHeight}
        onClick={handleCanvasClick}
        className={`max-w-full max-h-full object-contain rounded-xl shadow-2xl transition-all ${
          isSamplingColor ? 'cursor-crosshair ring-2 ring-blue-500' : ''
        }`}
        style={{
          aspectRatio: aspectRatio === '9:16' ? '9/16' : '16/9',
        }}
      />

      {/* Eyedropper Sampling Active Banner */}
      {isSamplingColor && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-semibold shadow-lg animate-bounce pointer-events-none flex items-center gap-2">
          <span>Click anywhere on your white wall to sample</span>
        </div>
      )}
    </div>
  );
});

StudioCanvas.displayName = 'StudioCanvas';
