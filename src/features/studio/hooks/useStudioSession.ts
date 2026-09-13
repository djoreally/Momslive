'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  AudioConfig,
  CameraDeviceInfo,
  CameraFacing,
  CameraQualityConfig,
  ChromaKeyConfig,
  MicConfig,
  RecordingFormat,
  RecordingState,
  StudioSetting,
  TeleprompterConfig,
  UserFraming,
} from '../../../types';
import { DEFAULT_STUDIOS, PREMADE_SCRIPTS } from '../../../data/studios';
import type { ActiveDrawer } from '../../../components/Header';
import type { StudioCanvasHandle } from '../../../components/StudioCanvas';
import {
  StudioAudioEngine,
  fixWebmBlobDuration,
  getSupportedMimeTypes,
  playCountdownBeep,
} from '../../../utils/audio';
import {
  buildCameraConstraints,
  enumerateCameraDevices,
  getBitrateForConfig,
} from '../../../utils/camera';

const INITIAL_CAMERA_QUALITY: CameraQualityConfig = {
  resolution: '4k',
  frameRate: 60,
  facingMode: 'user',
  selectedDeviceId: null,
  actualWidth: 0,
  actualHeight: 0,
  actualFrameRate: 0,
  sensorLabel: '',
};

const INITIAL_AUDIO_CONFIG: AudioConfig = {
  micGain: 1.35,
  vocalEnhance: true,
  highpassFilter: true,
  compressor: true,
  echoCancellation: true,
  monitorAudio: false,
};

const INITIAL_CHROMA_CONFIG: ChromaKeyConfig = {
  mode: 'luminance_white',
  luminanceThreshold: 0.76,
  tolerance: 0.18,
  softness: 0.08,
  spillSuppression: 0.35,
  sampledColor: { r: 245, g: 245, b: 245 },
  sampleRadius: 8,
  showMatteOnly: false,
  edgeErosion: 0,
};

const INITIAL_FRAMING: UserFraming = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  mirror: true,
  brightness: 1,
  contrast: 1,
};

const INITIAL_MIC_CONFIG: MicConfig = {
  visible: true,
  wrapStyle: 'moms_3d',
  wrapColor: 'royal_blue',
  customText: 'MOMS OIL',
  customLogoUrl: null,
  position: 'host_left',
  customX: 35,
  customY: 65,
  scale: 1,
  showStandBadge: true,
  audioReactiveGlow: true,
};

const INITIAL_TELEPROMPTER: TeleprompterConfig = {
  enabled: false,
  text: PREMADE_SCRIPTS[0].text,
  fontSize: 20,
  scrollSpeed: 3,
  isScrolling: false,
  opacity: 0.85,
};

const INITIAL_RECORDING: RecordingState = {
  isRecording: false,
  isPaused: false,
  countdown: null,
  durationSeconds: 0,
  recordedBlob: null,
  recordedVideoUrl: null,
  format: 'mp4',
  resolution: '4k',
  frameRate: 60,
  videoWidth: 0,
  videoHeight: 0,
  isConverting: false,
  conversionStatus: null,
  mp4Blob: null,
  mp4Url: null,
  serverDownloadUrl: null,
};

type SampledStats = { luminance: number; saturation: number };

type SessionActions = {
  initCamera: (overrides?: Partial<CameraQualityConfig>) => Promise<void>;
  handleFlipCamera: () => void;
  handleCameraConfigChange: (config: Partial<CameraQualityConfig>) => void;
  handleAudioConfigChange: (config: AudioConfig) => void;
  handleSampledColor: (color: {
    r: number;
    g: number;
    b: number;
    luminance: number;
    saturation: number;
  }) => void;
  handleCaptureEmptyWall: () => void;
  handleClearEmptyWall: () => void;
  handleAutoSampleWall: () => void;
  handleUploadCustomBg: (file: File) => void;
  handleTakeSnapshot: () => void;
  handleStartRecord: () => void;
  handleStopRecord: () => void;
  handleTogglePause: () => void;
  closeReview: () => void;
  retakeRecording: () => void;
};

