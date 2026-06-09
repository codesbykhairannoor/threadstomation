import { postToThreadsOfficial } from './threads.js';
import sql from './database.js';

export async function postToPlatforms(content, platforms = ['threads'], imageUrl = null, accountId = 1) {
  const results = [];

  if (platforms.includes('threads')) {
    try {
      const token = await sql`SELECT access_token FROM tokens WHERE account_id = ${accountId}`;
      if (token.length > 0 && token[0].access_token) {
        console.log(`[Service-Acc:${accountId}] Posting to Threads...`);
        
        let contents = Array.isArray(content) ? content : [content];
        let lastPostId = null;
        let finalStatus = 'success';
        let finalError = null;

        for (let i = 0; i < contents.length; i++) {
            const currentContent = contents[i];
            // Only attach image to the first post in the thread
            const currentImage = (i === 0) ? imageUrl : null;
            
            console.log(`[Service-Acc:${accountId}] Posting part ${i+1}/${contents.length} to Threads...`);
            try {
                const result = await postToThreadsOfficial(currentContent, currentImage, accountId, lastPostId);
                lastPostId = result.id; // Get the id to reply to in the next iteration
                
                await sql`
                    INSERT INTO post_history (content, media_url, status, platform, account_id) 
                    VALUES (${currentContent}, ${currentImage}, 'success', 'threads', ${accountId})
                `;
            } catch (err) {
                finalStatus = 'failed';
                finalError = err.message;
                await sql`
                    INSERT INTO post_history (content, media_url, status, platform, error_message, account_id) 
                    VALUES (${currentContent}, ${currentImage}, 'failed', 'threads', ${err.message}, ${accountId})
                `;
                break; // Stop posting further replies if one fails
            }
        }
        
        if (finalStatus === 'success') {
            results.push({ platform: 'threads', status: 'success' });
        } else {
            results.push({ platform: 'threads', status: 'failed', error: finalError });
        }
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
