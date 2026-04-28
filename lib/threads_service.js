import { postToThreadsOfficial } from './threads.js';
import sql from './database.js';

export async function postToPlatforms(content, platforms = ['threads'], imageUrl = null, accountId = 1) {
  const results = [];

  if (platforms.includes('threads')) {
    try {
      const token = await sql`SELECT access_token FROM tokens WHERE account_id = ${accountId}`;
      if (token.length > 0 && token[0].access_token) {
        console.log(`[Service-Acc:${accountId}] Posting to Threads...`);
        await postToThreadsOfficial(content, imageUrl, accountId);
        await sql`
            INSERT INTO post_history (content, media_url, status, platform, account_id) 
            VALUES (${content}, ${imageUrl}, 'success', 'threads', ${accountId})
        `;
        results.push({ platform: 'threads', status: 'success' });
      } else {
        const err = `No token found for account ID ${accountId}`;
        await sql`
            INSERT INTO post_history (content, media_url, status, platform, error_message, account_id) 
            VALUES (${content}, ${imageUrl}, 'failed', 'threads', ${err}, ${accountId})
        `;
        results.push({ platform: 'threads', status: 'failed', error: err });
      }
    } catch (e) {
      await sql`
          INSERT INTO post_history (content, media_url, status, platform, error_message, account_id) 
          VALUES (${content}, ${imageUrl}, 'failed', 'threads', ${e.message}, ${accountId})
      `;
      results.push({ platform: 'threads', status: 'failed', error: e.message });
    }
  }

  return results;
}
