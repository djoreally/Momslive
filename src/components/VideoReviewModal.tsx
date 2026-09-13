import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Download,
  RotateCcw,
  Check,
  Film,
  X,
  ExternalLink,
  Loader2,
  Volume2,
  FileVideo,
  Sparkles,
  AlertCircle,
  Tv,
  Cloud,
  Copy,
  Music,
  Smartphone,
  Share2,
} from 'lucide-react';
import { convertVideoToMp4, triggerFileDownload } from '../utils/audio';
import { ResolutionPreset, TargetFrameRate, CloudinaryAsset } from '../types';
import { RESOLUTION_SPECS } from '../utils/camera';
import { uploadRecordingToCloudinary } from '../utils/cloudinary';
import { saveLocalRecording, updateLocalRecordingCloudAsset } from '../utils/indexedDbVault';
import { useAuth } from '../context/AuthContext';

const MomsRemotionPreview = React.lazy(() =>
  import('../remotion/MomsRemotionPreview').then((module) => ({ default: module.MomsRemotionPreview }))
);

interface VideoReviewModalProps {
  videoUrl: string | null;
  videoBlob: Blob | null;
  durationSeconds: number;
  resolution?: ResolutionPreset;
  frameRate?: TargetFrameRate;
  onClose: () => void;
  onRetake: () => void;
  onOpenCloudVault?: () => void;
}

