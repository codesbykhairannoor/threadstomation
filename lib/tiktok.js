import axios from 'axios';
import sql from './database.js';
import dotenv from 'dotenv';
dotenv.config({ override: true });

const TIKTOK_BASE = 'https://open.tiktokapis.com';
const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;

// ── TOKEN MANAGEMENT ────────────────────────────────────────────────────────

/**
 * Get a valid access token for a TikTok account, auto-refresh if near expiry.
 */
export async function getTikTokAccessToken(accountId) {
  const rows = await sql`
    SELECT access_token, refresh_token, expires_at 
    FROM tiktok_accounts 
    WHERE id = ${accountId}
  `;

  if (!rows.length || !rows[0].access_token) {
    throw new Error(`TikTok account (ID: ${accountId}) not linked. Please connect via OAuth.`);
  }

  const { access_token, refresh_token, expires_at } = rows[0];
  const now = new Date();
  const expiry = new Date(expires_at);

  // Refresh if expiring within 2 hours
  if (expiry <= now || (expiry - now) < (2 * 60 * 60 * 1000)) {
    console.log(`[TikTok] Token for account ${accountId} expiring soon, refreshing...`);
    return await refreshTikTokToken(refresh_token, accountId);
  }

  return access_token;
}

/**
 * Refresh TikTok access token using refresh token (v2 OAuth).
 */
