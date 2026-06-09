import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sql, { initDb } from '../lib/database.js';
import { buildOAuthUrl, exchangeCodeForToken, getTikTokUserInfo, postTikTokCarousel } from '../lib/tiktok.js';
import { generateCarouselContent } from '../lib/gemini_tiktok.js';
import { generateSlideImages } from '../lib/tiktok_carousel.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express.Router();

// In-memory PKCE store (serverless — resets per cold start, but OAuth is one-shot)
const pkceStore = new Map();

// ── DB INIT MIDDLEWARE ────────────────────────────────────────────────────────
app.use(async (req, res, next) => {
  try { await initDb(); next(); } catch (e) { next(); }
});

// ── OAUTH FLOW ────────────────────────────────────────────────────────────────

/**
 * GET /api/tiktok/auth?accountName=MyName
 * Redirects user to TikTok OAuth authorization page.
 */
app.get('/api/tiktok/auth', (req, res) => {
  const host = req.headers.host || 'threadstomation.vercel.app';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/api/tiktok/callback`;
  const { url, codeVerifier } = buildOAuthUrl(redirectUri);

  // Store verifier keyed by state (using a simple timestamp key)
  const stateKey = `tt_${Date.now()}`;
  pkceStore.set(stateKey, { codeVerifier, accountName: req.query.accountName || 'TikTok Account' });

  // Redirect with our state key embedded
  const finalUrl = url.replace('state=tiktok_auth', `state=${stateKey}`);
  res.redirect(finalUrl);
});

/**
 * GET /api/tiktok/callback
 * Handles TikTok OAuth callback, saves tokens to DB.
 */
app.get('/api/tiktok/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`/tiktok?auth_error=${encodeURIComponent(error)}`);
  }

  const storedData = pkceStore.get(state);
  if (!storedData) {
    // pkceStore may reset on cold start — use a fallback verifier
    console.warn('[TikTok-Callback] PKCE state not found (cold start?), proceeding without verifier...');
  }

  const codeVerifier = storedData?.codeVerifier || '';
  const accountName = storedData?.accountName || 'TikTok Account';
  const host = req.headers.host || 'threadstomation.vercel.app';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/api/tiktok/callback`;

  try {
    const tokenData = await exchangeCodeForToken(code, codeVerifier, redirectUri);
    const { access_token, refresh_token, expires_in, open_id } = tokenData;
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // Get user display name
    let displayName = accountName;
    try {
      const userInfo = await getTikTokUserInfo(access_token);
      displayName = userInfo.display_name || accountName;
    } catch (e) {
      console.warn('[TikTok-Callback] Could not fetch user info:', e.message);
    }

    // Upsert account in DB
    await sql`
      INSERT INTO tiktok_accounts (name, tiktok_open_id, access_token, refresh_token, expires_at, is_active)
      VALUES (${displayName}, ${open_id}, ${access_token}, ${refresh_token}, ${expiresAt}, 1)
      ON CONFLICT (tiktok_open_id)
      DO UPDATE SET
        access_token = ${access_token},
        refresh_token = ${refresh_token},
        expires_at = ${expiresAt},
        name = ${displayName},
        is_active = 1
    `;

    pkceStore.delete(state);
    console.log(`[TikTok] ✅ Account "${displayName}" (${open_id}) linked successfully!`);
    res.redirect('/tiktok?auth_success=1');
  } catch (e) {
    console.error('[TikTok-Callback] Token exchange error:', e.message);
    res.redirect(`/tiktok?auth_error=${encodeURIComponent(e.message)}`);
  }
});

// ── ACCOUNTS ──────────────────────────────────────────────────────────────────

