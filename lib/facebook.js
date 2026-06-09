import axios from 'axios';
import sql from './database.js';
import dotenv from 'dotenv';
import { generateCarouselSlides } from './gemini.js';
import { renderSlideToBuffer } from './layout_engine.js';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ override: true });

const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

const FB_BASE = 'https://graph.facebook.com/v19.0';

/**
 * Get valid Page Access Token
 * If the stored token is a user token, this will try to exchange it for a page token.
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
    // Attempt to get page access token using the stored token
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
    // If it fails (maybe it's already a page token or permission issues), fallback to stored token
    console.log(`[Facebook] Page token exchange failed, using stored token: ${e.message}`);
  }

  return access_token;
}

/**
 * Post single photo to Facebook Page
 */
export async function postPhotoToFacebook(pageId, token, imageUrl, caption) {
  const res = await axios.post(`${FB_BASE}/${pageId}/photos`, {
    url: imageUrl,
    caption: caption,
    access_token: token
  });
  return res.data; // { id, post_id }
}

/**
 * Post multi-photo (carousel-like) to Facebook Page
 */
export async function postMultiPhotoToFacebook(pageId, token, imageUrls, caption) {
  // 1. Upload photos as unpublished
  const mediaIds = [];
  for (const url of imageUrls) {
    const res = await axios.post(`${FB_BASE}/${pageId}/photos`, {
      url: url,
      published: false,
      access_token: token
    });
    mediaIds.push(res.data.id);
  }

  // 2. Create post with attached media
  const attachedMedia = mediaIds.map(id => ({ media_fbid: id }));
  const res = await axios.post(`${FB_BASE}/${pageId}/feed`, {
    message: caption,
    attached_media: JSON.stringify(attachedMedia),
    access_token: token
  });

  return res.data; // { id }
}

async function uploadToSupabase(jpegBuffer, fileName) {
  if (!supabase) throw new Error('Supabase client not initialized.');
  const { error } = await supabase.storage
    .from('media')
    .upload(fileName, jpegBuffer, { contentType: 'image/jpeg', upsert: true });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);
  return `https://threadstomation.vercel.app/supabase-media/${fileName}`;
}

/**
 * Full flow: Generate slides -> Render -> Upload -> Post to Facebook
 */
export async function runFacebookCarouselPost(accountId, customPrompt = null) {
  const acc = await sql`SELECT * FROM facebook_accounts WHERE id = ${accountId}`.then(r => r[0]);
  if (!acc) throw new Error("Account not found");

  console.log(`[Facebook] Generating slides for ${acc.name}...`);
  const slides = await generateCarouselSlides('instagram', customPrompt, accountId); 
  // We use 'instagram' slide generator because it's square and fits FB well

  const uploadedUrls = [];
  const timestamp = Date.now();

  for (let i = 0; i < slides.length; i++) {
    console.log(`[Facebook] Rendering slide ${i+1}/${slides.length}...`);
    const buffer = await renderSlideToBuffer(slides[i]);
    const fileName = `fb_${accountId}_${timestamp}_${i}.jpg`;
    const url = await uploadToSupabase(buffer, fileName);
    uploadedUrls.push(url);
  }

  const caption = slides[0].caption || 'Check out our new update!';
  console.log(`[Facebook] Publishing to Page ${acc.facebook_page_id}...`);
  
  const token = await getFacebookAccessToken(accountId);
  const result = await postMultiPhotoToFacebook(acc.facebook_page_id, token, uploadedUrls, caption);

  await sql`
    INSERT INTO facebook_history (account_id, caption, slide_count, image_urls, post_id, status)
    VALUES (${accountId}, ${caption}, ${uploadedUrls.length}, ${uploadedUrls.join(',')}, ${result.id}, 'success')
  `;

  return { success: true, postId: result.id };
}
