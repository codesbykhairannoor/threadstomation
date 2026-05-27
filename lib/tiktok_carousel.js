import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ override: true });

const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

// TikTok recommended: 9:16 portrait — 1080 x 1920
const W = 1080;
const H = 1920;

// Curated dark gradient palettes per slide index
const PALETTES = [
  // Slide 1 (Hook) — deep electric blue
  { bg1: '#0f0c29', bg2: '#302b63', bg3: '#24243e', accent: '#00f2fe', accent2: '#4facfe' },
  // Slide 2 — deep purple to pink
  { bg1: '#1a0533', bg2: '#3b1f5e', bg3: '#1a0533', accent: '#f953c6', accent2: '#b91d73' },
  // Slide 3 — dark teal
  { bg1: '#0f2027', bg2: '#203a43', bg3: '#2c5364', accent: '#11998e', accent2: '#38ef7d' },
  // Slide 4 — dark orange
  { bg1: '#1a0a00', bg2: '#3d1a00', bg3: '#1a0a00', accent: '#f7971e', accent2: '#ffd200' },
  // Slide 5 (CTA) — dark indigo with gold
  { bg1: '#0d0d0d', bg2: '#1a1a2e', bg3: '#16213e', accent: '#e2b96f', accent2: '#f0d060' },
];

/**
 * Wrap text into lines that fit within maxWidth characters
 */
function wrapText(text, maxCharsPerLine) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxCharsPerLine) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = (current + ' ' + word).trim();
    }
  }
  if (current) lines.push(current.trim());
  return lines;
}

/**
 * Escape XML special chars for SVG
 */
function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate SVG for a single slide
 */
function buildSlideSvg(slideIndex, totalSlides, title, body, palette) {
  const { bg1, bg2, bg3, accent, accent2 } = palette;

  // Wrap text
  const titleLines = wrapText(title.toUpperCase(), 22);
  const bodyLines = wrapText(body, 30);

  // Title block starts at y=680
  const TITLE_Y = 680;
  const TITLE_LINE_H = 95;
  const BODY_Y = TITLE_Y + titleLines.length * TITLE_LINE_H + 60;
  const BODY_LINE_H = 65;

  const titleSvg = titleLines.map((line, i) => `
    <text
      x="540" y="${TITLE_Y + i * TITLE_LINE_H}"
      font-family="Arial Black, Impact, sans-serif"
      font-size="82" font-weight="900"
      fill="white"
      text-anchor="middle"
      dominant-baseline="auto"
    >${escapeXml(line)}</text>
  `).join('');

  const bodySvg = bodyLines.map((line, i) => `
    <text
      x="540" y="${BODY_Y + i * BODY_LINE_H}"
      font-family="Arial, Helvetica, sans-serif"
      font-size="52" font-weight="400"
      fill="rgba(255,255,255,0.85)"
      text-anchor="middle"
      dominant-baseline="auto"
    >${escapeXml(line)}</text>
  `).join('');

  // Progress dots
  const dotSpacing = 28;
  const totalDotWidth = totalSlides * dotSpacing;
  const dotStartX = 540 - totalDotWidth / 2;
  const dotsSvg = Array.from({ length: totalSlides }, (_, i) => {
    const cx = dotStartX + i * dotSpacing + 8;
    const isActive = i === slideIndex;
    return `<circle cx="${cx}" cy="1820" r="${isActive ? 10 : 6}" fill="${isActive ? accent : 'rgba(255,255,255,0.3)'}"/>`;
  }).join('');

  // Accent line under title
  const accentLineY = TITLE_Y - 30;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.5" y2="1">
      <stop offset="0%" stop-color="${bg1}"/>
      <stop offset="50%" stop-color="${bg2}"/>
      <stop offset="100%" stop-color="${bg3}"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="${accent2}"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- Subtle grid pattern -->
  <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
    <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
  </pattern>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>

  <!-- Top glow circle -->
  <circle cx="540" cy="320" r="280" fill="${accent}" opacity="0.07" filter="url(#glow)"/>

  <!-- Slide number indicator -->
  <text x="60" y="100" font-family="Arial, sans-serif" font-size="36" fill="rgba(255,255,255,0.3)" font-weight="600">
    ${slideIndex + 1}/${totalSlides}
  </text>

  <!-- Brand mark top-right -->
  <text x="1020" y="100" font-family="Arial, sans-serif" font-size="36" fill="${accent}" font-weight="700" text-anchor="end" opacity="0.8">
    ✦
  </text>

  <!-- Accent line -->
  <rect x="340" y="${accentLineY - 10}" width="400" height="6" rx="3" fill="url(#accent)" opacity="0.9"/>

  <!-- Title -->
  ${titleSvg}

  <!-- Separator dot -->
  <circle cx="540" cy="${BODY_Y - 35}" r="5" fill="${accent}" opacity="0.7"/>

  <!-- Body text -->
  ${bodySvg}

  <!-- Bottom accent bar -->
  <rect x="0" y="${H - 8}" width="${W}" height="8" fill="url(#accent)"/>

  <!-- Progress dots -->
  ${dotsSvg}
</svg>`;
}

/**
 * Convert SVG buffer → JPEG buffer via sharp
 */
async function svgToJpeg(svgString) {
  const svgBuffer = Buffer.from(svgString, 'utf-8');
  return sharp(svgBuffer)
    .resize(W, H)
    .jpeg({ quality: 90 })
    .toBuffer();
}

/**
 * Upload JPEG buffer to Supabase Storage → return public URL
 */
async function uploadToSupabase(jpegBuffer, fileName) {
  if (!supabase) throw new Error('Supabase client not initialized. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');

  const { error } = await supabase.storage
    .from('media')
    .upload(fileName, jpegBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  const { data } = supabase.storage.from('media').getPublicUrl(fileName);
  return data.publicUrl;
}

/**
 * Main export: generate slide images for a carousel
 * @param {Array} slides - [{title, body}]
 * @returns {Promise<string[]>} - array of public JPEG URLs
 */
export async function generateSlideImages(slides) {
  const total = slides.length;
  const urls = [];

  for (let i = 0; i < total; i++) {
    const slide = slides[i];
    const palette = PALETTES[i % PALETTES.length];
    const svgStr = buildSlideSvg(i, total, slide.title, slide.body, palette);

    console.log(`[TikTok-Carousel] Generating slide ${i + 1}/${total}...`);
    const jpegBuf = await svgToJpeg(svgStr);

    const fileName = `tiktok/${Date.now()}-slide-${i + 1}.jpg`;
    const url = await uploadToSupabase(jpegBuf, fileName);
    urls.push(url);
    console.log(`[TikTok-Carousel] Slide ${i + 1} uploaded: ${url}`);
  }

  return urls;
}
