import { MicConfig } from '../types';

/**
 * Draws the professional broadcast studio microphone with custom branded wrap on the canvas
 */
export function drawStudioMicrophone(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  config: MicConfig,
  audioLevel: number = 0
) {
  if (!config.visible) return;

  // Calculate position based on preset or custom coords
  let centerX = canvasWidth * 0.35; // Default host left
  let centerY = canvasHeight * 0.65;

  if (config.position === 'center') {
    centerX = canvasWidth * 0.5;
    centerY = canvasHeight * 0.7;
  } else if (config.position === 'guest_right') {
    centerX = canvasWidth * 0.65;
    centerY = canvasHeight * 0.65;
  } else if (config.position === 'custom') {
    centerX = (config.customX / 100) * canvasWidth;
    centerY = (config.customY / 100) * canvasHeight;
  }

  const baseScale = (canvasHeight / 1080) * config.scale;

  ctx.save();
  ctx.translate(centerX, centerY);

  // 1. Draw Tall Stand Pole down to the bottom
  const poleWidth = 14 * baseScale;
  const poleBottom = canvasHeight - centerY + 100;

  // Stand gradient (brushed dark metal)
  const standGrad = ctx.createLinearGradient(-poleWidth / 2, 0, poleWidth / 2, 0);
  standGrad.addColorStop(0, '#111827');
  standGrad.addColorStop(0.35, '#374151');
  standGrad.addColorStop(0.65, '#1f2937');
  standGrad.addColorStop(1, '#0f172a');

  ctx.fillStyle = standGrad;
  ctx.fillRect(-poleWidth / 2, 20 * baseScale, poleWidth, poleBottom);

  // Stand highlight line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1.5 * baseScale;
  ctx.beginPath();
  ctx.moveTo(-poleWidth * 0.15, 20 * baseScale);
  ctx.lineTo(-poleWidth * 0.15, poleBottom);
  ctx.stroke();

  // Stand Adjustment Collar / Nut
  const collarWidth = 22 * baseScale;
  const collarHeight = 18 * baseScale;
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(-collarWidth / 2, 35 * baseScale, collarWidth, collarHeight, 4 * baseScale);
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Lower MOMS logo badge on stand pole (like in reference image)
  if (config.showStandBadge) {
    const badgeY = 220 * baseScale;
    ctx.save();
    ctx.translate(0, badgeY);

    // MOMS 3D Badge on stand
    const badgeW = 75 * baseScale;
    const badgeH = 34 * baseScale;

    // Badge shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 10 * baseScale;
    ctx.shadowOffsetY = 4 * baseScale;

    // Badge pill base
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect(-badgeW / 2, -badgeH / 2, badgeW, badgeH, 12 * baseScale);
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = 'transparent';

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2 * baseScale;
    ctx.stroke();

    // MOMS text in bold playful bubble style
    ctx.font = `900 ${19 * baseScale}px 'Plus Jakarta Sans', 'Arial Black', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Blue extrusion
    ctx.fillStyle = '#0369a1';
    ctx.fillText('MOMS', 0, 2 * baseScale);
    // White top face
    ctx.fillStyle = '#ffffff';
    ctx.fillText('MOMS', 0, 0);

    ctx.restore();
  }

  // 2. Shockmount / Yoke Bracket
  const yokeRadius = 46 * baseScale;
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 6 * baseScale;
  ctx.beginPath();
  ctx.arc(0, 0, yokeRadius, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();

  // Yoke pivot knobs
  const knobGrad = ctx.createLinearGradient(-yokeRadius, 0, -yokeRadius + 12, 0);
  knobGrad.addColorStop(0, '#64748b');
  knobGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = knobGrad;
  ctx.fillRect(-yokeRadius - 5 * baseScale, -6 * baseScale, 8 * baseScale, 12 * baseScale);
  ctx.fillRect(yokeRadius - 3 * baseScale, -6 * baseScale, 8 * baseScale, 12 * baseScale);

  // 3. Microphone Body & Grille
  const micBodyWidth = 44 * baseScale;
  const micBodyHeight = 65 * baseScale;
  const micBodyY = -15 * baseScale;

  // Audio-reactive glow halo behind mic
  if (config.audioReactiveGlow && audioLevel > 0.05) {
    const glowRadius = (50 + audioLevel * 35) * baseScale;
    const glow = ctx.createRadialGradient(0, -35 * baseScale, 10 * baseScale, 0, -35 * baseScale, glowRadius);
    glow.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
    glow.addColorStop(0.6, 'rgba(14, 165, 233, 0.15)');
    glow.addColorStop(1, 'rgba(14, 165, 233, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -35 * baseScale, glowRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Metallic lower capsule body
  const micBodyGrad = ctx.createLinearGradient(-micBodyWidth / 2, 0, micBodyWidth / 2, 0);
  micBodyGrad.addColorStop(0, '#1e293b');
  micBodyGrad.addColorStop(0.3, '#64748b');
  micBodyGrad.addColorStop(0.5, '#cbd5e1');
  micBodyGrad.addColorStop(0.7, '#475569');
  micBodyGrad.addColorStop(1, '#0f172a');

  ctx.fillStyle = micBodyGrad;
  ctx.beginPath();
  ctx.roundRect(-micBodyWidth / 2, micBodyY, micBodyWidth, micBodyHeight, [8 * baseScale, 8 * baseScale, 14 * baseScale, 14 * baseScale]);
  ctx.fill();
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5 * baseScale;
  ctx.stroke();

  // Mesh upper capsule
  const domeRadius = 23 * baseScale;
  const domeCenterY = -35 * baseScale;

  // Grille background
  const grilleGrad = ctx.createLinearGradient(-domeRadius, 0, domeRadius, 0);
  grilleGrad.addColorStop(0, '#1e293b');
  grilleGrad.addColorStop(0.4, '#475569');
  grilleGrad.addColorStop(0.7, '#334155');
  grilleGrad.addColorStop(1, '#0f172a');

  ctx.fillStyle = grilleGrad;
  ctx.beginPath();
  ctx.arc(0, domeCenterY, domeRadius, Math.PI, 0);
  ctx.lineTo(domeRadius, micBodyY);
  ctx.lineTo(-domeRadius, micBodyY);
  ctx.closePath();
  ctx.fill();

  // Mesh fine grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  for (let gy = domeCenterY - domeRadius; gy <= micBodyY; gy += 4 * baseScale) {
    ctx.beginPath();
    ctx.moveTo(-domeRadius * 0.85, gy);
    ctx.lineTo(domeRadius * 0.85, gy);
    ctx.stroke();
  }

  // Ring around capsule collar
  ctx.fillStyle = '#0284c7'; // MOMS royal blue ring
  ctx.fillRect(-micBodyWidth / 2, micBodyY - 2 * baseScale, micBodyWidth, 4 * baseScale);

  // 4. THE MICROPHONE WRAP / MIC FLAG (The key requested feature!)
  // Sits over the microphone foam windscreen / upper body
  const wrapW = 54 * baseScale;
  const wrapH = 46 * baseScale;
  const wrapY = -62 * baseScale;

  // Determine Wrap Colors based on config
  let wrapBaseColor = '#0f172a'; // Carbon black default
  let wrapAccentColor = '#38bdf8';
  let wrapBorderColor = '#334155';

  if (config.wrapColor === 'royal_blue') {
    wrapBaseColor = '#0284c7';
    wrapAccentColor = '#ffffff';
    wrapBorderColor = '#38bdf8';
  } else if (config.wrapColor === 'carbon') {
    wrapBaseColor = '#18181b';
    wrapAccentColor = '#e4e4e7';
    wrapBorderColor = '#3f3f46';
  } else if (config.wrapColor === 'gold') {
    wrapBaseColor = '#d97706';
    wrapAccentColor = '#fef3c7';
    wrapBorderColor = '#f59e0b';
  } else if (config.wrapColor === 'white') {
    wrapBaseColor = '#f8fafc';
    wrapAccentColor = '#0284c7';
    wrapBorderColor = '#cbd5e1';
  }

  // Wrap Drop Shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 12 * baseScale;
  ctx.shadowOffsetY = 4 * baseScale;

  // Wrap Foam Cylinder Body
  const wrapGrad = ctx.createLinearGradient(-wrapW / 2, 0, wrapW / 2, 0);
  if (config.wrapColor === 'royal_blue') {
    wrapGrad.addColorStop(0, '#0369a1');
    wrapGrad.addColorStop(0.3, '#0284c7');
    wrapGrad.addColorStop(0.5, '#38bdf8');
    wrapGrad.addColorStop(0.8, '#0284c7');
    wrapGrad.addColorStop(1, '#075985');
  } else if (config.wrapColor === 'gold') {
    wrapGrad.addColorStop(0, '#b45309');
    wrapGrad.addColorStop(0.4, '#f59e0b');
    wrapGrad.addColorStop(0.6, '#fbbf24');
    wrapGrad.addColorStop(1, '#92400e');
  } else {
    wrapGrad.addColorStop(0, '#09090b');
    wrapGrad.addColorStop(0.35, '#27272a');
    wrapGrad.addColorStop(0.5, '#3f3f46');
    wrapGrad.addColorStop(0.7, '#27272a');
    wrapGrad.addColorStop(1, '#09090b');
  }

  ctx.fillStyle = wrapGrad;
  ctx.beginPath();
  ctx.roundRect(-wrapW / 2, wrapY, wrapW, wrapH, 10 * baseScale);
  ctx.fill();

  // Reset Shadow
  ctx.shadowColor = 'transparent';

  // Wrap edge borders
  ctx.strokeStyle = wrapBorderColor;
  ctx.lineWidth = 1.5 * baseScale;
  ctx.stroke();

  // Top & Bottom highlight trims on the wrap
  ctx.fillStyle = config.wrapColor === 'white' ? '#0284c7' : '#38bdf8';
  ctx.fillRect(-wrapW * 0.45, wrapY + 2 * baseScale, wrapW * 0.9, 2 * baseScale);
  ctx.fillRect(-wrapW * 0.45, wrapY + wrapH - 4 * baseScale, wrapW * 0.9, 2 * baseScale);

  // 5. BRANDING ON THE MIC WRAP
  const wrapCenterY = wrapY + wrapH / 2;

  if (config.wrapStyle === 'moms_3d') {
    // MOMS 3D Text Logo on the wrap
    ctx.font = `900 ${15 * baseScale}px 'Plus Jakarta Sans', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 3D Shadow/Bevel
    ctx.fillStyle = '#0369a1';
    ctx.fillText('MOMS', 0, wrapCenterY + 1.5 * baseScale);
    // Face
    ctx.fillStyle = '#ffffff';
    ctx.fillText('MOMS', 0, wrapCenterY);

    // Micro subtitle
    ctx.font = `700 ${5 * baseScale}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillStyle = '#93c5fd';
    ctx.fillText('MOBILE OIL', 0, wrapCenterY + 10 * baseScale);
  } else if (config.wrapStyle === 'diamond_tech') {
    // Diamond Tech Icon from the uploaded reference photo: [ < > ]
    ctx.save();
    ctx.translate(0, wrapCenterY);

    // Outer diamond ring
    const dSize = 14 * baseScale;
    ctx.strokeStyle = wrapAccentColor;
    ctx.lineWidth = 2 * baseScale;
    ctx.beginPath();
    ctx.moveTo(0, -dSize);
    ctx.lineTo(dSize, 0);
    ctx.lineTo(0, dSize);
    ctx.lineTo(-dSize, 0);
    ctx.closePath();
    ctx.stroke();

    // Inner `< >` or modern chevron
    ctx.fillStyle = '#ffffff';
    ctx.font = `800 ${11 * baseScale}px 'Space Grotesk', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('‹ ›', 0, 0);
    ctx.restore();
  } else if (config.wrapStyle === 'moms_text') {
    // Elegant MOMS OIL text
    ctx.font = `800 ${12 * baseScale}px 'Plus Jakarta Sans', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText("MOM'S", 0, wrapCenterY - 4 * baseScale);

    ctx.font = `700 ${6 * baseScale}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillStyle = '#f59e0b'; // Gold accent
    ctx.fillText('OIL CHANGE', 0, wrapCenterY + 7 * baseScale);
  } else if (config.wrapStyle === 'custom_text') {
    // Custom user text
    const text = config.customText || 'STUDIO';
    const fontSize = Math.min(13, Math.max(7, Math.floor(65 / Math.max(text.length, 4)))) * baseScale;
    ctx.font = `800 ${fontSize}px 'Plus Jakarta Sans', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = wrapAccentColor;
    ctx.fillText(text.toUpperCase(), 0, wrapCenterY);
  } else if (config.wrapStyle === 'custom_image' && config.customLogoUrl) {
    // Custom uploaded image logo on wrap (handled if preloaded)
    ctx.font = `700 ${8 * baseScale}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('BRAND', 0, wrapCenterY);
  }

  // Audio status indicator dot on bottom of wrap
  if (config.audioReactiveGlow) {
    ctx.beginPath();
    ctx.arc(0, wrapY + wrapH + 3 * baseScale, 2.5 * baseScale, 0, Math.PI * 2);
    ctx.fillStyle = audioLevel > 0.08 ? '#22c55e' : '#64748b';
    ctx.fill();
  }

  ctx.restore();
}
