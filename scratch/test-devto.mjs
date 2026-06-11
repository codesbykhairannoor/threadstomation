import sql from '../lib/database.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { generateTumblrContent } from '../lib/gemini_tumblr.js';
import { generateInstagramSlideImages } from '../lib/instagram_carousel.js';
import { postToDevto } from '../lib/devto.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env'), override: true });

async function testDevto() {
  await import('../lib/database.js').then(db => db.initDb());
  const token = process.env.DEVTO_API_KEY;
  if (!token) throw new Error('No DEVTO_API_KEY');
  
  const customPrompt = "Write an article promoting systeme.io for developers";
  const { slides, caption, hashtags } = await generateTumblrContent(customPrompt, '', '', "caridisinishop_devto", null);
  console.log(`[Devto-Test] Generated with ${slides.length} images`);

  let dynamicPalette = { name: 'systeme', bg1: '#ffffff', bg2: '#ffffff', accent: '#1778f2', text: '#000000' };

  let imageUrls = [];
  if (slides && slides.length > 0) {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      imageUrls = await generateInstagramSlideImages(slides, dynamicPalette, "caridisinishop_devto");
    } else {
      console.log('Skipping Supabase upload locally due to missing key');
      imageUrls = ['https://via.placeholder.com/800x600?text=Test+Devto+Image'];
    }
  }

  let markdownBody = "";
  if (imageUrls.length > 0) {
    markdownBody += `![Cover Image](${imageUrls[0]})\n\n`;
  }
  
  let cleanText = caption.replace(/<br\s*\/?>/gi, '\n');
  let titleMatch = cleanText.match(/^([^\n]{10,60})(?:\n|$)/);
  let articleTitle = titleMatch ? titleMatch[1] : (customPrompt || 'Amazing Tools You Need to Try');
  articleTitle = articleTitle.replace(/<[^>]+>/g, '').replace(/[\*#]/g, '').trim();
  if (articleTitle.length < 5) articleTitle = "Awesome Recommendations For You";

  if (cleanText.startsWith(articleTitle)) {
      cleanText = cleanText.substring(articleTitle.length).trim();
  }

  markdownBody += cleanText;

  const response = await postToDevto(token, articleTitle, markdownBody, hashtags);
  console.log(`[Devto-Test] Success! Post ID: ${response.id}`);
  process.exit(0);
}

testDevto().catch(e => {
  console.error('[Devto-Test] Error:', e.response?.data || e.message);
  process.exit(1);
});
