import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import { HfInference } from '@huggingface/inference';

async function generate() {
  const hfTokens = [
    process.env.HF_TOKEN,
    process.env.HF_TOKEN_2,
    process.env.HF_TOKEN_3,
    process.env.HF_TOKEN_4
  ].filter(Boolean);
  
  console.log(`Found ${hfTokens.length} Hugging Face tokens.`);

  for (let i = 0; i < hfTokens.length; i++) {
    const token = hfTokens[i];
    console.log(`\nTesting HF Token #${i+1}...`);
    try {
      const hf = new HfInference(token);
      const blob = await hf.textToImage({
        model: 'black-forest-labs/FLUX.1-schnell',
        inputs: "A highly converting promotional banner for a SaaS tool. Modern, sleek, dark mode design with neon blue accents. Prominent, perfectly spelled bold text in the center that reads: 'START YOUR FREE TRIAL'. 3D elements floating around, photorealistic, 8k resolution, cinematic lighting.",
        parameters: { width: 1024, height: 1024 }
      });
      const buffer = Buffer.from(await blob.arrayBuffer());
      fs.writeFileSync(`C:/Users/Axioo/.gemini/antigravity-ide/brain/5da522b4-77c5-47c4-b6ba-dfabe32807b0/hf_success_token_${i+1}.png`, buffer);
      console.log(`✅ SUCCESS on Token #${i+1}! Saved image.`);
      break; // Stop after first success
    } catch (e) {
      console.error(`❌ HF Token #${i+1} failed:`, e.message);
    }
  }
}

generate();
