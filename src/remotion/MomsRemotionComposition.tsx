import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Video,
} from 'remotion';

export type MomsRenderFormat = 'vertical' | 'landscape' | 'square';

export interface MomsRemotionProps {
  videoUrl: string;
  title?: string;
  subtitle?: string;
  showBranding?: boolean;
}

export const MomsRemotionComposition: React.FC<MomsRemotionProps> = ({
  videoUrl,
  title = 'MOMS Mobile Oil Change',
  subtitle = 'Mobile service. Done where you are.',
  showBranding = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const introOpacity = interpolate(frame, [0, fps * 0.35, fps * 1.5, fps * 2], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const lowerThirdY = interpolate(frame, [fps * 0.4, fps], [80, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#050505', fontFamily: 'Arial, sans-serif' }}>
      <Video
        src={videoUrl}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {showBranding && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: 'linear-gradient(180deg, rgba(0,0,0,.48), transparent 28%, transparent 68%, rgba(0,0,0,.68))',
            }}
          />

          <div
            style={{
              position: 'absolute',
              top: 36,
              left: 36,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 18px',
              borderRadius: 999,
              backgroundColor: 'rgba(0,0,0,.72)',
              color: 'white',
              fontWeight: 800,
              fontSize: 28,
              letterSpacing: -0.8,
            }}
          >
            MOMS
            <span style={{ color: '#60a5fa', fontSize: 18, fontWeight: 700 }}>
              MOBILE OIL CHANGE
            </span>
          </div>

          <div
            style={{
              position: 'absolute',
              left: 40,
              right: 40,
              bottom: 44,
              transform: `translateY(${lowerThirdY}px)`,
              borderRadius: 24,
              padding: '22px 26px',
              backgroundColor: 'rgba(5,5,5,.82)',
              border: '1px solid rgba(255,255,255,.16)',
              color: 'white',
            }}
          >
            <div style={{ fontSize: 34, fontWeight: 900, lineHeight: 1.05 }}>{title}</div>
            <div style={{ marginTop: 8, fontSize: 20, color: '#d4d4d8', fontWeight: 600 }}>
              {subtitle}
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: introOpacity,
              color: 'white',
              fontSize: 54,
              fontWeight: 900,
              letterSpacing: -1.5,
              textAlign: 'center',
              textShadow: '0 4px 30px rgba(0,0,0,.8)',
              pointerEvents: 'none',
            }}
          >
            Recorded in MOMS Live
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};
