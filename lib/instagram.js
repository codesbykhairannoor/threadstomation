import axios from 'axios';
import sql from './database.js';
import dotenv from 'dotenv';
dotenv.config({ override: true });

const GRAPH_BASE = 'https://graph.facebook.com/v19.0';

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
  // We return it directly. If expires_at is set and past, we warn or throw.
  const { access_token, expires_at } = rows[0];
  if (expires_at) {
    const expiry = new Date(expires_at);
    if (expiry <= new Date()) {
      throw new Error(`Instagram access token for account ${accountId} has expired. Please re-authenticate.`);
    }
  }

  return access_token;
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

  const res = await axios.get(`${GRAPH_BASE}/oauth/access_token`, {
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
  // 1. Get Facebook pages linked to this user
  const pagesRes = await axios.get(`${GRAPH_BASE}/me/accounts`, {
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
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    try {
      const statusRes = await axios.get(`${GRAPH_BASE}/${containerId}`, {
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

  // Step 1: Create media container
  console.log(`[Instagram-Post] Creating single image container for account ${accountId}...`);
  const containerRes = await axios.post(`${GRAPH_BASE}/${instagramBusinessId}/media`, null, {
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
  const publishRes = await axios.post(`${GRAPH_BASE}/${instagramBusinessId}/media_publish`, null, {
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

  // Step 1: Create individual item containers
  console.log(`[Instagram-Post] Creating ${imageUrls.length} carousel item containers...`);
  const itemIds = [];
  for (let i = 0; i < imageUrls.length; i++) {
    const itemRes = await axios.post(`${GRAPH_BASE}/${instagramBusinessId}/media`, null, {
      params: {
        image_url: imageUrls[i],
        is_carousel_item: true,
        access_token: accessToken,
      },
    });
    const itemId = itemRes.data.id;
    if (!itemId) throw new Error(`Failed to create carousel item container at index ${i}`);
    itemIds.push(itemId);
  }

  // Step 2: Wait for items to compile
  console.log(`[Instagram-Post] Waiting for items to process...`);
  for (const itemId of itemIds) {
    await awaitContainerProcessing(accessToken, itemId);
  }

  // Step 3: Create carousel container
  console.log(`[Instagram-Post] Creating carousel container containing items:`, itemIds);
  const carouselRes = await axios.post(`${GRAPH_BASE}/${instagramBusinessId}/media`, null, {
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
  const publishRes = await axios.post(`${GRAPH_BASE}/${instagramBusinessId}/media_publish`, null, {
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
