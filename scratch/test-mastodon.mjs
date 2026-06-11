import sql from '../lib/database.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { generateTumblrContent } from '../lib/gemini_tumblr.js';
import { generateInstagramSlideImages } from '../lib/instagram_carousel.js';
import { uploadMediaToMastodon, postToMastodon } from '../lib/mastodon.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env'), override: true });

async function testMastodon() {
  await import('../lib/database.js').then(db => db.initDb());
  const token = process.env.MASTODON_ACCESS_TOKEN;
  
  const customPrompt = "Promote make.com with a heavy focus on saving time";
  const { slides, caption, hashtags } = await generateTumblrContent(customPrompt, '', '', "caridisinishop_mastodon", null);
  console.log(`[Mastodon-Test] Generated with ${slides.length} images`);

  let dynamicPalette = { name: 'make', bg1: '#ffffff', bg2: '#ffffff', accent: '#7b2cbf', text: '#000000' };

  let imageUrls = [];
  if (slides && slides.length > 0) {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      imageUrls = await generateInstagramSlideImages(slides, dynamicPalette, "caridisinishop_mastodon");
    } else {
      console.log('Skipping Supabase upload locally due to missing key');
      imageUrls = ['https://via.placeholder.com/800x600?text=Test+Mastodon+Image'];
    }
  }

  let mediaIds = [];
  for (const url of imageUrls) {
    const id = await uploadMediaToMastodon(url, token, 'https://mastodon.social');
    mediaIds.push(id);
  }

  let cleanText = caption.replace(/<[^>]+>/g, '').trim();
  if (cleanText.length > 480) {
    cleanText = cleanText.substring(0, 480) + '...';
  }

  const hashtagsText = hashtags && hashtags.length > 0 ? `\n\n${hashtags.map(h => '#' + h.replace('#', '')).join(' ')}` : '';
  const statusText = `${cleanText}${hashtagsText}`.substring(0, 500);

  const response = await postToMastodon(token, 'https://mastodon.social', statusText, mediaIds);
  console.log(`[Mastodon-Test] Success! Post ID: ${response.id}`);
  process.exit(0);
}

testMastodon().catch(e => {
  console.error('[Mastodon-Test] Error:', e.response?.data || e.message);
  process.exit(1);
});
