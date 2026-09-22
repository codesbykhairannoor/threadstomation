import sql from './database.js';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAllGeminiKeys } from './gemini.js';
import { fetchRecentReplies, replyToThread, getThreadsAccessToken } from './threads.js';
import { fetchInstagramComments, replyToInstagramComment, getInstagramAccessToken, getGraphBase } from './instagram.js';

const GRAPH_BASE_URL = 'https://graph.threads.net/v1.0';

// Known network handles managed by this system.
// Any comment authored by these handles MUST be strictly ignored to prevent bot loops / self-replies!
const OWN_SYSTEM_HANDLES = new Set(['adhlil.co', 'tranvasapp', 'sharesa.space', 'caridisinishop', 'oneformind']);

let isTableInitialized = false;

async function initRepliedTable() {
  if (isTableInitialized) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS replied_comments (
        comment_id TEXT PRIMARY KEY,
        platform TEXT NOT NULL,
        account_id INTEGER NOT NULL,
        parent_media_id TEXT,
        comment_author TEXT,
        comment_text TEXT,
        reply_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    isTableInitialized = true;
  } catch (e) {
    console.warn('[AI-Replier] Table init note:', e.message);
  }
}

/**
 * Uses Gemini to generate a warm, human, conversation-sparking reply to an organic commenter
 */
