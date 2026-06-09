import sql, { initDb } from '../lib/database.js';
import { generateInstagramContent } from '../lib/gemini_instagram.js';
import { generateInstagramSlideImages } from '../lib/instagram_carousel.js';
import { postToInstagram } from '../lib/instagram.js';

async function run() {
  try {
    console.log('Initializing DB...');
    await initDb();
    const accountId = 2; // oneformind
    const customPrompt = 'How to achieve Deep Work';
    
    // Get account details
    const account = await sql`SELECT * FROM instagram_accounts WHERE id = ${accountId}`;
    if (!account.length) throw new Error(`Instagram account ${accountId} not found`);

    const masterPrompt = account[0].master_prompt || '';
    const visualTheme = account[0].visual_theme || '';
    const colorPalette = account[0].color_palette || null;
    const accountName = account[0].name || "@instagram";

    console.log(`[Instagram-Post] Generating content for account ${accountId}...`);

    // Step 1: Generate slide contents + caption
    const { slides, caption, hashtags } = await generateInstagramContent(customPrompt, masterPrompt, visualTheme, accountName, accountId);
    console.log(`[Instagram-Post] ${slides.length} slides generated:`, JSON.stringify(slides, null, 2));

    // Step 2: Render slides via Satori/ImgLy & Upload to Supabase Storage
    const imageUrls = await generateInstagramSlideImages(slides, colorPalette, accountName);
    console.log(`[Instagram-Post] ${imageUrls.length} images generated and uploaded to Supabase:`, imageUrls);

    // Step 3: Publish to Instagram
    const hashtagStr = hashtags.map(h => `#${h}`).join(' ');
    const finalCaption = `${caption}\n\n${hashtagStr}`;
    
    console.log('Posting to Instagram...');
    const result = await postToInstagram(imageUrls, finalCaption, accountId);
    console.log('Result:', result);
  } catch (err) {
    console.error('CRITICAL ERROR:', err);
  } finally {
    process.exit(0);
  }
}

run();
