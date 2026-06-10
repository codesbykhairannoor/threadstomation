import axios from 'axios';
import sql from './database.js';
import dotenv from 'dotenv';
dotenv.config({ override: true });

/**
 * Dynamically resolve Graph API endpoint based on the token.
 * Direct Instagram Graph tokens start with 'IG' or 'IGA' and use graph.instagram.com.
 * Facebook Login / Page access tokens use graph.facebook.com.
 */
export function getGraphBase(token) {
  if (token && (token.startsWith('IG') || token.startsWith('IGA'))) {
    return 'https://graph.instagram.com/v19.0';
  }
  return 'https://graph.facebook.com/v19.0';
}

/**
 * Get a valid access token for an Instagram account.
 */
export async function getInstagramAccessToken(accountId) {
  const rows = await sql`
    SELECT access_token, expires_at 
    FROM instagram_accounts 
    WHERE id = ${accountId}
  `;

  if (!rows.length || !rows[0].access_token) {
    throw new Error(`Instagram account (ID: ${accountId}) not linked. Please connect via Facebook/Instagram OAuth.`);
  }

  // Page tokens / System User tokens or Long-lived tokens usually don't expire for a long time (60 days or never)
  const { access_token, expires_at } = rows[0];
  if (expires_at) {
    const expiry = new Date(expires_at);
    // Refresh token if it expires in less than 5 days or is already expired
    if (expiry <= new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)) {
      try {
        console.log(`[Instagram] Token for account ${accountId} is nearing expiration. Attempting refresh...`);
        const newToken = await refreshInstagramAccessToken(access_token);
        const newExpiry = new Date(Date.now() + newToken.expires_in * 1000).toISOString();
        await sql`
          UPDATE instagram_accounts 
          SET access_token = ${newToken.access_token}, expires_at = ${newExpiry}
          WHERE id = ${accountId}
        `;
        return newToken.access_token;
      } catch (e) {
        console.error(`[Instagram] Failed to refresh token for account ${accountId}:`, e.message);
        // Fallback: use old token and hope it still works if it's a page token
      }
    }
  }

  return access_token;
}

/**
 * Refresh a long-lived access token
 */
export async function refreshInstagramAccessToken(longToken) {
  const base = getGraphBase(longToken);
  const res = await axios.get(`${base}/refresh_access_token`, {
    params: {
      grant_type: 'ig_refresh_token',
      access_token: longToken,
    },
  });
  return res.data; // { access_token, token_type, expires_in }
}

/**
 * Exchange a short-lived Facebook User Access Token for a long-lived one (expires in 60 days).
 */
export async function exchangeInstagramToken(shortToken) {
  const appId = process.env.THREADS_APP_ID; // We reuse Threads/FB credentials or load custom ones if configured
  const appSecret = process.env.THREADS_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error('THREADS_APP_ID or THREADS_APP_SECRET not configured in .env');
  }

  const base = getGraphBase(shortToken);
  const res = await axios.get(`${base}/oauth/access_token`, {
    params: {
      grant_type: 'fb_exchange_token',
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortToken,
    },
  });

  return res.data; // { access_token, token_type, expires_in }
}

/**
 * Fetch all linked Instagram Business accounts under the authorized user.
 */
export async function fetchInstagramAccounts(userAccessToken) {
  const base = getGraphBase(userAccessToken);
  // 1. Get Facebook pages linked to this user
  const pagesRes = await axios.get(`${base}/me/accounts`, {
    params: {
      fields: 'id,name,access_token,instagram_business_account{id,username,name,profile_picture_url}',
      access_token: userAccessToken,
    },
  });

  const pages = pagesRes.data.data || [];
  const accounts = [];

  for (const page of pages) {
    if (page.instagram_business_account) {
      accounts.push({
        facebook_page_id: page.id,
        facebook_page_name: page.name,
        instagram_business_id: page.instagram_business_account.id,
        username: page.instagram_business_account.username,
        name: page.instagram_business_account.name || page.instagram_business_account.username,
        profile_picture_url: page.instagram_business_account.profile_picture_url,
        // The Page Access Token is perfect for executing API calls on behalf of that page/Instagram account!
        page_access_token: page.access_token || userAccessToken,
      });
    }
  }

  return accounts;
}

/**
 * Helper: Wait for media container processing on Instagram.
 */
