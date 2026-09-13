import React, {
  createContext,
  useContext,
  useState,
  useRef,
  ReactNode,
} from 'react';
import { RecordingState, RecordingFormat } from '../types';
import {
  playCountdownBeep,
  getSupportedMimeTypes,
  fixWebmBlobDuration,
} from '../utils/audio';
import { getBitrateForDimensions } from '../utils/camera';
import { useStudio } from './StudioContext';

interface RecordingContextType {
  recordingState: RecordingState;
  recordingFormat: RecordingFormat;
  setRecordingFormat: (format: RecordingFormat) => void;
  startRecording: () => void;
  stopRecording: () => void;
  togglePause: () => void;
  takeSnapshot: () => void;
  clearRecording: () => void;
}

const RecordingContext = createContext<RecordingContextType | null>(null);

export const RecordingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    stream,
    canvasHandleRef,
    studioAudioEngine,
    cameraQuality,
    teleprompterConfig,
    setTeleprompterConfig,
  } = useStudio();

  const [recordingFormat, setRecordingFormat] = useState<RecordingFormat>('mp4');
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    countdown: null,
    durationSeconds: 0,
    recordedBlob: null,
    recordedVideoUrl: null,
    format: 'mp4',
    resolution: cameraQuality.resolution,
    frameRate: cameraQuality.frameRate,
    videoWidth: 0,
    videoHeight: 0,
    isConverting: false,
    conversionStatus: null,
    mp4Blob: null,
    mp4Url: null,
    serverDownloadUrl: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);

  const startRecording = () => {
    if (!stream || stream.getVideoTracks().length === 0) return;

    let count = 3;
    setRecordingState((prev) => ({ ...prev, countdown: count }));
    playCountdownBeep(880, 0.1);

    const interval = window.setInterval(() => {
      count -= 1;
      if (count > 0) {
        setRecordingState((prev) => ({ ...prev, countdown: count }));
        playCountdownBeep(880, 0.1);
      } else {
        clearInterval(interval);
        playCountdownBeep(1320, 0.25);
        setRecordingState((prev) => ({ ...prev, countdown: null }));
        executeStartRecording();
      }
    }, 1000);
  };

  const executeStartRecording = () => {
    if (!stream) return;

    // Social-camera architecture:
    // Record the device camera track directly so the browser/device can use its
    // native capture + hardware encode path. The studio canvas remains preview-only.
    // Branding, crops and layouts are applied after capture through Remotion.
    const sourceVideoTrack = stream.getVideoTracks()[0];
    if (!sourceVideoTrack || sourceVideoTrack.readyState !== 'live') return;

    const mixedStream = new MediaStream();
    const videoTrack = sourceVideoTrack;
    mixedStream.addTrack(videoTrack);

    const processedAudioTrack =
      studioAudioEngine.getProcessedAudioTrack() || stream.getAudioTracks()[0];
    if (processedAudioTrack) mixedStream.addTrack(processedAudioTrack);

    const supported = getSupportedMimeTypes();
    let mimeType = 'video/webm;codecs=vp9,opus';

    if (recordingFormat === 'mp4' && supported.mp4) {
      mimeType = supported.mp4;
    } else if (supported.webm) {
      mimeType = supported.webm;
    } else {
      mimeType = 'video/webm';
    }

    const captureSettings = videoTrack?.getSettings?.() || {};
    const captureWidth =
      captureSettings.width || cameraQuality.actualWidth || 1920;
    const captureHeight =
      captureSettings.height || cameraQuality.actualHeight || 1080;
    const captureFrameRate =
      captureSettings.frameRate || cameraQuality.actualFrameRate || cameraQuality.frameRate || 30;
    const baseBitrate = getBitrateForDimensions(
      captureWidth,
      captureHeight,
      captureFrameRate
    );
    // Give direct masters extra headroom. Browsers may clamp/ignore the hint,
    // but when honored this avoids social-video detail being starved.
    const masterVideoBitrate = Math.round(baseBitrate * 1.5);

    try {
      const recorder = new MediaRecorder(mixedStream, {
        mimeType,
        videoBitsPerSecond: masterVideoBitrate,
        audioBitsPerSecond: 256000,
      });

      recordedChunksRef.current = [];
      const startTime = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const rawBlob = new Blob(recordedChunksRef.current, { type: mimeType });
        const elapsedMs = Math.max(1000, Date.now() - startTime);

        let finalBlob = rawBlob;
        if (mimeType.includes('webm')) {
          finalBlob = await fixWebmBlobDuration(rawBlob, elapsedMs);
        }

        const videoUrl = URL.createObjectURL(finalBlob);
        setRecordingState((prev) => ({
          ...prev,
          isRecording: false,
          isPaused: false,
          recordedBlob: finalBlob,
          recordedVideoUrl: videoUrl,
          format: recordingFormat,
          resolution: cameraQuality.resolution,
          frameRate: cameraQuality.frameRate,
          videoWidth: captureWidth,
          videoHeight: captureHeight,
        }));

        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
      };

      // Larger chunks reduce main-thread churn on mobile during sustained capture.
      recorder.start(1000);
      mediaRecorderRef.current = recorder;

      setRecordingState((prev) => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        durationSeconds: 0,
        recordedBlob: null,
        recordedVideoUrl: null,
        resolution: cameraQuality.resolution,
        frameRate: cameraQuality.frameRate,
      }));

      if (teleprompterConfig.enabled) {
        setTeleprompterConfig((prev) => ({ ...prev, isScrolling: true }));
      }

      recordingTimerRef.current = window.setInterval(() => {
        setRecordingState((prev) => ({
          ...prev,
          durationSeconds: prev.durationSeconds + 1,
        }));
      }, 1000);
    } catch (err) {
      console.error('MediaRecorder start error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (teleprompterConfig.enabled) {
      setTeleprompterConfig((prev) => ({ ...prev, isScrolling: false }));
    }
  };

  const togglePause = () => {
    if (!mediaRecorderRef.current) return;
    if (recordingState.isPaused) {
      mediaRecorderRef.current.resume();
      setRecordingState((prev) => ({ ...prev, isPaused: false }));
    } else {
      mediaRecorderRef.current.pause();
      setRecordingState((prev) => ({ ...prev, isPaused: true }));
    }
  };

  const takeSnapshot = () => {
    if (canvasHandleRef.current) {
      const dataUrl = canvasHandleRef.current.takeSnapshot();
      if (dataUrl) {
        const a = document.createElement('a');
        a.href = dataUrl;
        const now = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        a.download = `MOMS_Studio_${cameraQuality.resolution.toUpperCase()}_Snapshot_${now}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    }
  };

  const clearRecording = () => {
    setRecordingState((prev) => ({
      ...prev,
      recordedBlob: null,
      recordedVideoUrl: null,
      durationSeconds: 0,
    }));
  };

  return (
    <RecordingContext.Provider
      value={{
        recordingState,
        recordingFormat,
        setRecordingFormat,
        startRecording,
        stopRecording,
        togglePause,
        takeSnapshot,
        clearRecording,
      }}
    >
      {children}
    </RecordingContext.Provider>
  );
};

export function useRecording() {
  const context = useContext(RecordingContext);
  if (!context) {
    throw new Error('useRecording must be used within a RecordingProvider');
  }
  return context;
}
