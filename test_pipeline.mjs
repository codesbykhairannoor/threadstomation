import { generateInstagramContent } from './lib/deepseek_instagram.js';
import { generateInstagramSlideImages } from './lib/instagram_carousel.js';
import fs from 'fs';

async function testPipeline() {
  try {
    console.log("1. Generating content with DeepSeek...");
    const content = await generateInstagramContent("Tips sehat untuk programmer yang sering begadang");
    console.log("DeepSeek Output:", JSON.stringify(content, null, 2));

    console.log("\n2. Generating AI Backgrounds and Compositing Slides...");
    const urls = await generateInstagramSlideImages(content.slides);
    console.log("\nSuccess! Generated Images:", urls);
  } catch (e) {
    console.error("Test failed:", e);
  }
}
testPipeline();
