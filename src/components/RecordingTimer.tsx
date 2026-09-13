import React from 'react';
import { useRecording } from '../context/RecordingContext';
import { Clock, Radio, Pause } from 'lucide-react';

interface RecordingTimerProps {
  className?: string;
  compact?: boolean;
}

export const RecordingTimer: React.FC<RecordingTimerProps> = ({
  className = '',
  compact = false,
}) => {
  const { recordingState } = useRecording();

  const { isRecording, isPaused, durationSeconds } = recordingState;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const hours = Math.floor(mins / 60);

    if (hours > 0) {
      const remMins = mins % 60;
      return `${hours.toString().padStart(2, '0')}:${remMins
        .toString()
        .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isRecording) {
    return (
      <div
        id="visual-recording-timer-idle"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900/80 border border-neutral-800 text-neutral-400 select-none ${className}`}
        title="Visual Recording Timer (Idle)"
      >
        <Clock className="w-3.5 h-3.5 text-neutral-500" />
        <span className="font-mono text-xs font-semibold text-neutral-400">00:00</span>
        {!compact && (
          <span className="text-[10px] text-neutral-500 uppercase font-medium tracking-wider hidden sm:inline">
            Standby
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      id="visual-recording-timer-active"
      className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all select-none shadow-md ${
        isPaused
          ? 'bg-amber-950/80 border-amber-500/50 text-amber-200'
          : 'bg-red-950/85 border-red-500/60 text-red-100 shadow-red-600/20'
      } ${className}`}
      title={isPaused ? 'Recording Paused' : 'Live Studio Recording Elapsed Time'}
    >
      {/* Blinking Live Beacon or Pause Icon */}
      {isPaused ? (
        <Pause className="w-3 h-3 text-amber-400 animate-pulse" />
      ) : (
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
        </span>
      )}

      {/* Time Display */}
      <span className="font-mono text-xs sm:text-sm font-black tracking-widest tabular-nums text-white">
        {formatTime(durationSeconds)}
      </span>

      {/* Mode Tag */}
      {!compact && (
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
            isPaused
              ? 'bg-amber-500/20 text-amber-300'
              : 'bg-red-600/40 text-red-200'
          }`}
        >
          {isPaused ? 'PAUSED' : 'LIVE'}
        </span>
      )}
    </div>
  );
};
