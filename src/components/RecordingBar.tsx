import React, { useState } from 'react';
import { RecordingState, RecordingFormat, CameraQualityConfig, ResolutionPreset, TargetFrameRate } from '../types';
import { RESOLUTION_SPECS } from '../utils/camera';
import {
  Circle,
  Square,
  Pause,
  Play,
  Camera,
  Volume2,
  Sliders,
  Settings2,
  FileVideo,
  Radio,
  Check,
  Repeat,
  Tv,
  Gauge,
  Sparkles,
} from 'lucide-react';

interface RecordingBarProps {
  recordingState: RecordingState;
  onStartRecord: () => void;
  onStopRecord: () => void;
  onTogglePause: () => void;
  onTakeSnapshot: () => void;
  audioLevel: number;
  audioPeak?: number;
  audioGain: number;
  onChangeAudioGain: (gain: number) => void;
  recordingFormat: RecordingFormat;
  onChangeRecordingFormat: (format: RecordingFormat) => void;
  cameraQuality: CameraQualityConfig;
  onChangeResolution: (resolution: ResolutionPreset) => void;
  onChangeFrameRate: (fps: TargetFrameRate) => void;
  onFlipCamera: () => void;
  onOpenCamSettings: () => void;
  hasCamera: boolean;
  onOpenMicSettings: () => void;
}

