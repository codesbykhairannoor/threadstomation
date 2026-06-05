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
 * Fetch AI Background using Hugging Face first (100% Free), then fallback to SiliconFlow (Paid)
 */
async function fetchAIGeneratedBackground(imagePrompt) {
  const finalPrompt = `${imagePrompt || 'A beautiful cinematic dark background'}, minimal, elegant, 4k, suitable as a backdrop for text, empty center, dark aesthetic`;
  
  console.log(`[AI-Bg] Requesting background: "${finalPrompt.substring(0, 50)}..."`);
  
  // 1. Try Hugging Face first (100% Free, Rate Limited)
  console.log(`[AI-Bg] Attempting Hugging Face Inference API (Free)...`);
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
    console.warn(`[AI-Bg] ❌ Hugging Face failed (Rate limit/Server error):`, e.message);
  }

  // 2. FALLBACK to SiliconFlow (Fast, High Quality, Deducts from Balance)
  console.log(`[AI-Bg] FALLING BACK to SiliconFlow API...`);
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

  throw new Error("Failed to generate AI background from both Hugging Face and SiliconFlow.");
}

/**
 * Generate a single Instagram Slide SVG overlay (transparent bg + text + UI)
 */
function buildSlideSvg(slideIndex, totalSlides, title, body, themeIndex, layoutType) {
  const titleText = (title || '').toUpperCase();
  const bodyText = body || '';
  const palette = palettes[themeIndex % palettes.length];

  let svgElements = '';
  
  // Slide indicator and Brand mark (Common across all layouts, placed at top)
  const uiElements = `
    <!-- Slide number indicator -->
    <text x="60" y="100" font-family="system-ui, -apple-system, sans-serif" font-size="32" fill="rgba(255,255,255,0.6)" font-weight="600">
      ${slideIndex + 1}/${totalSlides}
    </text>
    <!-- Brand mark top-right -->
    <text x="1020" y="100" font-family="system-ui, -apple-system, sans-serif" font-size="40" fill="${palette.accent}" font-weight="700" text-anchor="end" opacity="0.9">
      ✦
    </text>
  `;

  // Pagination dots (Common, bottom center)
  const dotSpacing = 30;
  const totalDotWidth = (totalSlides - 1) * dotSpacing;
  const dotStartX = 540 - totalDotWidth / 2;
  const dotsSvg = Array.from({ length: totalSlides }, (_, i) => {
    const cx = dotStartX + i * dotSpacing;
    const isActive = i === slideIndex;
    return `<circle cx="${cx}" cy="1250" r="${isActive ? 8 : 4}" fill="${isActive ? 'white' : 'rgba(255,255,255,0.4)'}"/>`;
  }).join('');

  if (layoutType === 0) {
    // LAYOUT 0: CENTERED CLEAN
    const TITLE_Y = 400;
    const titleLines = wrapText(titleText, 20);
    const bodyLines = wrapText(bodyText, 35);
    const BODY_Y = TITLE_Y + (titleLines.length * 85) + 60;

    const titleSvg = titleLines.map((line, i) => 
      `<text x="540" y="${TITLE_Y + i * 85}" font-family="system-ui, -apple-system, sans-serif" font-size="70" fill="white" font-weight="900" text-anchor="middle" letter-spacing="1">${escapeXml(line)}</text>`
    ).join('');

    const bodySvg = bodyLines.map((line, i) => 
      `<text x="540" y="${BODY_Y + i * 60}" font-family="Georgia, 'Times New Roman', serif" font-size="46" fill="white" font-weight="normal" text-anchor="middle" opacity="0.95">${escapeXml(line)}</text>`
    ).join('');

    svgElements = `
      <rect width="${W}" height="${H}" fill="black" opacity="0.5"/>
      <rect x="340" y="${TITLE_Y - 70}" width="400" height="6" rx="3" fill="${palette.accent}" opacity="0.9"/>
      ${titleSvg}
      <circle cx="540" cy="${BODY_Y - 45}" r="6" fill="${palette.accent}" opacity="0.8"/>
      ${bodySvg}
    `;
  } else if (layoutType === 1) {
    // LAYOUT 1: LEFT-ALIGNED EDITORIAL
    const TITLE_Y = 350;
    const titleLines = wrapText(titleText, 18);
    const bodyLines = wrapText(bodyText, 30);
    const BODY_Y = TITLE_Y + (titleLines.length * 85) + 60;

    const titleSvg = titleLines.map((line, i) => 
      `<text x="140" y="${TITLE_Y + i * 85}" font-family="system-ui, -apple-system, sans-serif" font-size="75" fill="white" font-weight="900" text-anchor="start" letter-spacing="1">${escapeXml(line)}</text>`
    ).join('');

    const bodySvg = bodyLines.map((line, i) => 
      `<text x="140" y="${BODY_Y + i * 60}" font-family="system-ui, -apple-system, sans-serif" font-size="44" fill="rgba(255,255,255,0.9)" font-weight="500" text-anchor="start">${escapeXml(line)}</text>`
    ).join('');

    const barHeight = (titleLines.length * 85) + (bodyLines.length * 60) + 20;

    svgElements = `
      <!-- Gradient overlay for moody editorial feel -->
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:black;stop-opacity:0.7" />
          <stop offset="100%" style="stop-color:transparent;stop-opacity:0.1" />
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#grad1)"/>
      <rect width="${W}" height="${H}" fill="black" opacity="0.3"/>
      
      <!-- Left Vertical Bar -->
      <rect x="90" y="${TITLE_Y - 70}" width="12" height="${barHeight}" rx="6" fill="${palette.accent}" opacity="0.9"/>
      ${titleSvg}
      ${bodySvg}
    `;
  } else {
    // LAYOUT 2: BOTTOM-HEAVY CARD
    // Keeps the top half entirely free for the AI background
    const TITLE_Y = 780;
    const titleLines = wrapText(titleText, 25);
    const bodyLines = wrapText(bodyText, 40);
    const BODY_Y = TITLE_Y + (titleLines.length * 75) + 50;

    const titleSvg = titleLines.map((line, i) => 
      `<text x="120" y="${TITLE_Y + i * 75}" font-family="system-ui, -apple-system, sans-serif" font-size="60" fill="${palette.accent}" font-weight="900" text-anchor="start">${escapeXml(line)}</text>`
    ).join('');

    const bodySvg = bodyLines.map((line, i) => 
      `<text x="120" y="${BODY_Y + i * 55}" font-family="Georgia, 'Times New Roman', serif" font-size="40" fill="white" font-weight="normal" text-anchor="start" opacity="0.9">${escapeXml(line)}</text>`
    ).join('');

    svgElements = `
      <!-- Just a subtle gradient at the bottom so the card pops -->
      <defs>
        <linearGradient id="gradBot" x1="0%" y1="50%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:transparent;stop-opacity:0" />
          <stop offset="100%" style="stop-color:black;stop-opacity:0.6" />
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#gradBot)"/>

      <!-- Glassmorphic Card -->
      <rect x="60" y="680" width="960" height="520" rx="40" fill="rgba(10, 10, 10, 0.75)" stroke="rgba(255,255,255,0.15)" stroke-width="3" />
      ${titleSvg}
      ${bodySvg}
    `;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${svgElements}
  ${uiElements}
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
  const layoutType = Math.floor(Math.random() * 3); // 0, 1, or 2

  const promises = slides.map(async (slide, i) => {
    console.log(`[Instagram-Carousel] Starting slide ${i + 1}/${total} (Layout ${layoutType})...`);
    
    // 1. Fetch AI Background (Tries Hugging Face first, falls back to SiliconFlow)
    const bgBuffer = await fetchAIGeneratedBackground(slide.image_prompt);

    // 2. Generate dynamic SVG text overlay
    const svgStr = buildSlideSvg(i, total, slide.title, slide.body, themeIndex, layoutType);

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
