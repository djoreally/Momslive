/**
 * Studio Audio Engine & Video Export Helpers
 * Broadcast audio processing chain: Pre-amp, High-pass filter, Voice presence EQ,
 * Dynamics Compressor, and sample-accurate MediaStream Destination.
 */

import fixWebmDuration from 'fix-webm-duration';
import { AudioConfig, RecordingFormat } from '../types';

export class StudioAudioEngine {
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private highpassFilter: BiquadFilterNode | null = null;
  private presenceFilter: BiquadFilterNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private destinationNode: MediaStreamAudioDestinationNode | null = null;
  private monitorGainNode: GainNode | null = null;

  private dataArray: Uint8Array | null = null;
  private animationFrameId: number | null = null;
  private onLevelCallback: ((level: number, peak: number) => void) | null = null;

  private config: AudioConfig = {
    micGain: 1.35,
    vocalEnhance: true,
    highpassFilter: true,
    compressor: true,
    echoCancellation: true,
    monitorAudio: false,
  };

  /**
   * Initializes the Studio Audio Engine graph with the incoming mic stream
   */
  start(stream: MediaStream, config: AudioConfig, onLevel: (level: number, peak: number) => void) {
    try {
      this.stop();
      this.config = { ...config };
      this.onLevelCallback = onLevel;

      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      // 48000 Hz is standard studio broadcast sample rate
      this.audioCtx = new AudioContextClass({ latencyHint: 'interactive', sampleRate: 48000 });

      // 1. Microphone Source Node
      this.sourceNode = this.audioCtx.createMediaStreamSource(stream);

      // 2. Studio Pre-amp / Gain Node (Boosts mic volume cleanly)
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.setValueAtTime(this.config.micGain, this.audioCtx.currentTime);

      // 3. High-Pass Filter at 80Hz (cuts desk bumps, breathing pops, AC rumble)
      this.highpassFilter = this.audioCtx.createBiquadFilter();
      this.highpassFilter.type = 'highpass';
      this.highpassFilter.frequency.setValueAtTime(
        this.config.highpassFilter ? 80 : 20,
        this.audioCtx.currentTime
      );
      this.highpassFilter.Q.setValueAtTime(0.7, this.audioCtx.currentTime);

      // 4. Voice Presence EQ Filter (Peaking at 3200Hz, +2.5dB, for radio/podcast vocal clarity)
      this.presenceFilter = this.audioCtx.createBiquadFilter();
      this.presenceFilter.type = 'peaking';
      this.presenceFilter.frequency.setValueAtTime(3200, this.audioCtx.currentTime);
      this.presenceFilter.Q.setValueAtTime(1.1, this.audioCtx.currentTime);
      this.presenceFilter.gain.setValueAtTime(
        this.config.vocalEnhance ? 2.5 : 0,
        this.audioCtx.currentTime
      );

      // 5. Studio Dynamics Compressor (prevents vocal clipping and levels out soft/loud speech)
      this.compressor = this.audioCtx.createDynamicsCompressor();
      if (this.config.compressor) {
        this.compressor.threshold.setValueAtTime(-22, this.audioCtx.currentTime);
        this.compressor.knee.setValueAtTime(10, this.audioCtx.currentTime);
        this.compressor.ratio.setValueAtTime(3.5, this.audioCtx.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.audioCtx.currentTime);
        this.compressor.release.setValueAtTime(0.22, this.audioCtx.currentTime);
      } else {
        this.compressor.threshold.setValueAtTime(0, this.audioCtx.currentTime);
        this.compressor.ratio.setValueAtTime(1, this.audioCtx.currentTime);
      }

      // 6. Analyser Node for precise VU meter & clipping detection
      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.75;
      const bufferLength = this.analyserNode.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      // 7. MediaStream Destination Node for MediaRecorder mixing
      this.destinationNode = this.audioCtx.createMediaStreamDestination();

      // 8. Headphone monitoring node (optional feedback to user's speakers/headphones)
      this.monitorGainNode = this.audioCtx.createGain();
      this.monitorGainNode.gain.setValueAtTime(
        this.config.monitorAudio ? 0.7 : 0,
        this.audioCtx.currentTime
      );
      this.monitorGainNode.connect(this.audioCtx.destination);

      // Connect the graph in series:
      // Source -> Gain -> Highpass -> Presence EQ -> Compressor -> Analyser -> Destination & Monitor
      this.sourceNode.connect(this.gainNode);
      this.gainNode.connect(this.highpassFilter);
      this.highpassFilter.connect(this.presenceFilter);
      this.presenceFilter.connect(this.compressor);
      this.compressor.connect(this.analyserNode);
      this.analyserNode.connect(this.destinationNode);
      this.analyserNode.connect(this.monitorGainNode);

      // Start volume and peak analysis loop
      const checkVolume = () => {
        if (!this.analyserNode || !this.dataArray || !this.onLevelCallback) return;
        this.analyserNode.getByteFrequencyData(this.dataArray);

        let sum = 0;
        let peak = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
          const val = this.dataArray[i];
          sum += val;
          if (val > peak) peak = val;
        }

        const average = sum / this.dataArray.length;
        const normalized = Math.min(1, average / 128);
        const normalizedPeak = Math.min(1, peak / 255);

        this.onLevelCallback(normalized, normalizedPeak);
        this.animationFrameId = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (err) {
      console.warn('StudioAudioEngine start error:', err);
    }
  }

  updateConfig(config: Partial<AudioConfig>) {
    this.config = { ...this.config, ...config };
    if (!this.audioCtx) return;

    if (config.micGain !== undefined && this.gainNode) {
      this.gainNode.gain.setTargetAtTime(config.micGain, this.audioCtx.currentTime, 0.05);
    }

    if (config.highpassFilter !== undefined && this.highpassFilter) {
      this.highpassFilter.frequency.setTargetAtTime(
        config.highpassFilter ? 80 : 20,
        this.audioCtx.currentTime,
        0.05
      );
    }

    if (config.vocalEnhance !== undefined && this.presenceFilter) {
      this.presenceFilter.gain.setTargetAtTime(
        config.vocalEnhance ? 2.5 : 0,
        this.audioCtx.currentTime,
        0.05
      );
    }

    if (config.compressor !== undefined && this.compressor) {
      if (config.compressor) {
        this.compressor.threshold.setTargetAtTime(-22, this.audioCtx.currentTime, 0.05);
        this.compressor.ratio.setTargetAtTime(3.5, this.audioCtx.currentTime, 0.05);
      } else {
        this.compressor.threshold.setTargetAtTime(0, this.audioCtx.currentTime, 0.05);
        this.compressor.ratio.setTargetAtTime(1, this.audioCtx.currentTime, 0.05);
      }
    }

    if (config.monitorAudio !== undefined && this.monitorGainNode) {
      this.monitorGainNode.gain.setTargetAtTime(
        config.monitorAudio ? 0.7 : 0,
        this.audioCtx.currentTime,
        0.05
      );
    }
  }

  /**
   * Returns the processed studio-grade audio track to mix into the video recorder
   */
  getProcessedAudioTrack(): MediaStreamTrack | null {
    if (!this.destinationNode) return null;
    const tracks = this.destinationNode.stream.getAudioTracks();
    return tracks.length > 0 ? tracks[0] : null;
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
  }
}

/**
 * Backwards-compatible AudioMonitor alias
 */
export class AudioMonitor extends StudioAudioEngine {}

/**
 * Plays an audible countdown tone (short high beep)
 */
export function playCountdownBeep(frequency: number = 880, duration: number = 0.1) {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Ignore audio autoplay restrictions
  }
}

