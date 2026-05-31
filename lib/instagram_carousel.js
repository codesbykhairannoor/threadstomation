import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config({ override: true });

const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

// Instagram recommended: 4:5 portrait - 1080 x 1350
const W = 1080;
const H = 1350;

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
 * Generate safe SVG overlay (No external fonts to prevent Vercel fontconfig crashes)
 */
function buildOverlaySvg(slideIndex, totalSlides, title, body) {
  const titleLines = wrapText(title.toUpperCase(), 22);
  const bodyLines = wrapText(body, 30);

  const TITLE_Y = 460;
  const TITLE_LINE_H = 95;
  const BODY_Y = TITLE_Y + titleLines.length * TITLE_LINE_H + 60;
  const BODY_LINE_H = 65;

  const titleSvg = titleLines.map((line, i) => `
    <text
      x="540" y="${TITLE_Y + i * TITLE_LINE_H}"
      font-family="Arial, sans-serif"
      font-size="70" font-weight="bold"
      fill="white"
      text-anchor="middle"
    >${escapeXml(line)}</text>
  `).join('');

  const bodySvg = bodyLines.map((line, i) => `
    <text
      x="540" y="${BODY_Y + i * BODY_LINE_H}"
      font-family="Arial, sans-serif"
      font-size="45" font-weight="normal"
      fill="rgba(255,255,255,0.9)"
      text-anchor="middle"
    >${escapeXml(line)}</text>
  `).join('');

  const dotSpacing = 35;
  const totalDotWidth = totalSlides * dotSpacing;
  const dotStartX = 540 - totalDotWidth / 2;
  const dotsSvg = Array.from({ length: totalSlides }, (_, i) => {
    const cx = dotStartX + i * dotSpacing + 8;
    const isActive = i === slideIndex;
    return `<circle cx="${cx}" cy="1260" r="${isActive ? 10 : 6}" fill="${isActive ? '#ffffff' : 'rgba(255,255,255,0.4)'}"/>`;
  }).join('');

  // We use a dark semi-transparent overlay over the entire image so white text is always readable
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="black" opacity="0.5"/>
  
  <text x="60" y="100" font-family="Arial, sans-serif" font-size="36" fill="rgba(255,255,255,0.7)" font-weight="bold">
    ${slideIndex + 1}/${totalSlides}
  </text>
  <text x="1020" y="100" font-family="Arial, sans-serif" font-size="36" fill="white" font-weight="bold" text-anchor="end">
    ✦
  </text>

  <rect x="340" y="${TITLE_Y - 40}" width="400" height="6" rx="3" fill="white" opacity="0.8"/>
  ${titleSvg}
  <circle cx="540" cy="${BODY_Y - 35}" r="5" fill="white" opacity="0.7"/>
  ${bodySvg}
  ${dotsSvg}
</svg>`;
}

// Beautiful Islamic/Aesthetic Color Palettes
const palettes = [
  { bg1: '#0f2027', bg2: '#203a43', bg3: '#2c5364', accent: '#d4af37' }, // Deep Teal & Gold
  { bg1: '#141e30', bg2: '#243b55', bg3: '#3b5998', accent: '#f7971e' }, // Midnight Navy
  { bg1: '#2b1008', bg2: '#1c0a05', bg3: '#0a0301', accent: '#ff6b6b' }, // Dark Hellfire / Kiamat
  { bg1: '#000000', bg2: '#0f0f0f', bg3: '#1a1a1a', accent: '#e6d070' }, // Dark Minimalist
  { bg1: '#0a2342', bg2: '#175676', bg3: '#4ba3c3', accent: '#ffffff' }, // Calm Heaven / Surga
];

/**
 * Generate a single Instagram Slide (SVG string) containing background + text overlay
 */
function buildSlideSvg(slideIndex, totalSlides, title, body, themeIndex) {
  const TITLE_Y = 300;
  const BODY_Y = 500;

  const titleLines = wrapText(title || '', 28);
  const bodyLines = wrapText(body || '', 35);

  const titleSvg = titleLines.map((line, i) => 
    `<text x="540" y="${TITLE_Y + i * 70}" font-family="Arial, sans-serif" font-size="64" fill="white" font-weight="900" text-anchor="middle" letter-spacing="2">${escapeXml(line)}</text>`
  ).join('');

  const bodySvg = bodyLines.map((line, i) => 
    `<text x="540" y="${BODY_Y + i * 55}" font-family="Arial, sans-serif" font-size="44" fill="white" font-weight="normal" text-anchor="middle" opacity="0.95">${escapeXml(line)}</text>`
  ).join('');

  const dotSpacing = 30;
  const totalDotWidth = (totalSlides - 1) * dotSpacing;
  const dotStartX = 540 - totalDotWidth / 2;
  const dotsSvg = Array.from({ length: totalSlides }, (_, i) => {
    const cx = dotStartX + i * dotSpacing;
    const isActive = i === slideIndex;
    return `<circle cx="${cx}" cy="1220" r="${isActive ? 8 : 4}" fill="${isActive ? 'white' : 'rgba(255,255,255,0.4)'}"/>`;
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
  <text x="60" y="100" font-family="Arial, sans-serif" font-size="32" fill="rgba(255,255,255,0.6)" font-weight="600">
    ${slideIndex + 1}/${totalSlides}
  </text>

  <!-- Brand mark top-right -->
  <text x="1020" y="100" font-family="Arial, sans-serif" font-size="40" fill="${palette.accent}" font-weight="700" text-anchor="end" opacity="0.9">
    ✦
  </text>

  <!-- Content -->
  <rect x="340" y="${TITLE_Y - 50}" width="400" height="4" rx="2" fill="${palette.accent}" opacity="0.8"/>
  ${titleSvg}
  <circle cx="540" cy="${BODY_Y - 45}" r="6" fill="${palette.accent}" opacity="0.8"/>
  ${bodySvg}
  ${dotsSvg}
</svg>`;
}

/**
 * Render SVG to JPEG buffer via sharp
 */
async function renderSvgToJpeg(svgString) {
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
 * Main export: generate slide images for an Instagram carousel
 * @param {Array} slides - [{title, body, image_prompt}]
 * @returns {Promise<string[]>} - array of public JPEG URLs
 */
export async function generateInstagramSlideImages(slides) {
  const total = slides.length;
  console.log(`[Instagram-Carousel] Generating ${total} slides in parallel using pure SVG...`);

  // Pick a random aesthetic theme for this carousel
  const themeIndex = Math.floor(Math.random() * palettes.length);

  const promises = slides.map(async (slide, i) => {
    console.log(`[Instagram-Carousel] Starting slide ${i + 1}/${total}...`);
    
    // 1. Generate full SVG
    const svgStr = buildSlideSvg(i, total, slide.title, slide.body, themeIndex);

    // 2. Render to JPEG via sharp
    const jpegBuf = await renderSvgToJpeg(svgStr);

    // 3. Upload to Supabase
    const fileName = `instagram/${Date.now()}-${Math.floor(Math.random()*1000)}-slide-${i + 1}.jpg`;
    const url = await uploadToSupabase(jpegBuf, fileName);
    console.log(`[Instagram-Carousel] Slide ${i + 1} uploaded: ${url}`);
    return url;
  });

  return await Promise.all(promises);
}