export type StudioSession = {
  stream: MediaStream | null;
  cameraError: string | null;
  audioLevel: number;
  audioPeak: number;
  cameraQuality: CameraQualityConfig;
  availableCameras: CameraDeviceInfo[];
  audioConfig: AudioConfig;
  recordingFormat: RecordingFormat;
  chromaConfig: ChromaKeyConfig;
  framing: UserFraming;
  micConfig: MicConfig;
  settingsList: StudioSetting[];
  currentSetting: StudioSetting;
  aspectRatio: '9:16' | '16:9';
  showBrandedOverlays: boolean;
  teleprompterConfig: TeleprompterConfig;
  recordingState: RecordingState;
  activeDrawer: ActiveDrawer;
  showGuideModal: boolean;
  isSamplingColor: boolean;
  hasEmptyWallCapture: boolean;
  sampledStats: SampledStats | undefined;
  canvasHandleRef: React.MutableRefObject<StudioCanvasHandle | null>;
  setActiveDrawer: React.Dispatch<React.SetStateAction<ActiveDrawer>>;
  setShowGuideModal: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSamplingColor: React.Dispatch<React.SetStateAction<boolean>>;
  setChromaConfig: React.Dispatch<React.SetStateAction<ChromaKeyConfig>>;
  setFraming: React.Dispatch<React.SetStateAction<UserFraming>>;
  setMicConfig: React.Dispatch<React.SetStateAction<MicConfig>>;
  setCurrentSetting: React.Dispatch<React.SetStateAction<StudioSetting>>;
  setAspectRatio: React.Dispatch<React.SetStateAction<'9:16' | '16:9'>>;
  setShowBrandedOverlays: React.Dispatch<React.SetStateAction<boolean>>;
  setTeleprompterConfig: React.Dispatch<React.SetStateAction<TeleprompterConfig>>;
  setRecordingFormat: React.Dispatch<React.SetStateAction<RecordingFormat>>;
} & SessionActions;

