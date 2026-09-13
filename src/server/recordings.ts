import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const execFileAsync = promisify(execFile);
const RECORDING_TTL_MS = 30 * 60 * 1000;
const MAX_INPUT_BYTES = 1.5 * 1024 * 1024 * 1024;

export const recordingDirectory = path.join(os.tmpdir(), 'moms_studio_recordings');

async function ensureRecordingDirectory() {
  await fs.mkdir(recordingDirectory, { recursive: true });
}

export async function cleanupExpiredRecordings() {
  await ensureRecordingDirectory();
  const entries = await fs.readdir(recordingDirectory, { withFileTypes: true });
  const cutoff = Date.now() - RECORDING_TTL_MS;

  await Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .map(async (entry) => {
        const filePath = path.join(recordingDirectory, entry.name);
        const stats = await fs.stat(filePath);
        if (stats.mtimeMs < cutoff) await fs.unlink(filePath).catch(() => undefined);
      }),
  );
}

export async function convertWebmToMp4(input: Buffer) {
  if (input.length === 0) throw new Error('Empty or invalid video buffer');
  if (input.length > MAX_INPUT_BYTES) throw new Error('Video exceeds the 1.5GB conversion limit');

  await ensureRecordingDirectory();
  const id = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const inputPath = path.join(recordingDirectory, `${id}_input.webm`);
  const outputPath = path.join(recordingDirectory, `${id}.mp4`);
  const filename = `MOMS_Studio_Recording_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.mp4`;

  await fs.writeFile(inputPath, input);
  try {
    await execFileAsync(
      'ffmpeg',
      [
        '-y',
        '-i',
        inputPath,
        '-c:v',
        'libx264',
        '-preset',
        'ultrafast',
        '-crf',
        '19',
        '-threads',
        '0',
        '-pix_fmt',
        'yuv420p',
        '-c:a',
        'aac',
        '-b:a',
        '256k',
        '-ar',
        '48000',
        '-movflags',
        '+faststart',
        outputPath,
      ],
      { maxBuffer: 16 * 1024 * 1024 },
    );
  } finally {
    await fs.unlink(inputPath).catch(() => undefined);
  }

  return { id, filename, outputPath };
}

export async function getRecordingFile(fileName: string) {
  const safeFileName = path.basename(fileName);
  if (safeFileName !== fileName || !safeFileName.endsWith('.mp4')) return null;
  const filePath = path.join(recordingDirectory, safeFileName);
  try {
    await fs.access(filePath);
    return filePath;
  } catch {
    return null;
  }
}

export async function getRecordingStream(fileName: string) {
  const filePath = await getRecordingFile(fileName);
  if (!filePath) return null;
  const stats = await fs.stat(filePath);
  const stream = (await import('node:fs')).createReadStream(filePath);
  return { stream, size: stats.size };
}

export const recordingLimits = {
  maxInputBytes: MAX_INPUT_BYTES,
  ttlMs: RECORDING_TTL_MS,
};
