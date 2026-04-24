import { postToThreadsOfficial } from './threads.js';
import db from './database.js';

export async function postToPlatforms(content, platforms = ['threads']) {
  const results = [];
  const insertHistory = db.prepare('INSERT INTO post_history (content, status, platform, error_message) VALUES (?, ?, ?, ?)');

  if (platforms.includes('threads')) {
    try {
      const token = db.prepare('SELECT access_token FROM tokens WHERE id = 1').get();
      if (token && token.access_token) {
        console.log('[Service] Posting to Threads (API)...');
        await postToThreadsOfficial(content);
        insertHistory.run(content, 'success', 'threads', null);
        results.push({ platform: 'threads', status: 'success' });
      } else {
        insertHistory.run(content, 'failed', 'threads', 'No Threads token found in database');
        results.push({ platform: 'threads', status: 'failed', error: 'No Threads token found in database' });
      }
    } catch (e) {
      insertHistory.run(content, 'failed', 'threads', e.message);
      results.push({ platform: 'threads', status: 'failed', error: e.message });
    }
  }



  return results;
}
