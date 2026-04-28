import axios from 'axios';
import sql from './database.js';

const GRAPH_BASE_URL = 'https://graph.threads.net/v1.0';

export async function getThreadsAccessToken(accountId = 1) {
  const rows = await sql`SELECT access_token, expires_at FROM tokens WHERE account_id = ${accountId}`;
  if (rows.length === 0 || !rows[0].access_token) {
    throw new Error(`Threads account (ID: ${accountId}) not linked.`);
  }

  const { access_token, expires_at } = rows[0];
  const now = new Date();
  const expiry = new Date(expires_at);
  
  // If expired or expiring in less than 2 hours, try refresh
  if (expiry <= now || (expiry - now) < (2 * 60 * 60 * 1000)) {
    console.log(`[Threads] Token for account ${accountId} expiring soon, attempting refresh...`);
    try {
      return await refreshThreadsToken(access_token, accountId);
    } catch (e) {
      console.warn(`[Threads] Auto-refresh for account ${accountId} failed:`, e.message);
      return access_token;
    }
  }

  return access_token;
}

export async function postToThreadsOfficial(content, imageUrl = null, accountId = 1) {
  try {
    const accessToken = await getThreadsAccessToken(accountId);
    
    // Get User ID from Meta
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

    // 2. Wait for Processing
    console.log(`[Threads-Acc:${accountId}] Container created:`, creationId, 'waiting...');
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
    console.error(`[Threads-Acc:${accountId}] API Error:`, errorData.message || error.message);
    
    // If token error, try refresh and retry ONCE
    if (error.response?.status === 401 || errorData.code === 190) {
      console.log(`[Threads-Acc:${accountId}] Token error, attempting refresh...`);
      try {
        const rows = await sql`SELECT access_token FROM tokens WHERE account_id = ${accountId}`;
        if (rows.length > 0) {
          await refreshThreadsToken(rows[0].access_token, accountId);
          return await postToThreadsOfficial(content, imageUrl, accountId); 
        }
      } catch (refreshErr) {
        console.error(`[Threads-Acc:${accountId}] Retry refresh failed:`, refreshErr.message);
      }
    }
    
    throw new Error(errorData.message || error.message);
  }
}

export async function exchangeShortLivedToken(shortToken, accountId = null) {
  try {
    const appSecret = process.env.THREADS_APP_SECRET;
    if (!appSecret) throw new Error('THREADS_APP_SECRET missing in .env');

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

    if (accountId) {
        await sql`
          UPDATE tokens 
          SET access_token = ${access_token}, expires_at = ${expiresAt}, updated_at = CURRENT_TIMESTAMP 
          WHERE account_id = ${accountId}
        `;
    }

    return access_token;
  } catch (error) {
    console.error('Token Exchange Error:', error.response?.data || error.message);
    throw error;
  }
}

export async function refreshThreadsToken(oldToken, accountId = null) {
  try {
    console.log(`[Threads] Refreshing token for account ID: ${accountId}...`);
    const response = await axios.get(`https://graph.threads.net/refresh_access_token`, {
      params: {
        grant_type: 'th_refresh_token',
        access_token: oldToken
      }
    });
    
    const { access_token, expires_in } = response.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    if (accountId) {
        await sql`
          UPDATE tokens 
          SET access_token = ${access_token}, expires_at = ${expiresAt}, updated_at = CURRENT_TIMESTAMP 
          WHERE account_id = ${accountId}
        `;
        console.log(`✅ [Threads-Acc:${accountId}] Token REFRESHED!`);
    }

    return access_token;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('[Threads] Refresh failed (400), attempting exchange...');
      return await exchangeShortLivedToken(oldToken, accountId);
    }
    throw error;
  }
}
