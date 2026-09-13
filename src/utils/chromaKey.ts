import { ChromaKeyConfig } from '../types';

/**
 * Process a camera video frame into a segmented frame with transparent background.
 * Uses optimized TypedArray operations for smooth 60fps performance.
 */
export function applyWhiteScreenKey(
  sourceCtx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: ChromaKeyConfig,
  referenceBackgroundData: ImageData | null = null
): ImageData {
  const frame = sourceCtx.getImageData(0, 0, width, height);
  const data = frame.data;
  const len = data.length;

  const targetLuminance = config.luminanceThreshold * 255;
  const tolerance = config.tolerance * 255;
  const softness = Math.max(config.softness * 255, 1);
  const sampleR = config.sampledColor.r;
  const sampleG = config.sampledColor.g;
  const sampleB = config.sampledColor.b;

  const isColorSampleMode = config.mode === 'color_sample';
  const isDiffMode = config.mode === 'difference_matte' && referenceBackgroundData !== null;
  const refData = referenceBackgroundData?.data;

  for (let i = 0; i < len; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    let alpha = 255;

    if (isDiffMode && refData) {
      // Compare current pixel against reference empty wall pixel
      const dr = Math.abs(r - refData[i]);
      const dg = Math.abs(g - refData[i + 1]);
      const db = Math.abs(b - refData[i + 2]);
      const diff = (dr + dg + db) / 3;

      if (diff < tolerance) {
        alpha = 0;
      } else if (diff < tolerance + softness) {
        alpha = Math.floor(((diff - tolerance) / softness) * 255);
      } else {
        alpha = 255;
      }
    } else if (isColorSampleMode) {
      // Color distance from sampled wall color
      const dr = r - sampleR;
      const dg = g - sampleG;
      const db = b - sampleB;
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);

      if (dist < tolerance) {
        alpha = 0;
      } else if (dist < tolerance + softness) {
        alpha = Math.floor(((dist - tolerance) / softness) * 255);
      } else {
        alpha = 255;
      }
    } else {
      // Luminance & Saturation White Screen Keying
      // White walls have high luminance and low saturation
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const saturation = maxC === 0 ? 0 : (maxC - minC) / maxC;

      // Distance from pure white or high luminance threshold
      const lumDistance = targetLuminance - lum;

      // If luminance is above threshold and saturation is low (white/off-white)
      if (lum >= targetLuminance && saturation < 0.25) {
        // Definitely wall
        alpha = 0;
      } else if (lum >= targetLuminance - softness && saturation < 0.35) {
        // Soft edge transition
        const factor = (targetLuminance - lum) / softness;
        alpha = Math.floor(Math.max(0, Math.min(1, factor)) * 255);
      } else {
        alpha = 255;
      }
    }

    // Spill suppression: slightly reduce extreme brightness on semi-transparent edges to avoid white halos
    if (alpha > 0 && alpha < 255 && config.spillSuppression > 0) {
      const suppression = (1 - alpha / 255) * config.spillSuppression;
      data[i] = Math.max(0, Math.floor(r * (1 - suppression * 0.4)));
      data[i + 1] = Math.max(0, Math.floor(g * (1 - suppression * 0.4)));
      data[i + 2] = Math.max(0, Math.floor(b * (1 - suppression * 0.4)));
    }

    if (config.showMatteOnly) {
      // Render matte view for calibration (white = person, black = transparent)
      data[i] = alpha;
      data[i + 1] = alpha;
      data[i + 2] = alpha;
      data[i + 3] = 255;
    } else {
      data[i + 3] = alpha;
    }
  }

  return frame;
}

/**
 * Samples average color from a region on canvas (for clicking on wall to sample)
 */
export function sampleWallColor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number = 6
): { r: number; g: number; b: number; luminance: number; saturation: number } {
  const startX = Math.max(0, Math.floor(x - radius));
  const startY = Math.max(0, Math.floor(y - radius));
  const width = Math.min(ctx.canvas.width - startX, radius * 2 + 1);
  const height = Math.min(ctx.canvas.height - startY, radius * 2 + 1);

  const imgData = ctx.getImageData(startX, startY, width, height);
  const data = imgData.data;

  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  const count = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    totalR += data[i];
    totalG += data[i + 1];
    totalB += data[i + 2];
  }

  const r = Math.round(totalR / count);
  const g = Math.round(totalG / count);
  const b = Math.round(totalB / count);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const maxC = Math.max(r, g, b);
  const minC = Math.min(r, g, b);
  const saturation = maxC === 0 ? 0 : (maxC - minC) / maxC;

  return { r, g, b, luminance, saturation };
}
