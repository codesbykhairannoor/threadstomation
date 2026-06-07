import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { HfInference } from '@huggingface/inference';
import dotenv from 'dotenv';
import { renderSlideToBuffer } from './layout_engine.js';

dotenv.config({ override: true });

const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

const sfKeys = [
  process.env.SILICONFLOW_API_KEY,
  process.env.SILICONFLOW_API_KEY_2
].filter(Boolean); // Only keep valid keys
const hf = new HfInference(process.env.HF_TOKEN);

/**
 * Fetch AI Foreground Subject using Hugging Face first (Free), then SiliconFlow (Paid)
 */
async function fetchAIForegroundAsset(prompt, bgColorName = 'pure white') {
  if (!prompt || prompt.trim() === '') return null;
  const finalPrompt = `${prompt}, isolated on solid ${bgColorName} background, masterpiece, highly detailed, photorealistic`;
  
  console.log(`[AI-Asset] Requesting: "${finalPrompt.substring(0, 50)}..."`);
  
  let assetUrlOrBlob = null;
  let assetBuffer = null;
  
  // 1. Try Hugging Face
  console.log(`[AI-Asset] Attempting Hugging Face API...`);
  try {
    const blob = await hf.textToImage({
      model: 'black-forest-labs/FLUX.1-schnell',
      inputs: finalPrompt,
      parameters: { width: 1024, height: 1024 }
    });
    assetUrlOrBlob = blob;
    assetBuffer = Buffer.from(await blob.arrayBuffer());
    console.log(`[AI-Asset] ✅ Hugging Face SUCCESS`);
  } catch (e) {
    console.warn(`[AI-Asset] ❌ Hugging Face failed:`, e.message);
  }

  // 2. Fallback to SiliconFlow
  if (!assetUrlOrBlob) {
    console.log(`[AI-Asset] FALLING BACK to SiliconFlow API...`);
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
              assetUrlOrBlob = data.images[0].url;
              const imgRes = await fetch(assetUrlOrBlob);
              assetBuffer = Buffer.from(await imgRes.arrayBuffer());
              console.log(`[AI-Asset] ✅ SiliconFlow SUCCESS using ${model}`);
              break outer;
            }
          }
        } catch(e) { console.warn(`[AI-Asset] SF ${model} error:`, e.message); }
      }
    }
  }

  if (!assetUrlOrBlob) throw new Error("Failed to generate AI asset.");

  // 3. Skip Background Removal (Causes GLib crashes on Windows Node)
  console.log(`[AI-Asset] Skipping local background removal due to OS compatibility.`);
  return await sharp(assetBuffer)
    .png()
    .toBuffer();
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
  const { data } = supabase.storage.from('media').getPublicUrl(fileName);
  return data.publicUrl;
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

  let palettes;
  if (accountName && accountName.toLowerCase().includes('adhlil')) {
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

  // Alternating Theme Logic (Always enforced over DB settings to create the checkerboard feed)
  let useDark = false;
  try {
    const fs = await import('fs');
    const statePath = path.join(process.cwd(), 'theme_state.json');
    if (fs.existsSync(statePath)) {
       const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
       useDark = !state.lastWasDark; // flip the boolean
    }
    fs.writeFileSync(statePath, JSON.stringify({ lastWasDark: useDark }));
  } catch(e) {
    console.warn('Could not read/write theme_state.json, defaulting to random.');
    useDark = Math.random() > 0.5;
  }
  
  const isAdhlil = accountName && accountName.toLowerCase().includes('adhlil');
  if (isAdhlil) {
    useDark = true; // Adhlil strictly uses Dark Mode only
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
