import dotenv from 'dotenv';
dotenv.config();

import { generateTumblrContent } from '../lib/gemini_tumblr.js';

async function runTests() {
  const customPrompt = "Systeme.io, The Ultimate All-in-One Marketing Platform: https://systeme.io/?sa=sa0154070058e57ee8c7407004f20bfb111a4362a9";
  const masterPrompt = "Aggressive affiliate marketer who loves sharing SaaS deals.";
  const visualTheme = "Tech Startups";

  console.log("==========================================");
  console.log("🧪 TESTING BLUESKY (Max 280 Chars, No Image)");
  console.log("==========================================");
  try {
    const bluesky = await generateTumblrContent(customPrompt, masterPrompt, visualTheme, "caridisinishop_bluesky", null, true, 280);
    console.log(`Caption Length: ${bluesky.caption.length}`);
    console.log(`Caption Content:\n${bluesky.caption}\n`);
  } catch (e) {
    console.error("Bluesky error:", e.message);
  }

  console.log("==========================================");
  console.log("🧪 TESTING MASTODON (Max 480 Chars, No Image)");
  console.log("==========================================");
  try {
    const mastodon = await generateTumblrContent(customPrompt, masterPrompt, visualTheme, "caridisinishop_mastodon", null, true, 480);
    console.log(`Caption Length: ${mastodon.caption.length}`);
    console.log(`Caption Content:\n${mastodon.caption}\n`);
  } catch (e) {
    console.error("Mastodon error:", e.message);
  }

  console.log("==========================================");
  console.log("🧪 TESTING DEV.TO (No Limit, No Image)");
  console.log("==========================================");
  try {
    const devto = await generateTumblrContent(customPrompt, masterPrompt, visualTheme, "caridisinishop_devto", null, true, null);
    console.log(`Caption Length: ${devto.caption.length}`);
    console.log(`Caption Content:\n${devto.caption.substring(0, 500)}...\n`);
  } catch (e) {
    console.error("DevTo error:", e.message);
  }

  console.log("==========================================");
  console.log("🧪 TESTING TUMBLR (No Limit, Allows Image)");
  console.log("==========================================");
  try {
    // pass false for forceNoImage to allow image random chance
    const tumblr = await generateTumblrContent(customPrompt, masterPrompt, visualTheme, "caridisinishop_tumblr", null, false, null);
    console.log(`Has Image Slide? ${tumblr.slides.length > 0 ? 'YES' : 'NO'}`);
    console.log(`Caption Length: ${tumblr.caption.length}`);
    console.log(`Caption Content:\n${tumblr.caption.substring(0, 500)}...\n`);
  } catch (e) {
    console.error("Tumblr error:", e.message);
  }
}

runTests().then(() => process.exit(0)).catch(console.error);
