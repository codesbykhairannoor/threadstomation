import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
 * Generate safe SVG overlay
 */
function buildOverlaySvg(slideIndex, totalSlides, title, body) {
  const titleLines = wrapText((title || '').toUpperCase(), 22);
  const bodyLines = wrapText(body || '', 30);

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
  <rect width="${W}" height="${H}" fill="black" opacity="0.65"/>
  
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

/**
 * Generate AI Background Image using Gemini
 */
async function fetchGeminiImage(prompt) {
  // Use the specific API key for image generation if available, fallback to default
  const key = process.env.GEMINI_IMAGE_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('No Gemini API key found for image generation');
  
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
  
  const cleanPrompt = prompt || "Islamic pattern, beautiful mosque, high quality, 4k";
  console.log('[Instagram-Carousel] Fetching background from Gemini:', cleanPrompt);
  
  const result = await model.generateContent(cleanPrompt);
  const response = await result.response;
  
  const candidates = response.candidates;
  if (!candidates || !candidates[0] || !candidates[0].content || !candidates[0].content.parts) {
    throw new Error('No valid response from Gemini Image API');
  }
  
  const imagePart = candidates[0].content.parts.find(p => p.inlineData);
  if (!imagePart) {
    throw new Error('No image returned from Gemini Image API');
  }
  
  return Buffer.from(imagePart.inlineData.data, 'base64');
}

/**
 * Composite AI Image + SVG Text → JPEG buffer via sharp
 */
async function compositeSlide(bgBuffer, svgString) {
  const svgBuffer = Buffer.from(svgString, 'utf-8');
  return sharp(bgBuffer)
    .resize(W, H, { fit: 'cover' })
    .composite([{ input: svgBuffer, top: 0, left: 0 }])
    .jpeg({ quality: 90 })
    .toBuffer();
}

/**
 * Upload JPEG buffer to Supabase Storage → return public URL
 */
async function uploadToSupabase(jpegBuffer, fileName) {
  if (!supabase) throw new Error('Supabase client not initialized.');

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
  console.log(`[Instagram-Carousel] Generating ${total} slides in parallel using Gemini Images...`);

  const promises = slides.map(async (slide, i) => {
    console.log(`[Instagram-Carousel] Starting slide ${i + 1}/${total}...`);
    
    // 1. Fetch AI Background from Gemini
    const bgBuffer = await fetchGeminiImage(slide.image_prompt);
    
    // 2. Generate Safe SVG Overlay
    const svgStr = buildOverlaySvg(i, total, slide.title, slide.body);

    // 3. Composite Background + Overlay
    const jpegBuf = await compositeSlide(bgBuffer, svgStr);

    // 4. Upload to Supabase
    const fileName = `instagram/${Date.now()}-${Math.floor(Math.random()*1000)}-slide-${i + 1}.jpg`;
    const url = await uploadToSupabase(jpegBuf, fileName);
    console.log(`[Instagram-Carousel] Slide ${i + 1} uploaded: ${url}`);
    return url;
  });

  return await Promise.all(promises);
}
