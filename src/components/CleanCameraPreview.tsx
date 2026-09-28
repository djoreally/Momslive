import React, { useEffect, useRef } from 'react';

interface CleanCameraPreviewProps {
  stream: MediaStream | null;
  mirror?: boolean;
}

export const CleanCameraPreview: React.FC<CleanCameraPreviewProps> = ({ stream, mirror = true }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    if (stream) {
      video.play().catch(() => undefined);
    }
    return () => {
      if (video) video.srcObject = null;
    };
  }, [stream]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="h-full w-full object-cover"
        style={{ transform: mirror ? 'scaleX(-1)' : undefined }}
      />
    </div>
  );
};
