import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { HfInference } from '@huggingface/inference';
import dotenv from 'dotenv';
import axios from 'axios';
import { renderSlideToBuffer } from './layout_engine.js';
import sql from './database.js';

async function generateAIImageBuffer(prompt) {
  let buffer = null;

  // --- PRIORITY 1: AGNES AI (Cinematic & Photorealistic Base) ---
  if (!buffer && process.env.AGNES_API_KEY) {
    console.log(`[AI-Asset] Trying Agnes AI (Priority 1)...`);
    try {
      const agnesResponse = await axios.post(
        'https://apihub.agnes-ai.com/v1/images/generations',
        {
          model: 'agnes-image-2.1-flash',
          prompt: prompt,
          size: '1024x1024'
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.AGNES_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000,
          validateStatus: () => true
        }
      );

      if (agnesResponse.status === 200 && agnesResponse.data?.data?.[0]) {
        const imgUrl = agnesResponse.data.data[0].url;
        const b64 = agnesResponse.data.data[0].b64_json;
        
        if (imgUrl) {
          const imgRes = await axios.get(imgUrl, { responseType: 'arraybuffer' });
          buffer = Buffer.from(imgRes.data);
        } else if (b64) {
          buffer = Buffer.from(b64, 'base64');
        }
        if (buffer) console.log(`[AI-Asset] Agnes AI succeeded.`);
      } else {
        console.warn(`[AI-Asset] Agnes AI failed: ${agnesResponse.status}`);
      }
    } catch (err) {
      console.warn(`[AI-Asset] Agnes AI Error: ${err.message}`);
    }
  }

  // --- PRIORITY 2: CLOUDFLARE WORKERS AI (Fast Fallback) ---
  const cfAccountId = process.env.CF_ACCOUNT_ID || "";
  const cfApiToken = process.env.CF_API_TOKEN || "";

  if (!buffer && cfAccountId && cfApiToken) {
    console.log(`[AI-Asset] Trying Cloudflare Workers AI (Priority 2)...`);
    try {
      const model = "@cf/black-forest-labs/flux-1-schnell";
      const response = await axios.post(
        `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${model}`,
        { prompt: prompt },
        {
          headers: {
            Authorization: `Bearer ${cfApiToken}`,
            "Content-Type": "application/json"
          },
          timeout: 60000,
          validateStatus: () => true
        }
      );

      if (response.status === 200 && response.data?.success) {
        const b64 = response.data.result.image;
        buffer = Buffer.from(b64, "base64");
        console.log(`[AI-Asset] Cloudflare FLUX.1-Schnell generated image.`);
      } else {
        console.warn(`[AI-Asset] Cloudflare Workers AI failed: ${response.status}`);
      }
    } catch (err) {
      console.warn(`[AI-Asset] Cloudflare Workers AI Error: ${err.message}`);
    }
  }

  // --- PRIORITY 3: POLLINATIONS.AI (Fallback) ---
  if (!buffer) {
    console.log(`[AI-Asset] Trying Pollinations API (Priority 3)...`);
    try {
      const encodedPrompt = encodeURIComponent(prompt);
      const randomSeed = Math.floor(Math.random() * 1000000000);
      const pollResponse = await axios.get(
        `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${randomSeed}`,
        { responseType: "arraybuffer", timeout: 60000, validateStatus: () => true }
      );
      if (pollResponse.status === 200) {
        buffer = Buffer.from(pollResponse.data);
        console.log(`[AI-Asset] Pollinations API succeeded.`);
      } else {
        console.warn(`[AI-Asset] Pollinations failed: ${pollResponse.status}`);
      }
    } catch (err) {
      console.warn(`[AI-Asset] Pollinations API Error: ${err.message}`);
    }
  }

  if (!buffer) {
    console.error("[AI-Asset] ALL Generation APIs failed. Cannot create image.");
    return null;
  }

  // Convert to JPEG and upscale to 3000x3000 (9 Megapixels) like IMAGECUAN
  console.log(`[AI-Asset] Upscaling image to 3000x3000 (Lanczos3)...`);
  const jpegBuffer = await sharp(buffer)
    .resize(3000, 3000, {
      kernel: sharp.kernel.lanczos3,
      fit: 'cover'
    })
    .jpeg({ quality: 95 })
    .toBuffer();

  return jpegBuffer;
}