export function useStudioSession(): StudioSession {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioPeak, setAudioPeak] = useState(0);
  const audioEngineRef = useRef<StudioAudioEngine>(new StudioAudioEngine());

  const [cameraQuality, setCameraQuality] = useState<CameraQualityConfig>(INITIAL_CAMERA_QUALITY);
  const [availableCameras, setAvailableCameras] = useState<CameraDeviceInfo[]>([]);
  const [audioConfig, setAudioConfig] = useState<AudioConfig>(INITIAL_AUDIO_CONFIG);
  const [recordingFormat, setRecordingFormat] = useState<RecordingFormat>('mp4');
  const canvasHandleRef = useRef<StudioCanvasHandle | null>(null);

  const [chromaConfig, setChromaConfig] = useState<ChromaKeyConfig>(INITIAL_CHROMA_CONFIG);
  const [framing, setFraming] = useState<UserFraming>(INITIAL_FRAMING);
  const [micConfig, setMicConfig] = useState<MicConfig>(INITIAL_MIC_CONFIG);
  const [settingsList, setSettingsList] = useState<StudioSetting[]>(DEFAULT_STUDIOS);
  const [currentSetting, setCurrentSetting] = useState<StudioSetting>(DEFAULT_STUDIOS[0]);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16');
  const [showBrandedOverlays, setShowBrandedOverlays] = useState(true);
  const [teleprompterConfig, setTeleprompterConfig] = useState<TeleprompterConfig>(INITIAL_TELEPROMPTER);
  const [recordingState, setRecordingState] = useState<RecordingState>(INITIAL_RECORDING);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const customObjectUrlsRef = useRef<string[]>([]);

  const [activeDrawer, setActiveDrawer] = useState<ActiveDrawer>('none');
  const [showGuideModal, setShowGuideModal] = useState(true);
  const [isSamplingColor, setIsSamplingColor] = useState(false);
  const [hasEmptyWallCapture, setHasEmptyWallCapture] = useState(false);
  const [sampledStats, setSampledStats] = useState<SampledStats>();

  const replaceStream = useCallback((nextStream: MediaStream | null) => {
    streamRef.current = nextStream;
    setStream(nextStream);
  }, []);

  const handleAudioConfigChange = useCallback((nextAudioConfig: AudioConfig) => {
    setAudioConfig(nextAudioConfig);
    audioEngineRef.current.updateConfig(nextAudioConfig);
  }, []);

  const initCamera = useCallback(
    async (overrides?: Partial<CameraQualityConfig>) => {
      setCameraError(null);
      const targetRes = overrides?.resolution ?? cameraQuality.resolution;
      const targetFps = overrides?.frameRate ?? cameraQuality.frameRate;
      const targetFacing = overrides?.facingMode ?? cameraQuality.facingMode;
      const targetDeviceId = overrides?.selectedDeviceId !== undefined
        ? overrides.selectedDeviceId
        : cameraQuality.selectedDeviceId;
      const constraints = buildCameraConstraints({
        resolution: targetRes,
        frameRate: targetFps,
        facingMode: targetFacing,
        deviceId: targetDeviceId || undefined,
        aspectRatio,
        echoCancellation: audioConfig.echoCancellation,
      });

      const applyStream = async (mediaStream: MediaStream, fallback = false) => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        replaceStream(mediaStream);
        const videoTrack = mediaStream.getVideoTracks()[0];
        const settings = videoTrack?.getSettings();
        setCameraQuality((previous) => ({
          ...previous,
          ...overrides,
          actualWidth: settings?.width ?? (fallback ? 1280 : 0),
          actualHeight: settings?.height ?? (fallback ? 720 : 0),
          actualFrameRate: settings?.frameRate ?? (fallback ? 30 : targetFps),
          sensorLabel: videoTrack?.label ?? '',
        }));
        setAvailableCameras(await enumerateCameraDevices());
        audioEngineRef.current.start(mediaStream, audioConfig, (level, peak) => {
          setAudioLevel(level);
          setAudioPeak(peak);
        });
      };

      try {
        await applyStream(await navigator.mediaDevices.getUserMedia(constraints));
      } catch (error) {
        console.warn('High-quality camera constraints failed, attempting hardware fallback:', error);
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: targetFacing },
            audio: {
              echoCancellation: audioConfig.echoCancellation,
              noiseSuppression: false,
              autoGainControl: false,
              sampleRate: 48000,
            },
          });
          await applyStream(fallbackStream, true);
        } catch (fallbackError) {
          console.error('All camera access failed:', fallbackError);
          setCameraError(
            fallbackError instanceof Error
              ? fallbackError.message
              : 'Camera or microphone access denied',
          );
        }
      }
    },
    [aspectRatio, audioConfig, cameraQuality, replaceStream],
  );

  const handleFlipCamera = useCallback(() => {
    const nextFacing: CameraFacing = cameraQuality.facingMode === 'user' ? 'environment' : 'user';
    setFraming((previous) => ({ ...previous, mirror: nextFacing === 'user' }));
    setCameraQuality((previous) => ({ ...previous, facingMode: nextFacing, selectedDeviceId: null }));
    void initCamera({ facingMode: nextFacing, selectedDeviceId: null });
  }, [cameraQuality.facingMode, initCamera]);

  const handleCameraConfigChange = useCallback(
    (nextConfig: Partial<CameraQualityConfig>) => {
      setCameraQuality((previous) => ({ ...previous, ...nextConfig }));
      void initCamera(nextConfig);
    },
    [initCamera],
  );

  useEffect(() => {
    void initCamera();
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      audioEngineRef.current.stop();
      if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
      if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current);
      customObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
    // Camera initialization intentionally runs once when the studio mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSampledColor = useCallback((color: {
    r: number;
    g: number;
    b: number;
    luminance: number;
    saturation: number;
  }) => {
    setChromaConfig((previous) => ({
      ...previous,
      mode: 'color_sample',
      sampledColor: { r: color.r, g: color.g, b: color.b },
      luminanceThreshold: Math.max(0.5, color.luminance - 0.05),
    }));
    setSampledStats({ luminance: color.luminance, saturation: color.saturation });
    setIsSamplingColor(false);
  }, []);

  const handleCaptureEmptyWall = useCallback(() => {
    canvasHandleRef.current?.captureEmptyWallSnapshot();
    setHasEmptyWallCapture(true);
    setChromaConfig((previous) => ({ ...previous, mode: 'difference_matte' }));
  }, []);

  const handleClearEmptyWall = useCallback(() => {
    canvasHandleRef.current?.clearEmptyWallSnapshot();
    setHasEmptyWallCapture(false);
    setChromaConfig((previous) => ({ ...previous, mode: 'luminance_white' }));
  }, []);

  const handleAutoSampleWall = useCallback(() => {
    canvasHandleRef.current?.autoSampleWall();
  }, []);

  const handleUploadCustomBg = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    customObjectUrlsRef.current.push(url);
    const newSetting: StudioSetting = {
      id: `custom_${Date.now()}`,
      name: file.name.slice(0, 16),
      thumbnailUrl: url,
      bgImageUrl: url,
      category: 'custom',
      blur: 0,
      brightness: 1,
    };
    setSettingsList((previous) => [newSetting, ...previous]);
    setCurrentSetting(newSetting);
  }, []);

  const handleTakeSnapshot = useCallback(() => {
    const dataUrl = canvasHandleRef.current?.takeSnapshot();
    if (!dataUrl) return;
    const anchor = document.createElement('a');
    anchor.href = dataUrl;
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    anchor.download = `MOMS_Studio_${cameraQuality.resolution.toUpperCase()}_Snapshot_${timestamp}.jpg`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }, [cameraQuality.resolution]);

  const executeStartRecording = useCallback(() => {
    if (!canvasHandleRef.current || !streamRef.current) return;
    const canvasStream = canvasHandleRef.current.getCanvasStream();
    if (!canvasStream) return;

    const mixedStream = new MediaStream();
    const videoTrack = canvasStream.getVideoTracks()[0];
    if (videoTrack) mixedStream.addTrack(videoTrack);
    const processedAudioTrack =
      audioEngineRef.current.getProcessedAudioTrack() || streamRef.current.getAudioTracks()[0];
    if (processedAudioTrack) mixedStream.addTrack(processedAudioTrack);

    const supported = getSupportedMimeTypes();
    const mimeType = recordingFormat === 'mp4' && supported.mp4
      ? supported.mp4
      : supported.webm || 'video/webm';

    try {
      const recorder = new MediaRecorder(mixedStream, {
        mimeType,
        videoBitsPerSecond: getBitrateForConfig(cameraQuality.resolution, cameraQuality.frameRate),
        audioBitsPerSecond: 256000,
      });
      recordedChunksRef.current = [];
      const startTime = Date.now();
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        const rawBlob = new Blob(recordedChunksRef.current, { type: mimeType });
        const elapsedMs = Math.max(1000, Date.now() - startTime);
        const finalBlob = mimeType.includes('webm')
          ? await fixWebmBlobDuration(rawBlob, elapsedMs)
          : rawBlob;
        setRecordingState((previous) => ({
          ...previous,
          isRecording: false,
          isPaused: false,
          recordedBlob: finalBlob,
          recordedVideoUrl: URL.createObjectURL(finalBlob),
          format: recordingFormat,
          resolution: cameraQuality.resolution,
          frameRate: cameraQuality.frameRate,
        }));
        if (recordingTimerRef.current) {
          window.clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
      };

      recorder.start(500);
      mediaRecorderRef.current = recorder;
      setRecordingState((previous) => ({
        ...previous,
        isRecording: true,
        isPaused: false,
        durationSeconds: 0,
        recordedBlob: null,
        recordedVideoUrl: null,
      }));
      if (teleprompterConfig.enabled) {
        setTeleprompterConfig((previous) => ({ ...previous, isScrolling: true }));
      }
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingState((previous) => ({
          ...previous,
          durationSeconds: previous.durationSeconds + 1,
        }));
      }, 1000);
    } catch (error) {
      console.error('MediaRecorder start error:', error);
    }
  }, [cameraQuality.frameRate, cameraQuality.resolution, recordingFormat, teleprompterConfig.enabled]);

  const handleStartRecord = useCallback(() => {
    if (!canvasHandleRef.current || !streamRef.current) return;
    if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current);
    let count = 3;
    setRecordingState((previous) => ({ ...previous, countdown: count }));
    playCountdownBeep(880, 0.1);
    countdownTimerRef.current = window.setInterval(() => {
      count -= 1;
      if (count > 0) {
        setRecordingState((previous) => ({ ...previous, countdown: count }));
        playCountdownBeep(880, 0.1);
        return;
      }
      if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
      playCountdownBeep(1320, 0.25);
      setRecordingState((previous) => ({ ...previous, countdown: null }));
      executeStartRecording();
    }, 1000);
  }, [executeStartRecording]);

  const handleStopRecord = useCallback(() => {
    if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop();
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (teleprompterConfig.enabled) {
      setTeleprompterConfig((previous) => ({ ...previous, isScrolling: false }));
    }
  }, [teleprompterConfig.enabled]);

  const handleTogglePause = useCallback(() => {
    if (!mediaRecorderRef.current) return;
    if (recordingState.isPaused) {
      mediaRecorderRef.current.resume();
      setRecordingState((previous) => ({ ...previous, isPaused: false }));
    } else {
      mediaRecorderRef.current.pause();
      setRecordingState((previous) => ({ ...previous, isPaused: true }));
    }
  }, [recordingState.isPaused]);

  const closeReview = useCallback(() => {
    setRecordingState((previous) => ({ ...previous, recordedVideoUrl: null }));
  }, []);

  const retakeRecording = useCallback(() => {
    setRecordingState((previous) => ({
      ...previous,
      recordedVideoUrl: null,
      recordedBlob: null,
      durationSeconds: 0,
    }));
  }, []);

  return {
    stream,
    cameraError,
    audioLevel,
    audioPeak,
    cameraQuality,
    availableCameras,
    audioConfig,
    recordingFormat,
    chromaConfig,
    framing,
    micConfig,
    settingsList,
    currentSetting,
    aspectRatio,
    showBrandedOverlays,
    teleprompterConfig,
    recordingState,
    activeDrawer,
    showGuideModal,
    isSamplingColor,
    hasEmptyWallCapture,
    sampledStats,
    canvasHandleRef,
    setActiveDrawer,
    setShowGuideModal,
    setIsSamplingColor,
    setChromaConfig,
    setFraming,
    setMicConfig,
    setCurrentSetting,
    setAspectRatio,
    setShowBrandedOverlays,
    setTeleprompterConfig,
    setRecordingFormat,
    initCamera,
    handleFlipCamera,
    handleCameraConfigChange,
    handleAudioConfigChange,
    handleSampledColor,
    handleCaptureEmptyWall,
    handleClearEmptyWall,
    handleAutoSampleWall,
    handleUploadCustomBg,
    handleTakeSnapshot,
    handleStartRecord,
    handleStopRecord,
    handleTogglePause,
    closeReview,
    retakeRecording,
  };
}
