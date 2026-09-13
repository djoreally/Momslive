import React from 'react';
import { CheckCircle2, AlertTriangle, Lightbulb, UserCheck, Sparkles, X } from 'lucide-react';

interface WhiteWallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCalibration: () => void;
}

export const WhiteWallGuideModal: React.FC<WhiteWallGuideModalProps> = ({
  isOpen,
  onClose,
  onStartCalibration,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        id="white-wall-guide-modal" 
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 text-neutral-100"
      >
        {/* Close Button */}
        <button
          id="close-guide-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition-colors"
          aria-label="Close setup guide"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold tracking-wider text-blue-400 uppercase">White Screen Virtual Studio</span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">White Wall Setup Guide</h2>
          </div>
        </div>

        {/* Core Instruction Alert */}
        <div className="p-4 mb-6 rounded-xl bg-gradient-to-r from-blue-950/60 to-neutral-900 border border-blue-500/40 text-sm text-neutral-200">
          <p className="font-semibold text-blue-300 text-base mb-1">
            Stand in front of a flat, plain white wall or white screen!
          </p>
          <p className="leading-relaxed text-neutral-300">
            The studio uses high-speed real-time keying to remove the white background behind you and insert you into the 
            <strong className="text-white"> MOMS Mobile Oil Change & Fleet Maintenance </strong> setting, positioned right behind the broadcast podcast microphone.
          </p>
        </div>

        {/* 4 Golden Rules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-neutral-800/60 border border-neutral-700/50">
            <div className="flex items-center gap-2 mb-2 text-emerald-400 font-semibold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>1. Solid White Wall</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Use a clean white, light grey, or off-white wall, door, or white sheet. Keep it clear of wall art or posters directly behind your head.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-800/60 border border-neutral-700/50">
            <div className="flex items-center gap-2 mb-2 text-emerald-400 font-semibold text-sm">
              <UserCheck className="w-4 h-4" />
              <span>2. Step 3–5 Feet Forward</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Do not lean against the wall. Standing 3 to 5 feet forward eliminates harsh shadows on the wall, making background removal crystal clear.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-800/60 border border-neutral-700/50">
            <div className="flex items-center gap-2 mb-2 text-emerald-400 font-semibold text-sm">
              <Lightbulb className="w-4 h-4" />
              <span>3. Even Lighting</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Turn on ceiling or frontal lights to illuminate your face and the wall evenly. Avoid dark gradients or direct spotlight flares.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-800/60 border border-neutral-700/50">
            <div className="flex items-center gap-2 mb-2 text-amber-400 font-semibold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>4. Contrasting Clothes</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Wear darker or colored clothing (navy, black, blue, red, etc.). Avoid wearing a solid pure white shirt so your shirt is not keyed out.
            </p>
          </div>
        </div>

        {/* Pro Tip: Difference Matte */}
        <div className="p-4 rounded-xl bg-neutral-800/80 border border-neutral-700 mb-6 text-xs text-neutral-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <span className="px-2 py-0.5 rounded bg-blue-600 text-[10px] uppercase tracking-wider font-bold">Pro Feature</span>
            <span>Empty Wall Snapshot Subtraction</span>
          </div>
          <p>
            If your wall is textured or has shadows, use <strong className="text-blue-300">&quot;Capture Empty Wall&quot;</strong> in the calibration panel. Step out of camera view for 1 second, capture the empty room, then step back in. The studio will subtract the wall with razor-sharp precision!
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-neutral-800">
          <button
            id="dismiss-guide-btn"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            I&apos;m In Front of White Wall
          </button>
          <button
            id="start-calibration-btn"
            onClick={() => {
              onClose();
              onStartCalibration();
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
          >
            <span>Open Calibration Tool</span>
          </button>
        </div>
      </div>
    </div>
  );
};