export const VideoReviewModal: React.FC<VideoReviewModalProps> = ({
  videoUrl,
  videoBlob,
  durationSeconds,
  resolution = '4k',
  frameRate = 60,
  onClose,
  onRetake,
  onOpenCloudVault,
}) => {
  const { currentWorkspace } = useAuth();
  const [localSavedRecordId, setLocalSavedRecordId] = useState<string | null>(null);

  const [isConvertingMp4, setIsConvertingMp4] = useState<boolean>(false);
  const [conversionStatus, setConversionStatus] = useState<string>('');
  const [mp4Blob, setMp4Blob] = useState<Blob | null>(null);
  const [mp4Url, setMp4Url] = useState<string | null>(null);
  const [serverDownloadUrl, setServerDownloadUrl] = useState<string | null>(null);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);
  const [conversionError, setConversionError] = useState<string | null>(null);

  // Cloudinary state
  const [isUploadingToCloud, setIsUploadingToCloud] = useState<boolean>(false);
  const [cloudUploadStatus, setCloudUploadStatus] = useState<string>('');
  const [cloudAsset, setCloudAsset] = useState<CloudinaryAsset | null>(null);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [copiedLinkKey, setCopiedLinkKey] = useState<string | null>(null);
  const [showRemotionStudio, setShowRemotionStudio] = useState<boolean>(false);

  const resSpec = RESOLUTION_SPECS[resolution] || RESOLUTION_SPECS['4k'];

  // Generate clean timestamped filename
  const getFilename = (ext: 'mp4' | 'webm') => {
    const now = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    return `MOMS_Mobile_Oil_Studio_${now}.${ext}`;
  };

  // Auto-save recording instantly to browser IndexedDB store under active workspace
  useEffect(() => {
    if (videoBlob && currentWorkspace?.id) {
      const recordId = `rec_${Date.now()}`;
      setLocalSavedRecordId(recordId);

      saveLocalRecording({
        id: recordId,
        workspaceId: currentWorkspace.id,
        title: `MOMS Studio - ${currentWorkspace.name} (${resSpec.shortName})`,
        blob: videoBlob,
        mimeType: videoBlob.type || 'video/webm',
        durationSeconds,
        resolution,
        frameRate,
        sizeBytes: videoBlob.size,
        createdAt: Date.now(),
        tags: [currentWorkspace.slug, 'studio', resSpec.shortName],
      }).catch((err) => {
        console.warn('Could not auto-save to IndexedDB:', err);
      });
    }
  }, [videoBlob, currentWorkspace?.id, durationSeconds, resolution, frameRate, resSpec.shortName]);

  useEffect(() => {
    if (videoUrl) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {
        // Ignore if confetti fails
      }

      // Pre-convert to MP4 in the background so MP4 is instantly ready to download!
      if (videoBlob && !mp4Blob && !isConvertingMp4) {
        handlePreConvertMp4(videoBlob);
      }
    }
  }, [videoUrl, videoBlob]);

  const handlePreConvertMp4 = async (blob: Blob) => {
    setIsConvertingMp4(true);
    setConversionStatus('Processing 48kHz audio & MP4 video...');
    try {
      const result = await convertVideoToMp4(blob, (status) => {
        setConversionStatus(status);
      });
      setMp4Blob(result.mp4Blob);
      const url = URL.createObjectURL(result.mp4Blob);
      setMp4Url(url);
      setServerDownloadUrl(result.downloadUrl);
    } catch (err: unknown) {
      console.warn('Background MP4 conversion note:', err);
      // Not fatal; user can still download WebM or retry MP4
    } finally {
      setIsConvertingMp4(false);
      setConversionStatus('');
    }
  };

  if (!videoUrl) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}m ${remaining}s`;
  };

  // Download MP4
  const handleDownloadMp4 = async () => {
    setDownloadSuccessMessage(null);
    setConversionError(null);

    const filename = getFilename('mp4');

    // If MP4 is already converted, trigger instant download
    if (mp4Blob) {
      const success = triggerFileDownload(mp4Blob, filename);
      if (success) {
        setDownloadSuccessMessage(`MP4 file downloaded: ${filename}`);
      } else if (serverDownloadUrl) {
        window.open(serverDownloadUrl, '_blank');
      }
      return;
    }

    // Otherwise convert now on demand
    if (!videoBlob) return;
    setIsConvertingMp4(true);
    setConversionStatus('Converting video to MP4 with studio audio...');

    try {
      const result = await convertVideoToMp4(videoBlob, (status) => {
        setConversionStatus(status);
      });
      setMp4Blob(result.mp4Blob);
      const url = URL.createObjectURL(result.mp4Blob);
      setMp4Url(url);
      setServerDownloadUrl(result.downloadUrl);

      const success = triggerFileDownload(result.mp4Blob, filename);
      if (success) {
        setDownloadSuccessMessage(`MP4 file downloaded: ${filename}`);
      } else {
        window.open(result.downloadUrl, '_blank');
      }
    } catch (err: unknown) {
      console.error('MP4 conversion error:', err);
      const msg = err instanceof Error ? err.message : 'Conversion failed';
      setConversionError(`MP4 conversion error: ${msg}. You can still download the WebM version.`);
    } finally {
      setIsConvertingMp4(false);
      setConversionStatus('');
    }
  };

  // Download WebM
  const handleDownloadWebm = () => {
    setDownloadSuccessMessage(null);
    const filename = getFilename('webm');
    const target = videoBlob || videoUrl;
    const success = triggerFileDownload(target, filename);
    if (success) {
      setDownloadSuccessMessage(`WebM file downloaded: ${filename}`);
    } else {
      window.open(videoUrl, '_blank');
    }
  };

  // Open in New Tab fallback
  const handleOpenInNewTab = () => {
    const targetUrl = mp4Url || serverDownloadUrl || videoUrl;
    if (targetUrl) {
      window.open(targetUrl, '_blank');
    }
  };

  // Upload to Cloudinary for storage & processing (auto CDN, audio extraction, social crops)
  const handleUploadToCloudinary = async () => {
    const target = mp4Blob || videoBlob;
    if (!target) return;

    setIsUploadingToCloud(true);
    setCloudError(null);
    setCloudUploadStatus('Connecting to Cloudinary...');

    try {
      const asset = await uploadRecordingToCloudinary(
        target,
        {
          title: `MOMS Mobile Oil Studio - ${currentWorkspace?.name || 'Fleet'} - ${resSpec.shortName} ${frameRate}fps`,
          resolution,
          frameRate,
        },
        (status) => setCloudUploadStatus(status)
      );
      setCloudAsset(asset);

      // Link cloud asset back into the IndexedDB local record
      if (localSavedRecordId) {
        updateLocalRecordingCloudAsset(localSavedRecordId, asset).catch((err) => {
          console.warn('Could not link cloud asset to IndexedDB record:', err);
        });
      }
    } catch (err: unknown) {
      console.error('Cloudinary upload error:', err);
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setCloudError(msg);
    } finally {
      setIsUploadingToCloud(false);
      setCloudUploadStatus('');
    }
  };

  const handleCopyLink = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLinkKey(key);
    setTimeout(() => setCopiedLinkKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="video-review-modal"
        className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden p-5 sm:p-6 text-neutral-100 flex flex-col max-h-[94vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 flex-wrap">
                <span>Video Recorded Successfully!</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-600/30 text-purple-300 border border-purple-500/30 font-bold">
                  {resSpec.shortName}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold">
                  {frameRate} FPS
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600/30 text-blue-300 border border-blue-500/30 font-medium">
                  Studio Sound
                </span>
              </h3>
              <p className="text-xs text-neutral-400 flex items-center gap-2 flex-wrap">
                <span>Duration: <strong className="text-neutral-200">{formatTime(durationSeconds)}</strong></span>
                <span>•</span>
                <span>Master: <strong className="text-neutral-300">{resSpec.label}</strong></span>
                {currentWorkspace && (
                  <>
                    <span>•</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-600/30 text-blue-300 font-semibold border border-blue-500/30">
                      {currentWorkspace.name}
                    </span>
                  </>
                )}
                {localSavedRecordId && (
                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>Saved in Local IndexedDB</span>
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            id="close-review-modal-btn"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Container */}
        <div className="my-3.5 flex-1 min-h-0 flex items-center justify-center bg-black rounded-xl overflow-hidden border border-neutral-800 relative group">
          <video
            id="review-video-player"
            src={mp4Url || videoUrl}
            controls
            autoPlay
            playsInline
            className="max-h-[46vh] w-auto rounded-lg shadow-md"
          />

          {/* Format badge on player */}
          <div className="absolute top-2.5 right-2.5 px-2 py-1 rounded bg-black/75 backdrop-blur-sm border border-neutral-700 text-[10px] font-mono text-neutral-300 flex items-center gap-1.5 pointer-events-none">
            <Volume2 className="w-3 h-3 text-emerald-400" />
            <span>48kHz Studio Sound</span>
          </div>
        </div>

        {/* Status / Notifications */}
        {isConvertingMp4 && (
          <div className="mb-3 px-4 py-2.5 rounded-xl bg-blue-950/70 border border-blue-600/40 text-blue-200 text-xs flex items-center gap-2.5 animate-pulse">
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
            <span>{conversionStatus || 'Preparing broadcast MP4 download...'}</span>
          </div>
        )}

        {downloadSuccessMessage && (
          <div className="mb-3 px-4 py-2 rounded-xl bg-emerald-950/70 border border-emerald-600/40 text-emerald-200 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{downloadSuccessMessage}</span>
            </div>
            <button
              onClick={() => setDownloadSuccessMessage(null)}
              className="text-emerald-400 hover:text-white text-[11px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {conversionError && (
          <div className="mb-3 px-4 py-2 rounded-xl bg-rose-950/70 border border-rose-600/40 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{conversionError}</span>
          </div>
        )}

        {/* Cloudinary Uploading Indicator */}
        {isUploadingToCloud && (
          <div className="mb-3 px-4 py-2.5 rounded-xl bg-purple-950/70 border border-purple-600/40 text-purple-200 text-xs flex items-center gap-2.5 animate-pulse">
            <Loader2 className="w-4 h-4 text-purple-400 animate-spin shrink-0" />
            <span>{cloudUploadStatus || 'Uploading to Cloudinary & running cloud processing...'}</span>
          </div>
        )}

        {/* Cloudinary Error */}
        {cloudError && (
          <div className="mb-3 px-4 py-2 rounded-xl bg-amber-950/70 border border-amber-600/40 text-amber-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{cloudError}</span>
          </div>
        )}

        {/* Cloudinary Success Card */}
        {cloudAsset && (
          <div className="mb-3 p-3.5 rounded-xl bg-neutral-900/90 border border-emerald-500/40 space-y-2.5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Processed &amp; Stored on Cloudinary CDN</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      LIVE
                    </span>
                  </h4>
                  <p className="text-[10px] text-neutral-400">
                    Video streaming master, 48kHz podcast audio &amp; social crops generated
                  </p>
                </div>
              </div>
              {onOpenCloudVault && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenCloudVault();
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold text-sky-400 hover:text-white bg-sky-950/60 hover:bg-sky-900/60 border border-sky-600/40 rounded-lg transition-colors"
                >
                  View in Vault →
                </button>
              )}
            </div>

            {/* Quick Copy Link Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
              <button
                onClick={() => handleCopyLink(cloudAsset.secureUrl, 'video')}
                className="px-2 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 flex items-center justify-between border border-neutral-700 transition-colors"
                title="Copy Cloudinary CDN Video Stream URL"
              >
                <span className="flex items-center gap-1 truncate">
                  <Film className="w-3 h-3 text-sky-400 shrink-0" />
                  <span>CDN Video</span>
                </span>
                {copiedLinkKey === 'video' ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3 text-neutral-400" />
                )}
              </button>

              <button
                onClick={() => handleCopyLink(cloudAsset.audioUrl, 'audio')}
                className="px-2 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 flex items-center justify-between border border-neutral-700 transition-colors"
                title="Copy Extracted 48kHz Podcast Audio MP3 URL"
              >
                <span className="flex items-center gap-1 truncate">
                  <Music className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Podcast MP3</span>
                </span>
                {copiedLinkKey === 'audio' ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3 text-neutral-400" />
                )}
              </button>

              <button
                onClick={() => handleCopyLink(cloudAsset.verticalUrl || cloudAsset.secureUrl, 'reel')}
                className="px-2 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 flex items-center justify-between border border-neutral-700 transition-colors"
                title="Copy 9:16 Social Reel Cut URL"
              >
                <span className="flex items-center gap-1 truncate">
                  <Smartphone className="w-3 h-3 text-purple-400 shrink-0" />
                  <span>9:16 Reel Cut</span>
                </span>
                {copiedLinkKey === 'reel' ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3 text-neutral-400" />
                )}
              </button>

              <a
                href={cloudAsset.secureUrl}
                target="_blank"
                rel="noreferrer"
                className="px-2 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 flex items-center justify-between border border-neutral-700 transition-colors"
                title="Open Video in Cloudinary CDN"
              >
                <span className="flex items-center gap-1 truncate">
                  <ExternalLink className="w-3 h-3 text-blue-400 shrink-0" />
                  <span>Open CDN</span>
                </span>
              </a>
            </div>
          </div>
        )}

        {/* Remotion Post-Production */}
        <div className="mb-3 rounded-xl border border-fuchsia-500/30 bg-fuchsia-950/20 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowRemotionStudio((open) => !open)}
            className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-fuchsia-500/10 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Create Social Version</div>
                <div className="text-[10px] text-neutral-400">Remotion branded 9:16, 16:9 and square previews</div>
              </div>
            </div>
            <span className="text-[10px] px-2 py-1 rounded-full border border-fuchsia-500/40 text-fuchsia-300 font-bold">
              {showRemotionStudio ? 'CLOSE' : 'OPEN'}
            </span>
          </button>

          {showRemotionStudio && (
            <div className="border-t border-fuchsia-500/20 p-3.5 max-h-[48vh] overflow-y-auto">
              <React.Suspense
                fallback={
                  <div className="min-h-40 flex items-center justify-center gap-2 text-xs text-neutral-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading Remotion Studio...
                  </div>
                }
              >
                <MomsRemotionPreview
                  videoUrl={mp4Url || videoUrl}
                  durationSeconds={durationSeconds}
                  workspaceName={currentWorkspace?.name}
                />
              </React.Suspense>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-neutral-800">
          {/* Retake Button */}
          <button
            id="retake-video-btn"
            onClick={onRetake}
            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-neutral-700 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retake</span>
          </button>

          {/* Action Buttons Group */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {/* Open in New Tab Fallback */}
            <button
              id="open-tab-fallback-btn"
              onClick={handleOpenInNewTab}
              className="px-3 py-2 rounded-xl border border-neutral-700 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Open video in isolated browser tab if downloads are blocked"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Open in Tab</span>
            </button>

            {/* Download WebM Option */}
            <button
              id="download-webm-btn"
              onClick={handleDownloadWebm}
              className="px-3 py-2 rounded-xl border border-neutral-700 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Download original WebM video recording"
            >
              <FileVideo className="w-3.5 h-3.5 text-neutral-400" />
              <span>WebM</span>
            </button>

            {/* Cloudinary Upload & Process Button (Save Button) */}
            <button
              id="upload-cloudinary-btn"
              disabled={isUploadingToCloud}
              onClick={handleUploadToCloudinary}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-md flex items-center justify-center gap-2 transition-all ${
                cloudAsset
                  ? 'bg-emerald-700 hover:bg-emerald-600 border border-emerald-500/50'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border border-purple-400/40 hover:scale-105 active:scale-95'
              }`}
              title="Save to your workspace Cloudinary cloud vault for streaming, MP3 podcast audio extraction & permanent hosting"
            >
              {isUploadingToCloud ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
                  <span>Saving to Vault...</span>
                </>
              ) : cloudAsset ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200" />
                  <span>Saved in Workspace Vault</span>
                </>
              ) : (
                <>
                  <Cloud className="w-4 h-4 text-purple-200" />
                  <span>Save to Cloud Vault</span>
                </>
              )}
            </button>

            {/* Primary Download Button: MP4 (H.264 / AAC) */}
            <button
              id="download-mp4-btn"
              disabled={isConvertingMp4}
              onClick={handleDownloadMp4}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-lg flex items-center justify-center gap-2 transition-all ${
                isConvertingMp4
                  ? 'bg-neutral-700 cursor-not-allowed text-neutral-400'
                  : 'bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/30 hover:scale-105 active:scale-95'
              }`}
            >
              {isConvertingMp4 ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                  <span>Preparing MP4...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download MP4</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
