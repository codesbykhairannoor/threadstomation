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

const sfKeys = [
  process.env.SILICONFLOW_API_KEY,
  process.env.SILICONFLOW_API_KEY_2
].filter(Boolean); // Only keep valid keys
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
  
  for (const sfKey of sfKeys) {
    console.log(`[AI-Bg] Trying SiliconFlow API Key starting with ${sfKey.substring(0, 8)}...`);
    for (const model of sfModels) {
      try {
        const res = await fetch("https://api.siliconflow.com/v1/images/generations", {
          method: 'POST',
          headers: { 
            "Authorization": `Bearer ${sfKey}`,
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
        } else {
          // If 400+ error like out of balance, we just log and it moves to the next key or model
          console.warn(`[AI-Bg] SF ${model} failed with ${res.status}`);
        }
      } catch(e) {
        console.warn(`[AI-Bg] SF ${model} error:`, e.message);
      }
    }
  }

  throw new Error("Failed to generate AI background from Hugging Face and all SiliconFlow API keys.");
}

/**
 * Generate a single Instagram Slide SVG overlay (transparent bg + text + UI)
 */
function buildSlideSvg({ title, body, slideIndex, totalSlides, layoutType = 0, paletteOverride = null }) {
  const titleText = (title || '').toUpperCase();
  const bodyText = body || '';
  const palette = paletteOverride || palettes[0];

  let svgElements = '';
  
  // Slide indicator and Brand mark (Common across all layouts, placed at top)
  let uiElements = `
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
  let dotsSvg = Array.from({ length: totalSlides }, (_, i) => {
    const cx = dotStartX + i * dotSpacing;
    const isActive = i === slideIndex;
    return `<circle cx="${cx}" cy="1250" r="${isActive ? 8 : 4}" fill="${isActive ? 'white' : 'rgba(255,255,255,0.4)'}"/>`;
  }).join('');

  if (layoutType === 0) {
    // LAYOUT 0: CENTERED CLEAN
    const TITLE_Y = 400;
    const titleLines = wrapText(titleText, 18);
    const bodyLines = wrapText(bodyText, 32);
    const BODY_Y = TITLE_Y + (titleLines.length * 95) + 70;

    const titleSvg = titleLines.map((line, i) => 
      `<text x="540" y="${TITLE_Y + i * 95}" font-family="system-ui, -apple-system, sans-serif" font-size="70" fill="white" font-weight="900" text-anchor="middle" letter-spacing="1">${escapeXml(line)}</text>`
    ).join('');

    const bodySvg = bodyLines.map((line, i) => 
      `<text x="540" y="${BODY_Y + i * 70}" font-family="Georgia, 'Times New Roman', serif" font-size="46" fill="white" font-weight="normal" text-anchor="middle" opacity="0.95">${escapeXml(line)}</text>`
    ).join('');

    svgElements = `
      <rect width="${W}" height="${H}" fill="black" opacity="0.5"/>
      <rect x="340" y="${TITLE_Y - 70}" width="400" height="6" rx="3" fill="${palette.accent}" opacity="0.9"/>
      ${titleSvg}
      <circle cx="540" cy="${BODY_Y - 50}" r="6" fill="${palette.accent}" opacity="0.8"/>
      ${bodySvg}
    `;
  } else if (layoutType === 1) {
    // LAYOUT 1: LEFT-ALIGNED EDITORIAL
    const TITLE_Y = 350;
    const titleLines = wrapText(titleText, 16);
    const bodyLines = wrapText(bodyText, 28);
    const BODY_Y = TITLE_Y + (titleLines.length * 95) + 70;

    const titleSvg = titleLines.map((line, i) => 
      `<text x="140" y="${TITLE_Y + i * 95}" font-family="system-ui, -apple-system, sans-serif" font-size="75" fill="white" font-weight="900" text-anchor="start" letter-spacing="1">${escapeXml(line)}</text>`
    ).join('');

    const bodySvg = bodyLines.map((line, i) => 
      `<text x="140" y="${BODY_Y + i * 70}" font-family="system-ui, -apple-system, sans-serif" font-size="44" fill="rgba(255,255,255,0.9)" font-weight="500" text-anchor="start">${escapeXml(line)}</text>`
    ).join('');

    const barHeight = (titleLines.length * 95) + (bodyLines.length * 70) + 20;

    svgElements = `
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:black;stop-opacity:0.7" />
          <stop offset="100%" style="stop-color:transparent;stop-opacity:0.1" />
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#grad1)"/>
      <rect width="${W}" height="${H}" fill="black" opacity="0.3"/>
      
      <rect x="90" y="${TITLE_Y - 70}" width="12" height="${barHeight}" rx="6" fill="${palette.accent}" opacity="0.9"/>
      ${titleSvg}
      ${bodySvg}
    `;
  } else {
    // LAYOUT 2: STARTUP BENTO WINDOW (Educational Notion-Style)
    const isDark = palette.bg === '#000000' || palette.bg === '#0f172a';
    const cardFill = isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)';
    const textColor = isDark ? '#ffffff' : '#0f172a';
    const subtleText = isDark ? 'rgba(255, 255, 255, 0.75)' : 'rgba(15, 23, 42, 0.75)';
    const strokeColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

    const TITLE_Y = 380;
    const titleLines = wrapText(titleText, 20);
    const bodyLines = wrapText(bodyText, 34);
    const BODY_Y = TITLE_Y + (titleLines.length * 85) + 60;

    const titleSvg = titleLines.map((line, i) => 
      `<text x="140" y="${TITLE_Y + i * 85}" font-family="system-ui, -apple-system, sans-serif" font-size="64" fill="${textColor}" font-weight="900" text-anchor="start" letter-spacing="-1">${escapeXml(line)}</text>`
    ).join('');

    const bodySvg = bodyLines.map((line, i) => 
      `<text x="140" y="${BODY_Y + i * 55}" font-family="system-ui, -apple-system, sans-serif" font-size="36" fill="${subtleText}" font-weight="500" text-anchor="start">${escapeXml(line)}</text>`
    ).join('');
    
    // Clear the default global UI elements for this layout
    uiElements = '';
    dotsSvg = '';

    const customDots = Array.from({ length: totalSlides }, (_, i) => {
      const cx = 540 - ((totalSlides - 1) * 30) / 2 + i * 30;
      const isActive = i === slideIndex;
      return \`<circle cx="\${cx}" cy="1160" r="\${isActive ? 8 : 4}" fill="\${isActive ? palette.accent : subtleText}"/>\`;
    }).join('');

    svgElements = `
      <!-- Solid translucent overlay over AI bg -->
      <rect width="${W}" height="${H}" fill="${palette.bg}" opacity="0.3"/>
      
      <!-- Bento Card -->
      <rect x="60" y="80" width="960" height="1190" rx="40" fill="${cardFill}" stroke="${strokeColor}" stroke-width="4" />
      
      <!-- Mac Window Dots -->
      <circle cx="120" cy="140" r="12" fill="#ff5f56" />
      <circle cx="160" cy="140" r="12" fill="#ffbd2e" />
      <circle cx="200" cy="140" r="12" fill="#27c93f" />
      
      <!-- Slide Number right aligned -->
      <text x="960" y="150" font-family="system-ui, -apple-system, sans-serif" font-size="28" fill="${subtleText}" font-weight="600" text-anchor="end">Slide ${slideIndex + 1}/${totalSlides}</text>

      <!-- Pill Tag (Category) -->
      <rect x="140" y="240" width="220" height="50" rx="25" fill="${palette.accent}" opacity="0.15" />
      <text x="250" y="275" font-family="system-ui, -apple-system, sans-serif" font-size="20" fill="${palette.accent}" font-weight="800" text-anchor="middle" letter-spacing="2">INSIGHT</text>

      ${titleSvg}
      ${bodySvg}
      ${customDots}
    `;
  }

  return \`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="\${W}" height="\${H}" viewBox="0 0 \${W} \${H}">
  \${svgElements}
  \${uiElements}
  \${dotsSvg}
</svg>\`;
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
export async function generateInstagramSlideImages(slides, customPalette = null, preferredLayout = -1) {
  // If DB provides a palette, use it. Otherwise pick a random dark/elegant one
  const palette = customPalette || palettes[Math.floor(Math.random() * palettes.length)];
  
  // If DB specifies a layout (0, 1, or 2), use it. Otherwise random.
  const layoutType = (preferredLayout >= 0 && preferredLayout <= 2) 
    ? preferredLayout 
    : Math.floor(Math.random() * 3);

  const images = [];
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    
    // Generate AI Background
    console.log(`[Slide ${i+1}] Generating background with prompt: ${slide.image_prompt}`);
    const bgBuffer = await fetchAIGeneratedBackground(slide.image_prompt);

    // Build SVG
    const svgString = buildSlideSvg({
      title: slide.title,
      body: slide.body,
      slideIndex: i,
      totalSlides: slides.length,
      layoutType: layoutType,
      paletteOverride: palette
    });
    
    // Composite
    const jpegBuf = await compositeSlide(svgString, bgBuffer);

    // 3. Upload to Supabase
    const fileName = `instagram/${Date.now()}-${Math.floor(Math.random()*1000)}-slide-${i + 1}.jpg`;
    const url = await uploadToSupabase(jpegBuf, fileName);
    console.log(`[Instagram-Carousel] Slide ${i + 1} uploaded: ${url}`);
    images.push(url);
  }

  return images;
}
