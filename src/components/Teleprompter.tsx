import React, { useEffect, useRef } from 'react';
import { TeleprompterConfig } from '../types';
import { PREMADE_SCRIPTS } from '../data/studios';
import { Play, Pause, RotateCcw, Type, FastForward, FileText } from 'lucide-react';

interface TeleprompterProps {
  config: TeleprompterConfig;
  onChange: (newConfig: TeleprompterConfig) => void;
  isOverlay?: boolean;
}

export const Teleprompter: React.FC<TeleprompterProps> = ({
  config,
  onChange,
  isOverlay = false,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!config.enabled || !config.isScrolling) return;

    let frameId: number;
    const scroll = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop += config.scrollSpeed * 0.4;
        // If reached bottom, pause
        if (
          scrollContainerRef.current.scrollTop + scrollContainerRef.current.clientHeight >=
          scrollContainerRef.current.scrollHeight - 5
        ) {
          onChange({ ...config, isScrolling: false });
          return;
        }
      }
      frameId = requestAnimationFrame(scroll);
    };

    frameId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(frameId);
  }, [config.enabled, config.isScrolling, config.scrollSpeed]);

  const handleResetScroll = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    onChange({ ...config, isScrolling: false });
  };

  if (isOverlay) {
    if (!config.enabled) return null;

    return (
      <div
        id="teleprompter-floating-overlay"
        className="absolute top-12 left-4 right-4 max-w-lg mx-auto z-30 pointer-events-auto rounded-2xl bg-black/75 backdrop-blur-md border border-white/20 p-4 shadow-2xl transition-all"
        style={{ opacity: config.opacity }}
      >
        {/* Compact Floating Controls */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs">
          <span className="font-semibold text-blue-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span>Teleprompter</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              id="tp-overlay-toggle-play-btn"
              onClick={() => onChange({ ...config, isScrolling: !config.isScrolling })}
              className="p-1 rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              {config.isScrolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              id="tp-overlay-reset-btn"
              onClick={handleResetScroll}
              className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrolling Text Window */}
        <div
          ref={scrollContainerRef}
          className="h-32 sm:h-40 overflow-y-scroll scroll-smooth select-none text-white font-medium leading-relaxed"
          style={{ fontSize: `${config.fontSize}px` }}
        >
          <div className="pb-16 pt-2 whitespace-pre-line">{config.text}</div>
        </div>
      </div>
    );
  }

  return (
    <div id="teleprompter-settings-panel" className="space-y-4 text-sm text-neutral-200">
      {/* Master Toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-800/80 border border-neutral-700">
        <div>
          <div className="font-semibold text-white text-xs uppercase tracking-wider">Teleprompter & Script</div>
          <div className="text-[11px] text-neutral-400">Scrolls text near camera while you speak</div>
        </div>
        <button
          id="toggle-teleprompter-btn"
          onClick={() => onChange({ ...config, enabled: !config.enabled })}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            config.enabled ? 'bg-blue-600 text-white shadow-sm' : 'bg-neutral-700 text-neutral-400'
          }`}
        >
          {config.enabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      {config.enabled && (
        <div className="space-y-3.5 p-3.5 rounded-xl bg-neutral-800/80 border border-neutral-700">
          {/* Premade Scripts */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Load MOMS Oil Change Script:</label>
            <div className="grid grid-cols-1 gap-1.5">
              {PREMADE_SCRIPTS.map((script) => (
                <button
                  key={script.id}
                  id={`load-script-${script.id}`}
                  onClick={() => onChange({ ...config, text: script.text, isScrolling: false })}
                  className="py-1.5 px-2.5 rounded-lg bg-neutral-700/60 hover:bg-neutral-700 text-left text-xs text-neutral-200 hover:text-white transition-colors"
                >
                  <span className="font-medium">{script.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Script Textarea */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">Your Script Text:</label>
            <textarea
              id="teleprompter-textarea"
              rows={4}
              value={config.text}
              onChange={(e) => onChange({ ...config, text: e.target.value })}
              className="w-full p-2.5 rounded-lg bg-neutral-950 border border-neutral-700 text-xs text-white leading-relaxed focus:outline-none focus:border-blue-500 font-sans"
              placeholder="Type or paste your video script here..."
            />
          </div>

          {/* Speed & Size Controls */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="flex items-center gap-1 text-neutral-400">
                  <FastForward className="w-3 h-3" />
                  <span>Scroll Speed</span>
                </span>
                <span className="font-mono text-neutral-300">{config.scrollSpeed}x</span>
              </div>
              <input
                id="slider-tp-speed"
                type="range"
                min="1"
                max="8"
                step="0.5"
                value={config.scrollSpeed}
                onChange={(e) => onChange({ ...config, scrollSpeed: parseFloat(e.target.value) })}
                className="w-full accent-blue-500 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="flex items-center gap-1 text-neutral-400">
                  <Type className="w-3 h-3" />
                  <span>Font Size</span>
                </span>
                <span className="font-mono text-neutral-300">{config.fontSize}px</span>
              </div>
              <input
                id="slider-tp-font-size"
                type="range"
                min="14"
                max="28"
                step="1"
                value={config.fontSize}
                onChange={(e) => onChange({ ...config, fontSize: parseInt(e.target.value, 10) })}
                className="w-full accent-blue-500 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
