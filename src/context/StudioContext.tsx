import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import {
  ChromaKeyConfig,
  UserFraming,
  MicConfig,
  StudioSetting,
  AspectRatio,
  TeleprompterConfig,
  AudioConfig,
  CameraQualityConfig,
  CameraDeviceInfo,
  CameraFacing,
} from '../types';
import { DEFAULT_STUDIOS, PREMADE_SCRIPTS } from '../data/studios';
import { StudioAudioEngine } from '../utils/audio';
import { enumerateCameraDevices, buildCameraConstraints, getSafeCaptureConfig } from '../utils/camera';
import { StudioCanvasHandle } from '../components/StudioCanvas';

interface StudioContextType {
  // Stream & Hardware
  stream: MediaStream | null;
  cameraError: string | null;
  canvasHandleRef: React.RefObject<StudioCanvasHandle | null>;
  studioAudioEngine: StudioAudioEngine;
  audioLevel: number;
  audioPeak: number;
  initCamera: (overrides?: Partial<CameraQualityConfig>) => Promise<void>;
  handleFlipCamera: () => void;
  availableCameras: CameraDeviceInfo[];

  // Camera settings
  cameraQuality: CameraQualityConfig;
  setCameraQuality: React.Dispatch<React.SetStateAction<CameraQualityConfig>>;
  handleCameraConfigChange: (newConfig: Partial<CameraQualityConfig>) => void;

  // Audio Preamp & Processing
  audioConfig: AudioConfig;
  handleAudioConfigChange: (config: AudioConfig) => void;

  // Chroma Key & White Screen
  chromaConfig: ChromaKeyConfig;
  setChromaConfig: React.Dispatch<React.SetStateAction<ChromaKeyConfig>>;
  isSamplingColor: boolean;
  setIsSamplingColor: (val: boolean) => void;
  hasEmptyWallCapture: boolean;
  sampledStats?: { luminance: number; saturation: number };
  handleSampledColor: (color: { r: number; g: number; b: number; luminance: number; saturation: number }) => void;
  handleCaptureEmptyWall: () => void;
  handleClearEmptyWall: () => void;
  handleAutoSampleWall: () => void;

  // Framing
  framing: UserFraming;
  setFraming: React.Dispatch<React.SetStateAction<UserFraming>>;

  // Microphone & 3D wrap
  micConfig: MicConfig;
  setMicConfig: React.Dispatch<React.SetStateAction<MicConfig>>;

  // Virtual sets & Aspect Ratio
  settingsList: StudioSetting[];
  currentSetting: StudioSetting;
  setCurrentSetting: React.Dispatch<React.SetStateAction<StudioSetting>>;
  aspectRatio: AspectRatio;
  setAspectRatio: React.Dispatch<React.SetStateAction<AspectRatio>>;
  showBrandedOverlays: boolean;
  setShowBrandedOverlays: React.Dispatch<React.SetStateAction<boolean>>;
  showMomsOverlay: boolean;
  setShowMomsOverlay: React.Dispatch<React.SetStateAction<boolean>>;
  handleUploadCustomBg: (file: File) => void;

  // Teleprompter
  teleprompterConfig: TeleprompterConfig;
  setTeleprompterConfig: React.Dispatch<React.SetStateAction<TeleprompterConfig>>;
}

const StudioContext = createContext<StudioContextType | null>(null);

