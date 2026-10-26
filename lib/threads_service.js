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
        
        // Unwrap any nested or stringified JSON arrays and remove model preamble
        contents = contents.flatMap(c => {
          if (typeof c === 'string') {
            let s = c.trim();
            // Remove conversational AI preamble if leaked
            s = s.replace(/^(?:Berikut(?: adalah)?|Tentu(?:kah)?|Ini|Here is|Sure).*?:\s*/is, '').trim();

            // Extract JSON array if embedded
            const jsonArrMatch = s.match(/\[\s*[\s\S]*?\s*\]/);
            if (jsonArrMatch) {
              try {
                const parsed = JSON.parse(jsonArrMatch[0]);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  return parsed.map(item => String(item).trim());
                }
              } catch (_) {
                const inner = jsonArrMatch[0].slice(1, -1);
                const quotes = Array.from(inner.matchAll(/"((?:[^"\\]|\\.)*)"/g)).map(m => {
                  try { return JSON.parse(`"${m[1]}"`); } catch (_) { return m[1]; }
                });
                if (quotes.length > 0) return quotes;
              }
            }
            // Strip any stray outer brackets or quotes
            s = s.replace(/^\[\s*"?/, '').replace(/"?\s*\]$/, '').trim();
            return [s];
          }
          return [String(c)];
        });

        // Clean each post item: remove prefix labels, hashtags, or bracket residue
        contents = contents.map(item => {
          let s = String(item).trim();
          s = s.replace(/^(?:Berikut(?: adalah)?|Tentu|Ini|Here is|Sure).*?:\s*/is, '').trim();
          s = s.replace(/^(?:Threads|Post|\d+[\/.]\d*)\s*:\s*/i, '').trim();
          s = s.replace(/^\[\s*"?/, '').replace(/"?\s*\]$/, '').trim();
          return s;
        }).filter(s => s.length > 0);

        const isSharesa = Number(accountId) === 3;
        const { cleanText: mainClean, url: extractedUrl } = extractUrlAndCleanText(contents[0] || '');

        // ── GROWTH ENGINE: LINK PENALTY ZERO-TOLERANCE EVASION ──
        // On Meta Threads, external URLs or raw domains in the main post body slash organic reach by 85-95%.
        // Top creator growth secret: Keep the main post 100% clean and pristine!
        // Direct users naturally to the Bio link (which Meta algorithm permits with 100% reach).
        const bioPointers = [
          '📌 (Detail tools & akses gratisnya udah kita taruh di bio profil yaa 🙌)',
          '📌 (Link tools versi browser lengkapnya bisa langsung dicek via tautan bio!)',
          '📌 (Akses langsung tanpa bayar & tanpa login ada di bio profil yaa ✨)',
          '📌 (Bisa langsung dicoba gratis lewat link di bio profil!)'
        ];
        const randomBioPointer = bioPointers[Math.floor(Math.random() * bioPointers.length)];

        // Strip any raw domains or URLs from the main post
        let postClean = (mainClean || '').replace(/(?:https?:\/\/)?(?:[a-zA-Z0-9-]+\.)+(?:com|id|co|org|io|dev|app|net)(?:\/[^\s]*)?/gi, '').trim();

        if (isSharesa) {
          // Strictly single post without ANY external domain penalties
          if (extractedUrl) {
            contents[0] = `${postClean}\n\n${randomBioPointer}`;
          } else {
            contents[0] = postClean;
          }
          contents = [contents[0]]; // Enforce strictly 1 single clean post
        } else {
          if (extractedUrl) {
            console.log(`[Growth-Engine-Acc:${accountId}] 🛡️ Extracted external link "${extractedUrl}" to place in First Reply to avoid algorithmic penalty.`);
            contents[0] = `${postClean}\n\n${randomBioPointer}`;
            const linkReply = `📌 Akses web / link lengkapnya:\n${extractedUrl}`;
            contents.push(linkReply);
          } else {
            contents[0] = postClean;
          }
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

