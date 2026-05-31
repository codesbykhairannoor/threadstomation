import dotenv from 'dotenv';
dotenv.config({ override: true });

import { generateInstagramContent } from './lib/gemini_instagram.js';
import { generateInstagramSlideImages } from './lib/instagram_carousel.js';
import sql, { initDb } from './lib/database.js';

async function testFullPipeline() {
  await initDb();
  
  try {
    const customPrompt = "Ceritakan keadaan manusia saat dikumpulkan di Padang Mahsyar dan bagikan tips amalan agar mendapatkan naungan Arsy Allah di hari yang terik itu. sertakan dalil.";
    
    console.log('1. Generating content with Gemini...');
    const content = await generateInstagramContent(customPrompt, "Gunakan tone serius tapi menenangkan.");
    console.log('Gemini Content:', JSON.stringify(content, null, 2));
    
    console.log('2. Generating slide images via Pollinations + SVG Composite...');
    // Testing only the first slide to save time and API calls
    const testSlides = [content.slides[0]];
    const urls = await generateInstagramSlideImages(testSlides);
    
    console.log('Generated Slide URLs:', urls);
    
    console.log('Test completed successfully! No 402 errors or syntax issues.');
  } catch (e) {
    console.error('Test Failed:', e.message);
    if (e.response) {
      console.error('Status:', e.response.status);
      console.error('Response:', e.response.data);
    }
    process.exit(1);
  }
  
  process.exit(0);
}

testFullPipeline();
