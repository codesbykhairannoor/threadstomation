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

// Beautiful Islamic/Aesthetic Color Palettes (Matched with IG)
const palettes = [
  { bg1: '#0f2027', bg2: '#203a43', bg3: '#2c5364', accent: '#d4af37' }, // Deep Teal & Gold
  { bg1: '#141e30', bg2: '#243b55', bg3: '#3b5998', accent: '#f7971e' }, // Midnight Navy
  { bg1: '#2b1008', bg2: '#1c0a05', bg3: '#0a0301', accent: '#ff6b6b' }, // Dark Hellfire / Kiamat
  { bg1: '#000000', bg2: '#0f0f0f', bg3: '#1a1a1a', accent: '#e6d070' }, // Dark Minimalist
  { bg1: '#0a2342', bg2: '#175676', bg3: '#4ba3c3', accent: '#ffffff' }, // Calm Heaven / Surga
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
function buildSlideSvg(slideIndex, totalSlides, title, body, themeIndex) {
  const TITLE_Y = 550; // Shifted down for TikTok Safe Zone
  
  const titleLines = wrapText((title || '').toUpperCase(), 20);
  const bodyLines = wrapText(body || '', 35);

  const titleSvg = titleLines.map((line, i) => 
    `<text x="540" y="${TITLE_Y + i * 85}" font-family="system-ui, -apple-system, sans-serif" font-size="70" fill="white" font-weight="900" text-anchor="middle" letter-spacing="1">${escapeXml(line)}</text>`
  ).join('');

  const BODY_Y = TITLE_Y + titleLines.length * 85 + 70;

  const bodySvg = bodyLines.map((line, i) => 
    `<text x="540" y="${BODY_Y + i * 60}" font-family="Georgia, 'Times New Roman', serif" font-size="46" fill="white" font-weight="normal" text-anchor="middle" opacity="0.95">${escapeXml(line)}</text>`
  ).join('');

  const dotSpacing = 30;
  const totalDotWidth = (totalSlides - 1) * dotSpacing;
  const dotStartX = 540 - totalDotWidth / 2;
  const dotsSvg = Array.from({ length: totalSlides }, (_, i) => {
    const cx = dotStartX + i * dotSpacing;
    const isActive = i === slideIndex;
    return `<circle cx="${cx}" cy="1450" r="${isActive ? 8 : 4}" fill="${isActive ? 'white' : 'rgba(255,255,255,0.4)'}"/>`;
  }).join('');

  const palette = palettes[themeIndex % palettes.length];

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.5" y2="1">
      <stop offset="0%" stop-color="${palette.bg1}"/>
      <stop offset="50%" stop-color="${palette.bg2}"/>
      <stop offset="100%" stop-color="${palette.bg3}"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="15" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- Subtle Islamic Geometric Grid (Optional Pattern) -->
  <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <path d="M 100 0 L 0 0 0 100" fill="none" stroke="${palette.accent}" stroke-width="1.5" opacity="0.05"/>
  </pattern>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>

  <!-- Dark overlay for readability -->
  <rect width="${W}" height="${H}" fill="black" opacity="0.2"/>

  <!-- Top glow circle -->
  <circle cx="540" cy="${TITLE_Y}" r="350" fill="${palette.accent}" opacity="0.15" filter="url(#glow)"/>

  <!-- Slide number indicator -->
  <text x="60" y="100" font-family="system-ui, -apple-system, sans-serif" font-size="32" fill="rgba(255,255,255,0.6)" font-weight="600">
    ${slideIndex + 1}/${totalSlides}
  </text>

  <!-- Brand mark top-right -->
  <text x="1020" y="100" font-family="system-ui, -apple-system, sans-serif" font-size="40" fill="${palette.accent}" font-weight="700" text-anchor="end" opacity="0.9">
    ✦
  </text>

  <!-- Content -->
  <rect x="340" y="${TITLE_Y - 70}" width="400" height="4" rx="2" fill="${palette.accent}" opacity="0.8"/>
  ${titleSvg}
  <circle cx="540" cy="${BODY_Y - 45}" r="6" fill="${palette.accent}" opacity="0.8"/>
  ${bodySvg}
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
  console.log(`[TikTok-Carousel] Generating ${total} slides in parallel using Elegant SVG...`);

  const themeIndex = Math.floor(Math.random() * palettes.length);

  const promises = slides.map(async (slide, i) => {
    console.log(`[TikTok-Carousel] Starting slide ${i + 1}/${total}...`);
    
    const svgStr = buildSlideSvg(i, total, slide.title, slide.body, themeIndex);
    const jpegBuf = await svgToJpeg(svgStr);

    const fileName = `tiktok/${Date.now()}-${Math.floor(Math.random()*1000)}-slide-${i + 1}.jpg`;
    const url = await uploadToSupabase(jpegBuf, fileName);
    console.log(`[TikTok-Carousel] Slide ${i + 1} uploaded: ${url}`);
    return url;
  });

  return await Promise.all(promises);
}
