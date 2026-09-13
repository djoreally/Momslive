import './server/env';
import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { exec } from 'child_process';
import { createServer as createViteServer } from 'vite';
import {
  isCloudinaryConfigured,
  getCloudName,
  uploadToCloudinary,
  listCloudinaryRecordings,
  deleteFromCloudinary,
  ensureEnvLoaded,
  signUploadParams,
} from './server/cloudinary';

async function startServer() {
  ensureEnvLoaded();
  const app = express();
  const PORT = 3000;

  // JSON middleware for API endpoints
  app.use(express.json());

  const tempDir = path.join(os.tmpdir(), 'moms_studio_recordings');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Periodic cleanup of temp files older than 30 minutes
  const cleanupTimer = setInterval(() => {
    try {
      const files = fs.readdirSync(tempDir);
      const now = Date.now();
      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > 30 * 60 * 1000) {
          fs.unlinkSync(filePath);
        }
      }
    } catch {
      // Ignore cleanup errors
    }
  }, 10 * 60 * 1000);
  cleanupTimer.unref();

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'moms-white-screen-studio', ffmpeg: true });
  });

  // Convert uploaded WebM/recording to standardized MP4
  // Supports up to 1.5GB buffer for long 4K / 8K 60fps master recordings
  app.post('/api/convert-to-mp4', express.raw({ type: '*/*', limit: '1500mb' }), async (req, res) => {
    try {
      const buffer = req.body;
      if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
        return res.status(400).json({ error: 'Empty or invalid video buffer' });
      }

      const id = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const inputPath = path.join(tempDir, `${id}_input.webm`);
      const outputPath = path.join(tempDir, `${id}.mp4`);

      await fs.promises.writeFile(inputPath, buffer);

      // Run FFmpeg to encode to standard H.264 / AAC MP4 with faststart
      // -threads 0 utilizes all CPU cores for fast 4K/8K encoding
      // -crf 19 provides master visually lossless video quality
      // -c:a aac with 256k audio bitrate and 48kHz sample rate delivers broadcast studio sound
      const ffmpegCmd = `ffmpeg -y -i "${inputPath}" -c:v libx264 -preset ultrafast -crf 19 -threads 0 -pix_fmt yuv420p -c:a aac -b:a 256k -ar 48000 -movflags +faststart "${outputPath}"`;

      exec(ffmpegCmd, async (err, stdout, stderr) => {
        // Clean up input file
        try {
          if (fs.existsSync(inputPath)) {
            fs.unlinkSync(inputPath);
          }
        } catch {
          // ignore
        }

        if (err) {
          console.error('FFmpeg conversion error:', stderr);
          return res.status(500).json({ error: 'Failed to convert video to MP4', details: err.message });
        }

        const filename = `MOMS_Studio_Recording_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.mp4`;

        // Check if query wants download URL or direct binary stream
        if (req.query.mode === 'json') {
          return res.json({
            success: true,
            id,
            filename,
            downloadUrl: `/api/download-file/${id}.mp4?name=${encodeURIComponent(filename)}`,
          });
        }

        // Direct binary stream with attachment headers
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        const readStream = fs.createReadStream(outputPath);
        readStream.pipe(res);
        readStream.on('close', () => {
          // Keep file for a bit in case user retries download, cleanup interval will delete it
        });
      });
    } catch (error: any) {
      console.error('Server error during MP4 conversion:', error);
      res.status(500).json({ error: error.message || 'Internal conversion error' });
    }
  });

  // Direct file download endpoint for reliable download handling across iframes
  app.get('/api/download-file/:file', (req, res) => {
    const filename = path.basename(req.params.file);
    const filePath = path.join(tempDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found or expired.');
    }

    const customName = (req.query.name as string) || filename;
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${customName}"`);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });

  // Cloudinary Status check endpoint
  app.get('/api/cloudinary/status', (req, res) => {
    const configured = isCloudinaryConfigured();
    res.json({
      configured,
      cloudName: configured ? getCloudName() : undefined,
      message: configured
        ? `Connected to Cloudinary API (${getCloudName()})`
        : 'Cloudinary credentials not configured in environment. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in AI Studio Settings.',
    });
  });

  // Direct Cloudinary Upload API Signature Provider
  // Allows direct client-side upload to https://api.cloudinary.com for fast, unthrottled 4K/8K transfers
  app.post('/api/cloudinary/sign', (req, res) => {
    if (!isCloudinaryConfigured()) {
      return res.status(400).json({
        error: 'Cloudinary credentials are not configured.',
      });
    }
    try {
      const tags = (req.body?.tags as string) || (req.query.tags as string) || undefined;
      const signedData = signUploadParams(tags);
      res.json({
        success: true,
        ...signedData,
      });
    } catch (err: any) {
      console.error('Cloudinary sign error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate upload signature' });
    }
  });

  // Upload video & audio to Cloudinary with automatic transcoding & processing
  app.post('/api/cloudinary/upload', express.raw({ type: '*/*', limit: '1500mb' }), async (req, res) => {
    if (!isCloudinaryConfigured()) {
      return res.status(400).json({
        error: 'Cloudinary is not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to the environment settings.',
      });
    }

    try {
      const buffer = req.body;
      const fileId = req.query.fileId as string | undefined;
      const title = (req.query.title as string) || `MOMS Studio Recording ${new Date().toLocaleDateString()}`;
      const resolution = (req.query.resolution as string) || '4k';
      const frameRate = req.query.frameRate ? parseInt(req.query.frameRate as string, 10) : 60;

      let uploadSourcePath: string;
      let shouldCleanup = false;

      if (fileId) {
        const localPath = path.join(tempDir, `${fileId}.mp4`);
        if (fs.existsSync(localPath)) {
          uploadSourcePath = localPath;
        } else {
          return res.status(404).json({ error: 'Source recording file not found or expired on server' });
        }
      } else {
        if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
          return res.status(400).json({ error: 'No video payload received for upload' });
        }
        const tempUploadId = `cld_up_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        uploadSourcePath = path.join(tempDir, `${tempUploadId}.mp4`);
        await fs.promises.writeFile(uploadSourcePath, buffer);
        shouldCleanup = true;
      }

      const result = await uploadToCloudinary(uploadSourcePath, {
        title,
        resolution,
        frameRate,
      });

      if (shouldCleanup && fs.existsSync(uploadSourcePath)) {
        try {
          fs.unlinkSync(uploadSourcePath);
        } catch {
          // ignore
        }
      }

      res.json({
        success: true,
        asset: result,
      });
    } catch (err: any) {
      console.error('Cloudinary upload error:', err);
      res.status(500).json({
        error: err.message || 'Failed to upload and process with Cloudinary',
      });
    }
  });

  // List all Cloudinary cloud studio recordings
  app.get('/api/cloudinary/recordings', async (req, res) => {
    try {
      const recordings = await listCloudinaryRecordings();
      res.json({
        success: true,
        recordings,
        configured: isCloudinaryConfigured(),
      });
    } catch (err: any) {
      console.error('Cloudinary list error:', err);
      res.status(500).json({
        error: err.message || 'Failed to retrieve Cloudinary recordings',
      });
    }
  });

  // Delete an asset from Cloudinary
  app.delete('/api/cloudinary/recordings/:publicId(*)', async (req, res) => {
    if (!isCloudinaryConfigured()) {
      return res.status(400).json({ error: 'Cloudinary is not configured' });
    }
    try {
      const publicId = req.params.publicId;
      await deleteFromCloudinary(publicId);
      res.json({ success: true, message: 'Asset deleted from Cloudinary' });
    } catch (err: any) {
      console.error('Cloudinary delete error:', err);
      res.status(500).json({
        error: err.message || 'Failed to delete asset from Cloudinary',
      });
    }
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });

  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer();
