import React, { useMemo, useState } from 'react';
import { Player } from '@remotion/player';
import { MomsRemotionComposition, MomsRenderFormat } from './MomsRemotionComposition';

interface MomsRemotionPreviewProps {
  videoUrl: string;
  durationSeconds: number;
  workspaceName?: string;
}

const FORMAT_SPECS: Record<MomsRenderFormat, { width: number; height: number; label: string }> = {
  vertical: { width: 1080, height: 1920, label: '9:16 Reel / Short' },
  landscape: { width: 1920, height: 1080, label: '16:9 YouTube' },
  square: { width: 1080, height: 1080, label: '1:1 Social' },
};

export const MomsRemotionPreview: React.FC<MomsRemotionPreviewProps> = ({
  videoUrl,
  durationSeconds,
  workspaceName,
}) => {
  const [format, setFormat] = useState<MomsRenderFormat>('vertical');
  const [title, setTitle] = useState('MOMS Mobile Oil Change');
  const [subtitle, setSubtitle] = useState('Mobile service. Done where you are.');
  const spec = FORMAT_SPECS[format];
  const fps = 30;
  const durationInFrames = useMemo(
    () => Math.max(fps, Math.ceil(Math.max(1, durationSeconds) * fps)),
    [durationSeconds]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h4 className="text-sm font-bold text-white">Remotion Post-Production</h4>
          <p className="text-[11px] text-neutral-400">
            Preview branded social exports without changing the original recording.
          </p>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full border border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-300 font-bold">
          REMOTION
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(FORMAT_SPECS) as MomsRenderFormat[]).map((key) => (
          <button
            key={key}
            onClick={() => setFormat(key)}
            className={`rounded-lg px-2 py-2 text-[10px] font-bold border transition-colors ${
              format === key
                ? 'bg-fuchsia-600/20 border-fuchsia-500/60 text-fuchsia-200'
                : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white'
            }`}
          >
            {FORMAT_SPECS[key].label}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg bg-neutral-950 border border-neutral-700 px-3 py-2 text-xs text-white"
          aria-label="Remotion title"
        />
        <input
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          className="w-full rounded-lg bg-neutral-950 border border-neutral-700 px-3 py-2 text-xs text-white"
          aria-label="Remotion subtitle"
        />
      </div>

      <div className="rounded-xl overflow-hidden bg-black border border-neutral-700 mx-auto" style={{ maxWidth: format === 'vertical' ? 260 : 520 }}>
        <Player
          component={MomsRemotionComposition}
          inputProps={{
            videoUrl,
            title,
            subtitle: workspaceName ? `${subtitle} • ${workspaceName}` : subtitle,
            showBranding: true,
          }}
          durationInFrames={durationInFrames}
          compositionWidth={spec.width}
          compositionHeight={spec.height}
          fps={fps}
          controls
          style={{ width: '100%', aspectRatio: `${spec.width}/${spec.height}` }}
        />
      </div>

      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[10px] text-amber-200">
        Export rendering is isolated from live capture. The original master remains untouched.
      </div>
    </div>
  );
};
