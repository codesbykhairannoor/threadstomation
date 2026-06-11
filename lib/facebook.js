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
 * Post multi-photo to Facebook Page
 * Meta API requires form-encoded for attached_media or very specific JSON formatting.
 * Using URLSearchParams (form-encoded) is the most reliable way.
 */
export async function postMultiPhotoToFacebook(pageId, token, imageUrls, caption) {
  const mediaIds = [];
  
  // 1. Upload photos as UNPUBLISHED first to get IDs
  for (const url of imageUrls) {
    try {
      console.log(`[Facebook-Upload] Uploading unpublished photo: ${url.substring(0, 60)}...`);
      const res = await axios.post(`${FB_BASE}/${pageId}/photos`, {
        url: url,
        published: false,
        access_token: token
      });
      mediaIds.push(res.data.id);
    } catch (err) {
      console.error('[Facebook-Upload] Error:', err.response?.data || err.message);
      throw new Error(`Facebook Photo Upload Failed: ${err.response?.data?.error?.message || err.message}`);
    }
  }

  // 2. Create the feed post with attached media
  const attachedMedia = mediaIds.map(id => ({ media_fbid: id }));
  
  try {
    console.log(`[Facebook-Feed] Publishing feed with ${mediaIds.length} photos...`);
    
    // Use URLSearchParams to force application/x-www-form-urlencoded
    // This is the preferred way for Meta Graph API when sending JSON-strings in parameters
    const params = new URLSearchParams();
    params.append('message', caption);
    params.append('attached_media', JSON.stringify(attachedMedia));
    params.append('access_token', token);

    const res = await axios.post(`${FB_BASE}/${pageId}/feed`, params);
    return res.data;
  } catch (err) {
    console.error('[Facebook-Feed] Error:', err.response?.data || err.message);
    throw new Error(`Facebook Feed Post Failed: ${err.response?.data?.error?.message || err.message}`);
  }
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

  // Detect Affiliate Product for Dynamic Color Palette
  let dynamicPalette = acc.color_palette ? JSON.parse(acc.color_palette) : null;
  if (customPrompt) {
    const cp = customPrompt.toLowerCase();
    if (cp.includes('make.com')) {
      dynamicPalette = { name: 'make', bg1: '#ffffff', bg2: '#ffffff', accent: '#7b2cbf', text: '#000000' };
    } else if (cp.includes('wise.com')) {
      dynamicPalette = { name: 'wise', bg1: '#ffffff', bg2: '#ffffff', accent: '#9fe870', text: '#000000' };
    } else if (cp.includes('systeme')) {
      dynamicPalette = { name: 'systeme', bg1: '#ffffff', bg2: '#ffffff', accent: '#1778f2', text: '#000000' };
    }
  }

  // 2. Render Slide Images + Upload to Supabase (Carousel Engine)
  const imageUrls = await generateInstagramSlideImages(
    slides, 
    dynamicPalette, 
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
