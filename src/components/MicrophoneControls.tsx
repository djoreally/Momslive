import React from 'react';
import { MicConfig, MicWrapStyle, MicWrapColor, MicPresetPosition, AudioConfig } from '../types';
import { Mic, Shield, Sparkles, Sliders, Volume2, Radio, Headphones, Activity, SlidersHorizontal } from 'lucide-react';

interface MicrophoneControlsProps {
  config: MicConfig;
  onChange: (newConfig: MicConfig) => void;
  audioLevel?: number;
  audioPeak?: number;
  audioConfig: AudioConfig;
  onChangeAudioConfig: (newAudioConfig: AudioConfig) => void;
}

export const MicrophoneControls: React.FC<MicrophoneControlsProps> = ({
  config,
  onChange,
  audioLevel = 0,
  audioPeak = 0,
  audioConfig,
  onChangeAudioConfig,
}) => {
  const wrapStyles: { id: MicWrapStyle; label: string; desc: string }[] = [
    { id: 'moms_3d', label: 'MOMS 3D Wrap', desc: 'Bold blue & white 3D brand logo' },
    { id: 'diamond_tech', label: 'Diamond Flag [‹ ›]', desc: 'Tech diamond wrap from photo' },
    { id: 'moms_text', label: "Mom's Oil Change", desc: 'Classic gold & white typography' },
    { id: 'custom_text', label: 'Custom Text Wrap', desc: 'Type your own name or show title' },
  ];

  const wrapColors: { id: MicWrapColor; label: string; colorHex: string }[] = [
    { id: 'black', label: 'Black Foam', colorHex: '#18181b' },
    { id: 'royal_blue', label: 'MOMS Blue', colorHex: '#0284c7' },
    { id: 'carbon', label: 'Dark Carbon', colorHex: '#27272a' },
    { id: 'gold', label: 'Oil Gold', colorHex: '#d97706' },
    { id: 'white', label: 'Studio White', colorHex: '#f8fafc' },
  ];

  const positions: { id: MicPresetPosition; label: string }[] = [
    { id: 'host_left', label: 'Host Left (Standard)' },
    { id: 'center', label: 'Center Stage' },
    { id: 'guest_right', label: 'Guest Right' },
    { id: 'custom', label: 'Custom Position' },
  ];

  return (
    <div id="mic-controls-panel" className="space-y-4 text-sm text-neutral-200">
      {/* 1. Studio Audio Recording Engine (NEW: Sound Quality Controls) */}
      <div className="p-3.5 rounded-xl bg-neutral-800/90 border border-emerald-500/40 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="font-bold text-white text-xs uppercase tracking-wider">
              Studio Sound &amp; Audio Processing
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            48kHz Broadcast
          </span>
        </div>

        {/* Live VU Meter with Peak Display */}
        <div className="space-y-1.5 bg-neutral-900/90 p-2.5 rounded-lg border border-neutral-700/80">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-neutral-300 font-medium flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Microphone Input Level</span>
            </span>
            <span className="font-mono text-neutral-400 text-[10px]">
              {audioLevel > 0.05 ? `${Math.round(audioLevel * 100)}%` : 'Quiet'}
              {audioPeak > 0.95 && <span className="text-red-400 font-bold ml-1">PEAK</span>}
            </span>
          </div>
          <div className="w-full h-2.5 bg-neutral-950 rounded-full overflow-hidden p-0.5 border border-neutral-800 flex items-center">
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                audioPeak > 0.9
                  ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]'
                  : audioLevel > 0.5
                  ? 'bg-amber-400'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.max(3, Math.min(100, audioLevel * 100))}%` }}
            />
          </div>
        </div>

        {/* Microphone Preamp Gain Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-neutral-300 font-medium">Mic Input Gain (Volume Boost)</span>
            <span className="font-mono text-emerald-400 font-bold">
              {Math.round(audioConfig.micGain * 100)}%
            </span>
          </div>
          <input
            id="slider-audio-gain"
            type="range"
            min="0.5"
            max="3.0"
            step="0.05"
            value={audioConfig.micGain}
            onChange={(e) =>
              onChangeAudioConfig({ ...audioConfig, micGain: parseFloat(e.target.value) })
            }
            className="w-full accent-emerald-500 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-neutral-500">
            <span>50% (Soft)</span>
            <span>100% (Standard)</span>
            <span>200% (Boost)</span>
            <span>300% (Max)</span>
          </div>
        </div>

        {/* Audio Quality Enhancer Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-neutral-700/60">
          {/* Vocal Clarity EQ */}
          <button
            id="toggle-vocal-enhance-btn"
            onClick={() =>
              onChangeAudioConfig({ ...audioConfig, vocalEnhance: !audioConfig.vocalEnhance })
            }
            className={`p-2 rounded-lg border text-left transition-all text-xs ${
              audioConfig.vocalEnhance
                ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-sm'
                : 'bg-neutral-800/60 border-neutral-700 text-neutral-400'
            }`}
          >
            <div className="font-semibold text-white flex items-center justify-between">
              <span>Vocal Clarity EQ</span>
              <span className="text-[10px] font-mono uppercase text-emerald-400">
                {audioConfig.vocalEnhance ? 'ON' : 'OFF'}
              </span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">Podcast voice presence boost</div>
          </button>

          {/* Low-Cut Filter (80Hz) */}
          <button
            id="toggle-highpass-filter-btn"
            onClick={() =>
              onChangeAudioConfig({ ...audioConfig, highpassFilter: !audioConfig.highpassFilter })
            }
            className={`p-2 rounded-lg border text-left transition-all text-xs ${
              audioConfig.highpassFilter
                ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-sm'
                : 'bg-neutral-800/60 border-neutral-700 text-neutral-400'
            }`}
          >
            <div className="font-semibold text-white flex items-center justify-between">
              <span>80Hz Rumble Cut</span>
              <span className="text-[10px] font-mono uppercase text-emerald-400">
                {audioConfig.highpassFilter ? 'ON' : 'OFF'}
              </span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">Eliminates AC &amp; desk bumps</div>
          </button>

          {/* Dynamics Compressor */}
          <button
            id="toggle-compressor-btn"
            onClick={() =>
              onChangeAudioConfig({ ...audioConfig, compressor: !audioConfig.compressor })
            }
            className={`p-2 rounded-lg border text-left transition-all text-xs ${
              audioConfig.compressor
                ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-sm'
                : 'bg-neutral-800/60 border-neutral-700 text-neutral-400'
            }`}
          >
            <div className="font-semibold text-white flex items-center justify-between">
              <span>Studio Compressor</span>
              <span className="text-[10px] font-mono uppercase text-emerald-400">
                {audioConfig.compressor ? 'ON' : 'OFF'}
              </span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">Smooths volume, stops clipping</div>
          </button>

          {/* Headphone Monitor */}
          <button
            id="toggle-headphone-monitor-btn"
            onClick={() =>
              onChangeAudioConfig({ ...audioConfig, monitorAudio: !audioConfig.monitorAudio })
            }
            className={`p-2 rounded-lg border text-left transition-all text-xs ${
              audioConfig.monitorAudio
                ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                : 'bg-neutral-800/60 border-neutral-700 text-neutral-400'
            }`}
            title="Use headphones to avoid microphone feedback"
          >
            <div className="font-semibold text-white flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Headphones className="w-3 h-3 text-blue-400" />
                <span>Headphone Test</span>
              </span>
              <span className="text-[10px] font-mono uppercase text-blue-400">
                {audioConfig.monitorAudio ? 'ON' : 'OFF'}
              </span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">Hear yourself (use headphones)</div>
          </button>
        </div>
      </div>

      {/* 2. Mic Master Visibility Toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-800/80 border border-neutral-700">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-white text-xs uppercase tracking-wider">
              Studio Microphone Stand
            </div>
            <div className="text-[11px] text-neutral-400">Visual broadcast mic in front of presenter</div>
          </div>
        </div>
        <button
          id="toggle-mic-visible-btn"
          onClick={() => onChange({ ...config, visible: !config.visible })}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            config.visible ? 'bg-blue-600 text-white shadow-sm' : 'bg-neutral-700 text-neutral-400'
          }`}
        >
          {config.visible ? 'Visible' : 'Hidden'}
        </button>
      </div>

      {config.visible && (
        <>
          {/* Microphone Wrap Styling Section */}
          <div className="p-3.5 rounded-xl bg-gradient-to-b from-neutral-800 to-neutral-900 border border-blue-500/30 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-white text-xs uppercase tracking-wider">
                  Microphone Wrap Branding
                </span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                Mic Flag
              </span>
            </div>

            {/* Wrap Style Presets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {wrapStyles.map((style) => (
                <button
                  key={style.id}
                  id={`mic-wrap-style-${style.id}`}
                  onClick={() => onChange({ ...config, wrapStyle: style.id })}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    config.wrapStyle === style.id
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                      : 'bg-neutral-800/60 border-neutral-700/70 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <div className="font-semibold text-xs text-white">{style.label}</div>
                  <div className="text-[10px] text-neutral-400 truncate">{style.desc}</div>
                </button>
              ))}
            </div>

            {/* Custom Text Input */}
            {config.wrapStyle === 'custom_text' && (
              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-semibold text-neutral-300">Custom Wrap Text / Name:</label>
                <input
                  id="mic-custom-text-input"
                  type="text"
                  maxLength={16}
                  value={config.customText}
                  onChange={(e) => onChange({ ...config, customText: e.target.value })}
                  placeholder="e.g. DJ O'REALLY"
                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-700 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            {/* Wrap Foam Color */}
            <div className="space-y-2 pt-1 border-t border-neutral-700/60">
              <label className="text-[11px] font-semibold text-neutral-300">Mic Wrap Color Theme:</label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {wrapColors.map((color) => (
                  <button
                    key={color.id}
                    id={`mic-color-${color.id}`}
                    onClick={() => onChange({ ...config, wrapColor: color.id })}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      config.wrapColor === color.id
                        ? 'border-blue-500 bg-blue-500/10 text-white shadow-sm'
                        : 'border-neutral-700 bg-neutral-800 text-neutral-300 hover:border-neutral-600'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-white/20"
                      style={{ backgroundColor: color.colorHex }}
                    />
                    <span>{color.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Position & Placement */}
          <div className="p-3.5 rounded-xl bg-neutral-800/80 border border-neutral-700 space-y-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" />
              <span className="font-semibold text-white text-xs uppercase tracking-wider">
                Placement &amp; Scale
              </span>
            </div>

            {/* Preset Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {positions.map((pos) => (
                <button
                  key={pos.id}
                  id={`mic-pos-${pos.id}`}
                  onClick={() => onChange({ ...config, position: pos.id })}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-center transition-all ${
                    config.position === pos.id
                      ? 'bg-blue-600 border-blue-500 text-white font-semibold'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>

            {/* Scale Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-300">Microphone Scale</span>
                <span className="font-mono text-neutral-400">{Math.round(config.scale * 100)}%</span>
              </div>
              <input
                id="slider-mic-scale"
                type="range"
                min="0.6"
                max="1.5"
                step="0.05"
                value={config.scale}
                onChange={(e) => onChange({ ...config, scale: parseFloat(e.target.value) })}
                className="w-full accent-blue-500 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Custom Coordinates if custom chosen */}
            {config.position === 'custom' && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-neutral-300">X Position</span>
                    <span className="font-mono text-neutral-400">{config.customX}%</span>
                  </div>
                  <input
                    id="slider-mic-x"
                    type="range"
                    min="10"
                    max="90"
                    value={config.customX}
                    onChange={(e) => onChange({ ...config, customX: parseInt(e.target.value, 10) })}
                    className="w-full accent-blue-500 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-neutral-300">Y Position</span>
                    <span className="font-mono text-neutral-400">{config.customY}%</span>
                  </div>
                  <input
                    id="slider-mic-y"
                    type="range"
                    min="30"
                    max="90"
                    value={config.customY}
                    onChange={(e) => onChange({ ...config, customY: parseInt(e.target.value, 10) })}
                    className="w-full accent-blue-500 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Stand Badge & Audio Reactivity Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              id="toggle-stand-badge-btn"
              onClick={() => onChange({ ...config, showStandBadge: !config.showStandBadge })}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                config.showStandBadge
                  ? 'bg-blue-600/20 border-blue-500 text-white font-medium'
                  : 'bg-neutral-800/80 border-neutral-700 text-neutral-400'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>MOMS Stand Badge</span>
              </span>
              <span className="font-bold text-[10px] uppercase">
                {config.showStandBadge ? 'ON' : 'OFF'}
              </span>
            </button>

            <button
              id="toggle-mic-glow-btn"
              onClick={() => onChange({ ...config, audioReactiveGlow: !config.audioReactiveGlow })}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                config.audioReactiveGlow
                  ? 'bg-blue-600/20 border-blue-500 text-white font-medium'
                  : 'bg-neutral-800/80 border-neutral-700 text-neutral-400'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Voice Reactive Glow</span>
              </span>
              <span className="font-bold text-[10px] uppercase">
                {config.audioReactiveGlow ? (audioLevel > 0.1 ? 'ACTIVE' : 'ON') : 'OFF'}
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