dotenv.config({ override: true });

const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

const sfKeys = [
  process.env.SILICONFLOW_API_KEY,
  process.env.SILICONFLOW_API_KEY_2
].filter(Boolean); // Only keep valid keys

const hfKeys = [
  process.env.HF_TOKEN,
  process.env.HF_TOKEN_2,
  process.env.HF_TOKEN_3,
  process.env.HF_TOKEN_4
].filter(Boolean);

/**
 * Fetch AI Foreground Subject using Hugging Face first (Free), then SiliconFlow (Paid)
 */
/**
 * Helper to generate images using decentralized AI Horde (anonymous key)
 */
async function fetchFromAIHorde(prompt, width = 1024, height = 1024) {
  try {
    console.log(`[AI-Horde] Submitting anonymous generation request...`);
    const res = await fetch("https://stablehorde.net/api/v2/generate/async", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": "0000000000"
      },
      body: JSON.stringify({
        prompt: prompt,
        params: {
          width: width,
          height: height,
          steps: 10,
          n: 1
        }
      })
    });
    if (!res.ok) {
      throw new Error(`AI Horde async submission failed: ${res.status}`);
    }
    const { id } = await res.json();
    console.log(`[AI-Horde] Job submitted. ID: ${id}. Polling...`);

    // Poll up to 3 times, waiting 3s between attempts (max 9 seconds to fit serverless limits)
    for (let attempt = 1; attempt <= 3; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      const checkRes = await fetch(`https://stablehorde.net/api/v2/generate/check/${id}`);
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        console.log(`[AI-Horde] Poll ${attempt}: finished=${checkData.finished}, waiting=${checkData.waiting}`);
        if (checkData.done || checkData.finished > 0) {
          const statusRes = await fetch(`https://stablehorde.net/api/v2/generate/status/${id}`);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            const url = statusData.generations?.[0]?.img;
            if (url) {
              console.log(`[AI-Horde] ✅ Generation success: ${url}`);
              const imgRes = await fetch(url);
              if (imgRes.ok) {
                return Buffer.from(await imgRes.arrayBuffer());
              }
            }
          }
        }
      }
    }
    console.warn(`[AI-Horde] Queue too slow or timed out.`);
    return null;
  } catch (err) {
    console.warn(`[AI-Horde] Generation failed:`, err.message);
    return null;
  }
}



/**
 * Fetch AI Foreground Subject using Hugging Face first (Free), then SiliconFlow (Paid)
 */
async function fetchAIForegroundAsset(prompt, bgColorName = 'pure white') {
  if (!prompt || prompt.trim() === '') return null;
  const finalPrompt = `${prompt}, isolated on solid ${bgColorName} background, masterpiece, highly detailed, photorealistic`;
  
  console.log(`[AI-Asset] Requesting: "${finalPrompt.substring(0, 50)}..."`);
  
  const assetBuffer = await generateAIImageBuffer(finalPrompt);
  
  if (!assetBuffer) throw new Error("Failed to generate or fetch AI/Stock asset.");

  // Skip Background Removal (Causes GLib crashes on Windows Node)
  console.log(`[AI-Asset] Skipping local background removal due to OS compatibility.`);
  return await sharp(assetBuffer)
    .png()
    .toBuffer();
}

