import dotenv from 'dotenv';
dotenv.config({ override: true });

import { generateInstagramSlideImages } from './lib/instagram_carousel.js';
import fs from 'fs';

async function testGeminiCarousel() {
  const slides = [
    {
      title: "Test Gemini Image",
      body: "Testing the newly added Gemini Image Generator with text overlay compositing.",
      image_prompt: "A beautiful cinematic shot of a mosque at sunset with golden hour lighting."
    }
  ];

  console.log('Testing slide generation...');
  try {
    const urls = await generateInstagramSlideImages(slides);
    console.log('SUCCESS! Uploaded to:', urls);
  } catch (e) {
    console.error('FAILED:', e.message);
  }
  process.exit(0);
}

testGeminiCarousel();
