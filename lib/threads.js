import axios from 'axios';
import sql from './database.js';

const GRAPH_BASE_URL = 'https://graph.threads.net/v1.0';

export async function getThreadsAccessToken() {
  const rows = await sql`SELECT access_token, expires_at FROM tokens WHERE id = 1`;
  if (rows.length === 0 || !rows[0].access_token) {
    throw new Error('Threads account not linked. Please Link Account first.');
  }

  return rows[0].access_token;
}

export async function postToThreadsOfficial(content) {
  try {
    const accessToken = await getThreadsAccessToken();
    
    // Get My User ID
    const me = await axios.get(`${GRAPH_BASE_URL}/me`, {
      params: { fields: 'id', access_token: accessToken }
    });
    const userId = me.data.id;

    // 1. Create Media Container (Text-only)
    const containerResponse = await axios.post(`${GRAPH_BASE_URL}/${userId}/threads`, null, {
      params: {
        media_type: 'TEXT',
        text: content,
        access_token: accessToken
      }
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
    console.error('Threads API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || error.message);
  }
}

export async function refreshThreadsToken(oldToken) {
  try {
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
    console.error('Token Refresh Error:', error.message);
    throw error;
  }
}
