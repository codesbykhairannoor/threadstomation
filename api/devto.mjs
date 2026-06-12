export const maxDuration = 60;
import express from 'express';
import cors from 'cors';
import sql, { initDb } from '../lib/database.js';
import { getDevtoUserInfo, postToDevto } from '../lib/devto.js';
import { generateTumblrContent } from '../lib/gemini_tumblr.js'; 
import { generateInstagramSlideImages, generateNativeBannerImage } from '../lib/instagram_carousel.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use(async (req, res, next) => {
  try { await initDb(); next(); } catch (e) { next(); }
});

// ── ACCOUNTS & DASHBOARD STATUS ──────────────────────────────────────────────────

app.get('/api/devto/accounts', async (req, res) => {
  try {
    const accounts = await sql`SELECT id, name, username FROM devto_accounts WHERE is_active = 1 ORDER BY id ASC`;
    res.json(accounts || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/devto/connect', async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ error: 'Missing API Key' });

  try {
    const user = await getDevtoUserInfo(apiKey);
    
    // Check if account already exists
    const existing = await sql`SELECT id FROM devto_accounts WHERE username = ${user.username}`;
    if (existing.length > 0) {
      await sql`UPDATE devto_accounts SET api_key = ${apiKey}, is_active = 1 WHERE username = ${user.username}`;
    } else {
      await sql`
        INSERT INTO devto_accounts (name, username, api_key, is_active)
        VALUES (${user.name || user.username}, ${user.username}, ${apiKey}, 1)
      `;
    }
    res.json({ success: true, username: user.username });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/devto/status', async (req, res) => {
  const accountId = req.query.accountId || 1;
  try {
    const [schedules, lastPost, tokenRow, autoRow] = await Promise.all([
      sql`SELECT * FROM devto_schedules WHERE account_id = ${accountId} ORDER BY id ASC`,
      sql`SELECT * FROM devto_history WHERE account_id = ${accountId} ORDER BY id DESC LIMIT 1`,
      sql`SELECT api_key FROM devto_accounts WHERE id = ${accountId}`,
      sql`SELECT value FROM devto_settings WHERE key = 'devto_automation_enabled'`,
    ]);

    const token = tokenRow[0];
    const isTokenValid = !!(token?.api_key);

    res.json({
      schedules,
      lastPost: lastPost[0] || null,
      devtoToken: isTokenValid,
      automation_enabled: autoRow[0]?.value || 'true',
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── SETTINGS & SCHEDULES ─────────────────────────────────────────────────────

app.post('/api/devto/settings/toggle-automation', async (req, res) => {
  try {
    const current = await sql`SELECT value FROM devto_settings WHERE key = 'devto_automation_enabled'`;
    const newValue = current[0]?.value === 'false' ? 'true' : 'false';
    await sql`
      INSERT INTO devto_settings (key, value) VALUES ('devto_automation_enabled', ${newValue})
      ON CONFLICT (key) DO UPDATE SET value = ${newValue}
    `;
    res.json({ success: true, enabled: newValue === 'true' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/devto/history', async (req, res) => {
  const accountId = req.query.accountId;
  try {
    const history = accountId
      ? await sql`SELECT * FROM devto_history WHERE account_id = ${accountId} ORDER BY created_at DESC LIMIT 15`
      : await sql`SELECT * FROM devto_history ORDER BY created_at DESC LIMIT 15`;
    res.json(history || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/devto/schedules', async (req, res) => {
  const { custom_prompt, accountId } = req.body;
  try {
    await sql`
      INSERT INTO devto_schedules (account_id, custom_prompt, is_active)
      VALUES (${accountId}, ${custom_prompt || null}, 1)
    `;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/devto/schedules/:id', async (req, res) => {
  try {
    await sql`DELETE FROM devto_schedules WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── CORE: POST TO DEV.TO ─────────────────────────────────────────────

async function runDevtoPost(accountId, customPrompt = null, forceNoImage = false) {
  const accountRow = await sql`SELECT * FROM devto_accounts WHERE id = ${accountId}`;
  if (!accountRow.length) throw new Error(`Dev.to account ${accountId} not found`);
  const account = accountRow[0];

  const masterPrompt = account.master_prompt || '';
  const visualTheme = account.visual_theme || '';
  const colorPalette = account.color_palette || null;

  console.log(`[Devto-Post] Generating content for ${account.username}...`);

  const accountName = "caridisinishop_devto";

  // Allow 1 image for Devto Promo layout
  const content = await generateTumblrContent(customPrompt, masterPrompt, visualTheme, accountName, accountId, forceNoImage);
  const slides = content.slides || [];
  const caption = content.caption || '';
  const hashtags = content.hashtags || [];
  const full_image_prompt = content.full_image_prompt || null;
  console.log(`[DevTo-Post] Generated Content`);

  let dynamicPalette = colorPalette;
  if (customPrompt) {
    const cp = customPrompt.toLowerCase();
    if (cp.includes('make.com')) {
      dynamicPalette = { name: 'make', bg1: '#ffffff', bg2: '#ffffff', accent: '#7b2cbf', text: '#000000' };
    } else if (cp.includes('wise.com')) {
      dynamicPalette = { name: 'wise', bg1: '#ffffff', bg2: '#ffffff', accent: '#9fe870', text: '#000000' };
    } else if (cp.includes('systeme')) {
      dynamicPalette = { name: 'systeme', bg1: '#ffffff', bg2: '#ffffff', accent: '#1778f2', text: '#000000' };
    }
  }

  let imageUrls = [];
  if (full_image_prompt) {
    imageUrls = await generateNativeBannerImage(full_image_prompt);
    console.log(`[Devto-Post] Native image generated and uploaded to Supabase`);
  } else if (slides && slides.length > 0) {
    imageUrls = await generateInstagramSlideImages(slides, dynamicPalette, accountName);
    console.log(`[Devto-Post] ${imageUrls.length} images generated and uploaded to Supabase`);
  }

  // Construct Markdown Body
  let markdownBody = "";
  if (imageUrls.length > 0) {
    if (imageUrls[0].isRawBuffer) {
      console.warn(`[Devto-Post] Raw buffer returned (no Supabase). Dev.to needs a public URL. Skipping image.`);
    } else {
      markdownBody += `![Cover Image](${imageUrls[0]})\n\n`;
    }
  }
  
  // Dev.to markdown
  // Assuming caption may contain HTML tags, let's strip basic ones or leave them since Dev.to supports HTML & Markdown
  // But to be safe, we'll convert simple <br> to \n
  let cleanText = caption.replace(/<br\s*\/?>/gi, '\n');
  
  // Extract a Title from the first sentence or use a generic one based on the prompt
  let titleMatch = cleanText.match(/^([^\n]{10,60})(?:\n|$)/);
  let articleTitle = titleMatch ? titleMatch[1] : (customPrompt || 'Amazing Tools You Need to Try');
  articleTitle = articleTitle.replace(/<[^>]+>/g, '').replace(/[\*#]/g, '').trim();
  if (articleTitle.length < 5) articleTitle = "Awesome Recommendations For You";

  // Remove the title from the body if we extracted it from the beginning
  if (cleanText.startsWith(articleTitle)) {
      cleanText = cleanText.substring(articleTitle.length).trim();
  }

  markdownBody += cleanText;

  const response = await postToDevto(account.api_key, articleTitle, markdownBody, hashtags);
  console.log(`[Devto-Post] Successfully posted to Dev.to. Post ID: ${response.id}`);

  await sql`
    INSERT INTO devto_history (account_id, caption, slide_count, image_urls, post_id, status)
    VALUES (${accountId}, ${markdownBody}, ${imageUrls.length}, ${JSON.stringify(imageUrls)}, ${String(response.id)}, 'success')
  `;

  return { publishId: response.id, status: 'success' };
}

app.post('/api/devto/post-now', async (req, res) => {
  const accountId = req.body.accountId || 1;
  const customPrompt = req.body.customPrompt || null;
  
  try {
    let finalPrompt = customPrompt;
    if (!finalPrompt) {
      const pending = await sql`SELECT custom_prompt FROM devto_schedules WHERE account_id = ${accountId} AND is_active = 1`;
      if (pending.length > 0) {
        finalPrompt = pending[Math.floor(Math.random() * pending.length)].custom_prompt;
      }
    }

    const result = await runDevtoPost(accountId, finalPrompt, false);
    res.json({ success: true, ...result });
  } catch (e) {
    console.error('[Devto-Manual]', e.message);
    try {
      await sql`
        INSERT INTO devto_history (account_id, caption, status, error_message)
        VALUES (${accountId}, ${customPrompt || 'Manual post'}, 'failed', ${e.message || String(e)})
      `;
    } catch (_) {}
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── CRON: AUTOMATION SCHEDULER ────────────────────────────────────────────────

app.get('/api/devto/cron', async (req, res) => {
  const expectedSecret = process.env.CRON_SECRET || 'super_chaos_secret_99';
  const authHeader = req.headers.authorization;
  const secretParam = req.query.secret;

  if (process.env.CRON_SECRET) {
    if (authHeader !== `Bearer ${expectedSecret}` && secretParam !== expectedSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const witaTime = new Date(utcTime + (3600000 * 8)); 
  
  const currentHour = witaTime.getHours();
  const todayStr = witaTime.toISOString().split('T')[0];
  const totalMinutesLeft = Math.max(1, (23 - currentHour) * 60 + (60 - witaTime.getMinutes()));

  try {
    const globalStatus = await sql`SELECT value FROM devto_settings WHERE key = 'devto_automation_enabled'`;
    if (globalStatus[0]?.value === 'false') {
      return res.json({ success: true, status: 'Dev.to automation disabled globally.' });
    }

    const accounts = await sql`SELECT id, name FROM devto_accounts WHERE is_active = 1`;
    const executed = [];

    for (const acc of accounts) {
      const ranToday = await sql`
        SELECT COUNT(*) as count FROM devto_history
        WHERE account_id = ${acc.id} AND status = 'success' AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Makassar') = ${todayStr}
      `;
      const postsToday = parseInt(ranToday[0]?.count || 0, 10);

      if (postsToday >= 5) {
        console.log(`[Devto-Cron] Acc ${acc.name}: hit 5-post daily limit.`);
        continue;
      }

      let pending = await sql`
        SELECT * FROM devto_schedules
        WHERE account_id = ${acc.id}
          AND is_active = 1
          AND (last_run_date IS NULL OR last_run_date != ${todayStr})
      `;

      if (!pending.length) {
        pending = Array(5).fill({ id: null, custom_prompt: "" });
      }

      const postsRemaining = 5 - postsToday;
      const numToMake = Math.min(postsRemaining, pending.length);
      const chance = numToMake / totalMinutesLeft;
      const roll = Math.random();

      if (roll < chance) {
        const chosen = pending[Math.floor(Math.random() * pending.length)];
        let finalPrompt = chosen.custom_prompt;
        
        let forceNoImage = false;
        if (!finalPrompt || finalPrompt.trim() === '') {
          if (postsToday === 0 || postsToday === 2) {
            finalPrompt = "Research and discuss a highly engaging, current viral trending topic. DO NOT include any affiliate links. Just pure value and engagement.";
            forceNoImage = true;
          } else if (postsToday === 1) {
            finalPrompt = "Enthusiastically recommend this tool: https://systeme.io/id?sa=sa0273997437b3abacdd34bc2577d7ca935ac6d6a5";
          } else if (postsToday === 3) {
            finalPrompt = "Enthusiastically recommend this tool: https://www.make.com/en/register?pc=airan";
          } else {
            finalPrompt = "Enthusiastically recommend this tool: https://wise.com/invite/dic/khairannoorf";
          }
        }

        try {
          const result = await runDevtoPost(acc.id, finalPrompt, forceNoImage);
          if (chosen.id) {
            await sql`UPDATE devto_schedules SET last_run_date = ${todayStr} WHERE id = ${chosen.id}`;
          }
          executed.push({ account: acc.name, scheduleId: chosen.id, ...result });
        } catch (postErr) {
          console.error(`[Devto-Cron] Post failed for ${acc.name}:`, postErr.message);
          await sql`
            INSERT INTO devto_history (account_id, caption, status, error_message)
            VALUES (${acc.id}, ${chosen.custom_prompt || 'Auto post'}, 'failed', ${postErr.message || String(postErr)})
          `;
        }
      }
    }

    res.json({ success: true, executed });
  } catch (e) {
    console.error('[Devto-Cron] Error:', e.message);
    res.status(200).json({ success: false, error: e.message });
  }
});

export default app;
