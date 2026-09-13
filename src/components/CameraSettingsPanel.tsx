import React from 'react';
import {
  ResolutionPreset,
  TargetFrameRate,
  CameraFacing,
  CameraDeviceInfo,
  CameraQualityConfig,
  AspectRatio,
} from '../types';
import { RESOLUTION_SPECS, getTargetDimensions, getBitrateForConfig } from '../utils/camera';
import {
  Video,
  Camera,
  Repeat,
  Sparkles,
  Gauge,
  Sliders,
  Check,
  CheckCircle2,
  Tv,
  Layers,
  Smartphone,
  ShieldCheck,
  Maximize2,
} from 'lucide-react';

interface CameraSettingsPanelProps {
  config: CameraQualityConfig;
  onChangeConfig: (newConfig: Partial<CameraQualityConfig>) => void;
  availableDevices: CameraDeviceInfo[];
  onFlipCamera: () => void;
  aspectRatio: AspectRatio;
  mirror: boolean;
  onToggleMirror: () => void;
}

export const CameraSettingsPanel: React.FC<CameraSettingsPanelProps> = ({
  config,
  onChangeConfig,
  availableDevices,
  onFlipCamera,
  aspectRatio,
  mirror,
  onToggleMirror,
}) => {
  const currentDims = getTargetDimensions(config.resolution, aspectRatio);
  const currentBitrate = getBitrateForConfig(config.resolution, config.frameRate);
  const bitrateMbps = (currentBitrate / 1000000).toFixed(0);

  const resolutionOptions: ResolutionPreset[] = ['8k', '4k', '2k', '1080p', 'max_sensor'];

  return (
    <div id="camera-settings-panel" className="space-y-4 text-sm text-neutral-200">
      {/* Active Sensor Live Telemetry Box */}
      <div className="p-3.5 rounded-xl bg-gradient-to-br from-neutral-900 via-neutral-850 to-neutral-900 border border-neutral-700/80 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="font-bold text-xs uppercase tracking-wider text-white">Live Sensor Stream</span>
          </div>
          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
            {config.facingMode === 'environment' ? 'Rear Sensor' : 'Front Sensor'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-neutral-950/80 p-2 rounded-lg border border-neutral-800">
            <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Active Hardware Output</span>
            <span className="font-mono font-bold text-white text-xs">
              {config.actualWidth > 0 ? `${config.actualWidth} × ${config.actualHeight}` : 'Probing Sensor...'}
            </span>
          </div>
          <div className="bg-neutral-950/80 p-2 rounded-lg border border-neutral-800">
            <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Live Refresh Rate</span>
            <span className="font-mono font-bold text-emerald-400 text-xs">
              {config.actualFrameRate > 0 ? `${Math.round(config.actualFrameRate)} FPS` : `${config.frameRate} FPS (Target)`}
            </span>
          </div>
          <div className="bg-neutral-950/80 p-2 rounded-lg border border-neutral-800">
            <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Master Composite</span>
            <span className="font-mono font-bold text-sky-300 text-xs">
              {currentDims.width} × {currentDims.height}
            </span>
          </div>
          <div className="bg-neutral-950/80 p-2 rounded-lg border border-neutral-800">
            <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Master Bitrate</span>
            <span className="font-mono font-bold text-amber-300 text-xs">
              {bitrateMbps} Mbps High-Q
            </span>
          </div>
        </div>

        {config.sensorLabel && (
          <p className="mt-2 text-[11px] text-neutral-400 truncate flex items-center gap-1">
            <Camera className="w-3 h-3 text-neutral-500 flex-shrink-0" />
            <span className="truncate">{config.sensorLabel}</span>
          </p>
        )}
      </div>

      {/* Camera Selection & Facing Mode (Front vs Rear) */}
      <div className="p-3.5 rounded-xl bg-neutral-800/80 border border-neutral-700 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Repeat className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-white text-xs uppercase tracking-wider">Camera Lens (Front / Rear)</span>
          </div>
          <button
            id="flip-camera-quick-btn"
            onClick={onFlipCamera}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition-colors"
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Switch to {config.facingMode === 'user' ? 'Rear' : 'Front'}</span>
          </button>
        </div>

        {/* Front vs Rear Choice Cards */}
        <div className="grid grid-cols-2 gap-2">
          <button
            id="camera-select-front"
            onClick={() => onChangeConfig({ facingMode: 'user', selectedDeviceId: '' })}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              config.facingMode === 'user'
                ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                : 'bg-neutral-900/60 border-neutral-700 text-neutral-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs">Front Camera</span>
              {config.facingMode === 'user' && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
            </div>
            <p className="text-[11px] text-neutral-400 leading-tight">
              Selfie &amp; Host View with mirror options
            </p>
          </button>

          <button
            id="camera-select-rear"
            onClick={() => onChangeConfig({ facingMode: 'environment', selectedDeviceId: '' })}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              config.facingMode === 'environment'
                ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                : 'bg-neutral-900/60 border-neutral-700 text-neutral-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs">Rear Camera</span>
              {config.facingMode === 'environment' && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
            </div>
            <p className="text-[11px] text-neutral-400 leading-tight">
              Main High-Res Ultra HD sensor
            </p>
          </button>
        </div>

        {/* Specific Hardware Device Dropdown if multiple sensors found */}
        {availableDevices.length > 1 && (
          <div className="pt-2 border-t border-neutral-700/60">
            <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
              Select Specific Hardware Lens / USB Cam:
            </label>
            <select
              id="camera-device-select"
              value={config.selectedDeviceId || ''}
              onChange={(e) => {
                const devId = e.target.value;
                const dev = availableDevices.find((d) => d.deviceId === devId);
                onChangeConfig({
                  selectedDeviceId: devId,
                  facingMode: dev ? dev.facing : config.facingMode,
                });
              }}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Default ({config.facingMode === 'user' ? 'Front' : 'Rear'})</option>
              {availableDevices.map((dev, idx) => (
                <option key={dev.deviceId || idx} value={dev.deviceId}>
                  {dev.label} ({dev.isRear ? 'Rear' : 'Front'})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Front Mirror Toggle */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-neutral-300">Mirror Camera View</span>
          <button
            id="toggle-mirror-btn"
            onClick={onToggleMirror}
            className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
              mirror ? 'bg-blue-600 justify-end' : 'bg-neutral-700 justify-start'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
          </button>
        </div>
      </div>

      {/* Master Recording Resolution: 8K, 4K, 2K, 1080p */}
      <div className="p-3.5 rounded-xl bg-neutral-800/80 border border-neutral-700 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tv className="w-4 h-4 text-sky-400" />
            <span className="font-semibold text-white text-xs uppercase tracking-wider">
              Recording Resolution
            </span>
          </div>
          <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wide">
            Max Device Quality
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {resolutionOptions.map((resKey) => {
            const spec = RESOLUTION_SPECS[resKey];
            const isSelected = config.resolution === resKey;
            const dims = getTargetDimensions(resKey, aspectRatio);

            return (
              <button
                key={resKey}
                id={`res-option-${resKey}`}
                onClick={() => onChangeConfig({ resolution: resKey })}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-md ring-1 ring-blue-500'
                    : 'bg-neutral-900/60 border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-600'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-extrabold text-xs flex items-center gap-1.5">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                        resKey === '8k'
                          ? 'bg-purple-600 text-white'
                          : resKey === '4k'
                          ? 'bg-blue-600 text-white'
                          : resKey === '2k'
                          ? 'bg-sky-700 text-white'
                          : 'bg-neutral-700 text-white'
                      }`}
                    >
                      {spec.shortName}
                    </span>
                    <span>{spec.label.split('(')[0]}</span>
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                </div>
                <div className="text-[11px] font-mono text-neutral-400">
                  {dims.width} × {dims.height} px
                </div>
                <div className="text-[10px] text-neutral-500 mt-0.5">
                  {spec.subLabel}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Frame Rate: 60 FPS vs 30 FPS */}
      <div className="p-3.5 rounded-xl bg-neutral-800/80 border border-neutral-700 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white text-xs uppercase tracking-wider">
              Frame Rate (FPS)
            </span>
          </div>
          <span className="text-[10px] font-bold text-emerald-400">
            {config.frameRate === 60 ? 'Ultra Smooth 60 FPS' : 'Cinematic 30 FPS'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            id="fps-select-60"
            onClick={() => onChangeConfig({ frameRate: 60 })}
            className={`p-3 rounded-xl border text-left transition-all ${
              config.frameRate === 60
                ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-md ring-1 ring-emerald-500'
                : 'bg-neutral-900/60 border-neutral-700 text-neutral-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm text-emerald-300">60 FPS</span>
              {config.frameRate === 60 && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </div>
            <p className="text-[11px] text-neutral-400 leading-tight">
              Silky smooth broadcast motion, ideal for natural hand gestures &amp; fluid speech.
            </p>
          </button>

          <button
            id="fps-select-30"
            onClick={() => onChangeConfig({ frameRate: 30 })}
            className={`p-3 rounded-xl border text-left transition-all ${
              config.frameRate === 30
                ? 'bg-blue-600/20 border-blue-500 text-white shadow-md ring-1 ring-blue-500'
                : 'bg-neutral-900/60 border-neutral-700 text-neutral-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm text-sky-300">30 FPS</span>
              {config.frameRate === 30 && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
            </div>
            <p className="text-[11px] text-neutral-400 leading-tight">
              Standard broadcast &amp; television standard with smaller file sizes.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
