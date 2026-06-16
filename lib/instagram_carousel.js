import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { HfInference } from '@huggingface/inference';
import dotenv from 'dotenv';
import { renderSlideToBuffer } from './layout_engine.js';
import sql from './database.js';

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
  
  let assetBuffer = null;
  
  // 1. Try SiliconFlow First
  console.log(`[AI-Asset] Attempting SiliconFlow API...`);
  const sfModels = ['black-forest-labs/FLUX.1-schnell', 'black-forest-labs/FLUX.2-flex'];
  outer: for (const sfKey of sfKeys) {
    for (const model of sfModels) {
      try {
        const res = await fetch("https://api.siliconflow.com/v1/images/generations", {
          method: 'POST',
          headers: { "Authorization": `Bearer ${sfKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: model, prompt: finalPrompt, image_size: "1024x1024" })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.images?.[0]?.url) {
            const assetUrl = data.images[0].url;
            const imgRes = await fetch(assetUrl);
            assetBuffer = Buffer.from(await imgRes.arrayBuffer());
            console.log(`[AI-Asset] ✅ SiliconFlow SUCCESS using ${model}`);
            break outer;
          }
        }
      } catch(e) { console.warn(`[AI-Asset] SF ${model} error:`, e.message); }
    }
  }

  // 2. Fallback to Hugging Face
  if (!assetBuffer) {
    console.log(`[AI-Asset] FALLING BACK to Hugging Face API...`);
    for (const hfToken of hfKeys) {
      try {
        const hf = new HfInference(hfToken);
        const blob = await hf.textToImage({
          model: 'black-forest-labs/FLUX.1-schnell',
          inputs: finalPrompt,
          parameters: { width: 1024, height: 1024 }
        });
        assetBuffer = Buffer.from(await blob.arrayBuffer());
        console.log(`[AI-Asset] ✅ Hugging Face SUCCESS`);
        break;
      } catch (e) {
        console.warn(`[AI-Asset] ❌ Hugging Face failed for key:`, e.message);
      }
    }
  }

  // We no longer fallback to Picsum because random stock photos have no marketing relevance.
  // The error below will trigger a fallback to TextHeavy layout in the caller function.
  if (!assetBuffer) throw new Error("Failed to generate or fetch AI/Stock asset.");

  // Skip Background Removal (Causes GLib crashes on Windows Node)
  console.log(`[AI-Asset] Skipping local background removal due to OS compatibility.`);
  return await sharp(assetBuffer)
    .png()
    .toBuffer();
}

export async function generateNativeBannerImage(prompt) {
  if (!prompt || prompt.trim() === '') return [];
  
  console.log(`[Native-AI] Requesting: "${prompt.substring(0, 50)}..."`);
  
  let assetBuffer = null;
  
  // 1. Try SiliconFlow First
  console.log(`[Native-AI] Attempting SiliconFlow API...`);
  const sfModels = ['black-forest-labs/FLUX.1-schnell', 'black-forest-labs/FLUX.2-flex'];
  outer: for (const sfKey of sfKeys) {
    for (const model of sfModels) {
      try {
        const res = await fetch("https://api.siliconflow.cn/v1/images/generations", {
          method: 'POST',
          headers: { "Authorization": `Bearer ${sfKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: model, prompt: prompt, image_size: "1024x1024" })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.images?.[0]?.url) {
            const assetUrl = data.images[0].url;
            const imgRes = await fetch(assetUrl);
            assetBuffer = Buffer.from(await imgRes.arrayBuffer());
            console.log(`[Native-AI] ✅ SiliconFlow SUCCESS using ${model}`);
            break outer;
          }
        }
      } catch(e) { console.warn(`[Native-AI] SF ${model} error:`, e.message); }
    }
  }

  // 2. Fallback to Hugging Face
  if (!assetBuffer) {
    console.log(`[Native-AI] FALLING BACK to Hugging Face API...`);
    for (const hfToken of hfKeys) {
      try {
        const hf = new HfInference(hfToken);
        const blob = await hf.textToImage({
          model: 'black-forest-labs/FLUX.1-schnell',
          inputs: prompt,
          parameters: { width: 1024, height: 1024 }
        });
        assetBuffer = Buffer.from(await blob.arrayBuffer());
        console.log(`[Native-AI] ✅ Hugging Face SUCCESS`);
        break;
      } catch (e) {
        console.warn(`[Native-AI] ❌ Hugging Face failed for key:`, e.message);
      }
    }
  }

  // We no longer fallback to Picsum because a random stock photo has no text/relevance.
  if (!assetBuffer) {
    console.warn(`[Native-AI] All AI image generators failed. Returning empty array to trigger text-only or Satori fallback.`);
    return [];
  }

  const jpegBuf = await sharp(assetBuffer).jpeg({ quality: 100 }).toBuffer();
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn(`[Native-AI] No Supabase key found! Bypassing Supabase upload and returning raw buffer.`);
      return [{ buffer: jpegBuf, isRawBuffer: true }];
  }

  const fileName = `native/${Date.now()}-${Math.floor(Math.random()*1000)}-banner.jpg`;
  const url = await uploadToSupabase(jpegBuf, fileName);
  console.log(`[Native-AI] Uploaded: ${url}`);
  
  return [url];
}

