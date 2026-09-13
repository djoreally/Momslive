/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChromaKeyConfig,
  UserFraming,
  MicConfig,
  StudioSetting,
  AspectRatio,
  TeleprompterConfig,
  RecordingState,
  AudioConfig,
  RecordingFormat,
  CameraQualityConfig,
  CameraDeviceInfo,
  CameraFacing,
  ResolutionPreset,
  TargetFrameRate,
} from './types';
import { DEFAULT_STUDIOS, PREMADE_SCRIPTS } from './data/studios';
import { StudioCanvas, StudioCanvasHandle } from './components/StudioCanvas';
import { Header, ActiveDrawer } from './components/Header';
import { RecordingBar } from './components/RecordingBar';
import { WhiteWallGuideModal } from './components/WhiteWallGuideModal';
import { CalibrationPanel } from './components/CalibrationPanel';
import { MicrophoneControls } from './components/MicrophoneControls';
import { SettingControls } from './components/SettingControls';
import { Teleprompter } from './components/Teleprompter';
import { VideoReviewModal } from './components/VideoReviewModal';
import { CameraSettingsPanel } from './components/CameraSettingsPanel';
import {
  StudioAudioEngine,
  playCountdownBeep,
  getSupportedMimeTypes,
  fixWebmBlobDuration,
} from './utils/audio';
import {
  enumerateCameraDevices,
  buildCameraConstraints,
  getBitrateForConfig,
} from './utils/camera';
import { Video, AlertCircle, Sparkles, X, Camera } from 'lucide-react';