export async function generateNativeBannerImage(prompt, overlayText = null, palette = null) {
  if (!prompt || prompt.trim() === '') return [];
  
  console.log(`[Native-AI] Requesting: "${prompt.substring(0, 50)}..."`);
  
  const assetBuffer = await generateAIImageBuffer(prompt);

  if (!assetBuffer) {
    console.warn(`[Native-AI] All AI image generators failed. Returning empty array to trigger text-only or Satori fallback.`);
    return [];
  }

  // ── OVERLAY TEXT ON TOP OF THE AI IMAGE using Satori PromoBanner layout ──
  // Instead of uploading the raw AI photo, we pipe it through the layout engine
  // so the text title/caption is overlaid on top in a beautiful glassmorphism card.
  console.log(`[Native-AI] Compositing text overlay via Satori PromoBanner layout...`);

  const words = (overlayText || prompt).replace(/<[^>]+>/g, '').trim().split(/\s+/);
  const slide = {
    layout_type: 'PromoBanner',
    title_part1: words.slice(0, 5).join(' '),
    title_part2: words.length > 5 ? words.slice(5, 9).join(' ') : null,
    body: null,
    foreground_subject_prompt: null
  };

  // Use caller palette or dark default
  const bannerTheme = palette || { name: 'dark', bg1: '#0a0a0a', bg2: '#0a0a0a', accent: '#ffd200', text: '#ffffff' };

  const pngBuf = await renderSlideToBuffer(slide, assetBuffer, bannerTheme, 'promo');
  const jpegBuf = await sharp(pngBuf).jpeg({ quality: 95 }).toBuffer();
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn(`[Native-AI] No Supabase key found! Bypassing Supabase upload and returning raw buffer.`);
      return [{ buffer: jpegBuf, isRawBuffer: true }];
  }

  const fileName = `native/${Date.now()}-${Math.floor(Math.random()*1000)}-banner.jpg`;
  const url = await uploadToSupabase(jpegBuf, fileName);
  console.log(`[Native-AI] Uploaded composited banner: ${url}`);
  
  return [url];
}

