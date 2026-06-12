import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import { HfInference } from '@huggingface/inference';

async function generate() {
  const hfToken = process.env.HF_TOKEN;
  const hf = new HfInference(hfToken);
  
  console.log("Generating with HF FLUX...");
  try {
    const blob = await hf.textToImage({
      model: 'black-forest-labs/FLUX.1-schnell',
      inputs: "A highly converting promotional banner for a SaaS tool. Modern, sleek, dark mode design with neon blue accents. Prominent, perfectly spelled bold text in the center that reads: 'START YOUR FREE TRIAL'. 3D elements floating around, photorealistic, 8k resolution, cinematic lighting.",
      parameters: { width: 1024, height: 1024 }
    });
    const buffer = Buffer.from(await blob.arrayBuffer());
    fs.writeFileSync('C:/Users/Axioo/.gemini/antigravity-ide/brain/5da522b4-77c5-47c4-b6ba-dfabe32807b0/full_ai_banner.png', buffer);
    console.log("Done: full_ai_banner.png");
  } catch (e) {
    console.error("HF failed:", e.message);
  }
}

generate();
