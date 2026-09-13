import React, { useRef } from 'react';
import { StudioSetting, AspectRatio } from '../types';
import { Image, Upload, Smartphone, Monitor, Eye, Sliders } from 'lucide-react';

interface SettingControlsProps {
  currentSetting: StudioSetting;
  settingsList: StudioSetting[];
  onSelectSetting: (setting: StudioSetting) => void;
  aspectRatio: AspectRatio;
  onChangeAspectRatio: (ratio: AspectRatio) => void;
  showBrandedOverlays: boolean;
  onToggleBrandedOverlays: () => void;
  onUploadCustomBg: (file: File) => void;
  onChangeBlur: (blur: number) => void;
  onChangeBrightness: (brightness: number) => void;
}

export const SettingControls: React.FC<SettingControlsProps> = ({
  currentSetting,
  settingsList,
  onSelectSetting,
  aspectRatio,
  onChangeAspectRatio,
  showBrandedOverlays,
  onToggleBrandedOverlays,
  onUploadCustomBg,
  onChangeBlur,
  onChangeBrightness,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadCustomBg(e.target.files[0]);
    }
  };

  return (
    <div id="setting-controls-panel" className="space-y-4 text-sm text-neutral-200">
      {/* Aspect Ratio Selector */}
      <div className="p-3 rounded-xl bg-neutral-800/80 border border-neutral-700">
        <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
          Video Format & Aspect Ratio
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            id="aspect-ratio-9-16-btn"
            onClick={() => onChangeAspectRatio('9:16')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
              aspectRatio === '9:16'
                ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>9:16 Vertical (Reel / TikTok)</span>
          </button>
          <button
            id="aspect-ratio-16-9-btn"
            onClick={() => onChangeAspectRatio('16:9')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
              aspectRatio === '16:9'
                ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>16:9 Landscape (YouTube)</span>
          </button>
        </div>
      </div>

      {/* Studio Setting Backdrops */}
      <div className="p-3.5 rounded-xl bg-neutral-800/80 border border-neutral-700 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-white text-xs uppercase tracking-wider">Virtual Studio Backdrop</span>
          </div>
          <button
            id="upload-custom-bg-btn"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Backdrops Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {settingsList.map((st) => (
            <button
              key={st.id}
              id={`setting-bg-${st.id}`}
              onClick={() => onSelectSetting(st)}
              className={`group relative overflow-hidden rounded-xl border text-left transition-all ${
                currentSetting.id === st.id
                  ? 'border-blue-500 ring-2 ring-blue-500/30'
                  : 'border-neutral-700 hover:border-neutral-500'
              }`}
            >
              <div className="h-24 w-full bg-neutral-900 relative">
                <img
                  src={st.bgImageUrl}
                  alt={st.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="text-xs font-bold text-white leading-tight truncate">{st.name}</div>
                  <div className="text-[10px] text-blue-300 font-medium">MOMS Official Studio</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Setting Adjustments: Blur & Brightness */}
        <div className="space-y-3 pt-2 border-t border-neutral-700/60">
          <div className="flex items-center gap-1.5 text-xs text-neutral-300 font-medium">
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            <span>Backdrop Depth of Field & Lighting</span>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-neutral-400">Background Blur (Lens Bokeh)</span>
              <span className="font-mono text-neutral-400">{currentSetting.blur}px</span>
            </div>
            <input
              id="slider-bg-blur"
              type="range"
              min="0"
              max="12"
              step="1"
              value={currentSetting.blur}
              onChange={(e) => onChangeBlur(parseInt(e.target.value, 10))}
              className="w-full accent-blue-500 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-neutral-400">Backdrop Brightness</span>
              <span className="font-mono text-neutral-400">{Math.round(currentSetting.brightness * 100)}%</span>
            </div>
            <input
              id="slider-bg-brightness"
              type="range"
              min="0.6"
              max="1.4"
              step="0.05"
              value={currentSetting.brightness}
              onChange={(e) => onChangeBrightness(parseFloat(e.target.value))}
              className="w-full accent-blue-500 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Branded Graphic Overlays */}
      <div className="p-3 rounded-xl bg-neutral-800/80 border border-neutral-700 flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="font-semibold text-white text-xs uppercase tracking-wider">MOMS Commercial Graphic Overlays</div>
          <div className="text-[11px] text-neutral-400">Website URL, QR Code, and 3D Logo banner</div>
        </div>
        <button
          id="toggle-branded-overlays-btn"
          onClick={onToggleBrandedOverlays}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            showBrandedOverlays
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-neutral-700 text-neutral-400'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{showBrandedOverlays ? 'Enabled' : 'Hidden'}</span>
        </button>
      </div>
    </div>
  );
};
