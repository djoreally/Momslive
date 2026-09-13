import path from 'path';
import {
  addBundleToSandbox,
  createSandbox,
  renderMediaOnVercel,
} from '@remotion/vercel';
import {uploadBufferToCloudinary} from './cloudinary';

export type RemotionRenderFormat = 'vertical' | 'landscape' | 'square';

export interface RemotionRenderRequest {
  videoUrl: string;
  durationSeconds: number;
  format: RemotionRenderFormat;
  title?: string;
  subtitle?: string;
  workspaceSlug?: string;
}

export async function renderRemotionToCloudinary(input: RemotionRenderRequest) {
  const sandbox = await createSandbox({
    resources: {vcpus: 4},
    timeoutInMilliseconds: 30 * 60 * 1000,
  });

  try {
    const bundleDir = path.join(process.cwd(), 'dist', 'remotion-bundle');
    await addBundleToSandbox({sandbox, bundleDir});

    const {sandboxFilePath} = await renderMediaOnVercel({
      sandbox,
      compositionId: 'MomsSocial',
      inputProps: {
        videoUrl: input.videoUrl,
        durationSeconds: input.durationSeconds,
        format: input.format,
        title: input.title || 'MOMS Mobile Oil Change',
        subtitle: input.subtitle || 'Mobile service. Done where you are.',
        showBranding: true,
      },
      codec: 'h264',
      audioBitrate: '192k',
      videoBitrate: input.format === 'landscape' ? '10M' : '8M',
      x264Preset: 'medium',
    });

    const rendered = await sandbox.readFileToBuffer({path: sandboxFilePath});
    if (!rendered || rendered.length === 0) {
      throw new Error('Rendered MP4 was empty or could not be read from the render sandbox');
    }

    return await uploadBufferToCloudinary(rendered, {
      title: input.title || 'MOMS Remotion Social Export',
      resolution: input.format,
      frameRate: 30,
      tags: [
        'remotion-render',
        `format-${input.format}`,
        input.workspaceSlug ? `workspace-${input.workspaceSlug}` : 'workspace-default',
      ],
      workspaceSlug: input.workspaceSlug,
    });
  } finally {
    await sandbox.stop().catch(() => undefined);
  }
}
