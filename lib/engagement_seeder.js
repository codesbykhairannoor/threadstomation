import sql from './database.js';
import axios from 'axios';
import { getThreadsAccessToken } from './threads.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAllGeminiKeys } from './gemini.js';

const GRAPH_BASE_URL = 'https://graph.threads.net/v1.0';

/**
 * Generates an authentic, highly relevant supportive reply or discussion question
 * from one account to another to trigger Meta's initial velocity algorithm.
 */
async function generateSeederReply(targetPostContent, sourceAccountName) {
  const apiKeys = await getAllGeminiKeys();
  if (!apiKeys || apiKeys.length === 0) return null;

  const prompt = `
You are @${sourceAccountName}, an active, smart creator on Threads.
Another creator in your network just posted this:
"${(targetPostContent || '').slice(0, 300)}"

Write a short, authentic, thought-provoking reaction or supportive comment (MAX 140 characters).
- Sound like a real person, not an AI bot.
- Share an insightful take, agree with a specific point, or add 1 practical thought.
- No sales pitch, no hashtags, no generic praise like "Great post!".
- Output ONLY the reply text.
`;

  for (let i = 0; i < apiKeys.length; i++) {
    try {
      const genAI = new GoogleGenerativeAI(apiKeys[i]);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const res = await model.generateContent(prompt);
      const text = res.response.text().trim().replace(/^["']|["']$/g, '');
      if (text && text.length > 5 && text.length < 250) {
        return text;
      }
    } catch (_) {}
  }
  return 'Setuju banget sama poin ini. Kuncinya memang di sistem yang konsisten 🙌';
}

/**
 * Seeds engagement across accounts:
 * Finds recent successful posts from an account, and has another active account like/reply
 * within the crucial first 30-minute window to bypass Meta's 0-view test pool.
 */
export async function runEngagementSeeder() {
  console.log('[Engagement-Seeder] 🚀 Checking for recent unseeded posts to boost velocity...');
  
  try {
    // 1. Get recent posts from the last 2 hours that haven't been seeded yet
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const recentPosts = await sql`
      SELECT id, account_id, threads_id, content, created_at 
      FROM post_history 
      WHERE platform = 'threads' 
        AND threads_id IS NOT NULL 
        AND status = 'success'
        AND created_at > ${twoHoursAgo}
      ORDER BY created_at DESC 
      LIMIT 3
    `;

    if (!recentPosts.length) {
      console.log('[Engagement-Seeder] 💤 No fresh posts in the last 2 hours. Nothing to seed.');
      return { seeded: 0 };
    }

    // 2. Fetch available active accounts
    const accounts = await sql`
      SELECT a.id, a.name, t.access_token 
      FROM accounts a
      JOIN tokens t ON t.account_id = a.id
      WHERE a.is_active = 1 AND t.access_token IS NOT NULL
    `;

    if (accounts.length < 2) {
      console.log('[Engagement-Seeder] ℹ️ Need at least 2 active accounts with tokens to cross-seed.');
      return { seeded: 0 };
    }

    let seededCount = 0;

    for (const post of recentPosts) {
      // Find eligible helper accounts (any active account EXCEPT the author)
      const helperAccounts = accounts.filter(a => a.id !== post.account_id);
      if (!helperAccounts.length) continue;

      // Check if we already seeded this post
      const [alreadySeeded] = await sql`
        SELECT comment_id FROM replied_comments 
        WHERE parent_media_id = ${post.threads_id} AND comment_author = 'cross_seed'
      `.catch(() => [null]);

      if (alreadySeeded) continue;

      // Pick one helper account
      const helper = helperAccounts[Math.floor(Math.random() * helperAccounts.length)];
      console.log(`[Engagement-Seeder] 🌱 Seeding post ${post.threads_id} (Author ID: ${post.account_id}) using Helper @${helper.name} (ID: ${helper.id})...`);

      const replyText = await generateSeederReply(post.content, helper.name);
      if (!replyText) continue;

      try {
        const helperToken = await getThreadsAccessToken(helper.id);
        
        // 1. Get helper user ID
        const meRes = await axios.get(`${GRAPH_BASE_URL}/me?fields=id&access_token=${helperToken}`);
        const helperUserId = meRes.data.id;

        // 2. Create reply container
        const containerRes = await axios.post(`${GRAPH_BASE_URL}/${helperUserId}/threads`, null, {
          params: {
            media_type: 'TEXT',
            text: replyText,
            reply_to_id: post.threads_id,
            access_token: helperToken,
          }
        });

        const creationId = containerRes.data?.id;
        if (!creationId) continue;

        // 3. Wait 4s and publish
        await new Promise(r => setTimeout(r, 4000));
        await axios.post(`${GRAPH_BASE_URL}/${helperUserId}/threads_publish`, null, {
          params: {
            creation_id: creationId,
            access_token: helperToken,
          }
        });

        // 4. Record into replied_comments so we never seed the same post twice
        await sql`
          INSERT INTO replied_comments (comment_id, platform, account_id, parent_media_id, comment_author, comment_text, reply_text)
          VALUES (${creationId}, 'threads', ${helper.id}, ${post.threads_id}, 'cross_seed', 'auto_cross_seed', ${replyText})
          ON CONFLICT (comment_id) DO NOTHING
        `.catch(() => {});

        console.log(`[Engagement-Seeder] ✅ Successfully cross-seeded post ${post.threads_id}! Helper @${helper.name} replied: "${replyText}"`);
        seededCount++;

        // Random jitter pause (10s)
        await new Promise(r => setTimeout(r, 10000));
      } catch (seedErr) {
        console.warn(`[Engagement-Seeder] ⚠️ Seeding error for post ${post.threads_id}:`, seedErr.response?.data?.error?.message || seedErr.message);
      }
    }

    return { seeded: seededCount };
  } catch (err) {
    console.warn('[Engagement-Seeder] Note:', err.message);
    return { seeded: 0 };
  }
}