async function awaitContainerProcessing(accessToken, containerId, maxAttempts = 10) {
  const base = getGraphBase(accessToken);
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    try {
      const statusRes = await axios.get(`${base}/${containerId}`, {
        params: {
          fields: 'status_code',
          access_token: accessToken,
        },
      });
      const status = statusRes.data.status_code;
      console.log(`[Instagram-Publish] Container ${containerId} status (attempt ${attempt + 1}):`, status);

      if (status === 'FINISHED') return true;
      if (status === 'ERROR') {
        throw new Error('Instagram media container processing failed with status ERROR.');
      }
    } catch (e) {
      console.warn(`[Instagram-Publish] Container status query warning:`, e.message);
    }
  }
  return true; // Proceed anyway and hope for the best
}

/**
 * Publish a single photo to Instagram.
 */
export async function postInstagramSingleImage(imageUrl, caption, accountId) {
  const rows = await sql`SELECT instagram_business_id FROM instagram_accounts WHERE id = ${accountId}`;
  if (!rows.length) throw new Error(`Instagram account ${accountId} not found in DB`);
  const instagramBusinessId = rows[0].instagram_business_id;

  const accessToken = await getInstagramAccessToken(accountId);
  const base = getGraphBase(accessToken);

  // Step 1: Create media container
  console.log(`[Instagram-Post] Creating single image container for account ${accountId}...`);
  const containerRes = await axios.post(`${base}/${instagramBusinessId}/media`, null, {
    params: {
      image_url: imageUrl,
      caption: caption,
      access_token: accessToken,
    },
  });

  const containerId = containerRes.data.id;
  if (!containerId) throw new Error('Failed to retrieve Instagram media container ID');

  // Step 2: Wait for processing
  await awaitContainerProcessing(accessToken, containerId);

  // Step 3: Publish container
  console.log(`[Instagram-Post] Publishing media container ${containerId}...`);
  const publishRes = await axios.post(`${base}/${instagramBusinessId}/media_publish`, null, {
    params: {
      creation_id: containerId,
      access_token: accessToken,
    },
  });

  return { publishId: publishRes.data.id, status: 'success' };
}

/**
 * Publish a photo carousel to Instagram.
 */
export async function postInstagramCarousel(imageUrls, caption, accountId) {
  if (!imageUrls || imageUrls.length < 2) {
    throw new Error('Instagram carousel requires at least 2 images.');
  }

  const rows = await sql`SELECT instagram_business_id FROM instagram_accounts WHERE id = ${accountId}`;
  if (!rows.length) throw new Error(`Instagram account ${accountId} not found in DB`);
  const instagramBusinessId = rows[0].instagram_business_id;

  const accessToken = await getInstagramAccessToken(accountId);
  const base = getGraphBase(accessToken);

  // Step 1 & 2: Create individual item containers and wait concurrently
  console.log(`[Instagram-Post] Creating ${imageUrls.length} carousel item containers in parallel...`);
  const itemPromises = imageUrls.map(async (url, i) => {
    const itemRes = await axios.post(`${base}/${instagramBusinessId}/media`, null, {
      params: {
        image_url: url,
        is_carousel_item: true,
        access_token: accessToken,
      },
    });
    const itemId = itemRes.data.id;
    if (!itemId) throw new Error(`Failed to create carousel item container at index ${i}`);
    
    // Wait for this specific item to process
    await awaitContainerProcessing(accessToken, itemId);
    return itemId;
  });

  // Since order matters for carousels, Promise.all preserves the map order
  const itemIds = await Promise.all(itemPromises);

  // Step 3: Create carousel container
  console.log(`[Instagram-Post] Creating carousel container containing items:`, itemIds);
  const carouselRes = await axios.post(`${base}/${instagramBusinessId}/media`, null, {
    params: {
      media_type: 'CAROUSEL',
      children: itemIds.join(','),
      caption: caption,
      access_token: accessToken,
    },
  });

  const containerId = carouselRes.data.id;
  if (!containerId) throw new Error('Failed to create Instagram carousel container ID');

  // Step 4: Wait for carousel container processing
  await awaitContainerProcessing(accessToken, containerId);

  // Step 5: Publish container
  console.log(`[Instagram-Post] Publishing carousel container ${containerId}...`);
  const publishRes = await axios.post(`${base}/${instagramBusinessId}/media_publish`, null, {
    params: {
      creation_id: containerId,
      access_token: accessToken,
    },
  });

  return { publishId: publishRes.data.id, status: 'success' };
}

