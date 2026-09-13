import React, { useState } from 'react';
import {
  DollarSign,
  Zap,
  HardDrive,
  Trash2,
  Check,
  AlertCircle,
  TrendingDown,
  Sparkles,
  Layers,
  FileCode,
  Copy,
  Info,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useCloudinary } from '../context/CloudinaryContext';
import { buildEmbedSnippet, formatFileSize } from '../utils/cloudinary';

export const CloudinaryCostOptimizer: React.FC = () => {
  const {
    status,
    recordings,
    costConfig,
    usageEstimate,
    updateCostConfig,
    purgeScratchTakes,
    refreshRecordings,
    selectedAsset,
  } = useCloudinary();

  const [purging, setPurging] = useState<boolean>(false);
  const [purgeMessage, setPurgeMessage] = useState<string | null>(null);
  const [copiedEmbed, setCopiedEmbed] = useState<boolean>(false);

  const scratchCount = recordings.filter((r) => r.duration > 0 && r.duration < 6).length;

  const handlePurge = async () => {
    setPurging(true);
    try {
      const count = await purgeScratchTakes();
      setPurgeMessage(`Cleaned up ${count} scratch take${count === 1 ? '' : 's'}!`);
      setTimeout(() => setPurgeMessage(null), 3000);
    } catch {
      setPurgeMessage('Failed to purge scratch takes');
    } finally {
      setPurging(false);
    }
  };

  const handleCopyEmbed = () => {
    if (!selectedAsset) return;
    const snippet = buildEmbedSnippet(selectedAsset);
    navigator.clipboard.writeText(snippet);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2500);
  };

  return (
    <div className="space-y-4 text-neutral-200">
      {/* Zero Cost Guarantee Card */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/50 via-neutral-900 to-neutral-900 border border-emerald-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Cloud Cost Optimizer
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  $0.00 / mo Free Tier
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Running in Cloudinary Free Tier (25 Monthly Credits)
              </p>
            </div>
          </div>
          <button
            onClick={() => refreshRecordings()}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
            title="Recalculate usage"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 25 Credits Progress Gauge */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-neutral-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Monthly Credits Used</span>
            </span>
            <span className="text-white font-mono">
              {usageEstimate.estimatedCreditsUsed} / 25.0 Credits
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-neutral-800 overflow-hidden p-0.5 border border-neutral-700/60">
            <div
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-500 via-sky-500 to-amber-500"
              style={{
                width: `${Math.max(4, (usageEstimate.estimatedCreditsUsed / 25) * 100)}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-neutral-400">
            <span>{usageEstimate.creditsRemaining} Credits Remaining</span>
            <span>Storage: {usageEstimate.totalStorageMb} MB ({usageEstimate.totalAssets} videos)</span>
          </div>
        </div>
      </div>

      {/* Tactical Zero-Cost Rules & Toggles */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span>Active Cost Reduction Rules</span>
        </h4>

        {/* Rule 1: Lazy URL Transformations */}
        <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-xs font-semibold text-white">Lazy Transformations</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                RECOMMENDED
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Produces audio MP3s, vertical crops, and thumbnails on-demand via URL parameters rather than upfront on upload.
            </p>
          </div>
          <button
            onClick={() => updateCostConfig({ lazyTransforms: !costConfig.lazyTransforms })}
            className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
              costConfig.lazyTransforms ? 'bg-blue-600' : 'bg-neutral-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                costConfig.lazyTransforms ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Rule 2: Dynamic Auto-Codec f_auto,q_auto */}
        <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-white">Edge Bandwidth Compressor</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                -52% EGRESS
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Injects <code className="text-emerald-400 font-mono text-[10px]">f_auto,q_auto</code> to serve AV1/VP9 codecs tailored to viewer devices, cutting monthly transfer quota in half.
            </p>
          </div>
          <button
            onClick={() =>
              updateCostConfig({ optimizedDeliveryCodec: !costConfig.optimizedDeliveryCodec })
            }
            className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
              costConfig.optimizedDeliveryCodec ? 'bg-emerald-600' : 'bg-neutral-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                costConfig.optimizedDeliveryCodec ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Rule 3: Scratch-Take Cleaner */}
        <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-xs font-semibold text-white">Scratch Take Storage Purge</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              {scratchCount > 0
                ? `Found ${scratchCount} test recording${scratchCount === 1 ? '' : 's'} under 6s consuming quota.`
                : 'No scratch takes detected. Storage is clean!'}
            </p>
          </div>
          <button
            onClick={handlePurge}
            disabled={purging || scratchCount === 0}
            className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-semibold disabled:opacity-40 transition-colors shrink-0 flex items-center gap-1.5"
          >
            {purging ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            <span>Purge ({scratchCount})</span>
          </button>
        </div>
        {purgeMessage && (
          <p className="text-xs text-emerald-400 font-medium px-1 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            <span>{purgeMessage}</span>
          </p>
        )}
      </div>

      {/* Embed Code Generator for Selected Video */}
      {selectedAsset && (
        <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-white">Zero-Bandwidth Embed Code</span>
            </div>
            <button
              onClick={handleCopyEmbed}
              className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-semibold transition-colors flex items-center gap-1"
            >
              {copiedEmbed ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedEmbed ? 'Copied' : 'Copy HTML5 Tag'}</span>
            </button>
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Includes <code className="text-purple-300 font-mono text-[10px]">preload=&quot;metadata&quot;</code> and WebP poster to ensure viewers don&apos;t download video data until they click play.
          </p>
          <pre className="p-2.5 rounded-lg bg-black/60 border border-neutral-800 text-[10px] text-neutral-300 font-mono overflow-x-auto whitespace-pre-wrap">
            {buildEmbedSnippet(selectedAsset)}
          </pre>
        </div>
      )}
    </div>
  );
};
