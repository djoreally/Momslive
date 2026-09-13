import React, { useState } from 'react';
import {
  Cloud,
  RefreshCw,
  Play,
  Volume2,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Film,
  Music,
  Share2,
  AlertCircle,
  Loader2,
  Smartphone,
  Square,
  Sparkles,
  Info,
  DollarSign,
  Activity,
  Image as ImageIcon,
} from 'lucide-react';
import { CloudinaryAsset } from '../types';
import { formatFileSize } from '../utils/cloudinary';
import { useCloudinary } from '../context/CloudinaryContext';
import { CloudinaryCostOptimizer } from './CloudinaryCostOptimizer';

interface CloudinaryVaultPanelProps {
  onSelectVideo?: (url: string) => void;
}

export const CloudinaryVaultPanel: React.FC<CloudinaryVaultPanelProps> = ({
  onSelectVideo,
}) => {
  const {
    status,
    recordings,
    isLoading,
    refreshRecordings,
    deleteRecording,
    selectedAsset,
    setSelectedAsset,
  } = useCloudinary();

  const [vaultSubTab, setVaultSubTab] = useState<'media' | 'optimizer'>('media');
  const [activeMediaTab, setActiveMediaTab] = useState<'video' | 'audio'>('video');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDelete = async (publicId: string) => {
    if (!confirm('Delete this recording and all derived formats from Cloudinary?')) {
      return;
    }
    setDeletingId(publicId);
    try {
      await deleteRecording(publicId);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDuration = (secs: number) => {
    if (!secs) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-4 text-neutral-200">
      {/* Top Header & Sub-tab Switcher */}
      <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Cloudinary Studio Vault</span>
                {status.configured ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {status.cloudName}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Needs Key
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400">
                Zero-cost lazy cloud transformations &amp; fast CDN distribution
              </p>
            </div>
          </div>
          <button
            onClick={() => refreshRecordings()}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
            title="Refresh Vault"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>

        {/* Sub-tab Navigation */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-neutral-950/70 rounded-lg border border-neutral-800">
          <button
            onClick={() => setVaultSubTab('media')}
            className={`py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              vaultSubTab === 'media'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Recordings ({recordings.length})</span>
          </button>
          <button
            onClick={() => setVaultSubTab('optimizer')}
            className={`py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              vaultSubTab === 'optimizer'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Cost Optimizer ($0)</span>
          </button>
        </div>
      </div>

      {vaultSubTab === 'optimizer' ? (
        <CloudinaryCostOptimizer />
      ) : (
        <>
          {/* Active Selection Details & Players */}
          {selectedAsset ? (
            <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Inspector</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-300 font-mono">
                    {selectedAsset.format.toUpperCase()}
                  </span>
                </span>

                {/* Video vs Audio Player toggle */}
                <div className="flex items-center p-0.5 bg-neutral-800 rounded-lg text-xs">
                  <button
                    onClick={() => setActiveMediaTab('video')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all ${
                      activeMediaTab === 'video'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Film className="w-3 h-3" />
                    <span>Video</span>
                  </button>
                  <button
                    onClick={() => setActiveMediaTab('audio')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all ${
                      activeMediaTab === 'audio'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Music className="w-3 h-3" />
                    <span>Podcast (MP3)</span>
                  </button>
                </div>
              </div>

              {/* Media Player */}
              <div className="bg-black rounded-lg overflow-hidden border border-neutral-800 flex items-center justify-center relative">
                {activeMediaTab === 'video' ? (
                  <video
                    key={selectedAsset.publicId}
                    src={selectedAsset.secureUrl}
                    poster={selectedAsset.thumbnailUrl}
                    controls
                    className="max-h-48 w-full object-contain"
                  />
                ) : (
                  <div className="w-full p-4 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-neutral-900 to-black">
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                        <Music className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">Extracted Podcast Master</p>
                        <p className="text-[10px] text-neutral-400">48kHz MP3 Master • 256kbps Studio Audio</p>
                      </div>
                    </div>
                    <audio
                      key={selectedAsset.audioUrl}
                      src={selectedAsset.audioUrl}
                      controls
                      className="w-full h-8"
                    />
                  </div>
                )}
              </div>

              {/* Asset Metadata & Transformation CDN Links */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span>Duration: <strong className="text-neutral-200">{formatDuration(selectedAsset.duration)}</strong></span>
                  <span>Size: <strong className="text-neutral-200">{formatFileSize(selectedAsset.bytes)}</strong></span>
                  <span>Resolution: <strong className="text-neutral-200">{selectedAsset.width}×{selectedAsset.height}</strong></span>
                </div>

                {/* Instant Transformation Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleCopy(selectedAsset.audioUrl, 'audio')}
                    className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[11px] font-medium text-neutral-200 flex items-center justify-between border border-neutral-700/60 transition-colors"
                    title="Copy 48kHz Podcast Audio MP3 URL"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <Music className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Podcast MP3</span>
                    </span>
                    {copiedKey === 'audio' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-neutral-400" />}
                  </button>

                  <button
                    onClick={() => handleCopy(selectedAsset.verticalUrl || selectedAsset.secureUrl, 'vertical')}
                    className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[11px] font-medium text-neutral-200 flex items-center justify-between border border-neutral-700/60 transition-colors"
                    title="Copy 9:16 Vertical Reel Transformation URL"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <Smartphone className="w-3 h-3 text-purple-400 shrink-0" />
                      <span>9:16 Reel Cut</span>
                    </span>
                    {copiedKey === 'vertical' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-neutral-400" />}
                  </button>

                  <button
                    onClick={() => handleCopy(selectedAsset.squareUrl || selectedAsset.secureUrl, 'square')}
                    className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[11px] font-medium text-neutral-200 flex items-center justify-between border border-neutral-700/60 transition-colors"
                    title="Copy 1:1 Square Feed Cut"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <Square className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>1:1 Square Feed</span>
                    </span>
                    {copiedKey === 'square' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-neutral-400" />}
                  </button>

                  <button
                    onClick={() => handleCopy(selectedAsset.thumbnailUrl, 'thumb')}
                    className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[11px] font-medium text-neutral-200 flex items-center justify-between border border-neutral-700/60 transition-colors"
                    title="Copy Video Poster Image URL"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <ImageIcon className="w-3 h-3 text-sky-400 shrink-0" />
                      <span>Poster Image</span>
                    </span>
                    {copiedKey === 'thumb' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-neutral-400" />}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* Cloud Recordings List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                All Cloud Takes ({recordings.length})
              </h4>
            </div>

            {isLoading ? (
              <div className="py-8 flex flex-col items-center justify-center text-neutral-500 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <span className="text-xs">Fetching recordings...</span>
              </div>
            ) : recordings.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                <Cloud className="w-8 h-8 mx-auto text-neutral-600" />
                <p className="text-xs text-neutral-400 font-medium">No cloud recordings saved yet.</p>
                <p className="text-[11px] text-neutral-500">
                  Record a video in the studio and hit &quot;Upload to Cloudinary&quot; in the review dialog!
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {recordings.map((rec) => {
                  const isSelected = selectedAsset?.publicId === rec.publicId;
                  const isDeleting = deletingId === rec.publicId;

                  return (
                    <div
                      key={rec.publicId}
                      onClick={() => setSelectedAsset(rec)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-blue-950/40 border-blue-500/50 shadow-sm'
                          : 'bg-neutral-900/70 hover:bg-neutral-800/80 border-neutral-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-12 h-9 rounded bg-black overflow-hidden border border-neutral-700 shrink-0 relative">
                          <img
                            src={rec.thumbnailUrl}
                            alt="Thumbnail"
                            className="w-full h-full object-cover"
                            crossOrigin="anonymous"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Play className="w-3 h-3 text-white drop-shadow" />
                          </div>
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">
                            {rec.publicId.split('/').pop() || 'Recording'}
                          </p>
                          <p className="text-[10px] text-neutral-400">
                            {formatDuration(rec.duration)} • {formatFileSize(rec.bytes)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(rec.publicId);
                          }}
                          disabled={isDeleting}
                          className="p-1.5 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-neutral-800 transition-colors"
                          title="Delete from Cloudinary"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
