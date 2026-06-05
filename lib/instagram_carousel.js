import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { HfInference } from '@huggingface/inference';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

const SF_API_KEY = process.env.SILICONFLOW_API_KEY;
const hf = new HfInference(process.env.HF_TOKEN);

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

// Beautiful Islamic/Aesthetic Color Palettes
const palettes = [
  { bg1: '#0f2027', bg2: '#203a43', bg3: '#2c5364', accent: '#d4af37' }, // Deep Teal & Gold
  { bg1: '#141e30', bg2: '#243b55', bg3: '#3b5998', accent: '#f7971e' }, // Midnight Navy
  { bg1: '#2b1008', bg2: '#1c0a05', bg3: '#0a0301', accent: '#ff6b6b' }, // Dark Hellfire / Kiamat
  { bg1: '#000000', bg2: '#0f0f0f', bg3: '#1a1a1a', accent: '#e6d070' }, // Dark Minimalist
  { bg1: '#0a2342', bg2: '#175676', bg3: '#4ba3c3', accent: '#ffffff' }, // Calm Heaven / Surga
];

/**
 * Fetch AI Background using SiliconFlow first, then fallback to Hugging Face
 */
async function fetchAIGeneratedBackground(imagePrompt) {
  const finalPrompt = `${imagePrompt || 'A beautiful cinematic dark background'}, minimal, elegant, 4k, suitable as a backdrop for text, empty center, dark aesthetic`;
  
  console.log(`[AI-Bg] Requesting background: "${finalPrompt.substring(0, 50)}..."`);
  
  // 1. Try SiliconFlow first (Fast, High Quality, Paid but has user balance)
  const sfModels = ['black-forest-labs/FLUX.1-schnell', 'black-forest-labs/FLUX.2-flex'];
  for (const model of sfModels) {
    try {
      const res = await fetch("https://api.siliconflow.com/v1/images/generations", {
        method: 'POST',
        headers: { 
          "Authorization": `Bearer ${SF_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model,
          prompt: finalPrompt,
          image_size: "1024x1024",
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.images && data.images[0] && data.images[0].url) {
          const imgRes = await fetch(data.images[0].url);
          const buf = Buffer.from(await imgRes.arrayBuffer());
          console.log(`[AI-Bg] ✅ SiliconFlow SUCCESS using ${model}`);
          return await sharp(buf).resize(W, H, { fit: 'cover' }).jpeg({ quality: 90 }).toBuffer();
        }
      }
      console.warn(`[AI-Bg] SF ${model} failed with ${res.status}`);
    } catch(e) {
      console.warn(`[AI-Bg] SF ${model} error:`, e.message);
    }
  }

  // 2. FALLBACK to Hugging Face (100% Free, Rate Limited)
  console.log(`[AI-Bg] SiliconFlow exhausted. FALLING BACK to Hugging Face Inference API...`);
  try {
    const blob = await hf.textToImage({
      model: 'black-forest-labs/FLUX.1-schnell',
      inputs: finalPrompt,
      parameters: { width: 1024, height: 1024 }
    });
    
    const arrayBuffer = await blob.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);
    console.log(`[AI-Bg] ✅ Hugging Face SUCCESS`);
    return await sharp(buf).resize(W, H, { fit: 'cover' }).jpeg({ quality: 90 }).toBuffer();
  } catch (e) {
    console.error(`[AI-Bg] ❌ Hugging Face fallback failed:`, e.message);
  }
  
  throw new Error("Failed to generate AI background from both SiliconFlow and Hugging Face.");
}

/**
 * Generate a single Instagram Slide SVG overlay (transparent bg + text + UI)
 */
function buildSlideSvg(slideIndex, totalSlides, title, body, themeIndex) {
  const TITLE_Y = 320;
  const BODY_Y = 520;

  const titleLines = wrapText((title || '').toUpperCase(), 20);
  const bodyLines = wrapText(body || '', 35);

  const titleSvg = titleLines.map((line, i) => 
    `<text x="540" y="${TITLE_Y + i * 85}" font-family="system-ui, -apple-system, sans-serif" font-size="70" fill="white" font-weight="900" text-anchor="middle" letter-spacing="1">${escapeXml(line)}</text>`
  ).join('');

  const bodySvg = bodyLines.map((line, i) => 
    `<text x="540" y="${BODY_Y + i * 60}" font-family="Georgia, 'Times New Roman', serif" font-size="46" fill="white" font-weight="normal" text-anchor="middle" opacity="0.95">${escapeXml(line)}</text>`
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
    <filter id="glow">
      <feGaussianBlur stdDeviation="15" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Dark transparent overlay to ensure text is always readable over ANY AI background -->
  <rect width="${W}" height="${H}" fill="black" opacity="0.4"/>

  <!-- Top glow circle (Accent) -->
  <circle cx="540" cy="${TITLE_Y}" r="350" fill="${palette.accent}" opacity="0.2" filter="url(#glow)"/>

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
 * Render SVG text overlay and composite it on top of the AI background buffer
 */
async function compositeSlide(svgString, bgBuffer) {
  const svgBuffer = Buffer.from(svgString, 'utf-8');
  return sharp(bgBuffer)
    .composite([{ input: svgBuffer }])
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
 */
export async function generateInstagramSlideImages(slides) {
  const total = slides.length;
  console.log(`[Instagram-Carousel] Generating ${total} slides in parallel using Pure SVG...`);

  const themeIndex = Math.floor(Math.random() * palettes.length);

  const promises = slides.map(async (slide, i) => {
    console.log(`[Instagram-Carousel] Starting slide ${i + 1}/${total}...`);
    
    // 1. Fetch AI Background (Tries SiliconFlow first, falls back to Hugging Face)
    const bgBuffer = await fetchAIGeneratedBackground(slide.image_prompt);

    // 2. Generate transparent SVG text overlay
    const svgStr = buildSlideSvg(i, total, slide.title, slide.body, themeIndex);

    // 3. Composite SVG on top of the AI background
    const jpegBuf = await compositeSlide(svgStr, bgBuffer);

    // 3. Upload to Supabase
    const fileName = `instagram/${Date.now()}-${Math.floor(Math.random()*1000)}-slide-${i + 1}.jpg`;
    const url = await uploadToSupabase(jpegBuf, fileName);
    console.log(`[Instagram-Carousel] Slide ${i + 1} uploaded: ${url}`);
    return url;
  });

  return await Promise.all(promises);
}