/**
 * Upload buffer to Supabase Storage → return public URL
 */
async function uploadToSupabase(jpegBuffer, fileName) {
  if (!supabase) throw new Error('Supabase client not initialized.');
  const { error } = await supabase.storage
    .from('media')
    .upload(fileName, jpegBuffer, { contentType: 'image/jpeg', upsert: true });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);
  // Proxy through Vercel to bypass Meta API crawler limitations / SSL / IP blocks on Supabase storage URLs
  return `https://threadstomation.vercel.app/supabase-media/${fileName}`;
}

/**
 * Main export: generate slide images for an Instagram carousel
 */
export async function generateInstagramSlideImages(slides, customPalette = null, accountName = "@sharesa.space") {
  
  // SHARESA.SPACE BRAND COLORS
  const SHARES_DARK = '#1e2a39';
  const SHARES_GREEN = '#00ff8c';
  const SHARES_WHITE = '#ffffff';

  // ADHLIL BRAND COLORS
  const AD_DARK = '#000000';
  const AD_YELLOW_LIGHT = '#facc15'; // bright yellow for dark mode
  const AD_YELLOW_DARK = '#b45309'; // darker yellow/orange for light mode
  const AD_WHITE = '#ffffff';

  // ONEFORMIND BRAND COLORS
  const ONE_DARK = '#0f172a'; // Slate 900
  const ONE_INDIGO = '#4f46e5'; // Indigo 600
  const ONE_WHITE = '#ffffff';

  let palettes;
  if (customPalette && customPalette.name) {
    palettes = [customPalette, customPalette]; // Force custom palette for both light/dark
  } else if (accountName && accountName.toLowerCase().includes('adhlil')) {
    palettes = [
      { name: 'light', bg1: AD_WHITE, bg2: AD_WHITE, accent: AD_YELLOW_DARK, text: AD_DARK }, // Light Mode
      { name: 'dark', bg1: AD_DARK, bg2: AD_DARK, accent: AD_YELLOW_LIGHT, text: AD_WHITE }, // Dark Mode
    ];
  } else if (accountName && accountName.toLowerCase().includes('oneformind')) {
    palettes = [
      { name: 'light', bg1: ONE_WHITE, bg2: ONE_WHITE, accent: ONE_INDIGO, text: ONE_DARK }, // Light Mode
      { name: 'dark', bg1: ONE_DARK, bg2: ONE_DARK, accent: ONE_INDIGO, text: ONE_WHITE }, // Dark Mode
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

    // 3. Upload
    const fileName = `instagram/${Date.now()}-${Math.floor(Math.random()*1000)}-slide-${i + 1}.jpg`;
    const url = await uploadToSupabase(jpegBuf, fileName);
    console.log(`[Instagram-Carousel] Slide ${i + 1} uploaded: ${url}`);
    images.push(url);
  }

  return images;
}
