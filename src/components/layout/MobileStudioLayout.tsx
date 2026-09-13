import React, { useState } from 'react';
import {
  Video,
  SwitchCamera,
  Play,
  Square as StopSquare,
  Pause,
  Camera,
  Layers,
  Mic,
  Sliders,
  Cloud,
  FileText,
  DollarSign,
  AlertCircle,
  X,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { useStudio } from '../../context/StudioContext';
import { useRecording } from '../../context/RecordingContext';
import { StudioCanvas } from '../StudioCanvas';
import { Teleprompter } from '../Teleprompter';
import { SettingControls } from '../SettingControls';
import { MicrophoneControls } from '../MicrophoneControls';
import { CalibrationPanel } from '../CalibrationPanel';
import { CameraSettingsPanel } from '../CameraSettingsPanel';
import { CloudinaryVaultPanel } from '../CloudinaryVaultPanel';
import { VideoReviewModal } from '../VideoReviewModal';
import { WhiteWallGuideModal } from '../WhiteWallGuideModal';
import { RecordingTimer } from '../RecordingTimer';
import { WorkspaceBadge } from '../WorkspaceBadge';
import { MobileTab } from '../../types';

export const MobileStudioLayout: React.FC = () => {
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
    showMomsOverlay,
    setShowMomsOverlay,
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

  const [activeTab, setActiveTab] = useState<MobileTab>('studio');
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-black text-neutral-100 overflow-hidden font-sans select-none safe-area-inset">
      {/* Top Mobile Status Header */}
      <header className="h-12 bg-neutral-950/90 backdrop-blur border-b border-neutral-800/80 px-3 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-blue-500/30">
            M
          </div>
          <span className="text-xs font-bold tracking-tight text-white hidden xs:inline">MOMS</span>
          <WorkspaceBadge />
        </div>

        {/* Quick Lens & Quality Badges */}
        <div className="flex items-center gap-1.5">
          {/* Quick Flip Camera */}
          <button
            onClick={handleFlipCamera}
            className="p-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors active:scale-95 flex items-center gap-1"
            title="Flip Front / Rear Camera"
          >
            <SwitchCamera className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] font-semibold uppercase">
              {cameraQuality.facingMode === 'user' ? 'Front' : 'Rear'}
            </span>
          </button>

          {/* Quick Aspect Ratio Toggle */}
          <button
            onClick={() => setAspectRatio((prev) => (prev === '9:16' ? '16:9' : '9:16'))}
            className="px-2 py-1 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-[10px] font-bold text-neutral-300 transition-colors"
          >
            {aspectRatio}
          </button>

          {/* Resolution Badge */}
          <button
            onClick={() =>
              handleCameraConfigChange({
                resolution: cameraQuality.resolution === '4k' ? '1080p' : '4k',
              })
            }
            className="px-2 py-1 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold uppercase tracking-wider"
          >
            {cameraQuality.resolution}
          </button>
        </div>
      </header>

      {/* Center Viewport Stage */}
      <div className="relative flex-1 min-h-0 bg-neutral-950 flex items-center justify-center overflow-hidden">
        {/* Camera Error */}
        {cameraError && (
          <div className="absolute top-2 left-2 right-2 z-40 p-3 rounded-xl bg-rose-950/90 border border-rose-600/50 text-rose-200 text-xs shadow-2xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="truncate">{cameraError}</span>
            </div>
            <button
              onClick={() => initCamera()}
              className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-semibold text-[11px] shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Floating Countdown */}
        {recordingState.countdown !== null && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-none">
            <div className="w-24 h-24 rounded-full bg-blue-600/30 border-4 border-blue-500 flex items-center justify-center text-5xl font-black text-white shadow-2xl animate-ping">
              {recordingState.countdown}
            </div>
          </div>
        )}

        {/* Teleprompter Overlay */}
        <Teleprompter
          config={teleprompterConfig}
          onChange={setTeleprompterConfig}
          isOverlay={true}
        />

        {/* Studio Compositing Canvas */}
        <StudioCanvas
          ref={canvasHandleRef}
          stream={stream}
          chromaConfig={chromaConfig}
          framing={framing}
          micConfig={micConfig}
          studioSetting={currentSetting}
          aspectRatio={aspectRatio}
          showBrandedOverlays={showBrandedOverlays}
          showMomsOverlay={showMomsOverlay}
          audioLevel={audioLevel}
          isSamplingColor={isSamplingColor}
          onSampledColor={handleSampledColor}
          isRecording={recordingState.isRecording}
          resolution={cameraQuality.resolution}
          frameRate={cameraQuality.frameRate}
        />

        {/* Visual Recording Session Timer HUD (Mobile Top Center) */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
          <RecordingTimer compact />
        </div>

        {/* Floating Quick Action Overlay on Studio View */}
        {activeTab === 'studio' && (
          <div className="absolute bottom-4 left-0 right-0 z-20 flex items-center justify-around px-4 pointer-events-none">
            {/* Snapshot button */}
            <button
              onClick={takeSnapshot}
              className="p-3 rounded-full bg-neutral-900/80 border border-neutral-700/80 text-white backdrop-blur shadow-lg active:scale-95 pointer-events-auto transition-transform"
              title="Take Photo Snapshot"
            >
              <Camera className="w-5 h-5 text-neutral-300" />
            </button>

            {/* Primary Record Button */}
            <div className="pointer-events-auto flex items-center gap-3">
              {recordingState.isRecording ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePause}
                    className="p-3 rounded-full bg-amber-600/90 text-white shadow-lg active:scale-95"
                    title={recordingState.isPaused ? 'Resume' : 'Pause'}
                  >
                    {recordingState.isPaused ? (
                      <Play className="w-5 h-5 fill-white" />
                    ) : (
                      <Pause className="w-5 h-5 fill-white" />
                    )}
                  </button>

                  <button
                    onClick={stopRecording}
                    className="w-16 h-16 rounded-full bg-rose-600 border-4 border-white flex flex-col items-center justify-center text-white shadow-2xl shadow-rose-600/50 active:scale-95 animate-pulse"
                  >
                    <StopSquare className="w-6 h-6 fill-white" />
                    <span className="text-[10px] font-mono font-bold mt-0.5">
                      {formatTimer(recordingState.durationSeconds)}
                    </span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={startRecording}
                  disabled={!stream}
                  className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-600 to-rose-500 border-4 border-white/90 flex items-center justify-center text-white shadow-2xl shadow-rose-600/50 active:scale-95 disabled:opacity-50"
                  title="Start Studio Recording"
                >
                  <div className="w-6 h-6 rounded-full bg-white shadow-inner" />
                </button>
              )}
            </div>

            {/* Teleprompter Toggle */}
            <button
              onClick={() =>
                setTeleprompterConfig((prev) => ({ ...prev, enabled: !prev.enabled }))
              }
              className={`p-3 rounded-full border backdrop-blur shadow-lg active:scale-95 pointer-events-auto transition-all ${
                teleprompterConfig.enabled
                  ? 'bg-blue-600 text-white border-blue-400'
                  : 'bg-neutral-900/80 text-neutral-300 border-neutral-700/80'
              }`}
              title="Toggle Script Prompter"
            >
              <FileText className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Modal Bottom Sheet for other tabs */}
        {activeTab !== 'studio' && (
          <div className="absolute inset-0 z-30 bg-neutral-950/95 backdrop-blur-md flex flex-col animate-in slide-in-from-bottom duration-200">
            {/* Sheet Header */}
            <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                {activeTab === 'sets' && 'Virtual Backgrounds'}
                {activeTab === 'mic' && 'Microphone & Vocal Preamp'}
                {activeTab === 'camera' && 'White Wall Chroma & Lens'}
                {activeTab === 'vault' && 'Cloud Vault & $0 Cost Optimizer'}
                {activeTab === 'prompter' && 'Teleprompter Script'}
              </span>
              <button
                onClick={() => setActiveTab('studio')}
                className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sheet Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeTab === 'vault' && <CloudinaryVaultPanel />}

              {activeTab === 'sets' && (
                <SettingControls
                  currentSetting={currentSetting}
                  settingsList={settingsList}
                  onSelectSetting={setCurrentSetting}
                  aspectRatio={aspectRatio}
                  onChangeAspectRatio={setAspectRatio}
                  showBrandedOverlays={showBrandedOverlays}
                  onToggleBrandedOverlays={() => setShowBrandedOverlays(!showBrandedOverlays)}
                  showMomsOverlay={showMomsOverlay}
                  onToggleMomsOverlay={() => setShowMomsOverlay(!showMomsOverlay)}
                  onUploadCustomBg={handleUploadCustomBg}
                  onChangeBlur={(blur) => setCurrentSetting((prev) => ({ ...prev, blur }))}
                  onChangeBrightness={(brightness) =>
                    setCurrentSetting((prev) => ({ ...prev, brightness }))
                  }
                />
              )}

              {activeTab === 'mic' && (
                <MicrophoneControls
                  config={micConfig}
                  onChange={setMicConfig}
                  audioLevel={audioLevel}
                  audioPeak={audioPeak}
                  audioConfig={audioConfig}
                  onChangeAudioConfig={handleAudioConfigChange}
                />
              )}

              {activeTab === 'camera' && (
                <div className="space-y-4">
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

                  <CameraSettingsPanel
                    config={cameraQuality}
                    onChangeConfig={handleCameraConfigChange}
                    availableDevices={availableCameras}
                    onFlipCamera={handleFlipCamera}
                    aspectRatio={aspectRatio}
                    mirror={framing.mirror}
                    onToggleMirror={() => setFraming((prev) => ({ ...prev, mirror: !prev.mirror }))}
                  />
                </div>
              )}

              {activeTab === 'prompter' && (
                <Teleprompter
                  config={teleprompterConfig}
                  onChange={setTeleprompterConfig}
                  isOverlay={false}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Mobile Tab Bar */}
      <nav className="h-14 bg-neutral-950 border-t border-neutral-800 flex items-center justify-around px-1 z-30 shrink-0">
        <button
          onClick={() => setActiveTab('studio')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'studio' ? 'text-blue-400 font-bold scale-105' : 'text-neutral-400'
          }`}
        >
          <Video className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('sets')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'sets' ? 'text-blue-400 font-bold scale-105' : 'text-neutral-400'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Sets</span>
        </button>

        <button
          onClick={() => setActiveTab('mic')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'mic' ? 'text-blue-400 font-bold scale-105' : 'text-neutral-400'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Mic</span>
        </button>

        <button
          onClick={() => setActiveTab('camera')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'camera' ? 'text-blue-400 font-bold scale-105' : 'text-neutral-400'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Wall/Cam</span>
        </button>

        <button
          onClick={() => setActiveTab('vault')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'vault' ? 'text-blue-400 font-bold scale-105' : 'text-neutral-400'
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Vault</span>
        </button>
      </nav>

      {/* Review Modal */}
      <VideoReviewModal
        videoUrl={recordingState.recordedVideoUrl}
        videoBlob={recordingState.recordedBlob}
        durationSeconds={recordingState.durationSeconds}
        resolution={cameraQuality.resolution}
        frameRate={cameraQuality.frameRate}
        onClose={clearRecording}
        onRetake={clearRecording}
        onOpenCloudVault={() => setActiveTab('vault')}
      />

      {/* White Wall Setup Guide */}
      <WhiteWallGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        onStartCalibration={() => setActiveTab('camera')}
      />
    </div>
  );
};
