import axios from 'axios';
import sql from './database.js';
import dotenv from 'dotenv';
import { generateInstagramContent } from './gemini_instagram.js';
import { generateInstagramSlideImages } from './instagram_carousel.js';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ override: true });

const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

const FB_BASE = 'https://graph.facebook.com/v19.0';

/**
 * Get valid Page Access Token
 */
export async function getFacebookAccessToken(accountId) {
  const rows = await sql`
    SELECT access_token, facebook_page_id FROM facebook_accounts WHERE id = ${accountId}
  `;
  if (!rows.length || !rows[0].access_token) {
    throw new Error(`Facebook account (ID: ${accountId}) not found.`);
  }

  const { access_token, facebook_page_id } = rows[0];

  try {
    const res = await axios.get(`${FB_BASE}/${facebook_page_id}`, {
      params: {
        fields: 'access_token',
        access_token: access_token
      }
    });
    if (res.data.access_token) {
      return res.data.access_token;
    }
  } catch (e) {
    console.log(`[Facebook] Page token exchange failed, using stored token: ${e.message}`);
  }

  return access_token;
}

/**
 * Post multi-photo (carousel-like) to Facebook Page
 */
export async function postMultiPhotoToFacebook(pageId, token, imageUrls, caption) {
  const mediaIds = [];
  for (const url of imageUrls) {
    const res = await axios.post(`${FB_BASE}/${pageId}/photos`, {
      url: url,
      published: false,
      access_token: token
    });
    mediaIds.push(res.data.id);
  }

  const attachedMedia = mediaIds.map(id => ({ media_fbid: id }));
  const res = await axios.post(`${FB_BASE}/${pageId}/feed`, {
    message: caption,
    attached_media: JSON.stringify(attachedMedia),
    access_token: token
  });

  return res.data;
}

/**
 * Full flow: Generate slides -> Render -> Upload -> Post to Facebook
 */
export async function runFacebookCarouselPost(accountId, customPrompt = null) {
  const acc = await sql`SELECT * FROM facebook_accounts WHERE id = ${accountId}`.then(r => r[0]);
  if (!acc) throw new Error("Account not found");

  console.log(`[Facebook] Generating content for ${acc.name}...`);
  
  // 1. Generate Slide Content + Caption via Gemini (IG Engine)
  const { slides, caption, hashtags } = await generateInstagramContent(
    customPrompt, 
    acc.master_prompt, 
    acc.visual_theme, 
    acc.name, 
    accountId
  );

  // 2. Render Slide Images + Upload to Supabase (Carousel Engine)
  // This handles AI image generation and rendering internally
  const imageUrls = await generateInstagramSlideImages(
    slides, 
    acc.color_palette ? JSON.parse(acc.color_palette) : null, 
    acc.name
  );

  // 3. Post to Facebook
  const finalCaption = `${caption}\n\n${hashtags.map(h => `#${h}`).join(' ')}`;
  const token = await getFacebookAccessToken(accountId);
  const result = await postMultiPhotoToFacebook(acc.facebook_page_id, token, imageUrls, finalCaption);

  // 4. Record History
  await sql`
    INSERT INTO facebook_history (account_id, caption, slide_count, image_urls, post_id, status)
    VALUES (${accountId}, ${caption}, ${imageUrls.length}, ${JSON.stringify(imageUrls)}, ${result.id}, 'success')
  `;

  return { success: true, postId: result.id };
}