export const StudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [audioPeak, setAudioPeak] = useState<number>(0);
  const studioAudioEngineRef = useRef<StudioAudioEngine>(new StudioAudioEngine());
  const canvasHandleRef = useRef<StudioCanvasHandle | null>(null);

  const [cameraQuality, setCameraQuality] = useState<CameraQualityConfig>({
    resolution: '1080p',
    frameRate: 30,
    facingMode: 'user',
    selectedDeviceId: '',
    actualWidth: 0,
    actualHeight: 0,
    actualFrameRate: 0,
    sensorLabel: '',
  });

  const [availableCameras, setAvailableCameras] = useState<CameraDeviceInfo[]>([]);

  const [audioConfig, setAudioConfig] = useState<AudioConfig>({
    micGain: 1.35,
    vocalEnhance: true,
    highpassFilter: true,
    compressor: true,
    echoCancellation: true,
    monitorAudio: false,
  });

  const [chromaConfig, setChromaConfig] = useState<ChromaKeyConfig>({
    mode: 'luminance_white',
    luminanceThreshold: 0.76,
    tolerance: 0.18,
    softness: 0.08,
    spillSuppression: 0.35,
    sampledColor: { r: 245, g: 245, b: 245 },
    sampleRadius: 8,
    showMatteOnly: false,
    edgeErosion: 0,
  });

  const [framing, setFraming] = useState<UserFraming>({
    scale: 1.0,
    offsetX: 0,
    offsetY: 0,
    mirror: true,
    brightness: 1.0,
    contrast: 1.0,
  });

  const [micConfig, setMicConfig] = useState<MicConfig>({
    visible: true,
    wrapStyle: 'moms_3d',
    wrapColor: 'royal_blue',
    customText: 'MOMS OIL',
    customLogoUrl: null,
    position: 'host_left',
    customX: 35,
    customY: 65,
    scale: 1.0,
    showStandBadge: true,
    audioReactiveGlow: true,
  });

  const [settingsList, setSettingsList] = useState<StudioSetting[]>(DEFAULT_STUDIOS);
  const [currentSetting, setCurrentSetting] = useState<StudioSetting>(DEFAULT_STUDIOS[0]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [showBrandedOverlays, setShowBrandedOverlays] = useState<boolean>(true);
  const [showMomsOverlay, setShowMomsOverlay] = useState<boolean>(true);

  const [teleprompterConfig, setTeleprompterConfig] = useState<TeleprompterConfig>({
    enabled: false,
    text: PREMADE_SCRIPTS[0].text,
    fontSize: 20,
    scrollSpeed: 3,
    isScrolling: false,
    opacity: 0.85,
  });

  const [isSamplingColor, setIsSamplingColor] = useState<boolean>(false);
  const [hasEmptyWallCapture, setHasEmptyWallCapture] = useState<boolean>(false);
  const [sampledStats, setSampledStats] = useState<{ luminance: number; saturation: number } | undefined>();

  const handleAudioConfigChange = useCallback((newAudioConfig: AudioConfig) => {
    setAudioConfig(newAudioConfig);
    studioAudioEngineRef.current.updateConfig(newAudioConfig);
  }, []);

  const initCamera = useCallback(
    async (overrides?: Partial<CameraQualityConfig>) => {
      setCameraError(null);

      const requestedRes = overrides?.resolution ?? cameraQuality.resolution;
      const requestedFps = overrides?.frameRate ?? cameraQuality.frameRate;
      const safeCapture = getSafeCaptureConfig(requestedRes, requestedFps);
      const targetRes = safeCapture.resolution;
      const targetFps = safeCapture.frameRate;
      const targetFacing = overrides?.facingMode ?? cameraQuality.facingMode;
      const targetDeviceId =
        overrides?.selectedDeviceId !== undefined
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

      try {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(mediaStream);

        const videoTrack = mediaStream.getVideoTracks()[0];
        let actualW = 0;
        let actualH = 0;
        let actualFps = 0;
        let sensorLabel = '';

        if (videoTrack) {
          const settings = videoTrack.getSettings();
          actualW = settings.width || 0;
          actualH = settings.height || 0;
          actualFps = settings.frameRate || targetFps;
          sensorLabel = videoTrack.label || '';
        }

        setCameraQuality((prev) => ({
          ...prev,
          ...overrides,
          resolution: targetRes,
          frameRate: targetFps,
          actualWidth: actualW,
          actualHeight: actualH,
          actualFrameRate: actualFps,
          sensorLabel,
        }));

        const devices = await enumerateCameraDevices();
        setAvailableCameras(devices);

        studioAudioEngineRef.current.start(mediaStream, audioConfig, (level, peak) => {
          setAudioLevel(level);
          setAudioPeak(peak);
        });
      } catch (err: unknown) {
        console.warn('High-Q camera constraints failed, attempting fallback:', err);
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: targetFacing,
            },
            audio: {
              echoCancellation: audioConfig.echoCancellation,
              noiseSuppression: false,
              autoGainControl: false,
              sampleRate: 48000,
            },
          });

          setStream(fallbackStream);
          const vTrack = fallbackStream.getVideoTracks()[0];
          let actualW = 1280;
          let actualH = 720;
          let actualFps = 30;
          let sLabel = '';
          if (vTrack) {
            const s = vTrack.getSettings();
            actualW = s.width || 1280;
            actualH = s.height || 720;
            actualFps = s.frameRate || 30;
            sLabel = vTrack.label || '';
          }

          setCameraQuality((prev) => ({
            ...prev,
            ...overrides,
            resolution: targetRes,
            frameRate: targetFps,
            actualWidth: actualW,
            actualHeight: actualH,
            actualFrameRate: actualFps,
            sensorLabel: sLabel,
          }));

          const devices = await enumerateCameraDevices();
          setAvailableCameras(devices);

          studioAudioEngineRef.current.start(fallbackStream, audioConfig, (level, peak) => {
            setAudioLevel(level);
            setAudioPeak(peak);
          });
        } catch (fallbackErr: unknown) {
          console.error('All camera access failed:', fallbackErr);
          const errMsg =
            fallbackErr instanceof Error
              ? fallbackErr.message
              : 'Camera or microphone access denied';
          setCameraError(errMsg);
        }
      }
    },
    [cameraQuality, audioConfig, aspectRatio, stream]
  );

  const handleFlipCamera = useCallback(() => {
    const nextFacing: CameraFacing = cameraQuality.facingMode === 'user' ? 'environment' : 'user';
    setFraming((prev) => ({ ...prev, mirror: nextFacing === 'user' }));
    setCameraQuality((prev) => ({
      ...prev,
      facingMode: nextFacing,
      selectedDeviceId: '',
    }));
    initCamera({ facingMode: nextFacing, selectedDeviceId: '' });
  }, [cameraQuality.facingMode, initCamera]);

  const handleCameraConfigChange = useCallback(
    (newConfig: Partial<CameraQualityConfig>) => {
      setCameraQuality((prev) => ({ ...prev, ...newConfig }));
      initCamera(newConfig);
    },
    [initCamera]
  );

  const handleSampledColor = (color: {
    r: number;
    g: number;
    b: number;
    luminance: number;
    saturation: number;
  }) => {
    setChromaConfig((prev) => ({
      ...prev,
      mode: 'color_sample',
      sampledColor: { r: color.r, g: color.b, b: color.b },
      luminanceThreshold: Math.max(0.5, color.luminance - 0.05),
    }));
    setSampledStats({ luminance: color.luminance, saturation: color.saturation });
    setIsSamplingColor(false);
  };

  const handleCaptureEmptyWall = () => {
    if (canvasHandleRef.current) {
      canvasHandleRef.current.captureEmptyWallSnapshot();
      setHasEmptyWallCapture(true);
      setChromaConfig((prev) => ({
        ...prev,
        mode: 'difference_matte',
      }));
    }
  };

  const handleClearEmptyWall = () => {
    if (canvasHandleRef.current) {
      canvasHandleRef.current.clearEmptyWallSnapshot();
      setHasEmptyWallCapture(false);
      setChromaConfig((prev) => ({
        ...prev,
        mode: 'luminance_white',
      }));
    }
  };

  const handleAutoSampleWall = () => {
    if (canvasHandleRef.current) {
      canvasHandleRef.current.autoSampleWall();
    }
  };

  const handleUploadCustomBg = (file: File) => {
    const url = URL.createObjectURL(file);
    const newSetting: StudioSetting = {
      id: `custom_${Date.now()}`,
      name: file.name.slice(0, 16),
      thumbnailUrl: url,
      bgImageUrl: url,
      category: 'custom',
      blur: 0,
      brightness: 1.0,
    };
    setSettingsList((prev) => [newSetting, ...prev]);
    setCurrentSetting(newSetting);
  };

  useEffect(() => {
    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      studioAudioEngineRef.current.stop();
    };
  }, []);

  return (
    <StudioContext.Provider
      value={{
        stream,
        cameraError,
        canvasHandleRef,
        studioAudioEngine: studioAudioEngineRef.current,
        audioLevel,
        audioPeak,
        initCamera,
        handleFlipCamera,
        availableCameras,
        cameraQuality,
        setCameraQuality,
        handleCameraConfigChange,
        audioConfig,
        handleAudioConfigChange,
        chromaConfig,
        setChromaConfig,
        isSamplingColor,
        setIsSamplingColor,
        hasEmptyWallCapture,
        sampledStats,
        handleSampledColor,
        handleCaptureEmptyWall,
        handleClearEmptyWall,
        handleAutoSampleWall,
        framing,
        setFraming,
        micConfig,
        setMicConfig,
        settingsList,
        currentSetting,
        setCurrentSetting,
        aspectRatio,
        setAspectRatio,
        showBrandedOverlays,
        setShowBrandedOverlays,
        showMomsOverlay,
        setShowMomsOverlay,
        handleUploadCustomBg,
        teleprompterConfig,
        setTeleprompterConfig,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
};

export function useStudio() {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error('useStudio must be used within a StudioProvider');
  }
  return context;
}
