import React, { useState, useEffect } from 'react';
import {
  Video,
  AlertCircle,
  X,
  Keyboard,
  Maximize2,
  Sparkles,
  Cloud,
} from 'lucide-react';
import { useStudio } from '../../context/StudioContext';
import { useRecording } from '../../context/RecordingContext';
import { Header, ActiveDrawer } from '../Header';
import { StudioCanvas } from '../StudioCanvas';
import { RecordingBar } from '../RecordingBar';
import { Teleprompter } from '../Teleprompter';
import { CalibrationPanel } from '../CalibrationPanel';
import { CameraSettingsPanel } from '../CameraSettingsPanel';
import { MicrophoneControls } from '../MicrophoneControls';
import { SettingControls } from '../SettingControls';
import { CloudinaryVaultPanel } from '../CloudinaryVaultPanel';
import { WhiteWallGuideModal } from '../WhiteWallGuideModal';
import { VideoReviewModal } from '../VideoReviewModal';

export const DesktopStudioLayout: React.FC = () => {
  const {
    stream,
    cameraError,
    canvasHandleRef,
    audioLevel,
    audioPeak,
    initCamera,
    handleFlipCamera,
    availableCameras,
    cameraQuality,
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
    handleUploadCustomBg,
    teleprompterConfig,
    setTeleprompterConfig,
  } = useStudio();

  const {
    recordingState,
    recordingFormat,
    setRecordingFormat,
    startRecording,
    stopRecording,
    togglePause,
    takeSnapshot,
    clearRecording,
  } = useRecording();

  const [activeDrawer, setActiveDrawer] = useState<ActiveDrawer>('none');
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  // Global hotkeys for desktop power users
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (recordingState.isRecording) {
          stopRecording();
        } else {
          startRecording();
        }
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        handleFlipCamera();
      } else if (e.code === 'KeyP') {
        e.preventDefault();
        if (recordingState.isRecording) {
          togglePause();
        }
      } else if (e.code === 'KeyS') {
        e.preventDefault();
        takeSnapshot();
      } else if (e.code === 'KeyV') {
        e.preventDefault();
        setActiveDrawer((prev) => (prev === 'cloudinary' ? 'none' : 'cloudinary'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recordingState.isRecording, stopRecording, startRecording, handleFlipCamera, togglePause, takeSnapshot]);

  return (
    <div className="flex flex-col h-screen w-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans select-none">
      {/* Top Header */}
      <Header
        activeDrawer={activeDrawer}
        onToggleDrawer={(drawer) => setActiveDrawer(drawer)}
        onOpenGuide={() => setShowGuideModal(true)}
        hasCamera={!!stream}
        onRequestCamera={() => initCamera()}
      />

      {/* Main Studio Viewport */}
      <div className="relative flex-1 min-h-0 flex flex-row overflow-hidden">
        {/* Center Stage: Compositing Canvas & Visual Monitors */}
        <main className="relative flex-1 h-full flex flex-col items-center justify-center p-2 sm:p-4 bg-neutral-950 overflow-hidden">
          {/* Camera Error Alert */}
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

          {/* Floating Teleprompter Overlay */}
          <Teleprompter
            config={teleprompterConfig}
            onChange={setTeleprompterConfig}
            isOverlay={true}
          />

          {/* Main Studio Compositing Canvas */}
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

          {/* Camera Access Request if no stream */}
          {!stream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/95 z-30 p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Video className="w-8 h-8" />
              </div>
              <div className="max-w-md space-y-2">
                <h2 className="text-xl font-bold text-white">Enable Camera to Begin</h2>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Stand in front of a white wall background. The studio removes the wall in real time and places you into the MOMS Mobile Oil Change virtual set in 4K/8K quality.
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
        </main>

        {/* Right Collapsible Control Drawer */}
        {activeDrawer !== 'none' && (
          <aside
            id="desktop-control-drawer"
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
                {activeDrawer === 'cloudinary' && 'Cloudinary Studio Vault & $0 Cost Optimizer'}
              </span>
              <button
                id="close-desktop-drawer-btn"
                onClick={() => setActiveDrawer('none')}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content Views */}
            <div className="flex-1 space-y-4">
              {activeDrawer === 'cloudinary' && <CloudinaryVaultPanel />}

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
                  onChangeBrightness={(brightness) =>
                    setCurrentSetting((prev) => ({ ...prev, brightness }))
                  }
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

      {/* Bottom Recording Deck */}
      <RecordingBar
        recordingState={recordingState}
        onStartRecord={startRecording}
        onStopRecord={stopRecording}
        onTogglePause={togglePause}
        onTakeSnapshot={takeSnapshot}
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

      {/* Modals */}
      <WhiteWallGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        onStartCalibration={() => setActiveDrawer('calibration')}
      />

      <VideoReviewModal
        videoUrl={recordingState.recordedVideoUrl}
        videoBlob={recordingState.recordedBlob}
        durationSeconds={recordingState.durationSeconds}
        resolution={cameraQuality.resolution}
        frameRate={cameraQuality.frameRate}
        onClose={clearRecording}
        onRetake={clearRecording}
        onOpenCloudVault={() => setActiveDrawer('cloudinary')}
      />
    </div>
  );
};