/**
 * Universal poster: handles either single image or carousel.
 */
export async function postToInstagram(imageUrls, caption, accountId) {
  try {
    if (Array.isArray(imageUrls) && imageUrls.length > 1) {
      return await postInstagramCarousel(imageUrls, caption, accountId);
    } else {
      const url = Array.isArray(imageUrls) ? imageUrls[0] : imageUrls;
      if (!url) throw new Error('No image URL provided for Instagram post');
      return await postInstagramSingleImage(url, caption, accountId);
    }
  } catch (e) {
    const errData = e.response?.data?.error || {};
    const msg = errData.message || e.message;
    console.error('[Instagram-Post] Error:', msg);
    throw new Error(`Instagram posting failed: ${msg}`);
  }
}

// ── FACEBOOK CROSS-POSTING ───────────────────────────────────────────────────

export async function postFacebookSingleImage(imageUrl, caption, fbPageId, accessToken) {
  const base = 'https://graph.facebook.com/v19.0';
  console.log(`[Facebook-Post] Publishing single photo to page ${fbPageId}...`);
  const res = await axios.post(`${base}/${fbPageId}/photos`, null, {
    params: {
      url: imageUrl,
      message: caption,
      access_token: accessToken,
    },
  });
  return { publishId: res.data.id, status: 'success' };
}

export async function postFacebookCarousel(imageUrls, caption, fbPageId, accessToken) {
  const base = 'https://graph.facebook.com/v19.0';
  console.log(`[Facebook-Post] Uploading ${imageUrls.length} unpublished photos for multi-photo post to page ${fbPageId}...`);
  
  // 1. Upload photos as unpublished
  const photoPromises = imageUrls.map(async (url, i) => {
    const res = await axios.post(`${base}/${fbPageId}/photos`, null, {
      params: {
        url: url,
        published: false,
        access_token: accessToken,
      },
    });
    return res.data.id;
  });
  
  const photoIds = await Promise.all(photoPromises);
  
  // 2. Publish multi-photo feed post
  console.log(`[Facebook-Post] Publishing feed post with attached media:`, photoIds);
  
  const params = {
    message: caption,
    access_token: accessToken,
  };
  
  photoIds.forEach((id, index) => {
    params[`attached_media[${index}]`] = JSON.stringify({ media_fbid: id });
  });

  const res = await axios.post(`${base}/${fbPageId}/feed`, null, {
    params: params
  });
  
  return { publishId: res.data.id, status: 'success' };
}

export async function postToFacebook(imageUrls, caption, accountId) {
  try {
    const rows = await sql`SELECT facebook_page_id, facebook_access_token, crosspost_to_facebook FROM instagram_accounts WHERE id = ${accountId}`;
    if (!rows.length) return { skipped: true, reason: 'Account not found' };
    
    const { facebook_page_id, facebook_access_token, crosspost_to_facebook } = rows[0];
    
    if (!crosspost_to_facebook) {
      console.log(`[Facebook-Post] Crossposting is disabled for account ${accountId}`);
      return { skipped: true, reason: 'Disabled' };
    }
    
    if (!facebook_page_id) {
      console.log(`[Facebook-Post] No facebook_page_id found for account ${accountId}. User needs to reconnect.`);
      return { skipped: true, reason: 'No Page ID' };
    }
    
    if (!facebook_access_token) {
      console.log(`[Facebook-Post] No facebook_access_token found. User needs to provide EAA token.`);
      return { skipped: true, reason: 'No Facebook Token' };
    }

    if (Array.isArray(imageUrls) && imageUrls.length > 1) {
      return await postFacebookCarousel(imageUrls, caption, facebook_page_id, facebook_access_token);
    } else {
      const url = Array.isArray(imageUrls) ? imageUrls[0] : imageUrls;
      return await postFacebookSingleImage(url, caption, facebook_page_id, facebook_access_token);
    }
  } catch (e) {
    const errData = e.response?.data?.error || {};
    const msg = errData.message || e.message;
    console.error('[Facebook-Post] Error:', msg);
    // We don't throw error to prevent failing the main IG post flow
    return { status: 'error', error: msg };
  }
}

