export type AspectRatio = '9:16' | '16:9';

export interface ChromaKeyConfig {
  mode: 'luminance_white' | 'color_sample' | 'difference_matte';
  luminanceThreshold: number; // 0.5 - 0.98, default ~0.78
  tolerance: number; // 0.05 - 0.5, default ~0.20
  softness: number; // 0.01 - 0.3, default ~0.08 (feathering)
  spillSuppression: number; // 0 - 1, default ~0.3
  sampledColor: { r: number; g: number; b: number };
  sampleRadius: number;
  showMatteOnly: boolean;
  edgeErosion: number; // 0 - 5
}

export interface UserFraming {
  scale: number; // 0.5 to 2.0, default 1.0
  offsetX: number; // -50% to +50%, default 0
  offsetY: number; // -50% to +50%, default 0
  mirror: boolean;
  brightness: number; // 0.5 - 1.5, default 1.0
  contrast: number; // 0.5 - 1.5, default 1.0
}

export type MicWrapStyle = 'moms_3d' | 'diamond_tech' | 'moms_text' | 'custom_text' | 'custom_image';
export type MicWrapColor = 'black' | 'royal_blue' | 'carbon' | 'gold' | 'white';
export type MicPresetPosition = 'host_left' | 'center' | 'guest_right' | 'custom';

export interface MicConfig {
  visible: boolean;
  wrapStyle: MicWrapStyle;
  wrapColor: MicWrapColor;
  customText: string;
  customLogoUrl: string | null;
  position: MicPresetPosition;
  customX: number; // 0 - 100 percentage
  customY: number; // 0 - 100 percentage
  scale: number; // 0.5 - 1.8, default 1.0
  showStandBadge: boolean;
  audioReactiveGlow: boolean;
}

export interface StudioSetting {
  id: string;
  name: string;
  thumbnailUrl: string;
  bgImageUrl: string;
  category: 'moms_official' | 'custom' | 'studio';
  blur: number; // 0 - 10px
  brightness: number; // 0.5 - 1.5
}

export interface TeleprompterConfig {
  enabled: boolean;
  text: string;
  fontSize: number; // 14 - 36px
  scrollSpeed: number; // 1 - 10
  isScrolling: boolean;
  opacity: number; // 0.3 - 1.0
}

export interface AudioConfig {
  micGain: number; // 0.5 to 3.0, default 1.35
  vocalEnhance: boolean; // Broadcast EQ & Voice warmth
  highpassFilter: boolean; // 80Hz rumble cut
  compressor: boolean; // Studio dynamics compressor
  echoCancellation: boolean;
  monitorAudio: boolean; // Live feedback in headphones
}

export type ResolutionPreset = '8k' | '4k' | '2k' | '1080p' | 'max_sensor';
export type TargetFrameRate = 30 | 60;
export type CameraFacing = 'user' | 'environment';

export interface CameraDeviceInfo {
  deviceId: string;
  label: string;
  facing: CameraFacing;
  isFront: boolean;
  isRear: boolean;
}

export interface CameraQualityConfig {
  resolution: ResolutionPreset;
  frameRate: TargetFrameRate;
  facingMode: CameraFacing;
  selectedDeviceId: string;
  actualWidth: number;
  actualHeight: number;
  actualFrameRate: number;
  sensorLabel: string;
}

export type RecordingFormat = 'mp4' | 'webm';

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  countdown: number | null;
  durationSeconds: number;
  recordedBlob: Blob | null;
  recordedVideoUrl: string | null;
  format: RecordingFormat;
  resolution: ResolutionPreset;
  frameRate: TargetFrameRate;
  videoWidth: number;
  videoHeight: number;
  isConverting: boolean;
  conversionStatus: string | null;
  mp4Blob: Blob | null;
  mp4Url: string | null;
  serverDownloadUrl: string | null;
}
