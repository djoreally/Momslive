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
} from 'lucide-react';
import { convertVideoToMp4, triggerFileDownload } from '../utils/audio';
import { ResolutionPreset, TargetFrameRate } from '../types';
import { RESOLUTION_SPECS } from '../utils/camera';

interface VideoReviewModalProps {
  videoUrl: string | null;
  videoBlob: Blob | null;
  durationSeconds: number;
  resolution?: ResolutionPreset;
  frameRate?: TargetFrameRate;
  onClose: () => void;
  onRetake: () => void;
}

export const VideoReviewModal: React.FC<VideoReviewModalProps> = ({
  videoUrl,
  videoBlob,
  durationSeconds,
  resolution = '4k',
  frameRate = 60,
  onClose,
  onRetake,
}) => {
  const [isConvertingMp4, setIsConvertingMp4] = useState<boolean>(false);
  const [conversionStatus, setConversionStatus] = useState<string>('');
  const [mp4Blob, setMp4Blob] = useState<Blob | null>(null);
  const [mp4Url, setMp4Url] = useState<string | null>(null);
  const [serverDownloadUrl, setServerDownloadUrl] = useState<string | null>(null);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);
  const [conversionError, setConversionError] = useState<string | null>(null);

  const resSpec = RESOLUTION_SPECS[resolution] || RESOLUTION_SPECS['4k'];

  // Generate clean timestamped filename
  const getFilename = (ext: 'mp4' | 'webm') => {
    const now = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    return `MOMS_Mobile_Oil_Studio_${now}.${ext}`;
  };

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
              <p className="text-xs text-neutral-400">
                Duration: <strong className="text-neutral-200">{formatTime(durationSeconds)}</strong> • Master:{' '}
                <strong className="text-neutral-300">{resSpec.label}</strong>
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

          {/* Download Buttons Group */}
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
              className="px-3.5 py-2 rounded-xl border border-neutral-700 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Download original WebM video recording"
            >
              <FileVideo className="w-3.5 h-3.5 text-neutral-400" />
              <span>WebM</span>
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
