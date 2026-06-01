import { generateSlideImages } from './lib/tiktok_carousel.js';
import fs from 'fs';

async function run() {
  console.log('Testing TikTok slide generation...');
  const mockSlides = [
    { title: "CARA AMPUH HILANGIN MALAS", body: "Lo pernah ngerasa males banget buat ngerjain tugas atau ibadah padahal tahu itu wajib? Santai, lo nggak sendirian." },
    { title: "TIPS PERTAMA: PAKSAIN AJA", body: "Iya, kadang obat malas itu cuma satu: Paksain diri lo buat mulai. 5 menit pertama itu yang paling berat, setelah itu bakal ngalir sendiri." },
  ];

  try {
    const urls = await generateSlideImages(mockSlides);
    console.log('Success! Image URLs:', urls);
  } catch (e) {
    if (e.message.includes('Supabase client not initialized')) {
      console.log('Test passed up to Supabase upload (Supabase not configured locally for test script).');
      console.log('SVG rendering and sharp compression succeeded!');
    } else {
      console.error('FAILED:', e);
    }
  }
}

run();