async function generateSmartReply(platform, postContent, commenterName, commentText, accountPersona = '') {
  const apiKeys = await getAllGeminiKeys();
  if (!apiKeys || apiKeys.length === 0) return null;

  const isIndo = /[a-zA-Z\s]+(yang|dan|ini|bisa|gue|lo|kamu|kita|makasih|mantap)/i.test(commentText + ' ' + (postContent || ''));

  const prompt = `
You are a friendly, hyper-engaging human creator replying to a follower's comment on ${platform.toUpperCase()}.
Account Persona: ${accountPersona || 'Thoughtful creator, building in public, highly supportive'}

Original Post: "${(postContent || '').slice(0, 300)}"
Comment from @${commenterName || 'user'}: "${commentText}"

STRICT GUIDELINES:
1. Length: MAXIMUM 120-180 characters. Short, punchy, conversational.
2. Tone: Warm, respectful, authentic, NOT salesy or corporate. Sound like a real friend.
3. Language: ${isIndo ? 'Natural conversational Indonesian (pake lo-gue/kamu tergantung nada komen)' : 'Natural conversational English'}.
4. Goal: Acknowledge their point warmly, and if appropriate, leave a gentle open-ended thought to keep the conversation going (boosting reply velocity!).
5. Output: ONLY the reply text, no quotes, no markdown, no placeholders.
6. ANTI-SELF TAGGING: NEVER mention or tag @${commenterName} or our own account handle in the reply text. Address them naturally without tagging!
`;

  for (let i = 0; i < apiKeys.length; i++) {
    try {
      const genAI = new GoogleGenerativeAI(apiKeys[i]);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const res = await model.generateContent(prompt);
      const text = res.response.text().trim().replace(/^["']|["']$/g, '');
      if (text && text.length > 5 && text.length < 350) {
        return text;
      }
    } catch (err) {
      continue;
    }
  }

  // Safe conversational fallbacks
  if (isIndo) {
    return 'Mantap banget sudut pandang lo! Setuju banget sama poin ini 🙌';
  }
  return 'Spot on! Really appreciate you sharing your perspective on this 🙌';
}

/**
 * Scans recent Threads posts and auto-replies to any unanswered user comments
 */
async function processThreadsComments() {
  let repliedCount = 0;
  try {
    const recentPosts = await sql`
      SELECT threads_id, account_id, content 
      FROM post_history 
      WHERE platform = 'threads' AND threads_id IS NOT NULL AND status = 'success'
      ORDER BY created_at DESC LIMIT 10
    `;

    const accountUsernames = new Map();

    for (const post of recentPosts) {
      if (!post.threads_id) continue;

      // Determine the account's own Threads username
      let myUsername = accountUsernames.get(post.account_id);
      if (!myUsername) {
        try {
          const myToken = await getThreadsAccessToken(post.account_id);
          const meRes = await axios.get(`${GRAPH_BASE_URL}/me?fields=id,username&access_token=${myToken}`, { timeout: 6000 });
          myUsername = (meRes.data?.username || '').toLowerCase().trim();
          accountUsernames.set(post.account_id, myUsername);
        } catch (_) {}
      }

      const replies = await fetchRecentReplies(post.threads_id, post.account_id);
      if (!replies || replies.length === 0) continue;

      for (const reply of replies) {
        if (!reply.id || !reply.text) continue;

        const authorUsername = (reply.username || '').toLowerCase().trim();

        // 🚨 1. NEVER reply to ourselves (same account talking to itself)
        if (authorUsername === myUsername) {
          continue;
        }

        // 🚨 2. CROSS-ACCOUNT INTERACTION:
        // If authorUsername is another account in our network (e.g. @sharesa.space or @tranvasapp commenting on @adhlil.co),
        // we ALLOW @adhlil.co to reply back warmly!
        // To prevent infinite bot loops, ensure the author only replies ONCE per post to that helper account:
        if (OWN_SYSTEM_HANDLES.has(authorUsername)) {
          const [alreadyInteracted] = await sql`
            SELECT comment_id FROM replied_comments 
            WHERE parent_media_id = ${post.threads_id} 
              AND comment_author = ${authorUsername}
              AND reply_text NOT LIKE 'SKIPPED%'
          `.catch(() => [null]);

          if (alreadyInteracted) {
            continue;
          }
        }

        // Check if already replied
        const [alreadyReplied] = await sql`
          SELECT comment_id FROM replied_comments WHERE comment_id = ${reply.id}
        `;
        if (alreadyReplied) continue;

        console.log(`[AI-Replier] 📩 Found ORGANIC Threads comment from @${reply.username || 'user'}: "${reply.text.slice(0, 60)}..."`);

        const replyText = await generateSmartReply(
          'threads',
          post.content,
          reply.username,
          reply.text
        );

        if (replyText) {
          try {
            await replyToThread(reply.id, replyText, post.account_id);
            await sql`
              INSERT INTO replied_comments (comment_id, platform, account_id, parent_media_id, comment_author, comment_text, reply_text)
              VALUES (${reply.id}, 'threads', ${post.account_id}, ${post.threads_id}, ${reply.username || ''}, ${reply.text}, ${replyText})
            `;
            console.log(`[AI-Replier] ✅ Successfully auto-replied on Threads to @${reply.username}: "${replyText}"`);
            repliedCount++;
            // Natural pause between replies (5-10s)
            await new Promise(r => setTimeout(r, 6000));
          } catch (replyErr) {
            console.warn(`[AI-Replier] Could not publish Threads reply:`, replyErr.message);
            // Record as skipped to avoid re-attempting invalid comment errors endlessly
            await sql`
              INSERT INTO replied_comments (comment_id, platform, account_id, parent_media_id, comment_author, comment_text, reply_text)
              VALUES (${reply.id}, 'threads', ${post.account_id}, ${post.threads_id}, ${reply.username || ''}, ${reply.text}, ${'SKIPPED_' + (replyErr.message || '').slice(0, 50)})
              ON CONFLICT (comment_id) DO NOTHING
            `.catch(() => {});
          }
        }
      }
    }
  } catch (err) {
    console.warn('[AI-Replier] Threads comments check note:', err.message);
  }
  return repliedCount;
}

/**
 * Scans recent Instagram posts and auto-replies to any unanswered user comments
 */
async function processInstagramComments() {
  let repliedCount = 0;
  try {
    const recentPosts = await sql`
      SELECT creation_id, account_id, caption 
      FROM instagram_history 
      WHERE creation_id IS NOT NULL AND creation_id != '' AND status = 'success'
      ORDER BY created_at DESC LIMIT 6
    `;

    const accountIgUsernames = new Map();

    for (const post of recentPosts) {
      if (!post.creation_id) continue;

      let myIgUsername = accountIgUsernames.get(post.account_id);
      if (!myIgUsername) {
        try {
          const igRows = await sql`SELECT instagram_business_id FROM instagram_accounts WHERE id = ${post.account_id}`;
          if (igRows.length > 0) {
            const token = await getInstagramAccessToken(post.account_id);
            const base = getGraphBase(token);
            const igRes = await axios.get(`${base}/${igRows[0].instagram_business_id}?fields=username&access_token=${token}`, { timeout: 6000 });
            myIgUsername = (igRes.data?.username || '').toLowerCase().trim();
            accountIgUsernames.set(post.account_id, myIgUsername);
          }
        } catch (_) {}
      }

      const comments = await fetchInstagramComments(post.creation_id, post.account_id);
      if (!comments || comments.length === 0) continue;

      for (const comment of comments) {
        if (!comment.id || !comment.text) continue;

        const authorUsername = (comment.username || '').toLowerCase().trim();

        // 🚨 1. NEVER reply to ourselves
        if (authorUsername === myIgUsername) {
          continue;
        }

        // 🚨 2. CROSS-ACCOUNT INTERACTION:
        if (OWN_SYSTEM_HANDLES.has(authorUsername)) {
          const [alreadyInteracted] = await sql`
            SELECT comment_id FROM replied_comments 
            WHERE parent_media_id = ${post.creation_id} 
              AND comment_author = ${authorUsername}
              AND reply_text NOT LIKE 'SKIPPED%'
          `.catch(() => [null]);

          if (alreadyInteracted) {
            continue;
          }
        }

        // Check if already replied
        const [alreadyReplied] = await sql`
          SELECT comment_id FROM replied_comments WHERE comment_id = ${comment.id}
        `;
        if (alreadyReplied) continue;

        console.log(`[AI-Replier] 📩 Found ORGANIC Instagram comment from @${comment.username || 'user'}: "${comment.text.slice(0, 60)}..."`);

        const replyText = await generateSmartReply(
          'instagram',
          post.caption,
          comment.username,
          comment.text
        );

        if (replyText) {
          try {
            await replyToInstagramComment(comment.id, replyText, post.account_id);
            await sql`
              INSERT INTO replied_comments (comment_id, platform, account_id, parent_media_id, comment_author, comment_text, reply_text)
              VALUES (${comment.id}, 'instagram', ${post.account_id}, ${post.creation_id}, ${comment.username || ''}, ${comment.text}, ${replyText})
            `;
            console.log(`[AI-Replier] ✅ Successfully auto-replied on Instagram to @${comment.username}: "${replyText}"`);
            repliedCount++;
            // Natural pause between replies (5-10s)
            await new Promise(r => setTimeout(r, 6000));
          } catch (replyErr) {
            console.warn(`[AI-Replier] Could not publish Instagram reply:`, replyErr.message);
            await sql`
              INSERT INTO replied_comments (comment_id, platform, account_id, parent_media_id, comment_author, comment_text, reply_text)
              VALUES (${comment.id}, 'instagram', ${post.account_id}, ${post.creation_id}, ${comment.username || ''}, ${comment.text}, ${'SKIPPED_' + (replyErr.message || '').slice(0, 50)})
              ON CONFLICT (comment_id) DO NOTHING
            `.catch(() => {});
          }
        }
      }
    }
  } catch (err) {
    console.warn('[AI-Replier] Instagram comments check note:', err.message);
  }
  return repliedCount;
}

/**
 * Main function to run the 24/7 AI Comment Replier across Threads and Instagram
 */
export async function runCommentReplier() {
  console.log('[AI-Replier] 🔍 Scanning recent Threads & Instagram posts for new user comments...');
  await initRepliedTable();

  const [thCount, igCount] = await Promise.all([
    processThreadsComments(),
    processInstagramComments()
  ]);

  const total = thCount + igCount;
  if (total > 0) {
    console.log(`[AI-Replier] 🚀 Handled ${total} comment(s) (Threads: ${thCount}, Instagram: ${igCount}). Velocity multiplied!`);
  } else {
    console.log(`[AI-Replier] 💤 No pending organic unreplied comments found. Everything is up-to-date.`);
  }

  return { total, threads: thCount, instagram: igCount };
}