async function uploadToSupabase(jpegBuffer, fileName) {
  try {
    const form = new FormData();
    form.append('key', '6d207e02198a847aa98d0a2a901485a5'); // Public Freeimage API Key
    form.append('action', 'upload');
    form.append('source', jpegBuffer.toString('base64'));
    form.append('format', 'json');

    const response = await axios.post('https://freeimage.host/api/1/upload', form, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (response.data && response.data.image && response.data.image.url) {
      return response.data.image.url;
    }
    
    throw new Error('Invalid response from image host');
  } catch (err) {
    console.error('[Image Upload Error]:', err.message || err);
    throw new Error(`Upload failed: ${err.message}`);
  }
}

/**
 * Main export: generate slide images for an Instagram carousel
 */
export async function generateInstagramSlideImages(slides, customPalette = null, accountName = "@sharesa.space", returnBuffers = false) {
  
  // SHARESA.SPACE BRAND COLORS
  const SHARES_DARK = '#1e2a39';
  const SHARES_GREEN = '#00ff8c';
  const SHARES_WHITE = '#ffffff';

  // ADHLIL BRAND COLORS
  const AD_DARK = '#000000';
  const AD_YELLOW_LIGHT = '#facc15'; // bright yellow for dark mode
  const AD_YELLOW_DARK = '#b45309'; // darker yellow/orange for light mode
  const AD_WHITE = '#ffffff';

  // TRANVAS BRAND COLORS
  const TRANVAS_DARK = '#0f172a'; // Slate 900
  const TRANVAS_INDIGO = '#4f46e5'; // Indigo 600
  const TRANVAS_WHITE = '#ffffff';

  let palettes;
  if (customPalette && customPalette.name) {
    palettes = [customPalette, customPalette]; // Force custom palette for both light/dark
  } else if (accountName && accountName.toLowerCase().includes('adhlil')) {
    palettes = [
      { name: 'light', bg1: AD_WHITE, bg2: AD_WHITE, accent: AD_YELLOW_DARK, text: AD_DARK }, // Light Mode
      { name: 'dark', bg1: AD_DARK, bg2: AD_DARK, accent: AD_YELLOW_LIGHT, text: AD_WHITE }, // Dark Mode
    ];
  } else if (accountName && (accountName.toLowerCase().includes('tranvas') || accountName.toLowerCase().includes('oneformind'))) {
    palettes = [
      { name: 'light', bg1: TRANVAS_WHITE, bg2: TRANVAS_WHITE, accent: TRANVAS_INDIGO, text: TRANVAS_DARK }, // Light Mode
      { name: 'dark', bg1: TRANVAS_DARK, bg2: TRANVAS_DARK, accent: TRANVAS_INDIGO, text: TRANVAS_WHITE }, // Dark Mode
    ];
  } else {
    // Default to Sharesa Space
    palettes = [
      { name: 'light', bg1: SHARES_WHITE, bg2: SHARES_WHITE, accent: SHARES_GREEN, text: SHARES_DARK }, // Light Mode
      { name: 'dark', bg1: SHARES_DARK, bg2: SHARES_DARK, accent: SHARES_GREEN, text: SHARES_WHITE }, // Dark Mode
    ];
  }

  const isAdhlil = accountName && accountName.toLowerCase().includes('adhlil');

  // Alternating Theme Logic (Database based to work on Vercel)
  let useDark = false;
  if (isAdhlil) {
    useDark = true; // Adhlil strictly uses Dark Mode only
  } else {
    try {
      const settingKey = `last_theme_dark_${accountName.replace(/[^a-zA-Z0-9]/g, '')}`;
      const stateRow = await sql`SELECT value FROM instagram_settings WHERE key = ${settingKey}`;
      
      let lastWasDark = false;
      if (stateRow.length > 0) {
        lastWasDark = stateRow[0].value === 'true';
      }
      useDark = !lastWasDark; // flip the boolean
      
      // Save new state
      await sql`
        INSERT INTO instagram_settings (key, value) 
        VALUES (${settingKey}, ${String(useDark)})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `;
    } catch(e) {
      console.warn('Could not read/write DB theme state, defaulting to random:', e.message);
      useDark = Math.random() > 0.5;
    }
  }

  const theme = useDark ? palettes[1] : palettes[0];
  
  console.log(`[Theme Selected] Mode: ${theme.name || 'custom'}, BG: ${theme.bg1}`);
  
  const images = [];
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    
    // 1. Generate Asset if needed
    let fgBuffer = null;
    if (slide.foreground_subject_prompt && slide.layout_type !== 'TextHeavy') {
      try {
        fgBuffer = await fetchAIForegroundAsset(slide.foreground_subject_prompt, 'pure white');
      } catch (e) {
        console.warn(`[LayoutEngine] Failed to fetch foreground: ${e.message}, falling back to TextHeavy`);
        slide.layout_type = 'TextHeavy';
      }
    }

    // 2. Render Slide to PNG via Satori
    console.log(`[LayoutEngine] Rendering slide ${i+1}/${slides.length} (${slide.layout_type})...`);
    const pngBuf = await renderSlideToBuffer(slide, fgBuffer, theme, accountName);

    // Convert PNG to JPEG for smaller file size, max quality for HD
    const jpegBuf = await sharp(pngBuf).jpeg({ quality: 100 }).toBuffer();

    // 3. Upload or Return Buffer
    if (returnBuffers) {
      images.push({ buffer: jpegBuf, isRawBuffer: true });
    } else if (!supabase) {
      console.warn(`[Instagram-Carousel] No Supabase client! Bypassing upload and returning raw buffer.`);
      images.push({ buffer: jpegBuf, isRawBuffer: true });
    } else {
      const fileName = `instagram/${Date.now()}-${Math.floor(Math.random()*1000)}-slide-${i + 1}.jpg`;
      const url = await uploadToSupabase(jpegBuf, fileName);
      console.log(`[Instagram-Carousel] Slide ${i + 1} uploaded: ${url}`);
      images.push(url);
    }
  }

  return images;
}
