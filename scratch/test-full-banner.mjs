import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import sharp from 'sharp';
import { generateTumblrContent } from '../lib/gemini_tumblr.js';
import { HfInference } from '@huggingface/inference';

async function fetchNativeAssetLocal(prompt) {
  console.log(`[Native-AI] Requesting: "${prompt.substring(0, 100)}..."`);
  
  const sfKeys = [
    process.env.SILICONFLOW_API_KEY,
    process.env.SILICONFLOW_API_KEY_2
  ].filter(Boolean);
  
  let assetBuffer = null;
  
  console.log(`[Native-AI] Attempting SiliconFlow API...`);
  const sfModels = ['black-forest-labs/FLUX.1-schnell', 'black-forest-labs/FLUX.2-flex'];
  outer: for (const sfKey of sfKeys) {
    for (const model of sfModels) {
      try {
        const res = await fetch("https://api.siliconflow.com/v1/images/generations", {
          method: 'POST',
          headers: { "Authorization": `Bearer ${sfKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: model, prompt: prompt, image_size: "1024x1024" })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.images?.[0]?.url) {
            const imgRes = await fetch(data.images[0].url);
            assetBuffer = Buffer.from(await imgRes.arrayBuffer());
            console.log(`[Native-AI] ✅ SiliconFlow SUCCESS using ${model}`);
            break outer;
          }
        } else {
          console.error("SF error:", await res.text());
        }
      } catch(e) { console.warn(`[Native-AI] SF ${model} error:`, e.message); }
    }
  }

  // Fallback to HF
  if (!assetBuffer) {
    console.log(`[Native-AI] FALLING BACK to Hugging Face API...`);
    const hfKeys = [process.env.HF_TOKEN, process.env.HF_TOKEN_2].filter(Boolean);
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
        console.warn(`[Native-AI] ❌ Hugging Face failed:`, e.message);
      }
    }
  }
  
  if (!assetBuffer) {
    console.log("Using Placeholder Image");
    const res = await fetch('https://picsum.photos/1024/1024');
    assetBuffer = Buffer.from(await res.arrayBuffer());
  }

  return await sharp(assetBuffer).png().toBuffer();
}

async function testSimulate() {
  const accountName = "caridisinishop_tumblr";
  
  // =====================================
  // VIRAL TEST
  // =====================================
  console.log("🔥 TEST 1: KONTEN VIRAL");
  // Let's prompt it to find something trending this week to see its "research"
  const viralPrompt = "Find a very recent, highly trending topic or controversy on social media right now (June 2026). Give me a mind-blowing aggressive take on it. No affiliate links. Pure engagement bait.";
  try {
    const content = await generateTumblrContent(viralPrompt, "", "", accountName, null, true);
    console.log("-> Caption:\n", content.caption);
    console.log("-> Full Image Prompt:\n", content.full_image_prompt || "NONE (Text Only Mode)");
    
    if (content.full_image_prompt) {
      const pngBuf = await fetchNativeAssetLocal(content.full_image_prompt);
      fs.writeFileSync('C:/Users/Axioo/.gemini/antigravity-ide/brain/5da522b4-77c5-47c4-b6ba-dfabe32807b0/viral_native.png', pngBuf);
      console.log("-> Saved viral_native.png");
    }
  } catch (e) {
    console.error("Viral Test Error:", e.message);
  }

  // =====================================
  // PROMO TEST
  // =====================================
  console.log("==========================================");
  console.log("💰 TEST 2: KONTEN AFFILIATE");
  const promoPrompt = "Enthusiastically recommend this tool: https://systeme.io/id?sa=sa0273997437b3abacdd34bc2577d7ca935ac6d6a5";
  try {
    const content = await generateTumblrContent(promoPrompt, "", "", accountName, null, false);
    console.log("-> Caption:\n", content.caption);
    console.log("-> Full Image Prompt:\n", content.full_image_prompt);
    
    if (content.full_image_prompt) {
      const pngBuf = await fetchNativeAssetLocal(content.full_image_prompt);
      fs.writeFileSync('C:/Users/Axioo/.gemini/antigravity-ide/brain/5da522b4-77c5-47c4-b6ba-dfabe32807b0/promo_native.png', pngBuf);
      console.log("-> Saved promo_native.png");
    }
  } catch (e) {
    console.error("Promo Test Error:", e.message);
  }
}

testSimulate().then(() => process.exit(0)).catch(console.error);
