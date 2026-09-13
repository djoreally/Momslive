import React from 'react';
import { ChromaKeyConfig, UserFraming } from '../types';
import { Sliders, Pipette, Camera, Eye, RefreshCw, Sparkles, ZoomIn, Move } from 'lucide-react';

interface CalibrationPanelProps {
  config: ChromaKeyConfig;
  onChangeConfig: (newConfig: ChromaKeyConfig) => void;
  framing: UserFraming;
  onChangeFraming: (newFraming: UserFraming) => void;
  onCaptureEmptyWall: () => void;
  onClearEmptyWall: () => void;
  hasEmptyWallCapture: boolean;
  isSamplingColor: boolean;
  onToggleSamplingColor: () => void;
  onAutoSampleWall: () => void;
  sampledStats?: { luminance: number; saturation: number };
}

export const CalibrationPanel: React.FC<CalibrationPanelProps> = ({
  config,
  onChangeConfig,
  framing,
  onChangeFraming,
  onCaptureEmptyWall,
  onClearEmptyWall,
  hasEmptyWallCapture,
  isSamplingColor,
  onToggleSamplingColor,
  onAutoSampleWall,
  sampledStats,
}) => {
  const handlePreset = (preset: 'bright_white' | 'off_white' | 'light_grey') => {
    if (preset === 'bright_white') {
      onChangeConfig({
        ...config,
        mode: 'luminance_white',
        luminanceThreshold: 0.76,
        tolerance: 0.18,
        softness: 0.08,
        spillSuppression: 0.35,
        sampledColor: { r: 245, g: 245, b: 245 },
      });
    } else if (preset === 'off_white') {
      onChangeConfig({
        ...config,
        mode: 'luminance_white',
        luminanceThreshold: 0.70,
        tolerance: 0.22,
        softness: 0.09,
        spillSuppression: 0.40,
        sampledColor: { r: 235, g: 232, b: 225 },
      });
    } else if (preset === 'light_grey') {
      onChangeConfig({
        ...config,
        mode: 'luminance_white',
        luminanceThreshold: 0.62,
        tolerance: 0.25,
        softness: 0.10,
        spillSuppression: 0.45,
        sampledColor: { r: 215, g: 215, b: 215 },
      });
    }
  };

  return (
    <div id="calibration-panel" className="space-y-5 text-sm text-neutral-200">
      {/* Wall Quality & Sampling Header */}
      <div className="p-3.5 rounded-xl bg-neutral-800/80 border border-neutral-700 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-white text-xs uppercase tracking-wider">White Wall Calibration</span>
          </div>
          {sampledStats && (
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              sampledStats.luminance > 0.65 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {sampledStats.luminance > 0.65 ? 'Optimal White Wall' : 'Low Wall Lighting'}
            </span>
          )}
        </div>

        {/* Action Buttons: Sample & Eyedropper */}
        <div className="grid grid-cols-2 gap-2">
          <button
            id="auto-sample-btn"
            onClick={onAutoSampleWall}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
            <span>Auto-Sample Wall</span>
          </button>
          <button
            id="eyedropper-btn"
            onClick={onToggleSamplingColor}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
              isSamplingColor
                ? 'bg-blue-600 text-white ring-2 ring-blue-400 animate-pulse'
                : 'bg-neutral-700 hover:bg-neutral-600 text-white'
            }`}
          >
            <Pipette className="w-3.5 h-3.5" />
            <span>{isSamplingColor ? 'Click on Wall...' : 'Pick Wall Color'}</span>
          </button>
        </div>

        {/* Sampled Color Indicator */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-700/60">
          <span className="text-neutral-400">Sampled Wall Tone:</span>
          <div className="flex items-center gap-2">
            <span
              className="w-4 h-4 rounded-full border border-white/40 shadow-inner"
              style={{
                backgroundColor: `rgb(${config.sampledColor.r}, ${config.sampledColor.g}, ${config.sampledColor.b})`,
              }}
            />
            <span className="font-mono text-neutral-300">
              rgb({config.sampledColor.r}, {config.sampledColor.g}, {config.sampledColor.b})
            </span>
          </div>
        </div>
      </div>

      {/* Difference Matte: Empty Wall Snapshot */}
      <div className="p-3.5 rounded-xl bg-neutral-800/80 border border-neutral-700 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white text-xs uppercase tracking-wider">Empty Wall Snapshot (Pro)</span>
          </div>
          {hasEmptyWallCapture && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
              ACTIVE
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-400 leading-relaxed">
          Step out of the camera view for 2 seconds and capture the empty white wall. The app subtracts the wall cleanly.
        </p>
        <div className="flex gap-2 pt-1">
          <button
            id="capture-empty-wall-btn"
            onClick={onCaptureEmptyWall}
            className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-colors flex items-center justify-center gap-1.5"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Capture Empty Wall</span>
          </button>
          {hasEmptyWallCapture && (
            <button
              id="clear-empty-wall-btn"
              onClick={onClearEmptyWall}
              className="py-2 px-3 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-neutral-300 text-xs font-medium transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Quick Presets */}
      <div>
        <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
          Wall Color Presets
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            id="preset-bright-white-btn"
            onClick={() => handlePreset('bright_white')}
            className="py-2 px-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-medium text-white transition-all text-center"
          >
            Bright White
          </button>
          <button
            id="preset-off-white-btn"
            onClick={() => handlePreset('off_white')}
            className="py-2 px-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-medium text-white transition-all text-center"
          >
            Off-White
          </button>
          <button
            id="preset-light-grey-btn"
            onClick={() => handlePreset('light_grey')}
            className="py-2 px-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-medium text-white transition-all text-center"
          >
            Light Grey
          </button>
        </div>
      </div>

      {/* Fine-Tuning Sliders */}
      <div className="space-y-3.5 p-3.5 rounded-xl bg-neutral-800/80 border border-neutral-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-white text-xs uppercase tracking-wider">Keying Fine-Tuning</span>
          </div>
          <button
            id="toggle-matte-btn"
            onClick={() => onChangeConfig({ ...config, showMatteOnly: !config.showMatteOnly })}
            className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-md transition-colors ${
              config.showMatteOnly ? 'bg-amber-500 text-black font-bold' : 'bg-neutral-700 text-neutral-300 hover:text-white'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>{config.showMatteOnly ? 'Color Mode' : 'Mask Mode'}</span>
          </button>
        </div>

        {/* Luminance Threshold */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-neutral-300">White Cutoff (Brightness)</span>
            <span className="font-mono text-neutral-400">{Math.round(config.luminanceThreshold * 100)}%</span>
          </div>
          <input
            id="slider-luminance"
            type="range"
            min="0.45"
            max="0.95"
            step="0.01"
            value={config.luminanceThreshold}
            onChange={(e) => onChangeConfig({ ...config, luminanceThreshold: parseFloat(e.target.value) })}
            className="w-full accent-blue-500 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
          />
        </div>

        {/* Tolerance */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-neutral-300">Tolerance</span>
            <span className="font-mono text-neutral-400">{Math.round(config.tolerance * 100)}%</span>
          </div>
          <input
            id="slider-tolerance"
            type="range"
            min="0.05"
            max="0.45"
            step="0.01"
            value={config.tolerance}
            onChange={(e) => onChangeConfig({ ...config, tolerance: parseFloat(e.target.value) })}
            className="w-full accent-blue-500 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
          />
        </div>

        {/* Edge Feathering / Softness */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-neutral-300">Edge Feathering (Softness)</span>
            <span className="font-mono text-neutral-400">{Math.round(config.softness * 100)}%</span>
          </div>
          <input
            id="slider-softness"
            type="range"
            min="0.01"
            max="0.25"
            step="0.01"
            value={config.softness}
            onChange={(e) => onChangeConfig({ ...config, softness: parseFloat(e.target.value) })}
            className="w-full accent-blue-500 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
          />
        </div>

        {/* Halo / Spill Suppression */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-neutral-300">White Halo Suppression</span>
            <span className="font-mono text-neutral-400">{Math.round(config.spillSuppression * 100)}%</span>
          </div>
          <input
            id="slider-spill"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={config.spillSuppression}
            onChange={(e) => onChangeConfig({ ...config, spillSuppression: parseFloat(e.target.value) })}
            className="w-full accent-blue-500 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Person Framing & Position */}
      <div className="space-y-3.5 p-3.5 rounded-xl bg-neutral-800/80 border border-neutral-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Move className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-white text-xs uppercase tracking-wider">Position & Framing Behind Mic</span>
          </div>
          <button
            id="mirror-camera-btn"
            onClick={() => onChangeFraming({ ...framing, mirror: !framing.mirror })}
            className={`text-[11px] px-2 py-1 rounded-md transition-colors ${
              framing.mirror ? 'bg-blue-600 text-white font-semibold' : 'bg-neutral-700 text-neutral-300 hover:text-white'
            }`}
          >
            Mirror: {framing.mirror ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Scale */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-neutral-300">
              <ZoomIn className="w-3.5 h-3.5 text-neutral-400" />
              <span>Person Scale / Size</span>
            </span>
            <span className="font-mono text-neutral-400">{Math.round(framing.scale * 100)}%</span>
          </div>
          <input
            id="slider-framing-scale"
            type="range"
            min="0.5"
            max="1.6"
            step="0.05"
            value={framing.scale}
            onChange={(e) => onChangeFraming({ ...framing, scale: parseFloat(e.target.value) })}
            className="w-full accent-amber-500 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
          />
        </div>

        {/* Horizontal Position X */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-neutral-300">Horizontal Position (X)</span>
            <span className="font-mono text-neutral-400">{framing.offsetX > 0 ? `+${framing.offsetX}%` : `${framing.offsetX}%`}</span>
          </div>
          <input
            id="slider-framing-x"
            type="range"
            min="-40"
            max="40"
            step="1"
            value={framing.offsetX}
            onChange={(e) => onChangeFraming({ ...framing, offsetX: parseInt(e.target.value, 10) })}
            className="w-full accent-amber-500 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
          />
        </div>

        {/* Vertical Position Y */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-neutral-300">Vertical Height (Y)</span>
            <span className="font-mono text-neutral-400">{framing.offsetY > 0 ? `+${framing.offsetY}%` : `${framing.offsetY}%`}</span>
          </div>
          <input
            id="slider-framing-y"
            type="range"
            min="-30"
            max="30"
            step="1"
            value={framing.offsetY}
            onChange={(e) => onChangeFraming({ ...framing, offsetY: parseInt(e.target.value, 10) })}
            className="w-full accent-amber-500 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
          />
        </div>

        {/* Reset Framing */}
        <button
          id="reset-framing-btn"
          onClick={() => onChangeFraming({ scale: 1.0, offsetX: 0, offsetY: 0, mirror: true, brightness: 1.0, contrast: 1.0 })}
          className="w-full py-1.5 text-xs text-neutral-400 hover:text-white rounded bg-neutral-700/50 hover:bg-neutral-700 transition-colors"
        >
          Reset Framing Defaults
        </button>
      </div>
    </div>
  );
};