export const RecordingBar: React.FC<RecordingBarProps> = ({
  recordingState,
  onStartRecord,
  onStopRecord,
  onTogglePause,
  onTakeSnapshot,
  audioLevel,
  audioPeak = 0,
  audioGain,
  onChangeAudioGain,
  recordingFormat,
  onChangeRecordingFormat,
  cameraQuality,
  onChangeResolution,
  onChangeFrameRate,
  onFlipCamera,
  onOpenCamSettings,
  hasCamera,
  onOpenMicSettings,
}) => {
  const [showGainSlider, setShowGainSlider] = useState(false);
  const [showResMenu, setShowResMenu] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentResSpec = RESOLUTION_SPECS[cameraQuality.resolution] || RESOLUTION_SPECS['4k'];
  const resList: ResolutionPreset[] = ['8k', '4k', '2k', '1080p', 'max_sensor'];

  return (
    <div
      id="recording-action-bar"
      className="w-full flex flex-col md:flex-row items-center justify-between px-3 sm:px-5 py-2.5 bg-neutral-900/95 border-t border-neutral-800 backdrop-blur-md gap-2.5 md:gap-0 z-20"
    >
      {/* Left: Audio VU Meter & Quick Controls */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
        {/* Audio VU Meter & Quick Preamp Control */}
        <div className="relative flex items-center gap-2">
          <button
            id="quick-mic-gain-toggle"
            onClick={() => setShowGainSlider(!showGainSlider)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 text-xs transition-colors"
            title="Click to adjust microphone volume & sound settings"
          >
            <Volume2
              className={`w-4 h-4 ${
                audioPeak > 0.95
                  ? 'text-red-400 animate-pulse'
                  : audioLevel > 0.05
                  ? 'text-emerald-400'
                  : 'text-neutral-500'
              }`}
            />
            <span className="font-mono text-[11px] font-bold text-emerald-400 hidden sm:inline">
              {Math.round(audioGain * 100)}%
            </span>
          </button>

          {/* Visual VU Meter Bar */}
          <div
            onClick={onOpenMicSettings}
            className="w-14 sm:w-20 h-2.5 bg-neutral-950 rounded-full overflow-hidden flex items-center p-0.5 border border-neutral-700 cursor-pointer"
            title="Click to open full Studio Audio controls"
          >
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                audioPeak > 0.9
                  ? 'bg-red-500'
                  : audioLevel > 0.45
                  ? 'bg-amber-400'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.max(4, Math.min(100, audioLevel * 100))}%` }}
            />
          </div>

          {/* Floating Preamp Gain Popover */}
          {showGainSlider && (
            <div className="absolute bottom-full left-0 mb-2 p-3 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl w-56 z-50 animate-in fade-in">
              <div className="flex items-center justify-between text-xs mb-1.5 font-semibold text-white">
                <span className="flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Mic Input Gain</span>
                </span>
                <span className="text-emerald-400 font-mono">{Math.round(audioGain * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.05"
                value={audioGain}
                onChange={(e) => onChangeAudioGain(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 h-1.5 bg-neutral-700 rounded-lg cursor-pointer mb-2"
              />
              <button
                onClick={() => {
                  setShowGainSlider(false);
                  onOpenMicSettings();
                }}
                className="w-full py-1 text-[11px] text-center text-blue-400 hover:text-blue-300 font-medium rounded hover:bg-neutral-800 transition-colors"
              >
                Open Studio Sound EQ &amp; Compressor →
              </button>
            </div>
          )}
        </div>

        {/* Format Selector Pill (MP4 vs WebM) */}
        <div className="flex items-center p-0.5 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] font-semibold">
          <button
            id="format-select-mp4"
            disabled={recordingState.isRecording}
            onClick={() => onChangeRecordingFormat('mp4')}
            className={`px-2 py-0.5 rounded-md transition-all flex items-center gap-1 ${
              recordingFormat === 'mp4'
                ? 'bg-blue-600 text-white shadow-sm font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Download in universal MP4 (H.264 / AAC 48kHz)"
          >
            <span>MP4</span>
            {recordingFormat === 'mp4' && <span className="w-1 h-1 rounded-full bg-sky-200" />}
          </button>
          <button
            id="format-select-webm"
            disabled={recordingState.isRecording}
            onClick={() => onChangeRecordingFormat('webm')}
            className={`px-2 py-0.5 rounded-md transition-all ${
              recordingFormat === 'webm'
                ? 'bg-blue-600 text-white shadow-sm font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Download in direct WebM"
          >
            <span>WebM</span>
          </button>
        </div>

        {/* Front / Rear Camera Flip Quick Button */}
        <button
          id="flip-camera-bar-btn"
          disabled={recordingState.isRecording || !hasCamera}
          onClick={onFlipCamera}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-semibold transition-all shadow-sm"
          title={`Switch camera facing (Current: ${cameraQuality.facingMode === 'user' ? 'Front Selfie' : 'Rear Lens'})`}
        >
          <Repeat className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">
            {cameraQuality.facingMode === 'user' ? 'Front Cam' : 'Rear Cam'}
          </span>
          <span className="sm:hidden">
            {cameraQuality.facingMode === 'user' ? 'Front' : 'Rear'}
          </span>
        </button>

        {/* Resolution Selector Quick Popover (8K, 4K, 2K, 1080p) */}
        <div className="relative">
          <button
            id="quick-resolution-toggle"
            disabled={recordingState.isRecording}
            onClick={() => setShowResMenu(!showResMenu)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-black transition-all shadow-sm ${
              cameraQuality.resolution === '8k'
                ? 'bg-purple-600/30 border-purple-500/60 text-purple-300 hover:bg-purple-600/40'
                : cameraQuality.resolution === '4k'
                ? 'bg-blue-600/30 border-blue-500/60 text-sky-300 hover:bg-blue-600/40'
                : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
            }`}
            title="Select Recording Resolution (8K, 4K, 2K, 1080p)"
          >
            <Tv className="w-3.5 h-3.5 text-sky-400" />
            <span>{currentResSpec.shortName}</span>
          </button>

          {/* Resolution Picker Menu Popover */}
          {showResMenu && (
            <div className="absolute bottom-full left-0 mb-2 p-2 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl w-60 z-50 animate-in fade-in space-y-1">
              <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold uppercase text-neutral-400">
                <span>Resolution Quality</span>
                <span className="text-sky-400">Highest Device Q</span>
              </div>
              {resList.map((resKey) => {
                const spec = RESOLUTION_SPECS[resKey];
                const isCurrent = cameraQuality.resolution === resKey;
                return (
                  <button
                    key={resKey}
                    id={`res-picker-${resKey}`}
                    onClick={() => {
                      onChangeResolution(resKey);
                      setShowResMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors ${
                      isCurrent
                        ? 'bg-blue-600 text-white font-bold'
                        : 'hover:bg-neutral-800 text-neutral-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>{spec.label.split('(')[0]}</span>
                        <span className="text-[10px] opacity-80">({spec.shortName})</span>
                      </div>
                      <div className="text-[10px] opacity-70">{spec.subLabel}</div>
                    </div>
                    {isCurrent && <Check className="w-4 h-4 text-white" />}
                  </button>
                );
              })}
              <div className="pt-1 border-t border-neutral-800">
                <button
                  onClick={() => {
                    setShowResMenu(false);
                    onOpenCamSettings();
                  }}
                  className="w-full py-1 text-[11px] text-center text-blue-400 hover:text-blue-300 font-semibold"
                >
                  All Camera &amp; Sensor Settings →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 60 FPS vs 30 FPS Toggle Pill */}
        <div className="flex items-center p-0.5 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] font-semibold">
          <button
            id="bar-fps-60"
            disabled={recordingState.isRecording}
            onClick={() => onChangeFrameRate(60)}
            className={`px-2 py-0.5 rounded-md transition-all flex items-center gap-1 ${
              cameraQuality.frameRate === 60
                ? 'bg-emerald-600 text-white shadow-sm font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="60 Frames Per Second (Ultra fluid broadcast motion)"
          >
            <span>60 FPS</span>
          </button>
          <button
            id="bar-fps-30"
            disabled={recordingState.isRecording}
            onClick={() => onChangeFrameRate(30)}
            className={`px-2 py-0.5 rounded-md transition-all ${
              cameraQuality.frameRate === 30
                ? 'bg-blue-600 text-white shadow-sm font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="30 Frames Per Second (Cinematic standard)"
          >
            <span>30 FPS</span>
          </button>
        </div>
      </div>

      {/* Center: Record / Pause / Stop Controls */}
      <div className="flex items-center gap-3">
        {recordingState.isRecording ? (
          <>
            {/* Pause / Resume Button */}
            <button
              id="pause-resume-record-btn"
              onClick={onTogglePause}
              className="p-2.5 sm:p-3 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-700 transition-all shadow-md"
              title={recordingState.isPaused ? 'Resume Recording' : 'Pause Recording'}
            >
              {recordingState.isPaused ? (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              ) : (
                <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>

            {/* Stop Recording Button */}
            <button
              id="stop-record-btn"
              onClick={onStopRecord}
              className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-600/30 transition-all hover:scale-105 active:scale-95 text-xs sm:text-sm"
            >
              <Square className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              <span>Finish &amp; Download</span>
            </button>

            {/* Live Recording Timer */}
            <div className="flex items-center gap-1.5 pl-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="font-mono font-bold text-xs sm:text-sm text-white">
                {formatTime(recordingState.durationSeconds)}
              </span>
            </div>
          </>
        ) : (
          <>
            {/* Big Start Recording Button with Res & FPS Label */}
            <button
              id="start-record-btn"
              disabled={!hasCamera || recordingState.countdown !== null}
              onClick={onStartRecord}
              className={`flex items-center gap-2 px-6 sm:px-7 py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm text-white shadow-xl transition-all ${
                !hasCamera || recordingState.countdown !== null
                  ? 'bg-neutral-700 opacity-50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 hover:scale-105 active:scale-95 shadow-red-600/40'
              }`}
            >
              <Circle className="w-4 h-4 sm:w-5 sm:h-5 fill-current text-white" />
              <span>
                {recordingState.countdown !== null
                  ? `Starting in ${recordingState.countdown}...`
                  : `Record in ${currentResSpec.shortName} @ ${cameraQuality.frameRate}fps`}
              </span>
            </button>
          </>
        )}
      </div>

      {/* Right: Sensor Specs & Snapshot Still Photo Button */}
      <div className="flex items-center gap-2 min-w-[140px] justify-end">
        {/* Sensor Live Badge */}
        {cameraQuality.actualWidth > 0 && (
          <div
            onClick={onOpenCamSettings}
            className="hidden xl:flex flex-col text-right cursor-pointer hover:opacity-80 transition-opacity"
            title="Click to view sensor telemetry and camera settings"
          >
            <span className="text-[10px] font-mono font-bold text-neutral-300">
              {cameraQuality.actualWidth}×{cameraQuality.actualHeight}
            </span>
            <span className="text-[9px] font-bold text-emerald-400">
              {cameraQuality.facingMode === 'environment' ? 'Rear' : 'Front'} • {cameraQuality.frameRate}fps
            </span>
          </div>
        )}

        <button
          id="take-snapshot-btn"
          disabled={!hasCamera}
          onClick={onTakeSnapshot}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-semibold transition-all shadow-sm"
          title={`Take high-resolution photo snapshot at ${currentResSpec.shortName}`}
        >
          <Camera className="w-4 h-4 text-sky-400" />
          <span className="hidden sm:inline">Snapshot</span>
        </button>
      </div>
    </div>
  );
};

