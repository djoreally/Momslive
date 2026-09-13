import { ResolutionPreset, TargetFrameRate, CameraFacing, CameraDeviceInfo, AspectRatio } from '../types';

export interface ResolutionDetail {
  label: string;
  subLabel: string;
  shortName: string;
  width16_9: number;
  height16_9: number;
  bitrate60: number;
  bitrate30: number;
}

export const RESOLUTION_SPECS: Record<ResolutionPreset, ResolutionDetail> = {
  '8k': {
    label: '8K Ultra HD (4320p)',
    subLabel: 'Master Cinema Resolution (7680 × 4320)',
    shortName: '8K',
    width16_9: 7680,
    height16_9: 4320,
    bitrate60: 75000000, // 75 Mbps
    bitrate30: 55000000, // 55 Mbps
  },
  '4k': {
    label: '4K Ultra HD (2160p)',
    subLabel: 'Broadcast Studio Quality (3840 × 2160)',
    shortName: '4K',
    width16_9: 3840,
    height16_9: 2160,
    bitrate60: 38000000, // 38 Mbps
    bitrate30: 26000000, // 26 Mbps
  },
  '2k': {
    label: '2K Quad HD (1440p)',
    subLabel: 'Pro Cinematic (2560 × 1440)',
    shortName: '2K',
    width16_9: 2560,
    height16_9: 1440,
    bitrate60: 18000000, // 18 Mbps
    bitrate30: 13000000, // 13 Mbps
  },
  '1080p': {
    label: '1080p Full HD',
    subLabel: 'Crisp High-Definition (1920 × 1080)',
    shortName: '1080p',
    width16_9: 1920,
    height16_9: 1080,
    bitrate60: 12000000, // 12 Mbps
    bitrate30: 8000000,  // 8 Mbps
  },
  'max_sensor': {
    label: 'Device Max Sensor (Ultra)',
    subLabel: 'Highest hardware sensor resolution available',
    shortName: 'MAX',
    width16_9: 7680,
    height16_9: 4320,
    bitrate60: 65000000,
    bitrate30: 45000000,
  },
};

/**
 * Calculates optimal width and height for canvas and recording based on aspect ratio
 */
export function getTargetDimensions(
  resolution: ResolutionPreset,
  aspectRatio: AspectRatio,
  fallbackWidth = 3840,
  fallbackHeight = 2160
): { width: number; height: number } {
  const spec = RESOLUTION_SPECS[resolution];
  const w = spec ? spec.width16_9 : fallbackWidth;
  const h = spec ? spec.height16_9 : fallbackHeight;

  if (aspectRatio === '9:16') {
    return { width: h, height: w };
  }
  return { width: w, height: h };
}

/**
 * Computes high-quality video bitrate based on resolution and framerate
 */
export function getBitrateForConfig(resolution: ResolutionPreset, frameRate: TargetFrameRate): number {
  const spec = RESOLUTION_SPECS[resolution] || RESOLUTION_SPECS['1080p'];
  return frameRate === 60 ? spec.bitrate60 : spec.bitrate30;
}

/**
 * Browser canvas compositing at 4K/8K is extremely expensive on phones.
 * Keep the live recording pipeline at a profile the device can sustain.
 * Higher-resolution masters remain available on capable desktop hardware.
 */
export function getSafeCaptureConfig(
  resolution: ResolutionPreset,
  frameRate: TargetFrameRate,
  userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''
): { resolution: ResolutionPreset; frameRate: TargetFrameRate; wasCapped: boolean } {
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);

  if (isMobile) {
    const cappedResolution: ResolutionPreset =
      resolution === '1080p' ? '1080p' : '1080p';
    const cappedFrameRate: TargetFrameRate = 30;
    return {
      resolution: cappedResolution,
      frameRate: cappedFrameRate,
      wasCapped: resolution !== cappedResolution || frameRate !== cappedFrameRate,
    };
  }

  return { resolution, frameRate, wasCapped: false };
}

/**
 * Select a realistic encoder bitrate from the dimensions the camera/canvas
 * is actually producing instead of trusting the requested preset label.
 */
export function getBitrateForDimensions(width: number, height: number, frameRate: number): number {
  const pixels = Math.max(1, width * height);
  const fps = frameRate >= 50 ? 60 : 30;

  if (pixels >= 3840 * 2160) return fps === 60 ? 38_000_000 : 26_000_000;
  if (pixels >= 2560 * 1440) return fps === 60 ? 18_000_000 : 13_000_000;
  if (pixels >= 1920 * 1080) return fps === 60 ? 12_000_000 : 8_000_000;
  if (pixels >= 1280 * 720) return fps === 60 ? 8_000_000 : 5_000_000;
  return fps === 60 ? 5_000_000 : 3_000_000;
}

/**
 * Detects all camera sensors on the device (Front, Rear, Ultra-Wide, External 4K USB)
 */
export async function enumerateCameraDevices(): Promise<CameraDeviceInfo[]> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return [];
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((d) => d.kind === 'videoinput');

    return videoDevices.map((device, index) => {
      const labelLower = device.label.toLowerCase();

      // Intelligent detection of front vs rear cameras across iOS, Android, and Desktop
      const isRear =
        labelLower.includes('back') ||
        labelLower.includes('rear') ||
        labelLower.includes('environment') ||
        labelLower.includes('telephoto') ||
        labelLower.includes('ultra-wide') ||
        labelLower.includes('wide camera') ||
        labelLower.includes('camera 0');

      const isFront =
        labelLower.includes('front') ||
        labelLower.includes('user') ||
        labelLower.includes('facetime') ||
        labelLower.includes('selfie') ||
        labelLower.includes('truedepth') ||
        labelLower.includes('camera 1');

      const facing: CameraFacing = isRear ? 'environment' : isFront ? 'user' : index === 0 ? 'user' : 'environment';

      let label = device.label;
      if (!label) {
        label = facing === 'environment' ? `Rear Camera ${index + 1}` : `Front Camera ${index + 1}`;
      }

      return {
        deviceId: device.deviceId,
        label,
        facing,
        isFront: facing === 'user',
        isRear: facing === 'environment',
      };
    });
  } catch (err) {
    console.warn('Unable to enumerate camera devices:', err);
    return [];
  }
}

/**
 * Builds standard getUserMedia camera constraints requesting maximum available sensor capabilities
 */
export function buildCameraConstraints(params: {
  resolution: ResolutionPreset;
  frameRate: TargetFrameRate;
  facingMode: CameraFacing;
  deviceId?: string;
  aspectRatio: AspectRatio;
  echoCancellation?: boolean;
}): MediaStreamConstraints {
  const dims = getTargetDimensions(params.resolution, params.aspectRatio);

  const videoConstraints: MediaTrackConstraints = {
    frameRate: {
      ideal: params.frameRate,
      max: params.frameRate,
    },
    width: {
      ideal: dims.width,
    },
    height: {
      ideal: dims.height,
    },
  };

  // If specific hardware camera device selected, use exact deviceId
  if (params.deviceId && params.deviceId.trim().length > 0) {
    videoConstraints.deviceId = { exact: params.deviceId };
  } else {
    // Otherwise request ideal facing mode (front vs rear)
    videoConstraints.facingMode = { ideal: params.facingMode };
  }

  return {
    video: videoConstraints,
    audio: {
      echoCancellation: params.echoCancellation !== false,
      noiseSuppression: false,
      autoGainControl: false,
      sampleRate: 48000,
    },
  };
}
