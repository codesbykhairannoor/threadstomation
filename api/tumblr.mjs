import express from 'express';
import cors from 'cors';
import sql, { initDb } from '../lib/database.js';
import {
  getTumblrAuthUrl,
  getTumblrTokens,
  refreshTumblrToken,
  getTumblrUserInfo,
  postToTumblr
} from '../lib/tumblr.js';
import { generateTumblrContent } from '../lib/gemini_tumblr.js';
import { generateInstagramSlideImages } from '../lib/instagram_carousel.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Global DB Init
app.use(async (req, res, next) => {
  try { await initDb(); next(); } catch (e) { next(); }
});

// ── AUTHENTICATION ─────────────────────────────────────────────────────────────

app.get('/api/tumblr/accounts', async (req, res) => {
  try {
    const accounts = await sql`SELECT id, name, blog_name FROM tumblr_accounts WHERE is_active = 1 ORDER BY id ASC`;
    res.json(accounts || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/tumblr/auth', (req, res) => {
  const url = getTumblrAuthUrl('tumblr_auth');
  res.redirect(url);
});

app.get('/api/tumblr/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('No code provided');

  try {
    const tokens = await getTumblrTokens(code);
    const userInfo = await getTumblrUserInfo(tokens.access_token);
    
    // Tumblr returns an array of blogs, usually the first one is primary
    const primaryBlog = userInfo.blogs.find(b => b.primary) || userInfo.blogs[0];
    const blogName = primaryBlog.name;

    const expiresAt = tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null;

    await sql`
      INSERT INTO tumblr_accounts (name, blog_name, access_token, refresh_token, expires_at, is_active)
      VALUES (${userInfo.name}, ${blogName}, ${tokens.access_token}, ${tokens.refresh_token}, ${expiresAt}, 1)
      ON CONFLICT (blog_name) DO UPDATE SET
        access_token = ${tokens.access_token},
        refresh_token = ${tokens.refresh_token},
        expires_at = ${expiresAt},
        is_active = 1
    `;

    res.send(`
      <script>
        window.opener.postMessage('TUMBLR_AUTH_SUCCESS', '*');
        window.close();
      </script>
      Login successful. You can close this window.
    `);
  } catch (e) {
    console.error('Tumblr Auth Error:', e.response?.data || e.message);
    res.status(500).send('Authentication failed: ' + (e.response?.data?.meta?.msg || e.message));
  }
});

app.get('/api/tumblr/status', async (req, res) => {
  const accountId = req.query.accountId || 1;
  try {
    const [schedules, lastPost, tokenRow, autoRow] = await Promise.all([
      sql`SELECT * FROM tumblr_schedules WHERE account_id = ${accountId} ORDER BY id ASC`,
      sql`SELECT * FROM tumblr_history WHERE account_id = ${accountId} ORDER BY id DESC LIMIT 1`,
      sql`SELECT access_token, expires_at FROM tumblr_accounts WHERE id = ${accountId}`,
      sql`SELECT value FROM tumblr_settings WHERE key = 'tumblr_automation_enabled'`,
    ]);

    const token = tokenRow[0];
    const isTokenValid = !!(token?.access_token);

    res.json({
      schedules,
      lastPost: lastPost[0] || null,
      tumblrToken: isTokenValid,
      automation_enabled: autoRow[0]?.value || 'true',
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── SETTINGS & SCHEDULES ─────────────────────────────────────────────────────

app.post('/api/tumblr/settings/toggle-automation', async (req, res) => {
  try {
    const current = await sql`SELECT value FROM tumblr_settings WHERE key = 'tumblr_automation_enabled'`;
    const newValue = current[0]?.value === 'false' ? 'true' : 'false';
    await sql`
      INSERT INTO tumblr_settings (key, value) VALUES ('tumblr_automation_enabled', ${newValue})
      ON CONFLICT (key) DO UPDATE SET value = ${newValue}
    `;
    res.json({ success: true, enabled: newValue === 'true' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/tumblr/history', async (req, res) => {
  const accountId = req.query.accountId;
  try {
    const history = accountId
      ? await sql`SELECT * FROM tumblr_history WHERE account_id = ${accountId} ORDER BY created_at DESC LIMIT 15`
      : await sql`SELECT * FROM tumblr_history ORDER BY created_at DESC LIMIT 15`;
    res.json(history || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/tumblr/schedules', async (req, res) => {
  const { custom_prompt, accountId } = req.body;
  try {
    await sql`
      INSERT INTO tumblr_schedules (account_id, custom_prompt, is_active)
      VALUES (${accountId}, ${custom_prompt || null}, 1)
    `;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/tumblr/schedules/:id', async (req, res) => {
  try {
    await sql`DELETE FROM tumblr_schedules WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── CORE: POST CAROUSEL TO TUMBLR ─────────────────────────────────────────────

async function refreshTumblrTokenIfNeeded(account) {
  if (account.expires_at && new Date(account.expires_at) < new Date()) {
    console.log(`[Tumblr-Post] Token expired for ${account.name}. Refreshing...`);
    const newTokens = await refreshTumblrToken(account.refresh_token);
    const expiresAt = newTokens.expires_in ? new Date(Date.now() + newTokens.expires_in * 1000) : null;
    await sql`
      UPDATE tumblr_accounts SET
        access_token = ${newTokens.access_token},
        refresh_token = ${newTokens.refresh_token},
        expires_at = ${expiresAt}
      WHERE id = ${account.id}
    `;
    return newTokens.access_token;
  }
  return account.access_token;
}

async function runTumblrPost(accountId, customPrompt = null) {
  const accountRow = await sql`SELECT * FROM tumblr_accounts WHERE id = ${accountId}`;
  if (!accountRow.length) throw new Error(`Tumblr account ${accountId} not found`);
  const account = accountRow[0];

  const accessToken = await refreshTumblrTokenIfNeeded(account);

  const masterPrompt = account.master_prompt || '';
  const visualTheme = account.visual_theme || '';
  const colorPalette = account.color_palette || null;

  console.log(`[Tumblr-Post] Generating content for blog ${account.blog_name}...`);

  const accountName = "caridisinishop_tumblr"; // Force caridisinishop persona instead of Adhlil for Tumblr

  const { slides, caption, hashtags } = await generateTumblrContent(customPrompt, masterPrompt, visualTheme, accountName, accountId);
  console.log(`[Tumblr-Post] Generated with ${slides.length} images`);

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
  if (slides && slides.length > 0) {
    imageUrls = await generateInstagramSlideImages(slides, dynamicPalette, accountName);
    console.log(`[Tumblr-Post] ${imageUrls.length} images generated and uploaded to Supabase`);
  } else {
    console.log(`[Tumblr-Post] TEXT-ONLY mode activated. No images generated.`);
  }

  const response = await postToTumblr(account.blog_name, accessToken, imageUrls, caption, hashtags);
  console.log(`[Tumblr-Post] Successfully posted to Tumblr. Post ID: ${response.id}`);

  await sql`
    INSERT INTO tumblr_history (account_id, caption, slide_count, image_urls, post_id, status)
    VALUES (${accountId}, ${caption}, ${imageUrls.length}, ${JSON.stringify(imageUrls)}, ${String(response.id)}, 'success')
  `;

  return { publishId: response.id, status: 'success' };
}

app.post('/api/tumblr/post-now', async (req, res) => {
  const accountId = req.body.accountId || 1;
  const customPrompt = req.body.customPrompt || null;
  
  try {
    let finalPrompt = customPrompt;
    if (!finalPrompt) {
      const pending = await sql`SELECT custom_prompt FROM tumblr_schedules WHERE account_id = ${accountId} AND is_active = 1`;
      if (pending.length > 0) {
        finalPrompt = pending[Math.floor(Math.random() * pending.length)].custom_prompt;
      }
    }

    const result = await runTumblrPost(accountId, finalPrompt);
    res.json({ success: true, ...result });
  } catch (e) {
    console.error('[Tumblr-Manual]', e.message);
    try {
      await sql`
        INSERT INTO tumblr_history (account_id, caption, status, error_message)
        VALUES (${accountId}, ${customPrompt || 'Manual post'}, 'failed', ${e.message || String(e)})
      `;
    } catch (_) {}
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── CRON: AUTOMATION SCHEDULER ────────────────────────────────────────────────

app.get('/api/tumblr/cron', async (req, res) => {
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
    const globalStatus = await sql`SELECT value FROM tumblr_settings WHERE key = 'tumblr_automation_enabled'`;
    if (globalStatus[0]?.value === 'false') {
      return res.json({ success: true, status: 'Tumblr automation disabled globally.' });
    }

    const accounts = await sql`SELECT id, name FROM tumblr_accounts WHERE is_active = 1`;
    const executed = [];

    for (const acc of accounts) {
      const ranToday = await sql`
        SELECT COUNT(*) as count FROM tumblr_schedules
        WHERE account_id = ${acc.id} AND last_run_date = ${todayStr}
      `;
      const postsToday = parseInt(ranToday[0]?.count || 0, 10);

      if (postsToday >= 5) {
        console.log(`[Tumblr-Cron] Acc ${acc.name}: hit 5-post daily limit.`);
        continue;
      }

      const pending = await sql`
        SELECT * FROM tumblr_schedules
        WHERE account_id = ${acc.id}
          AND is_active = 1
          AND (last_run_date IS NULL OR last_run_date != ${todayStr})
      `;

      if (!pending.length) continue;

      const postsRemaining = 5 - postsToday;
      const numToMake = Math.min(postsRemaining, pending.length);
      const chance = numToMake / totalMinutesLeft;
      const roll = Math.random();

      if (roll < chance) {
        const chosen = pending[Math.floor(Math.random() * pending.length)];
        try {
          const result = await runTumblrPost(acc.id, chosen.custom_prompt);
          await sql`UPDATE tumblr_schedules SET last_run_date = ${todayStr} WHERE id = ${chosen.id}`;
          executed.push({ account: acc.name, scheduleId: chosen.id, ...result });
        } catch (postErr) {
          console.error(`[Tumblr-Cron] Post failed for ${acc.name}:`, postErr.message);
          await sql`
            INSERT INTO tumblr_history (account_id, caption, status, error_message)
            VALUES (${acc.id}, ${chosen.custom_prompt || 'Auto post'}, 'failed', ${postErr.message || String(postErr)})
          `;
        }
      }
    }

    res.json({ success: true, executed });
  } catch (e) {
    console.error('[Tumblr-Cron] Error:', e.message);
    res.status(200).json({ success: false, error: e.message });
  }
});

export default app;
