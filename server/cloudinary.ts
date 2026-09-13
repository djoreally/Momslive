import './env';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { sanitizeAndLoadEnv } from './env';

export function ensureEnvLoaded(): void {
  sanitizeAndLoadEnv();
}

export function isCloudinaryConfigured(): boolean {
  ensureEnvLoaded();
  if (process.env.CLOUDINARY_URL && process.env.CLOUDINARY_URL.startsWith('cloudinary://')) {
    return true;
  }
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

let isConfigured = false;

export function getCloudinaryClient() {
  ensureEnvLoaded();
  if (!isCloudinaryConfigured()) {
    throw new Error(
      'Cloudinary credentials are not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in environment settings.'
    );
  }

  if (!isConfigured) {
    if (process.env.CLOUDINARY_URL && process.env.CLOUDINARY_URL.startsWith('cloudinary://')) {
      cloudinary.config();
    } else {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
      });
    }
    isConfigured = true;
  }

  return cloudinary;
}

export function getCloudName(): string {
  ensureEnvLoaded();
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    return process.env.CLOUDINARY_CLOUD_NAME;
  }
  if (process.env.CLOUDINARY_URL) {
    try {
      const match = process.env.CLOUDINARY_URL.match(/@([^@]+)$/);
      if (match && match[1]) {
        return match[1];
      }
    } catch {
      // ignore
    }
  }
  return 'dhjl09lfn';
}

export function signUploadParams(customTags?: string) {
  ensureEnvLoaded();
  const client = getCloudinaryClient();
  const timestamp = Math.round(new Date().getTime() / 1000);
  const folder = 'moms_studio_recordings';
  const tags = customTags || 'moms-white-screen-studio,oil-change-podcast';
  const eager = 'f_mp3,ac_2,ar_48000,b_256k|so_0,f_jpg,w_800|c_fill,ar_9:16,g_auto';

  const paramsToSign: Record<string, any> = {
    eager,
    folder,
    tags,
    timestamp,
  };

  const signature = client.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: getCloudName(),
    folder,
    tags,
    eager,
    uploadUrl: `https://api.cloudinary.com/v1_1/${getCloudName()}/video/upload`,
  };
}

export interface DerivedUrls {
  streamingUrl: string;
  thumbnailUrl: string;
  audioUrl: string;
  verticalUrl: string;
  squareUrl: string;
  waveformUrl: string;
}

export function buildDerivedUrls(cloudName: string, publicId: string): DerivedUrls {
  const cleanId = publicId.replace(/\.[^/.]+$/, '');
  const base = `https://res.cloudinary.com/${cloudName}/video/upload`;

  return {
    // Adaptive quality and codec for fast web playback
    streamingUrl: `${base}/f_auto,q_auto/${cleanId}.mp4`,
    // Video poster thumbnail extracted at 0.5s or frame 0
    thumbnailUrl: `${base}/so_0,f_jpg,q_auto:eco,w_800/${cleanId}.jpg`,
    // High quality standalone MP3 podcast audio extraction
    audioUrl: `${base}/f_mp3,ac_2,ar_48000,b_256k/${cleanId}.mp3`,
    // Social crops: 9:16 Vertical Story / Reel
    verticalUrl: `${base}/c_fill,ar_9:16,g_auto,q_auto/${cleanId}.mp4`,
    // Social crops: 1:1 Square Feed
    squareUrl: `${base}/c_fill,ar_1:1,g_auto,q_auto/${cleanId}.mp4`,
    // Cloudinary audio waveform visualizer
    waveformUrl: `${base}/fl_waveform,co_rgb:3b82f6,b_rgb:0f172a,w_600,h_120/${cleanId}.png`,
  };
}

export interface CloudinaryUploadOptions {
  title?: string;
  resolution?: string;
  frameRate?: number;
  tags?: string[];
}

export async function uploadToCloudinary(
  filePath: string,
  options: CloudinaryUploadOptions = {}
) {
  const client = getCloudinaryClient();
  const cloudName = getCloudName();

  const customTags = [
    'moms-white-screen-studio',
    'oil-change-podcast',
    options.resolution ? `res-${options.resolution}` : 'studio-video',
    ...(options.tags || []),
  ];

  const uploadResult: UploadApiResponse = await client.uploader.upload(filePath, {
    resource_type: 'video',
    folder: 'moms_studio_recordings',
    tags: customTags,
    context: {
      caption: options.title || 'MOMS Studio Recording',
      resolution: options.resolution || 'master',
      frameRate: options.frameRate ? String(options.frameRate) : '60',
    },
    // Generate eager transformations for instant ready-to-stream formats
    eager: [
      { format: 'mp3', audio_codec: 'mp3', bit_rate: '256k' },
      { format: 'jpg', start_offset: '0', transformation: [{ width: 800, crop: 'scale' }] },
      { format: 'mp4', aspect_ratio: '9:16', crop: 'fill', gravity: 'auto' },
    ],
    eager_async: false,
  });

  const derived = buildDerivedUrls(cloudName, uploadResult.public_id);

  return {
    publicId: uploadResult.public_id,
    secureUrl: uploadResult.secure_url,
    format: uploadResult.format,
    bytes: uploadResult.bytes,
    duration: uploadResult.duration || 0,
    width: uploadResult.width || 0,
    height: uploadResult.height || 0,
    createdAt: uploadResult.created_at,
    resourceType: uploadResult.resource_type,
    ...derived,
  };
}

export async function listCloudinaryRecordings(limit: number = 30) {
  if (!isCloudinaryConfigured()) {
    return [];
  }

  try {
    const client = getCloudinaryClient();
    const cloudName = getCloudName();

    // Query resources in our studio folder
    const result = await client.api.resources({
      type: 'upload',
      resource_type: 'video',
      prefix: 'moms_studio_recordings/',
      max_results: limit,
      tags: true,
      context: true,
    });

    const resources = result.resources || [];
    return resources.map((item: any) => {
      const derived = buildDerivedUrls(cloudName, item.public_id);
      return {
        publicId: item.public_id,
        secureUrl: item.secure_url,
        format: item.format,
        bytes: item.bytes,
        duration: item.duration || 0,
        width: item.width || 0,
        height: item.height || 0,
        createdAt: item.created_at,
        resourceType: item.resource_type,
        ...derived,
      };
    });
  } catch (err: any) {
    console.warn('Cloudinary list query fallback:', err.message);
    return [];
  }
}

export async function deleteFromCloudinary(publicId: string) {
  const client = getCloudinaryClient();
  return await client.uploader.destroy(publicId, {
    resource_type: 'video',
    invalidate: true,
  });
}
