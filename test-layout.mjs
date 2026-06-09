import { generateInstagramSlideImages } from './lib/instagram_carousel.js';
import fs from 'fs';

async function runTest() {
  const slides = [
    {
      layout_type: 'CenterMockup',
      title_part1: 'Website',
      title_part2: 'Ngebut?',
      body: 'Desain Profesional, Hosting Premium, Support Cepat.',
      foreground_subject_prompt: 'A sleek modern laptop displaying a dashboard, isolated on pure white background'
    }
  ];

  console.log('Generating slide with new white background logic...');
  try {
    const urls = await generateInstagramSlideImages(slides);
    console.log('Done! Result:', urls);
  } catch(e) {
    console.error('Error:', e);
  }
}

runTest();