app.get('/api/tiktok/accounts', async (req, res) => {
  try {
    const accounts = await sql`SELECT id, name, tiktok_open_id, is_active, created_at FROM tiktok_accounts ORDER BY id ASC`;
    res.json(accounts);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── STATUS ────────────────────────────────────────────────────────────────────

app.get('/api/tiktok/status', async (req, res) => {
  const accountId = req.query.accountId || 1;
  try {
    const [schedules, lastPost, tokenRow, autoRow] = await Promise.all([
      sql`SELECT * FROM tiktok_schedules WHERE account_id = ${accountId} ORDER BY id ASC`,
      sql`SELECT * FROM tiktok_history WHERE account_id = ${accountId} ORDER BY id DESC LIMIT 1`,
      sql`SELECT access_token, expires_at FROM tiktok_accounts WHERE id = ${accountId}`,
      sql`SELECT value FROM tiktok_settings WHERE key = 'automation_enabled'`,
    ]);

    const token = tokenRow[0];
    const isTokenValid = !!(token?.access_token && new Date(token.expires_at) > new Date());

    res.json({
      schedules,
      lastPost: lastPost[0] || null,
      tiktokToken: isTokenValid,
      automation_enabled: autoRow[0]?.value || 'true',
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── HISTORY ───────────────────────────────────────────────────────────────────

app.get('/api/tiktok/history', async (req, res) => {
  const accountId = req.query.accountId;
  try {
    const history = accountId
      ? await sql`SELECT * FROM tiktok_history WHERE account_id = ${accountId} ORDER BY created_at DESC LIMIT 15`
      : await sql`SELECT * FROM tiktok_history ORDER BY created_at DESC LIMIT 15`;
    res.json(history || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── STATUS ────────────────────────────────────────────────────────────────────

app.get('/api/tiktok/status', async (req, res) => {
  const accountId = req.query.accountId || 1;
  try {
    const [schedules, lastPost, tokenRow, autoRow] = await Promise.all([
      sql`SELECT * FROM tiktok_schedules WHERE account_id = ${accountId} ORDER BY id ASC`,
      sql`SELECT * FROM tiktok_history WHERE account_id = ${accountId} ORDER BY id DESC LIMIT 1`,
      sql`SELECT access_token, expires_at FROM tiktok_accounts WHERE id = ${accountId}`,
      sql`SELECT value FROM tiktok_settings WHERE key = 'automation_enabled'`,
    ]);

    const token = tokenRow[0];
    const isTokenValid = !!(token?.access_token && new Date(token.expires_at) > new Date());

    res.json({
      schedules,
      lastPost: lastPost[0] || null,
      tiktokToken: isTokenValid,
      automation_enabled: autoRow[0]?.value || 'true',
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── HISTORY ───────────────────────────────────────────────────────────────────

app.get('/api/tiktok/history', async (req, res) => {
  const accountId = req.query.accountId;
  try {
    const history = accountId
      ? await sql`SELECT * FROM tiktok_history WHERE account_id = ${accountId} ORDER BY created_at DESC LIMIT 15`
      : await sql`SELECT * FROM tiktok_history ORDER BY created_at DESC LIMIT 15`;
    res.json(history || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── SCHEDULES ─────────────────────────────────────────────────────────────────

app.post('/api/tiktok/schedules', async (req, res) => {
  const { custom_prompt, accountId } = req.body;
  try {
    await sql`
      INSERT INTO tiktok_schedules (account_id, custom_prompt, is_active)
      VALUES (${accountId}, ${custom_prompt || null}, 1)
    `;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/tiktok/schedules/:id', async (req, res) => {
  try {
    await sql`DELETE FROM tiktok_schedules WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/tiktok/schedules/:id/toggle', async (req, res) => {
  try {
    await sql`
      UPDATE tiktok_schedules 
      SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END
      WHERE id = ${req.params.id}
    `;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── SETTINGS ──────────────────────────────────────────────────────────────────

app.get('/api/tiktok/settings', async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM tiktok_settings`;
    const obj = {};
    rows.forEach(r => obj[r.key] = r.value);
    res.json(obj);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/tiktok/settings', async (req, res) => {
  try {
    for (const [key, value] of Object.entries(req.body)) {
      await sql`
        INSERT INTO tiktok_settings (key, value) VALUES (${key}, ${value})
        ON CONFLICT (key) DO UPDATE SET value = ${value}
      `;
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/tiktok/settings/toggle-automation', async (req, res) => {
  try {
    const current = await sql`SELECT value FROM tiktok_settings WHERE key = 'automation_enabled'`;
    const newValue = current[0]?.value === 'false' ? 'true' : 'false';
    await sql`
      INSERT INTO tiktok_settings (key, value) VALUES ('automation_enabled', ${newValue})
      ON CONFLICT (key) DO UPDATE SET value = ${newValue}
    `;
    res.json({ success: true, enabled: newValue === 'true' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/tiktok/media?path=tiktok/xxx.jpg
 * Proxies images from Supabase storage through the Vercel domain to pass TikTok's domain ownership rules.
 */
app.get('/api/tiktok/media', async (req, res) => {
  const { path } = req.query;
  if (!path) return res.status(400).send('path required');

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) throw new Error('SUPABASE_URL environment variable is missing');

    const imageUrl = `${supabaseUrl}/storage/v1/object/public/media/${path}`;
    const response = await fetch(imageUrl);

    if (!response.ok) {
      return res.status(response.status).send('Failed to fetch media from storage');
    }

    const arrayBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(arrayBuffer));
  } catch (e) {
    console.error('[TikTok-MediaProxy] Error:', e.message);
    res.status(500).send(e.message);
  }
});

// ── CORE: POST CAROUSEL ───────────────────────────────────────────────────────

async function runTikTokCarouselPost(accountId, customPrompt = null, baseUrl = '') {
  // Get account master prompt
  const account = await sql`SELECT * FROM tiktok_accounts WHERE id = ${accountId}`;
  if (!account.length) throw new Error(`TikTok account ${accountId} not found`);

  const masterPromptRow = await sql`SELECT value FROM tiktok_settings WHERE key = 'tiktok_master_prompt'`;
  const masterPrompt = masterPromptRow[0]?.value || '';

  console.log(`[TikTok-Post] Generating carousel content for account ${accountId}...`);

  // Step 1: Generate slide content with Gemini
  const { slides, caption, hashtags } = await generateCarouselContent(customPrompt, masterPrompt);
  console.log(`[TikTok-Post] ${slides.length} slides generated`);

  // Step 2: Generate slide images (SVG → JPEG → Supabase)
  const imageUrls = await generateSlideImages(slides);
  console.log(`[TikTok-Post] ${imageUrls.length} images uploaded`);

  // Step 3: Rewrite URLs to go through verified domain proxy if baseUrl is provided
  let finalUrls = imageUrls;
  if (baseUrl) {
    finalUrls = imageUrls.map(url => {
      const match = url.match(/\/storage\/v1\/object\/public\/media\/(.*)/);
      if (match && match[1]) {
        return `${baseUrl}/api/tiktok/media?path=${match[1]}`;
      }
      return url;
    });
    console.log(`[TikTok-Post] Rewrote image URLs to verified domain proxy:`, finalUrls);
  }

  // Step 4: Post to TikTok
  const { publishId, status } = await postTikTokCarousel(finalUrls, caption, hashtags, accountId);

  // Step 5: Save to history
  await sql`
    INSERT INTO tiktok_history (account_id, caption, slide_count, image_urls, publish_id, status)
    VALUES (
      ${accountId},
      ${caption},
      ${slides.length},
      ${JSON.stringify(finalUrls)},
      ${publishId},
      ${status}
    )
  `;

  return { publishId, status, slideCount: slides.length };
}

// POST /api/tiktok/post-now
app.post('/api/tiktok/post-now', async (req, res) => {
  const { accountId, customPrompt } = req.body;
  if (!accountId) return res.status(400).json({ error: 'accountId required' });

  const protocol = req.get('host').includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${req.get('host')}`;

  try {
    const result = await runTikTokCarouselPost(parseInt(accountId), customPrompt, baseUrl);
    res.json({ success: true, ...result });
  } catch (e) {
    console.error('[TikTok-PostNow] Error:', e.message);
    // Save failed history
    try {
      await sql`
        INSERT INTO tiktok_history (account_id, caption, status, error_message)
        VALUES (${accountId}, ${customPrompt || 'Manual post'}, 'failed', ${e.message})
      `;
    } catch (_) {}
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── CRON: CHAOS SCHEDULER ────────────────────────────────────────────────────

app.get('/api/tiktok/cron', async (req, res) => {
  // Auth check
  const expectedSecret = process.env.CRON_SECRET || 'super_chaos_secret_99';
  const authHeader = req.headers.authorization;
  const secretParam = req.query.secret;

  if (process.env.CRON_SECRET) {
    if (authHeader !== `Bearer ${expectedSecret}` && secretParam !== expectedSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  // Robust WITA (UTC+8) Time Calculation
  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const witaTime = new Date(utcTime + (3600000 * 8)); 
  
  const currentHour = witaTime.getHours();
  const todayStr = witaTime.toISOString().split('T')[0];
  const totalMinutesLeft = Math.max(1, (23 - currentHour) * 60 + (60 - witaTime.getMinutes()));

  try {
    const host = req.headers.host || 'threadstomation.vercel.app';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    
    // Check global automation switch
    const globalStatus = await sql`SELECT value FROM tiktok_settings WHERE key = 'automation_enabled'`;
    if (globalStatus[0]?.value === 'false') {
      return res.json({ success: true, status: 'TikTok automation disabled globally.' });
    }

    const accounts = await sql`SELECT id, name FROM tiktok_accounts WHERE is_active = 1`;
    const executed = [];

    for (const acc of accounts) {
      // How many posts today?
      const ranToday = await sql`
        SELECT COUNT(*) as count FROM tiktok_schedules
        WHERE account_id = ${acc.id} AND last_run_date = ${todayStr}
      `;
      const postsToday = parseInt(ranToday[0]?.count || 0, 10);

      if (postsToday >= 5) {
        console.log(`[TikTok-Cron] Acc ${acc.name}: hit 5-post daily limit.`);
        continue;
      }

      // Get pending schedules
      const pending = await sql`
        SELECT * FROM tiktok_schedules
        WHERE account_id = ${acc.id}
          AND is_active = 1
          AND (last_run_date IS NULL OR last_run_date != ${todayStr})
      `;

      if (!pending.length) continue;

      const postsRemaining = 5 - postsToday;
      const numToMake = Math.min(postsRemaining, pending.length);
      const chance = numToMake / totalMinutesLeft;
      const roll = Math.random();

      console.log(`[TikTok-Cron] ${acc.name}: postsToday=${postsToday}/5, pending=${pending.length}, chance=${chance.toFixed(4)}, roll=${roll.toFixed(4)}`);

      if (roll < chance) {
        const chosen = pending[Math.floor(Math.random() * pending.length)];

        // Mark as run immediately to prevent duplicate
        await sql`UPDATE tiktok_schedules SET last_run_date = ${todayStr} WHERE id = ${chosen.id}`;

        try {
          const result = await runTikTokCarouselPost(acc.id, chosen.custom_prompt, baseUrl);
          executed.push({ account: acc.name, scheduleId: chosen.id, ...result });
          console.log(`[TikTok-Cron] ✅ Posted for ${acc.name}`);
        } catch (postErr) {
          console.error(`[TikTok-Cron] Post failed for ${acc.name}:`, postErr.message);
          await sql`
            INSERT INTO tiktok_history (account_id, caption, status, error_message)
            VALUES (${acc.id}, ${chosen.custom_prompt || 'Auto post'}, 'failed', ${postErr.message})
          `;
        }
      }
    }

    res.json({ success: true, executed });
  } catch (e) {
    console.error('[TikTok-Cron] Error:', e.message);
    res.status(200).json({ success: false, error: e.message });
  }
});

// ── DEBUG ─────────────────────────────────────────────────────────────────────

app.get('/api/tiktok/debug', async (req, res) => {
  try {
    const test = await sql`SELECT 1 + 1 as result`;
    res.json({
      success: true,
      db: 'online',
      has_client_key: !!process.env.TIKTOK_CLIENT_KEY,
      has_client_secret: !!process.env.TIKTOK_CLIENT_SECRET,
      has_supabase: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    });
  } catch (e) {
    res.status(200).json({ success: false, db: 'offline', error: e.message });
  }
});

export default app;
