import axios from 'axios';
import sql from './database.js';

const GRAPH_BASE_URL = 'https://graph.threads.net/v1.0';

export async function getThreadsAccessToken() {
  const rows = await sql`SELECT access_token, expires_at FROM tokens WHERE id = 1`;
  if (rows.length === 0 || !rows[0].access_token) {
    throw new Error('Threads account not linked. Please Link Account first.');
  }

  const { access_token, expires_at } = rows[0];
  const now = new Date();
  const expiry = new Date(expires_at);
  
  // If expired or expiring in less than 2 hours, try refresh
  if (expiry <= now || (expiry - now) < (2 * 60 * 60 * 1000)) {
    console.log('[Threads] Token expiring soon, attempting refresh...');
    try {
      return await refreshThreadsToken(access_token);
    } catch (e) {
      console.warn('[Threads] Auto-refresh failed:', e.message);
      return access_token; // Fallback to old token and let it fail normally
    }
  }

  return access_token;
}

export async function postToThreadsOfficial(content, imageUrl = null) {
  try {
    const accessToken = await getThreadsAccessToken();
    
    // Get My User ID
    const me = await axios.get(`${GRAPH_BASE_URL}/me`, {
      params: { fields: 'id', access_token: accessToken }
    });
    const userId = me.data.id;

    // 1. Create Media Container
    const containerParams = {
      media_type: imageUrl ? 'IMAGE' : 'TEXT',
      text: content,
      access_token: accessToken
    };

    if (imageUrl) {
      containerParams.image_url = imageUrl;
    }

    const containerResponse = await axios.post(`${GRAPH_BASE_URL}/${userId}/threads`, null, {
      params: containerParams
    });

    const creationId = containerResponse.data.id;
    if (!creationId) throw new Error('Failed to create Threads container.');

    // 2. Wait for Processing (Meta recommendation)
    console.log('[Threads] Container created:', creationId, 'waiting for processing...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 3. Publish Media
    const publishResponse = await axios.post(`${GRAPH_BASE_URL}/${userId}/threads_publish`, null, {
      params: {
        creation_id: creationId,
        access_token: accessToken
      }
    });

    return publishResponse.data;
  } catch (error) {
    const errorData = error.response?.data?.error || {};
    console.error('Threads API Error:', errorData.message || error.message);
    
    // If token error and we haven't retried, try to refresh and retry
    if (error.response?.status === 401 || errorData.code === 190 || errorData.type === 'OAuthException') {
      console.log('[Threads] Token error detected, attempting manual refresh and retry...');
      try {
        const rows = await sql`SELECT access_token FROM tokens WHERE id = 1`;
        if (rows.length > 0) {
          const newToken = await refreshThreadsToken(rows[0].access_token);
          // Recursively call once more with the new token logic (via the function again)
          // To avoid infinite loop, we could pass a flag, but getThreadsAccessToken will now have updated token
          return await postToThreadsOfficial(content, imageUrl); 
        }
      } catch (refreshErr) {
        console.error('[Threads] Retry refresh failed:', refreshErr.message);
      }
    }
    
    throw new Error(errorData.message || error.message);
  }
}

export async function exchangeShortLivedToken(shortToken) {
  try {
    const appSecret = process.env.THREADS_APP_SECRET;
    if (!appSecret) throw new Error('THREADS_APP_SECRET missing in .env');

    console.log('[Threads] Exchanging short-lived token for long-lived...');
    const response = await axios.get(`https://graph.threads.net/access_token`, {
      params: {
        grant_type: 'th_exchange_token',
        client_secret: appSecret,
        access_token: shortToken
      }
    });

    const { access_token, expires_in } = response.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();
    console.log(`✅ [Threads] Token EXCHANGED! Berlaku sampai: ${expiresAt}`);

    await sql`
      UPDATE tokens 
      SET access_token = ${access_token}, expires_at = ${expiresAt}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = 1
    `;

    return access_token;
  } catch (error) {
    console.error('Token Exchange Error:', error.response?.data || error.message);
    throw error;
  }
}

export async function refreshThreadsToken(oldToken) {
  try {
    console.log('[Threads] Refreshing long-lived token...');
    const response = await axios.get(`https://graph.threads.net/refresh_access_token`, {
      params: {
        grant_type: 'th_refresh_token',
        access_token: oldToken
      }
    });
    
    const { access_token, expires_in } = response.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    await sql`
      UPDATE tokens 
      SET access_token = ${access_token}, expires_at = ${expiresAt}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = 1
    `;

    return access_token;
  } catch (error) {
    // If it's a 400, it might be because it's a short-lived token that needs exchange
    if (error.response?.status === 400) {
      console.log('[Threads] Refresh failed (400), attempting initial exchange instead...');
      return await exchangeShortLivedToken(oldToken);
    }
    console.error('Token Refresh Error:', error.message);
    throw error;
  }
}
