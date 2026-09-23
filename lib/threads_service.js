import { postToThreadsOfficial } from './threads.js';
import sql from './database.js';

/**
 * Extracts URL from text and returns clean text + extracted URL
 */
function extractUrlAndCleanText(text) {
  if (!text || typeof text !== 'string') return { cleanText: text, url: null };
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const match = text.match(urlRegex);
  if (!match || match.length === 0) return { cleanText: text, url: null };

  const url = match[0];
  let cleanText = text.replace(urlRegex, '').trim();
  // Remove dangling labels like "Link:", "Cek link:", "Akses:", etc.
  cleanText = cleanText.replace(/(?:Link|Cek link|Cek di sini|Daftar di|Akses link|Baca selengkapnya|Sisipkan link ini di akhir)[\s:]*$/i, '').trim();
  return { cleanText, url };
}

export async function postToPlatforms(content, platforms = ['threads'], imageUrl = null, accountId = 1) {
  const results = [];

  if (platforms.includes('threads')) {
    try {
      const token = await sql`SELECT access_token FROM tokens WHERE account_id = ${accountId}`;
      if (token.length > 0 && token[0].access_token) {
        console.log(`[Service-Acc:${accountId}] Processing Threads post with Growth Engine...`);
        
        let contents = Array.isArray(content) ? [...content] : [content];
        
        // ── GROWTH ENGINE: LINK SEPARATION & FIRST-REPLY OPTIMIZATION ──
        // On Threads, external links in the main post cause an 80% algorithmic penalty.
        // We strip any link from the main post and place it safely in the First Reply.
        const { cleanText: mainClean, url: extractedUrl } = extractUrlAndCleanText(contents[0]);
        contents[0] = mainClean;

        if (extractedUrl) {
          console.log(`[Growth-Engine-Acc:${accountId}] 🛡️ Extracted external link "${extractedUrl}" to place in First Reply to avoid algorithmic penalty.`);
          const linkReply = `📌 Akses / cek detail link lengkapnya di sini:\n${extractedUrl}`;
          // If it's a single post, append linkReply as the second item (first reply)
          if (contents.length === 1) {
            contents.push(linkReply);
          } else {
            // In multi-part thread, make sure link is at the very end
            contents.push(linkReply);
          }
        } else if (contents.length === 1) {
          // If no link exists and it's a single post, add an engaging Discussion Starter First Reply
          // to trigger initial Reply Depth & Velocity.
          const isIndo = /[a-zA-Z\s]+(yang|dan|ini|bisa|gue|lo|kamu|kita)/i.test(mainClean);
          const discussionStarter = isIndo
            ? "Gimana menurut lo? Setuju, atau punya sudut pandang lain? Tulis opini lo di bawah, yuk kita bedah bareng! 👇"
            : "What's your take on this? Do you agree, or do you have a different perspective? Drop your thoughts below! 👇";
          
          contents.push(discussionStarter);
          console.log(`[Growth-Engine-Acc:${accountId}] 💬 Added Auto-First-Reply conversation igniter to boost Reply Depth.`);
        }

        // ── HARD THREAD LENGTH LIMIT: MAX 4 POSTS ──
        if (contents.length > 4) {
          console.log(`[Growth-Engine-Acc:${accountId}] 🛡️ Enforcing max 4 posts limit (reduced from ${contents.length} to 4)`);
          contents = [contents[0], contents[1], contents[2], contents[contents.length - 1]];
        }

        let lastPostId = null;
        let finalStatus = 'success';
        let finalError = null;

        for (let i = 0; i < contents.length; i++) {
          const currentContent = contents[i];
          // Only attach image to the first post in the thread
          const currentImage = (i === 0) ? imageUrl : null;
          
          if (i > 0) {
            // Natural human pacing between thread parts (8-15 seconds) to avoid spam filters
            console.log(`[Service-Acc:${accountId}] Waiting 12s before publishing reply part ${i+1}/${contents.length}...`);
            await new Promise(r => setTimeout(r, 12000));
          }

          console.log(`[Service-Acc:${accountId}] Posting part ${i+1}/${contents.length} to Threads...`);
          try {
            const result = await postToThreadsOfficial(currentContent, currentImage, accountId, lastPostId);
            lastPostId = result.id; // Get id to reply to in next iteration
            
            const isChild = (i > 0);
            await sql`
              INSERT INTO post_history (content, media_url, status, platform, threads_id, account_id, is_thread_child) 
              VALUES (${currentContent}, ${currentImage}, 'success', 'threads', ${result.id}, ${accountId}, ${isChild})
            `;
          } catch (err) {
            finalStatus = 'failed';
            finalError = err.message;
            const isChild = (i > 0);
            await sql`
              INSERT INTO post_history (content, media_url, status, platform, error_message, account_id, is_thread_child) 
              VALUES (${currentContent}, ${currentImage}, 'failed', 'threads', ${err.message}, ${accountId}, ${isChild})
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

