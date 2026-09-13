import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { exec } from 'child_process';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

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
