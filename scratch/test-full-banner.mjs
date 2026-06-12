import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import { HfInference } from '@huggingface/inference';

async function testFullBannerGeneration() {
  const sfKeys = [
    process.env.SILICONFLOW_API_KEY,
    process.env.SILICONFLOW_API_KEY_2
  ].filter(Boolean);

  const prompt = "A highly converting promotional banner for a SaaS tool. Modern, sleek, dark mode design with neon blue accents. Bold text that says 'Start Your Free Trial' and 'Claim Now'. 3D elements floating around.";

  console.log(`[Test] Requesting: "${prompt}"`);
  
  let assetBuffer = null;
  
  // Try SiliconFlow First
  console.log(`[Test] Attempting SiliconFlow API...`);
  const sfModels = ['black-forest-labs/FLUX.1-schnell'];
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
            console.log(`[Test] ✅ SiliconFlow SUCCESS using ${model}`);
            break outer;
          }
        } else {
          console.error("SF error:", await res.text());
        }
      } catch(e) { console.warn(`SF ${model} error:`, e.message); }
    }
  }

  if (assetBuffer) {
    fs.writeFileSync('C:/Users/Axioo/.gemini/antigravity-ide/brain/5da522b4-77c5-47c4-b6ba-dfabe32807b0/full_ai_banner.png', assetBuffer);
    console.log("-> Saved full_ai_banner.png");
  } else {
    console.log("Failed to generate.");
  }
}

testFullBannerGeneration().then(() => process.exit(0)).catch(console.error);
