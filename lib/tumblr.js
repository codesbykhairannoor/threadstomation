import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ override: true });

import sql from './database.js';

let cachedClientId = process.env.TUMBLR_CLIENT_ID || null;
let cachedClientSecret = process.env.TUMBLR_CLIENT_SECRET || null;

async function getTumblrCredentials() {
  if (cachedClientId && cachedClientSecret) {
    return { clientId: cachedClientId, clientSecret: cachedClientSecret };
  }
  try {
    const rows = await sql`SELECT key, value FROM tumblr_settings WHERE key IN ('tumblr_client_id', 'tumblr_client_secret')`;
    for (const r of rows) {
      if (r.key === 'tumblr_client_id' && r.value) cachedClientId = r.value;
      if (r.key === 'tumblr_client_secret' && r.value) cachedClientSecret = r.value;
    }
  } catch (e) {
    console.warn('[Tumblr-Auth] DB credential lookup note:', e.message);
  }
  return {
    clientId: cachedClientId || process.env.TUMBLR_CLIENT_ID,
    clientSecret: cachedClientSecret || process.env.TUMBLR_CLIENT_SECRET
  };
}

// Must match exact URL registered in Tumblr dashboard
const getRedirectUri = () => {
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/api/tumblr/callback`;
  }
  return 'https://threadstomation.vercel.app/api/tumblr/callback';
};

export function getTumblrAuthUrl(state) {
  const url = new URL('https://www.tumblr.com/oauth2/authorize');
  url.searchParams.append('client_id', cachedClientId || process.env.TUMBLR_CLIENT_ID);
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('scope', 'write offline_access');
  url.searchParams.append('state', state);
  return url.toString();
}

export async function getTumblrTokens(code) {
  const { clientId, clientSecret } = await getTumblrCredentials();
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  params.append('redirect_uri', getRedirectUri());

  const response = await axios.post('https://api.tumblr.com/v2/oauth2/token', params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  return response.data; // { access_token, refresh_token, expires_in }
}

export async function refreshTumblrToken(refreshToken) {
  const { clientId, clientSecret } = await getTumblrCredentials();
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);

  const response = await axios.post('https://api.tumblr.com/v2/oauth2/token', params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  return response.data; // { access_token, refresh_token, expires_in }
}

export async function getTumblrUserInfo(accessToken) {
  const response = await axios.get('https://api.tumblr.com/v2/user/info', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return response.data.response.user;
}

/**
 * Uploads posts (with optional images and heading1 title) as NPF (Neue Post Format) to Tumblr
 * @param {string} blogName The blog identifier (e.g., 'username' or 'username.tumblr.com')
 * @param {string} accessToken Valid OAuth2 access token
 * @param {string[]} imageUrls Array of image URLs or raw image buffers
 * @param {string} caption Markdown or plain text caption
 * @param {string[]} tags Array of tags
 * @param {string|null} title Optional explicit title/headline for the post
 */
export async function postToTumblr(blogName, accessToken, imageUrls = [], caption = '', tags = [], title = null) {
  // Construct NPF blocks
  const content = [];

  let finalTitle = title ? title.trim().replace(/^#+\s*/, '') : null;
  let finalBody = caption ? caption.trim() : '';

  // Auto-detect title from the first line of caption if no explicit title is provided
  if (!finalTitle && finalBody) {
    const lines = finalBody.split('\n');
    const firstLine = lines[0].trim();
    // If the first line is short and punchy (<= 140 chars) and followed by a blank line or starts with #
    if (firstLine && lines.length > 1 && (lines[1].trim() === '' || firstLine.startsWith('#')) && firstLine.length <= 150) {
      finalTitle = firstLine.replace(/^#+\s*/, '').replace(/^\*\*|\*\*$/g, '').trim();
      finalBody = lines.slice(lines[1].trim() === '' ? 2 : 1).join('\n').trim();
    }
  }

  // 1. Add Heading 1 (Title) as the first NPF block so Tumblr renders it with bold H1 headline styling
  if (finalTitle) {
    content.push({
      type: 'text',
      subtype: 'heading1',
      text: finalTitle
    });
  }

  // 2. Add images if any
  for (const item of imageUrls) {
    if (item && item.isRawBuffer) {
      content.push({
        type: 'image',
        media: [{
          type: 'image/jpeg',
          base64: item.buffer.toString('base64')
        }]
      });
    } else if (typeof item === 'string') {
      content.push({
        type: 'image',
        media: [{ url: item }]
      });
    }
  }

  // 3. Add text body
  if (finalBody) {
    content.push({
      type: 'text',
      text: finalBody
    });
  }

  const payload = {
    content: content,
    tags: tags.join(',')
  };

  try {
    const response = await axios.post(`https://api.tumblr.com/v2/blog/${blogName}/posts`, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.response; // usually contains { id: "12345" }
  } catch (err) {
    if (err.response?.data) {
      console.error('[Tumblr-API] Error detail:', JSON.stringify(err.response.data));
      const errMsg = err.response.data.errors ? JSON.stringify(err.response.data.errors) : JSON.stringify(err.response.data);
      throw new Error(`Tumblr API Error (${err.response.status}): ${errMsg}`);
    }
    throw err;
  }
}