export default function App() {
  // Media streams
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [audioPeak, setAudioPeak] = useState<number>(0);
  const studioAudioEngineRef = useRef<StudioAudioEngine>(new StudioAudioEngine());

  // Camera Quality & Hardware Configuration (4K, 8K, 60fps, Front / Rear)
  const [cameraQuality, setCameraQuality] = useState<CameraQualityConfig>({
    resolution: '4k',
    frameRate: 60,
    facingMode: 'user',
    selectedDeviceId: null,
    actualWidth: 0,
    actualHeight: 0,
    actualFrameRate: 0,
    sensorLabel: '',
  });
  const [availableCameras, setAvailableCameras] = useState<CameraDeviceInfo[]>([]);

  // Audio Engine & Preamp Settings (Clean broadcast sound)
  const [audioConfig, setAudioConfig] = useState<AudioConfig>({
    micGain: 1.35,
    vocalEnhance: true,
    highpassFilter: true,
    compressor: true,
    echoCancellation: true,
    monitorAudio: false,
  });

  // Recording format selection
  const [recordingFormat, setRecordingFormat] = useState<RecordingFormat>('mp4');

  // Canvas ref
  const canvasHandleRef = useRef<StudioCanvasHandle | null>(null);

  // Chroma Key & White Screen Config
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

  // User video framing
  const [framing, setFraming] = useState<UserFraming>({
    scale: 1.0,
    offsetX: 0,
    offsetY: 0,
    mirror: true,
    brightness: 1.0,
    contrast: 1.0,
  });

  // Microphone on Stand & Wrap Config
  const [micConfig, setMicConfig] = useState<MicConfig>({
    visible: true,
    wrapStyle: 'moms_3d',
    wrapColor: 'royal_blue',
    customText: "MOMS OIL",
    customLogoUrl: null,
    position: 'host_left',
    customX: 35,
    customY: 65,
    scale: 1.0,
    showStandBadge: true,
    audioReactiveGlow: true,
  });

  // Studio Setting Backdrops
  const [settingsList, setSettingsList] = useState<StudioSetting[]>(DEFAULT_STUDIOS);
  const [currentSetting, setCurrentSetting] = useState<StudioSetting>(DEFAULT_STUDIOS[0]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [showBrandedOverlays, setShowBrandedOverlays] = useState<boolean>(true);

  // Teleprompter
  const [teleprompterConfig, setTeleprompterConfig] = useState<TeleprompterConfig>({
    enabled: false,
    text: PREMADE_SCRIPTS[0].text,
    fontSize: 20,
    scrollSpeed: 3,
    isScrolling: false,
    opacity: 0.85,
  });

  // Recording State & MediaRecorder
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    countdown: null,
    durationSeconds: 0,
    recordedBlob: null,
    recordedVideoUrl: null,
    format: 'mp4',
    isConverting: false,
    conversionStatus: null,
    mp4Blob: null,
    mp4Url: null,
    serverDownloadUrl: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);

  // UI state
  const [activeDrawer, setActiveDrawer] = useState<ActiveDrawer>('none');
  const [showGuideModal, setShowGuideModal] = useState<boolean>(true);
  const [isSamplingColor, setIsSamplingColor] = useState<boolean>(false);
  const [hasEmptyWallCapture, setHasEmptyWallCapture] = useState<boolean>(false);
  const [sampledStats, setSampledStats] = useState<{ luminance: number; saturation: number } | undefined>();

  // Audio configuration update handler
  const handleAudioConfigChange = useCallback((newAudioConfig: AudioConfig) => {
    setAudioConfig(newAudioConfig);
    studioAudioEngineRef.current.updateConfig(newAudioConfig);
  }, []);

  // Initialize / Switch Camera Stream with 4K/8K & Front/Rear constraints
  const initCamera = useCallback(
    async (overrides?: Partial<CameraQualityConfig>) => {
      setCameraError(null);

      const targetRes = overrides?.resolution ?? cameraQuality.resolution;
      const targetFps = overrides?.frameRate ?? cameraQuality.frameRate;
      const targetFacing = overrides?.facingMode ?? cameraQuality.facingMode;
      const targetDeviceId = overrides?.selectedDeviceId !== undefined ? overrides.selectedDeviceId : cameraQuality.selectedDeviceId;

      const constraints = buildCameraConstraints({
        resolution: targetRes,
        frameRate: targetFps,
        facingMode: targetFacing,
        deviceId: targetDeviceId || undefined,
        aspectRatio,
        echoCancellation: audioConfig.echoCancellation,
      });

      try {
        // Stop prior stream tracks cleanly
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(mediaStream);

        // Inspect actual hardware video track settings
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
          actualWidth: actualW,
          actualHeight: actualH,
          actualFrameRate: actualFps,
          sensorLabel,
        }));

        // Enumerate devices to populate available cameras
        const devices = await enumerateCameraDevices();
        setAvailableCameras(devices);

        // Start Studio Audio Engine with 48kHz processing chain
        studioAudioEngineRef.current.start(mediaStream, audioConfig, (level, peak) => {
          setAudioLevel(level);
          setAudioPeak(peak);
        });
      } catch (err: unknown) {
        console.warn('High-Q camera constraints failed, attempting hardware fallback:', err);
        try {
          // Fallback with basic constraints if device cannot fulfill advanced 4K/60 constraint
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
          const errMsg = fallbackErr instanceof Error ? fallbackErr.message : 'Camera or microphone access denied';
          setCameraError(errMsg);
        }
      }
    },
    [cameraQuality, audioConfig, stream]
  );

  // Quick Flip Camera between Front & Rear
  const handleFlipCamera = useCallback(() => {
    const nextFacing: CameraFacing = cameraQuality.facingMode === 'user' ? 'environment' : 'user';
    // Mirror front camera by default, do not mirror rear camera
    setFraming((prev) => ({ ...prev, mirror: nextFacing === 'user' }));
    setCameraQuality((prev) => ({
      ...prev,
      facingMode: nextFacing,
      selectedDeviceId: null,
    }));
    initCamera({ facingMode: nextFacing, selectedDeviceId: null });
  }, [cameraQuality.facingMode, initCamera]);

  // Update Camera Quality config
  const handleCameraConfigChange = useCallback(
    (newConfig: Partial<CameraQualityConfig>) => {
      setCameraQuality((prev) => ({ ...prev, ...newConfig }));
      initCamera(newConfig);
    },
    [initCamera]
  );

  useEffect(() => {
    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      studioAudioEngineRef.current.stop();
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  // Wall sampling callback
  const handleSampledColor = (color: { r: number; g: number; b: number; luminance: number; saturation: number }) => {
    setChromaConfig((prev) => ({
      ...prev,
      mode: 'color_sample',
      sampledColor: { r: color.r, g: color.b, b: color.b },
      luminanceThreshold: Math.max(0.5, color.luminance - 0.05),
    }));
    setSampledStats({ luminance: color.luminance, saturation: color.saturation });
    setIsSamplingColor(false);
  };

  // Capture empty wall snapshot
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

  // Upload custom backdrop
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

  // Take Snapshot Still Photo
  const handleTakeSnapshot = () => {
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

  // Start Video Recording with 3s Countdown
  const handleStartRecord = () => {
    if (!canvasHandleRef.current || !stream) return;

    // Start 3.. 2.. 1 countdown
    let count = 3;
    setRecordingState((prev) => ({ ...prev, countdown: count }));
    playCountdownBeep(880, 0.1);

    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setRecordingState((prev) => ({ ...prev, countdown: count }));
        playCountdownBeep(880, 0.1);
      } else {
        clearInterval(interval);
        playCountdownBeep(1320, 0.25); // Higher pitch for GO
        setRecordingState((prev) => ({ ...prev, countdown: null }));
        executeStartRecording();
      }
    }, 1000);
  };

  const executeStartRecording = () => {
    if (!canvasHandleRef.current || !stream) return;
    const canvasStream = canvasHandleRef.current.getCanvasStream();
    if (!canvasStream) return;

    // Mix canvas video track with Studio-Engine processed audio track
    const mixedStream = new MediaStream();
    const videoTrack = canvasStream.getVideoTracks()[0];
    if (videoTrack) mixedStream.addTrack(videoTrack);

    // Get 48kHz processed audio with highpass, vocal EQ, and dynamics compression
    const processedAudioTrack =
      studioAudioEngineRef.current.getProcessedAudioTrack() || stream.getAudioTracks()[0];
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

    // Dynamic bitrate allocation matched to resolution & frame rate (up to 75Mbps for 8K)
    const masterVideoBitrate = getBitrateForConfig(cameraQuality.resolution, cameraQuality.frameRate);

    try {
      const recorder = new MediaRecorder(mixedStream, {
        mimeType,
        videoBitsPerSecond: masterVideoBitrate,
        audioBitsPerSecond: 256000, // Studio 256kbps audio
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

        // Append proper duration metadata for seekable playback
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
        }));

        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
      };

      recorder.start(500); // 500ms time slice
      mediaRecorderRef.current = recorder;

      setRecordingState((prev) => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        durationSeconds: 0,
        recordedBlob: null,
        recordedVideoUrl: null,
      }));

      // Start teleprompter scrolling if enabled
      if (teleprompterConfig.enabled) {
        setTeleprompterConfig((prev) => ({ ...prev, isScrolling: true }));
      }

      // Start timer
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

  const handleStopRecord = () => {
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

  const handleTogglePause = () => {
    if (!mediaRecorderRef.current) return;
    if (recordingState.isPaused) {
      mediaRecorderRef.current.resume();
      setRecordingState((prev) => ({ ...prev, isPaused: false }));
    } else {
      mediaRecorderRef.current.pause();
      setRecordingState((prev) => ({ ...prev, isPaused: true }));
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      {/* Top Header */}
      <Header
        activeDrawer={activeDrawer}
        onToggleDrawer={(drawer) => setActiveDrawer(drawer)}
        onOpenGuide={() => setShowGuideModal(true)}
        hasCamera={!!stream}
        onRequestCamera={() => initCamera()}
      />

      {/* Main Studio Center Viewport */}
      <div className="relative flex-1 min-h-0 flex flex-row overflow-hidden">
        {/* Left/Center Stage: Viewport Canvas */}
        <div className="relative flex-1 h-full flex flex-col items-center justify-center p-2 sm:p-4 bg-neutral-950 overflow-hidden">
          {/* Camera Error Banner */}
          {cameraError && (
            <div className="absolute top-4 left-4 right-4 z-40 max-w-md mx-auto p-4 rounded-xl bg-rose-950/90 border border-rose-600/50 text-rose-200 text-xs shadow-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>{cameraError}. Please grant camera and microphone access.</span>
              </div>
              <button
                id="retry-camera-btn"
                onClick={() => initCamera()}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-colors shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {/* Floating Countdown Display */}
          {recordingState.countdown !== null && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
              <div className="w-32 h-32 rounded-full bg-blue-600/30 border-4 border-blue-500 flex items-center justify-center text-6xl font-black text-white shadow-2xl shadow-blue-500/50 animate-ping duration-1000">
                {recordingState.countdown}
              </div>
            </div>
          )}

          {/* Floating Teleprompter */}
          <Teleprompter
            config={teleprompterConfig}
            onChange={setTeleprompterConfig}
            isOverlay={true}
          />

          {/* The Main Studio Compositing Canvas */}
          <StudioCanvas
            ref={canvasHandleRef}
            stream={stream}
            chromaConfig={chromaConfig}
            framing={framing}
            micConfig={micConfig}
            studioSetting={currentSetting}
            aspectRatio={aspectRatio}
            showBrandedOverlays={showBrandedOverlays}
            audioLevel={audioLevel}
            isSamplingColor={isSamplingColor}
            onSampledColor={handleSampledColor}
            isRecording={recordingState.isRecording}
            resolution={cameraQuality.resolution}
            frameRate={cameraQuality.frameRate}
          />

          {/* Floating White Wall Guide Callout (if guide not yet dismissed) */}
          {!stream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/95 z-30 p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Video className="w-8 h-8" />
              </div>
              <div className="max-w-md space-y-2">
                <h2 className="text-xl font-bold text-white">Enable Camera to Begin</h2>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Stand in front of a white wall background. The studio removes the wall in real time and places you into the MOMS Mobile Oil Change virtual set in 4K/8K quality with front and rear camera support.
                </p>
              </div>
              <button
                id="grant-camera-btn"
                onClick={() => initCamera()}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all hover:scale-105 flex items-center gap-2"
              >
                <Video className="w-4 h-4" />
                <span>Allow Camera &amp; Mic</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Collapsible Drawer */}
        {activeDrawer !== 'none' && (
          <aside
            id="control-drawer-sidebar"
            className="w-80 sm:w-96 h-full bg-neutral-900 border-l border-neutral-800 shadow-2xl overflow-y-auto p-4 flex flex-col z-30 animate-in slide-in-from-right duration-200"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                {activeDrawer === 'camera' && 'Camera Lens & 4K/8K Quality'}
                {activeDrawer === 'calibration' && 'White Wall & Framing'}
                {activeDrawer === 'microphone' && 'Microphone & Wrap'}
                {activeDrawer === 'setting' && 'Virtual Setting'}
                {activeDrawer === 'teleprompter' && 'Script & Teleprompter'}
              </span>
              <button
                id="close-drawer-btn"
                onClick={() => setActiveDrawer('none')}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Contents */}
            <div className="flex-1 space-y-4">
              {activeDrawer === 'camera' && (
                <CameraSettingsPanel
                  config={cameraQuality}
                  onChangeConfig={handleCameraConfigChange}
                  availableDevices={availableCameras}
                  onFlipCamera={handleFlipCamera}
                  aspectRatio={aspectRatio}
                  mirror={framing.mirror}
                  onToggleMirror={() => setFraming((prev) => ({ ...prev, mirror: !prev.mirror }))}
                />
              )}

              {activeDrawer === 'calibration' && (
                <CalibrationPanel
                  config={chromaConfig}
                  onChangeConfig={setChromaConfig}
                  framing={framing}
                  onChangeFraming={setFraming}
                  onCaptureEmptyWall={handleCaptureEmptyWall}
                  onClearEmptyWall={handleClearEmptyWall}
                  hasEmptyWallCapture={hasEmptyWallCapture}
                  isSamplingColor={isSamplingColor}
                  onToggleSamplingColor={() => setIsSamplingColor(!isSamplingColor)}
                  onAutoSampleWall={handleAutoSampleWall}
                  sampledStats={sampledStats}
                />
              )}

              {activeDrawer === 'microphone' && (
                <MicrophoneControls
                  config={micConfig}
                  onChange={setMicConfig}
                  audioLevel={audioLevel}
                  audioPeak={audioPeak}
                  audioConfig={audioConfig}
                  onChangeAudioConfig={handleAudioConfigChange}
                />
              )}

              {activeDrawer === 'setting' && (
                <SettingControls
                  currentSetting={currentSetting}
                  settingsList={settingsList}
                  onSelectSetting={setCurrentSetting}
                  aspectRatio={aspectRatio}
                  onChangeAspectRatio={setAspectRatio}
                  showBrandedOverlays={showBrandedOverlays}
                  onToggleBrandedOverlays={() => setShowBrandedOverlays(!showBrandedOverlays)}
                  onUploadCustomBg={handleUploadCustomBg}
                  onChangeBlur={(blur) => setCurrentSetting((prev) => ({ ...prev, blur }))}
                  onChangeBrightness={(brightness) => setCurrentSetting((prev) => ({ ...prev, brightness }))}
                />
              )}

              {activeDrawer === 'teleprompter' && (
                <Teleprompter
                  config={teleprompterConfig}
                  onChange={setTeleprompterConfig}
                  isOverlay={false}
                />
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Recording Action Bar */}
      <RecordingBar
        recordingState={recordingState}
        onStartRecord={handleStartRecord}
        onStopRecord={handleStopRecord}
        onTogglePause={handleTogglePause}
        onTakeSnapshot={handleTakeSnapshot}
        audioLevel={audioLevel}
        audioPeak={audioPeak}
        audioGain={audioConfig.micGain}
        onChangeAudioGain={(gain) => handleAudioConfigChange({ ...audioConfig, micGain: gain })}
        recordingFormat={recordingFormat}
        onChangeRecordingFormat={setRecordingFormat}
        cameraQuality={cameraQuality}
        onChangeResolution={(res) => handleCameraConfigChange({ resolution: res })}
        onChangeFrameRate={(fps) => handleCameraConfigChange({ frameRate: fps })}
        onFlipCamera={handleFlipCamera}
        onOpenCamSettings={() => setActiveDrawer('camera')}
        hasCamera={!!stream}
        onOpenMicSettings={() => setActiveDrawer('microphone')}
      />

      {/* White Wall Setup Guide Modal */}
      <WhiteWallGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        onStartCalibration={() => {
          setActiveDrawer('calibration');
        }}
      />

      {/* Recorded Video Review & Download Modal */}
      <VideoReviewModal
        videoUrl={recordingState.recordedVideoUrl}
        videoBlob={recordingState.recordedBlob}
        durationSeconds={recordingState.durationSeconds}
        resolution={cameraQuality.resolution}
        frameRate={cameraQuality.frameRate}
        onClose={() => setRecordingState((prev) => ({ ...prev, recordedVideoUrl: null }))}
        onRetake={() => {
          setRecordingState((prev) => ({
            ...prev,
            recordedVideoUrl: null,
            recordedBlob: null,
            durationSeconds: 0,
          }));
        }}
      />
    </div>
  );
}

