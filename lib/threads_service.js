import { postToThreadsOfficial } from './threads.js';
import sql from './database.js';

export async function postToPlatforms(content, platforms = ['threads']) {
  const results = [];

  if (platforms.includes('threads')) {
    try {
      const token = await sql`SELECT access_token FROM tokens WHERE id = 1`;
      if (token.length > 0 && token[0].access_token) {
        console.log('[Service] Posting to Threads (API)...');
        await postToThreadsOfficial(content);
        await sql`INSERT INTO post_history (content, status, platform, error_message) VALUES (${content}, 'success', 'threads', null)`;
        results.push({ platform: 'threads', status: 'success' });
      } else {
        await sql`INSERT INTO post_history (content, status, platform, error_message) VALUES (${content}, 'failed', 'threads', 'No Threads token found in database')`;
        results.push({ platform: 'threads', status: 'failed', error: 'No Threads token found in database' });
      }
    } catch (e) {
      await sql`INSERT INTO post_history (content, status, platform, error_message) VALUES (${content}, 'failed', 'threads', ${e.message})`;
      results.push({ platform: 'threads', status: 'failed', error: e.message });
    }
  }

  return results;
}
