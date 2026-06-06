import { generateInstagramSlideImages } from './lib/instagram_carousel.js';
import fs from 'fs';

async function test() {
  const mockSlides = [
    {
      layout_type: 'CenterMockup',
      title_part1: 'Website Lemot',
      title_part2: 'Pas Traffic Lagi Tinggi!!',
      body: 'Selengkapnya',
      foreground_subject_prompt: 'A sleek modern silver laptop displaying a clean dashboard',
      background_theme: 'Navy'
    },
    {
      layout_type: 'LeftPerson',
      title_part1: 'Ubah Pengunjung',
      title_part2: 'Jadi Pembeli',
      body: 'Swipe >>',
      foreground_subject_prompt: 'A sleek silver laptop on a desk showing website conversion metrics',
      background_theme: 'Neon Green'
    },
    {
      layout_type: 'PureAI',
      title_part1: '',
      title_part2: '',
      body: '',
      foreground_subject_prompt: 'A premium minimalist Instagram slide layout. Flat navy blue background. In the center, the text "Sharesa Space" is written in huge bold clean futuristic neon green and white typography. Below, a minimalist 3D rendering of a futuristic laptop, modern agency style, clean layout',
      background_theme: 'Pure AI Slide'
    }
  ];

  const palette = [
    { bg1: '#1e2a39', bg2: '#1e2a39', accent: '#00ff8c', text: '#ffffff' }, // Navy dominant
    { bg1: '#00ff8c', bg2: '#00ff8c', accent: '#1e2a39', text: '#1e2a39' }, // Green dominant
    { bg1: '#ffffff', bg2: '#ffffff', accent: '#00ff8c', text: '#1e2a39' }  // White dominant
  ];
  
  try {
    console.log('Testing generateInstagramSlideImages with null palette (default rotation)...');
    const urls = await generateInstagramSlideImages(mockSlides, null, '@sharesa.space');
    console.log('Success! Generated URLs:', urls);
  } catch (e) {
    console.error('Failed:', e);
  }
}

test();
