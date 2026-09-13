import {
  CloudinaryAsset,
  CloudinaryConfigStatus,
  CloudinaryCostConfig,
  CloudinaryUsageEstimate,
} from '../types';

export const DEFAULT_COST_CONFIG: CloudinaryCostConfig = {
  lazyTransforms: true,
  optimizedDeliveryCodec: true,
  storageQuotaWarningGb: 20,
  autoCleanScratchTakes: false,
  defaultPodcastBitrate: '256k',
};

const COST_CONFIG_KEY = 'moms_cloudinary_cost_config_v1';

export function getStoredCostConfig(): CloudinaryCostConfig {
  try {
    const raw = localStorage.getItem(COST_CONFIG_KEY);
    if (raw) {
      return { ...DEFAULT_COST_CONFIG, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_COST_CONFIG;
}

export function saveStoredCostConfig(config: CloudinaryCostConfig): void {
  try {
    localStorage.setItem(COST_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

export async function fetchCloudinaryStatus(): Promise<CloudinaryConfigStatus> {
  try {
    const res = await fetch('/api/cloudinary/status');
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    return {
      configured: false,
      message: 'Could not connect to Cloudinary API status endpoint',
    };
  }
}

/**
 * Builds dynamic URL-based transformations that are 100% computed on-demand
 * (Lazy transformations). They do not incur upfront transformation credits on upload!
 */
export function buildClientDerivedUrls(cloudName: string, publicId: string) {
  const cleanId = publicId.replace(/\.[^/.]+$/, '');
  const base = `https://res.cloudinary.com/${cloudName}/video/upload`;
  return {
    // f_auto,q_auto reduces CDN egress by 40-60%
    streamingUrl: `${base}/f_auto,q_auto/${cleanId}.mp4`,
    // Video poster image extracted at 0s, webp/jpg auto compressed
    thumbnailUrl: `${base}/so_0,f_auto,q_auto:eco,w_800/${cleanId}.jpg`,
    // Instant 48kHz stereo podcast extraction at 256kbps
    audioUrl: `${base}/f_mp3,ac_2,ar_48000,b_256k/${cleanId}.mp3`,
    // Dynamic AI center auto-gravity 9:16 vertical crop for Reels & Shorts
    verticalUrl: `${base}/c_fill,ar_9:16,g_auto,q_auto/${cleanId}.mp4`,
    // Dynamic 1:1 square crop for Instagram / LinkedIn feed
    squareUrl: `${base}/c_fill,ar_1:1,g_auto,q_auto/${cleanId}.mp4`,
    // Audio waveform visualizer image
    waveformUrl: `${base}/fl_waveform,co_rgb:3b82f6,b_rgb:0f172a,w_600,h_120/${cleanId}.png`,
  };
}

/**
 * Calculates real-time usage estimate against Cloudinary's 25 Free-Tier monthly credits
 * 1 credit = 1 GB Storage, or 1 GB CDN Bandwidth, or 1,000 Transformations
 */
export function calculateUsageEstimate(recordings: CloudinaryAsset[]): CloudinaryUsageEstimate {
  const totalAssets = recordings.length;
  const totalBytes = recordings.reduce((acc, r) => acc + (r.bytes || 0), 0);
  const totalStorageMb = Math.round((totalBytes / (1024 * 1024)) * 10) / 10;
  const totalStorageGb = totalBytes / (1024 * 1024 * 1024);

  // Storage credits: 1 Credit per GB
  const storageCredits = totalStorageGb;

  // Estimated lazy transformations (average 3-4 requested variants per asset)
  const estimatedTransformations = totalAssets * 3;
  const transformCredits = estimatedTransformations / 1000;

  // Total estimated credits used
  const estimatedCreditsUsed = Math.min(25, Math.round((storageCredits + transformCredits) * 100) / 100);
  const creditsRemaining = Math.max(0, Math.round((25 - estimatedCreditsUsed) * 100) / 100);

  return {
    totalAssets,
    totalBytes,
    totalStorageMb,
    estimatedCreditsUsed,
    creditsRemaining,
    bandwidthSavedPercent: 52, // Typical savings of f_auto,q_auto over raw MP4
  };
}

/**
 * Generates ready-to-paste embed code snippet for websites & blogs
 */
export function buildEmbedSnippet(asset: CloudinaryAsset, title: string = 'MOMS Studio Recording'): string {
  return `<video 
  src="${asset.streamingUrl || asset.secureUrl}" 
  poster="${asset.thumbnailUrl}" 
  controls 
  preload="metadata" 
  playsinline 
  style="width: 100%; max-width: 800px; border-radius: 12px; background: #000;"
  title="${title}">
  Your browser does not support HTML5 video.
</video>`;
}

export async function uploadRecordingToCloudinary(
  blobOrFileId: Blob | string,
  meta: {
    title?: string;
    resolution?: string;
    frameRate?: number;
  } = {},
  onStatus?: (status: string) => void
): Promise<CloudinaryAsset> {
  const costConfig = getStoredCostConfig();

  // If we have a direct Blob, attempt direct signed upload to api.cloudinary.com for maximum speed & reliability
  if (typeof blobOrFileId !== 'string') {
    try {
      onStatus?.('Requesting secure Cloudinary API signature...');
      const signRes = await fetch('/api/cloudinary/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tags: `moms-white-screen-studio,oil-change-podcast,res-${meta.resolution || '4k'}`,
        }),
      });

      if (signRes.ok) {
        const signData = await signRes.json();
        if (signData.signature && signData.apiKey && signData.cloudName) {
          onStatus?.('Uploading master video directly to Cloudinary API...');

          const formData = new FormData();
          formData.append('file', blobOrFileId, 'moms_studio_video.mp4');
          formData.append('api_key', signData.apiKey);
          formData.append('timestamp', String(signData.timestamp));
          formData.append('signature', signData.signature);
          formData.append('folder', signData.folder);
          formData.append('tags', signData.tags);

          // If lazy transforms is enabled, we omit heavy eager generation to keep credit usage strictly at $0
          if (!costConfig.lazyTransforms) {
            formData.append('eager', signData.eager);
          }

          const directUploadResult = await new Promise<any>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', signData.uploadUrl);

            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                const pct = Math.round((e.loaded / e.total) * 100);
                onStatus?.(`Uploading directly to Cloudinary API (${pct}%)...`);
              }
            };

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  resolve(JSON.parse(xhr.responseText));
                } catch (err) {
                  reject(new Error('Invalid JSON from Cloudinary API'));
                }
              } else {
                let errMessage = `Cloudinary API error: ${xhr.status}`;
                try {
                  const parsed = JSON.parse(xhr.responseText);
                  errMessage = parsed.error?.message || errMessage;
                } catch {
                  // ignore
                }
                reject(new Error(errMessage));
              }
            };

            xhr.onerror = () => reject(new Error('Network error uploading to Cloudinary API'));
            xhr.ontimeout = () => reject(new Error('Timeout uploading to Cloudinary API'));

            xhr.send(formData);
          });

          onStatus?.('Upload complete! Preparing dynamic CDN formats and 48kHz audio...');

          const derived = buildClientDerivedUrls(signData.cloudName, directUploadResult.public_id);
          return {
            publicId: directUploadResult.public_id,
            secureUrl: directUploadResult.secure_url,
            format: directUploadResult.format,
            bytes: directUploadResult.bytes,
            duration: directUploadResult.duration || 0,
            width: directUploadResult.width || 0,
            height: directUploadResult.height || 0,
            createdAt: directUploadResult.created_at,
            resourceType: directUploadResult.resource_type,
            ...derived,
          };
        }
      }
    } catch (directUploadErr) {
      console.warn('Direct Cloudinary API upload notice, trying server proxy:', directUploadErr);
    }
  }

  // Fallback: Server-side upload proxy (/api/cloudinary/upload)
  const queryParams = new URLSearchParams();
  if (meta.title) queryParams.set('title', meta.title);
  if (meta.resolution) queryParams.set('resolution', meta.resolution);
  if (meta.frameRate) queryParams.set('frameRate', String(meta.frameRate));

  let url = `/api/cloudinary/upload?${queryParams.toString()}`;
  let body: BodyInit | undefined = undefined;

  if (typeof blobOrFileId === 'string') {
    queryParams.set('fileId', blobOrFileId);
    url = `/api/cloudinary/upload?${queryParams.toString()}`;
    onStatus?.('Syncing server master recording to Cloudinary API...');
  } else {
    body = blobOrFileId;
    onStatus?.('Transferring master video to Cloudinary...');
  }

  onStatus?.('Processing cloud video and preparing CDN delivery...');

  const response = await fetch(url, {
    method: 'POST',
    body,
  });

  if (!response.ok) {
    let errorDetail = 'Cloudinary upload failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.error || errorDetail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  const data = await response.json();
  if (!data.success || !data.asset) {
    throw new Error(data.error || 'Invalid response from Cloudinary API');
  }

  onStatus?.('Complete! Video & audio ready on Cloudinary CDN.');
  return data.asset as CloudinaryAsset;
}

export async function fetchCloudinaryRecordings(): Promise<{
  recordings: CloudinaryAsset[];
  configured: boolean;
}> {
  try {
    const res = await fetch('/api/cloudinary/recordings');
    if (!res.ok) {
      return { recordings: [], configured: false };
    }
    const data = await res.json();
    return {
      recordings: data.recordings || [],
      configured: !!data.configured,
    };
  } catch {
    return { recordings: [], configured: false };
  }
}

export async function deleteCloudinaryRecording(publicId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/cloudinary/recordings/${encodeURIComponent(publicId)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function batchDeleteRecordings(publicIds: string[]): Promise<number> {
  let count = 0;
  for (const id of publicIds) {
    try {
      const ok = await deleteCloudinaryRecording(id);
      if (ok) count++;
    } catch {
      // ignore
    }
  }
  return count;
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
