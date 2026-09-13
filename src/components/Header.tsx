import React from 'react';
import { Sparkles, Sliders, Mic, Image, FileText, HelpCircle, Video, VideoOff, Camera, Cloud } from 'lucide-react';
import { WorkspaceBadge } from './WorkspaceBadge';

export type ActiveDrawer = 'none' | 'calibration' | 'microphone' | 'setting' | 'teleprompter' | 'camera' | 'cloudinary';

interface HeaderProps {
  activeDrawer: ActiveDrawer;
  onToggleDrawer: (drawer: ActiveDrawer) => void;
  onOpenGuide: () => void;
  hasCamera: boolean;
  onRequestCamera: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeDrawer,
  onToggleDrawer,
  onOpenGuide,
  hasCamera,
  onRequestCamera,
}) => {
  return (
    <header className="w-full bg-neutral-900/90 border-b border-neutral-800 backdrop-blur-md px-4 sm:px-6 py-2.5 flex items-center justify-between z-20">
      {/* Brand & App Title + Workspace Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {/* MOMS Stylized Logo Badge */}
          <div className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-700 to-sky-600 border border-sky-400/40 text-white font-black text-sm tracking-tight shadow-md flex items-center gap-1.5">
            <span className="font-extrabold text-white text-base leading-none">MOMS</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5 leading-none">
              <span>White Screen Studio</span>
            </h1>
            <p className="text-[10px] text-neutral-400 tracking-wide font-medium hidden sm:block">
              Mobile Oil Change &amp; Fleet Maintenance Virtual Set
            </p>
          </div>
        </div>

        {/* User Workspace Badge & Switcher */}
        <div className="hidden sm:block pl-2 border-l border-neutral-800">
          <WorkspaceBadge />
        </div>
      </div>

      {/* Control Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* White Wall Setup Guide Button */}
        <button
          id="open-guide-btn"
          onClick={onOpenGuide}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 transition-all shadow-sm"
        >
          <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden md:inline">White Wall Setup Guide</span>
          <span className="md:hidden">Guide</span>
        </button>

        {/* Camera Lens & 4K/8K Drawer Toggle */}
        <button
          id="tab-camera-btn"
          onClick={() => onToggleDrawer(activeDrawer === 'camera' ? 'none' : 'camera')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            activeDrawer === 'camera'
              ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
              : 'bg-neutral-800/80 border-neutral-700 text-neutral-300 hover:text-white'
          }`}
          title="Camera Lens (Front/Rear) & 4K/8K Quality"
        >
          <Camera className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Camera / 4K</span>
        </button>

        {/* Drawer Toggles */}
        <button
          id="tab-calibration-btn"
          onClick={() => onToggleDrawer(activeDrawer === 'calibration' ? 'none' : 'calibration')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            activeDrawer === 'calibration'
              ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
              : 'bg-neutral-800/80 border-neutral-700 text-neutral-300 hover:text-white'
          }`}
          title="White Screen Calibration & Framing"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Calibrate Wall</span>
        </button>

        <button
          id="tab-microphone-btn"
          onClick={() => onToggleDrawer(activeDrawer === 'microphone' ? 'none' : 'microphone')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            activeDrawer === 'microphone'
              ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
              : 'bg-neutral-800/80 border-neutral-700 text-neutral-300 hover:text-white'
          }`}
          title="Microphone Wrap & Position"
        >
          <Mic className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Mic Wrap</span>
        </button>

        <button
          id="tab-setting-btn"
          onClick={() => onToggleDrawer(activeDrawer === 'setting' ? 'none' : 'setting')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            activeDrawer === 'setting'
              ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
              : 'bg-neutral-800/80 border-neutral-700 text-neutral-300 hover:text-white'
          }`}
          title="Virtual Setting & Format"
        >
          <Image className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Setting</span>
        </button>

        <button
          id="tab-teleprompter-btn"
          onClick={() => onToggleDrawer(activeDrawer === 'teleprompter' ? 'none' : 'teleprompter')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            activeDrawer === 'teleprompter'
              ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
              : 'bg-neutral-800/80 border-neutral-700 text-neutral-300 hover:text-white'
          }`}
          title="Teleprompter & Script"
        >
          <FileText className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Script</span>
        </button>

        {/* Cloudinary Cloud Storage & Processing Tab */}
        <button
          id="tab-cloudinary-btn"
          onClick={() => onToggleDrawer(activeDrawer === 'cloudinary' ? 'none' : 'cloudinary')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            activeDrawer === 'cloudinary'
              ? 'bg-purple-600 border-purple-500 text-white shadow-sm'
              : 'bg-neutral-800/80 border-neutral-700 text-purple-300 hover:text-white hover:bg-neutral-800'
          }`}
          title="Cloudinary Cloud Vault: Media Storage, Podcast Audio & CDN"
        >
          <Cloud className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">Cloud Vault</span>
        </button>

        {/* Camera Permission status */}
        {!hasCamera && (
          <button
            id="enable-camera-btn"
            onClick={onRequestCamera}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow transition-colors ml-1"
          >
            <VideoOff className="w-3.5 h-3.5" />
            <span>Enable Cam</span>
          </button>
        )}
      </div>
    </header>
  );
};