/**
 * Detects supported MediaRecorder formats in current browser
 */
export function getSupportedMimeTypes(): { mp4: string | null; webm: string | null } {
  if (typeof MediaRecorder === 'undefined') {
    return { mp4: null, webm: null };
  }

  const mp4Candidates = [
    'video/mp4;codecs=avc1,mp4a.40.2',
    'video/mp4;codecs=avc1',
    'video/mp4;codecs=h264,aac',
    'video/mp4;codecs=h264',
    'video/mp4',
  ];

  const webmCandidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];

  const mp4 = mp4Candidates.find((mime) => MediaRecorder.isTypeSupported(mime)) || null;
  const webm = webmCandidates.find((mime) => MediaRecorder.isTypeSupported(mime)) || null;

  return { mp4, webm };
}

/**
 * Appends duration metadata to WebM recordings so they can seek properly
 */
export function fixWebmBlobDuration(blob: Blob, durationMs: number): Promise<Blob> {
  return new Promise((resolve) => {
    try {
      fixWebmDuration(
        blob,
        durationMs,
        (fixedBlob: Blob) => {
          resolve(fixedBlob);
        },
        { logger: false }
      );
    } catch (err) {
      console.warn('fixWebmDuration fallback to original blob:', err);
      resolve(blob);
    }
  });
}

/**
 * Converts recorded WebM/Video to broadcast standard MP4 via server FFmpeg
 */
export async function convertVideoToMp4(
  videoBlob: Blob,
  onProgress?: (status: string) => void
): Promise<{ mp4Blob: Blob; downloadUrl: string; filename: string }> {
  onProgress?.('Uploading to studio converter...');
  const arrayBuffer = await videoBlob.arrayBuffer();

  onProgress?.('Encoding H.264 video with 48kHz AAC studio sound...');
  const response = await fetch('/api/convert-to-mp4?mode=json', {
    method: 'POST',
    headers: {
      'Content-Type': 'video/webm',
    },
    body: arrayBuffer,
  });

  if (!response.ok) {
    throw new Error(`Server conversion error: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'MP4 encoding failed');
  }

  onProgress?.('Finalizing MP4 file...');
  const blobRes = await fetch(data.downloadUrl);
  const mp4Blob = await blobRes.blob();

  return {
    mp4Blob,
    downloadUrl: data.downloadUrl,
    filename: data.filename,
  };
}

/**
 * Universal safe file download trigger that works reliably in all browsers & iframes
 */
export function triggerFileDownload(blobOrUrl: Blob | string, filename: string): boolean {
  try {
    const url = typeof blobOrUrl === 'string' ? blobOrUrl : URL.createObjectURL(blobOrUrl);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);

    // Dispatch mouse event to satisfy user-gesture security policies
    const clickEvt = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    a.dispatchEvent(clickEvt);

    setTimeout(() => {
      try {
        if (a.parentNode) {
          document.body.removeChild(a);
        }
      } catch {
        // ignore
      }
      if (typeof blobOrUrl !== 'string') {
        setTimeout(() => URL.revokeObjectURL(url), 30000);
      }
    }, 1000);

    return true;
  } catch (err) {
    console.error('File download trigger error:', err);
    return false;
  }
}
