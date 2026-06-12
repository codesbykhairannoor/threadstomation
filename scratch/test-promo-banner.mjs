import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { generateTumblrContent } from '../lib/gemini_tumblr.js';
import { renderSlideToBuffer } from '../lib/layout_engine.js';
import { HfInference } from '@huggingface/inference';

// Replicate fetchAIForegroundAsset locally for testing
async function fetchAssetLocal(prompt) {
  try {
    const res = await fetch('https://picsum.photos/1024/1024');
    const buffer = Buffer.from(await res.arrayBuffer());
    console.log("[Dummy-Asset] Using placeholder image from Picsum");
    return await sharp(buffer).png().toBuffer();
  } catch(e) {
    console.error("Dummy failed:", e);
    return null;
  }
}

async function testSimulate() {
  const accountName = "caridisinishop_tumblr";
  
  // =====================================
  // VIRAL TEST
  // =====================================
  console.log("🔥 TEST 1: KONTEN VIRAL");
  const viralPrompt = "Research and discuss a highly engaging, current viral trending topic. DO NOT include any affiliate links. Just pure value and engagement.";
  try {
    const { slides, caption, hashtags } = await generateTumblrContent(viralPrompt, "", "", accountName, null, false);
    console.log("-> Caption:\n", caption);
    
    const fgBuffer = await fetchAssetLocal(slides[0].foreground_subject_prompt);
    const pngBuf = await renderSlideToBuffer(slides[0], fgBuffer, { name: 'viral', bg1: '#0f172a', bg2: '#0f172a', accent: '#00ff8c', text: '#ffffff' }, accountName);
    
    fs.writeFileSync('C:/Users/Axioo/.gemini/antigravity-ide/brain/5da522b4-77c5-47c4-b6ba-dfabe32807b0/viral_test.png', pngBuf);
    console.log("-> Saved viral_test.png");
  } catch (e) {
    console.error("Viral Test Error:", e.message);
  }

  // =====================================
  // PROMO TEST
  // =====================================
  console.log("💰 TEST 2: KONTEN AFFILIATE");
  const promoPrompt = "Aggressively promote this tool: https://systeme.io/id?sa=sa0273997437b3abacdd34bc2577d7ca935ac6d6a5";
  try {
    const { slides, caption, hashtags } = await generateTumblrContent(promoPrompt, "", "", accountName, null, false);
    console.log("-> Caption:\n", caption);
    
    const fgBuffer = await fetchAssetLocal(slides[0].foreground_subject_prompt);
    const pngBuf = await renderSlideToBuffer(slides[0], fgBuffer, { name: 'systeme', bg1: '#ffffff', bg2: '#ffffff', accent: '#1778f2', text: '#000000' }, accountName);
    
    fs.writeFileSync('C:/Users/Axioo/.gemini/antigravity-ide/brain/5da522b4-77c5-47c4-b6ba-dfabe32807b0/promo_test.png', pngBuf);
    console.log("-> Saved promo_test.png");
  } catch (e) {
    console.error("Promo Test Error:", e.message);
  }
}

testSimulate().then(() => process.exit(0)).catch(console.error);