export async function refreshTikTokToken(refreshToken, accountId) {
  try {
    const params = new URLSearchParams({
      client_key: CLIENT_KEY,
      client_secret: CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    const res = await axios.post(`${TIKTOK_BASE}/v2/oauth/token/`, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token, refresh_token: new_refresh, expires_in } = res.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    await sql`
      UPDATE tiktok_accounts 
      SET access_token = ${access_token},
          refresh_token = ${new_refresh || refreshToken},
          expires_at = ${expiresAt}
      WHERE id = ${accountId}
    `;

    console.log(`[TikTok] ✅ Token refreshed for account ${accountId}`);
    return access_token;
  } catch (e) {
    const errMsg = e.response?.data?.error?.message || e.message;
    console.error(`[TikTok] Token refresh failed for account ${accountId}:`, errMsg);
    throw new Error(`TikTok token refresh failed: ${errMsg}`);
  }
}

/**
 * Exchange authorization code for tokens (OAuth callback).
 */
export async function exchangeCodeForToken(code, codeVerifier, redirectUri) {
  const params = new URLSearchParams({
    client_key: CLIENT_KEY,
    client_secret: CLIENT_SECRET,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const res = await axios.post(`${TIKTOK_BASE}/v2/oauth/token/`, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  return res.data; // { access_token, refresh_token, expires_in, open_id, scope }
}

/**
 * Get TikTok user info (open_id, display_name, avatar_url).
 */
export async function getTikTokUserInfo(accessToken) {
  const res = await axios.get(`${TIKTOK_BASE}/v2/user/info/`, {
    params: { fields: 'open_id,union_id,display_name,avatar_url' },
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (res.data.error?.code !== 'ok') {
    throw new Error(`TikTok user info error: ${res.data.error?.message}`);
  }
  return res.data.data.user;
}

// ── CONTENT POSTING ──────────────────────────────────────────────────────────

/**
 * Query creator info to get valid privacy levels (REQUIRED before posting).
 */
async function queryCreatorInfo(accessToken) {
  try {
    const res = await axios.post(`${TIKTOK_BASE}/v2/post/publish/creator_info/query/`, {}, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      }
    });

    if (res.data.error?.code !== 'ok') {
      console.warn('[TikTok] Creator info warning:', res.data.error?.message);
      return { privacy_level_options: ['PUBLIC_TO_EVERYONE'] };
    }

    return res.data.data;
  } catch (e) {
    console.warn('[TikTok] Creator info fetch failed, using default privacy:', e.message);
    return { privacy_level_options: ['PUBLIC_TO_EVERYONE'] };
  }
}

/**
 * Post a photo carousel to TikTok.
 * @param {string[]} imageUrls - public JPEG URLs (3–5 images)
 * @param {string} caption - post caption
 * @param {string[]} hashtags - array of hashtag strings (no #)
 * @param {number} accountId - tiktok_accounts.id
 */
export async function postTikTokCarousel(imageUrls, caption, hashtags = [], accountId) {
  if (!imageUrls || imageUrls.length < 3) {
    throw new Error('TikTok carousel requires at least 3 images.');
  }

  const accessToken = await getTikTokAccessToken(accountId);

  // Step 1: Get creator info for valid privacy level
  const creatorInfo = await queryCreatorInfo(accessToken);
  const privacyOptions = creatorInfo.privacy_level_options || ['PUBLIC_TO_EVERYONE'];

  let privacyLevel = privacyOptions.includes('PUBLIC_TO_EVERYONE')
      ? 'PUBLIC_TO_EVERYONE'
      : privacyOptions[0];

  // Step 2: Build description with hashtags
  const hashtagStr = hashtags.map(h => `#${h}`).join(' ');
  const description = `${caption}\n\n${hashtagStr}`.slice(0, 4000);
  const title = caption.slice(0, 90);

  // Step 3: Init carousel post
  console.log(`[TikTok-Post] Initializing carousel with ${imageUrls.length} images for account ${accountId} (Privacy: ${privacyLevel})...`);

  let initRes;
  try {
    initRes = await axios.post(
      `${TIKTOK_BASE}/v2/post/publish/content/init/`,
      {
        post_mode: 'DIRECT_POST',
        media_type: 'PHOTO',
        post_info: {
          title,
          description,
          privacy_level: privacyLevel,
          disable_comment: false,
          auto_add_music: true,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          photo_images: imageUrls,
          photo_cover_index: 0,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
        }
      }
    );
  } catch (e) {
    if (e.response?.status === 403) {
      const errCode = e.response.data?.error?.code;
      if (errCode === 'unaudited_client_can_only_post_to_private_accounts' || e.response.data?.error?.message?.includes('private')) {
        throw new Error(
          'TikTok Sandbox Error: Aplikasi developer Anda belum diaudit oleh TikTok. ' +
          'Agar bisa memposting: 1) Ubah akun TikTok Anda menjadi AKUN PRIVAT di aplikasi HP TikTok Anda. ' +
          '2) Aktifkan "TikTok Sandbox/Test Mode" di halaman Konfigurasi TikTok di web ini.'
        );
      }
    }
    const errMsg = e.response?.data?.error?.message || e.message;
    throw new Error(`TikTok post init failed: ${errMsg}`);
  }

  if (initRes.data.error?.code !== 'ok') {
    throw new Error(`TikTok post init failed: ${initRes.data.error?.message} (${initRes.data.error?.code})`);
  }

  const publishId = initRes.data.data?.publish_id;
  console.log(`[TikTok-Post] ✅ Carousel submitted! publish_id: ${publishId}`);

  // Step 4: Poll status (up to 30s)
  const finalStatus = await pollPublishStatus(accessToken, publishId);

  return { publishId, status: finalStatus };
}

/**
 * Poll TikTok publish status until done or timeout.
 */
async function pollPublishStatus(accessToken, publishId, maxAttempts = 10) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(r => setTimeout(r, 3000)); // wait 3s between polls

    try {
      const res = await axios.post(
        `${TIKTOK_BASE}/v2/post/publish/status/fetch/`,
        { publish_id: publishId },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8',
          }
        }
      );

      const statusData = res.data.data;
      const status = statusData?.status;
      console.log(`[TikTok-Poll] attempt ${attempt + 1}: ${status}`);

      if (status === 'PUBLISH_COMPLETE') return 'success';
      if (status === 'FAILED') throw new Error(`TikTok publish failed: ${statusData?.fail_reason}`);
    } catch (e) {
      if (e.message.includes('FAILED')) throw e;
      console.warn(`[TikTok-Poll] Poll error (attempt ${attempt + 1}):`, e.message);
    }
  }

  // Timeout — still mark as "pending" not failed, TikTok processes async
  console.warn('[TikTok-Poll] Timeout polling status. Post may still be processing.');
  return 'pending';
}

// ── OAUTH URL BUILDER ─────────────────────────────────────────────────────────

/**
 * Generate TikTok OAuth URL + PKCE code verifier.
 * Returns { url, codeVerifier } — store codeVerifier in session.
 */
export function buildOAuthUrl(redirectUri, state = 'tiktok_auth') {
  // PKCE: code_verifier = random base64url string
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let codeVerifier = '';
  for (let i = 0; i < 64; i++) {
    codeVerifier += chars[Math.floor(Math.random() * chars.length)];
  }

  // For server-side web apps TikTok also supports plain (no SHA256)
  // but they do recommend SHA256 hex. We'll use plain for simplicity with web apps.
  const params = new URLSearchParams({
    client_key: CLIENT_KEY,
    response_type: 'code',
    scope: 'user.info.basic,video.publish',
    redirect_uri: redirectUri,
    state,
    code_challenge: codeVerifier,
    code_challenge_method: 'plain',
  });

  return {
    url: `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`,
    codeVerifier,
  };
}
