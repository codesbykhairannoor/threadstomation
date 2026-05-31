import dotenv from 'dotenv';
dotenv.config({ override: true });

import { generateInstagramContent } from './lib/gemini_instagram.js';
import { generateInstagramSlideImages } from './lib/instagram_carousel.js';
import { postToInstagram } from './lib/instagram.js';
import { initDb } from './lib/database.js';

async function testFullPost() {
  await initDb();
  console.log('1. Gemini...');
  const content = await generateInstagramContent("Ceritakan keadaan manusia di Padang Mahsyar singkat.");
  console.log('2. Pollinations...');
  const urls = await generateInstagramSlideImages(content.slides.slice(0, 2)); // Just 2 slides for speed
  console.log('3. Graph API Publish...');
  try {
    const result = await postToInstagram(urls, content.caption, 1);
    console.log('Success:', result);
  } catch (e) {
    console.error('Publish Failed:', e.message);
  }
  process.exit(0);
}

testFullPost();
