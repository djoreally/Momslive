'use client';

import { AlertCircle, Video, X } from 'lucide-react';
import { CalibrationPanel } from '../../components/CalibrationPanel';
import { CameraSettingsPanel } from '../../components/CameraSettingsPanel';
import { Header } from '../../components/Header';
import { MicrophoneControls } from '../../components/MicrophoneControls';
import { RecordingBar } from '../../components/RecordingBar';
import { SettingControls } from '../../components/SettingControls';
import { StudioCanvas } from '../../components/StudioCanvas';
import { Teleprompter } from '../../components/Teleprompter';
import { VideoReviewModal } from '../../components/VideoReviewModal';
import { WhiteWallGuideModal } from '../../components/WhiteWallGuideModal';
import { useStudioSession } from './hooks/useStudioSession';

const DRAWER_TITLES = {
  camera: 'Camera Lens & 4K/8K Quality',
  calibration: 'White Wall & Framing',
  microphone: 'Microphone & Wrap',
  setting: 'Virtual Setting',
  teleprompter: 'Script & Teleprompter',
} as const;

export default function StudioWorkspace() {
  const session = useStudioSession();
  const {
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
  } = session;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-neutral-950 font-sans text-neutral-100">
      <Header
        activeDrawer={activeDrawer}
        onToggleDrawer={setActiveDrawer}
        onOpenGuide={() => setShowGuideModal(true)}
        hasCamera={Boolean(stream)}
        onRequestCamera={() => void initCamera()}
      />

      <div className="relative flex min-h-0 flex-1 flex-row overflow-hidden">
        <div className="relative flex h-full min-w-0 flex-1 flex-col items-center justify-center overflow-hidden bg-neutral-950 p-2 sm:p-4">
          {cameraError && (
            <div className="absolute left-4 right-4 top-4 z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl border border-rose-600/50 bg-rose-950/90 p-4 text-xs text-rose-200 shadow-2xl">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
                <span>{cameraError}. Please grant camera and microphone access.</span>
              </div>
              <button
                id="retry-camera-btn"
                onClick={() => void initCamera()}
                className="shrink-0 rounded-lg bg-rose-600 px-3 py-1 font-semibold text-white transition-colors hover:bg-rose-500"
              >
                Retry
              </button>
            </div>
          )}

          {recordingState.countdown !== null && (
            <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-blue-500 bg-blue-600/30 text-6xl font-black text-white shadow-2xl shadow-blue-500/50">
                {recordingState.countdown}
              </div>
            </div>
          )}

          <Teleprompter config={teleprompterConfig} onChange={setTeleprompterConfig} isOverlay />

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

          {!stream && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center space-y-4 bg-neutral-950/95 p-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-600/20 text-blue-400">
                <Video className="h-8 w-8" />
              </div>
              <div className="max-w-md space-y-2">
                <h2 className="text-xl font-bold text-white">Enable Camera to Begin</h2>
                <p className="text-xs leading-relaxed text-neutral-400">
                  Stand in front of a white wall background. The studio removes the wall in real time and places you into the MOMS Mobile Oil Change virtual set in 4K/8K quality with front and rear camera support.
                </p>
              </div>
              <button
                id="grant-camera-btn"
                onClick={() => void initCamera()}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:scale-105 hover:bg-blue-500"
              >
                <Video className="h-4 w-4" />
                <span>Allow Camera &amp; Mic</span>
              </button>
            </div>
          )}
        </div>

        {activeDrawer !== 'none' && (
          <aside
            id="control-drawer-sidebar"
            className="z-30 flex h-full w-80 shrink-0 flex-col overflow-y-auto border-l border-neutral-800 bg-neutral-900 p-4 shadow-2xl sm:w-96"
          >
            <div className="mb-3 flex items-center justify-between border-b border-neutral-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                {DRAWER_TITLES[activeDrawer]}
              </span>
              <button
                id="close-drawer-btn"
                onClick={() => setActiveDrawer('none')}
                className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-4">
              {activeDrawer === 'camera' && (
                <CameraSettingsPanel
                  config={cameraQuality}
                  onChangeConfig={handleCameraConfigChange}
                  availableDevices={availableCameras}
                  onFlipCamera={handleFlipCamera}
                  aspectRatio={aspectRatio}
                  mirror={framing.mirror}
                  onToggleMirror={() => setFraming((previous) => ({ ...previous, mirror: !previous.mirror }))}
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
                  onToggleSamplingColor={() => setIsSamplingColor((previous) => !previous)}
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
                  onToggleBrandedOverlays={() => setShowBrandedOverlays((previous) => !previous)}
                  onUploadCustomBg={handleUploadCustomBg}
                  onChangeBlur={(blur) => setCurrentSetting((previous) => ({ ...previous, blur }))}
                  onChangeBrightness={(brightness) => setCurrentSetting((previous) => ({ ...previous, brightness }))}
                />
              )}
              {activeDrawer === 'teleprompter' && (
                <Teleprompter config={teleprompterConfig} onChange={setTeleprompterConfig} isOverlay={false} />
              )}
            </div>
          </aside>
        )}
      </div>

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
        onChangeResolution={(resolution) => handleCameraConfigChange({ resolution })}
        onChangeFrameRate={(frameRate) => handleCameraConfigChange({ frameRate })}
        onFlipCamera={handleFlipCamera}
        onOpenCamSettings={() => setActiveDrawer('camera')}
        hasCamera={Boolean(stream)}
        onOpenMicSettings={() => setActiveDrawer('microphone')}
      />

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
        onClose={closeReview}
        onRetake={retakeRecording}
      />
    </div>
  );
}
