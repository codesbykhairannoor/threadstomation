import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
process.env.FONTCONFIG_PATH = join(__dirname, '../lib/fonts');

export const maxDuration = 60;
import express from 'express';
import cors from 'cors';
import sql, { initDb } from '../lib/database.js';
import { postToInstagram, exchangeInstagramToken, fetchInstagramAccounts, postToFacebook } from '../lib/instagram.js';
import { generateInstagramContent } from '../lib/gemini_instagram.js';
import { generateInstagramSlideImages } from '../lib/instagram_carousel.js';
import { createVideoFromImages } from '../lib/video_generator.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── DB INIT MIDDLEWARE ────────────────────────────────────────────────────────
app.use(async (req, res, next) => {
  try { await initDb(); next(); } catch (e) { next(); }
});

// In-memory state store for OAuth
const stateStore = new Map();

// ── DB INIT MIDDLEWARE ────────────────────────────────────────────────────────
app.use('/api/instagram', async (req, res, next) => {
  try { await initDb(); next(); } catch (e) { next(); }
});

// ── OAUTH FLOW ────────────────────────────────────────────────────────────────

/**
 * GET /api/instagram/auth
 * Redirects user to Facebook Login to authorize Instagram Graph API.
 */
app.get('/api/instagram/auth', (req, res) => {
  const protocol = req.get('host').includes('localhost') ? 'http' : 'https';
  const redirectUri = `${protocol}://${req.get('host')}/api/instagram/callback`;
  const appId = process.env.THREADS_APP_ID;

  if (!appId) {
    return res.status(500).send('THREADS_APP_ID missing in environment variables.');
  }

  const stateKey = `ig_${Date.now()}`;
  stateStore.set(stateKey, { accountName: req.query.accountName || 'Instagram Bot Account' });

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state: stateKey,
    scope: 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,pages_manage_posts',
    response_type: 'code',
  });

  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
  res.redirect(authUrl);
});

/**
 * GET /api/instagram/callback
 * Handles Facebook OAuth callback, exchanges code for long-lived page token, and saves account.
 */
app.get('/api/instagram/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`/instagram?auth_error=${encodeURIComponent(error)}`);
  }

  const storedData = stateStore.get(state);
  const accountName = storedData?.accountName || 'Instagram Bot Account';

  const protocol = req.get('host').includes('localhost') ? 'http' : 'https';
  const redirectUri = `${protocol}://${req.get('host')}/api/instagram/callback`;
  const appId = process.env.THREADS_APP_ID;
  const appSecret = process.env.THREADS_APP_SECRET;

  try {
    // 1. Exchange authorization code for short-lived user access token
    const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?` + new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code: code,
    }));
    
    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      throw new Error(`Token exchange failed: ${tokenData.error.message}`);
    }

    const { access_token: shortToken } = tokenData;

    // 2. Exchange short-lived token for long-lived user access token
    const longLivedData = await exchangeInstagramToken(shortToken);
    const { access_token: longUserToken, expires_in } = longLivedData;
    const expiresAt = expires_in ? new Date(Date.now() + expires_in * 1000).toISOString() : null;

    // 3. Fetch linked Instagram accounts
    const accounts = await fetchInstagramAccounts(longUserToken);
    if (accounts.length === 0) {
      throw new Error('No Instagram Business accounts found linked to your Facebook pages.');
    }

    // 4. Save accounts to DB
    for (const acc of accounts) {
      await sql`
        INSERT INTO instagram_accounts (name, instagram_business_id, facebook_page_id, access_token, facebook_access_token, expires_at, is_active)
        VALUES (${acc.name} + ' (' + ${acc.username} + ')', ${acc.instagram_business_id}, ${acc.facebook_page_id}, ${acc.page_access_token}, ${acc.page_access_token}, ${expiresAt}, 1)
        ON CONFLICT (instagram_business_id)
        DO UPDATE SET
          access_token = ${acc.page_access_token},
          facebook_access_token = ${acc.page_access_token},
          facebook_page_id = ${acc.facebook_page_id},
          expires_at = ${expiresAt},
          name = ${acc.name} + ' (' + ${acc.username} + ')',
          is_active = 1
      `;
    }

    stateStore.delete(state);
    console.log(`[Instagram] Linked ${accounts.length} account(s) successfully!`);
    res.redirect('/instagram?auth_success=1');
  } catch (e) {
    console.error('[Instagram-Callback] Error:', e.message);
    res.redirect(`/instagram?auth_error=${encodeURIComponent(e.message)}`);
  }
});

// ── ACCOUNTS ──────────────────────────────────────────────────────────────────

app.get('/api/instagram/accounts', async (req, res) => {
  try {
    const accounts = await sql`
      SELECT id, name, instagram_business_id, is_active, created_at, 
             master_prompt, visual_theme, color_palette, preferred_layout 
      FROM instagram_accounts 
      ORDER BY id ASC
    `;
    res.json(accounts);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/instagram/accounts', async (req, res) => {
  const { name, instagram_business_id, access_token } = req.body;
  if (!instagram_business_id || !access_token) {
    return res.status(400).json({ error: 'instagram_business_id and access_token are required' });
  }
  try {
    const result = await sql`
      INSERT INTO instagram_accounts (name, instagram_business_id, access_token, expires_at, is_active)
      VALUES (${name || 'Manual Instagram Account'}, ${instagram_business_id}, ${access_token}, NULL, 1)
      ON CONFLICT (instagram_business_id)
      DO UPDATE SET
        name = ${name || 'Manual Instagram Account'},
        access_token = ${access_token},
        is_active = 1
      RETURNING *
    `;
    res.json({ success: true, account: result[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/instagram/accounts/:id', async (req, res) => {
  try {
    await sql`DELETE FROM instagram_accounts WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/instagram/accounts/:id/config', async (req, res) => {
  const { id } = req.params;
  const { master_prompt, visual_theme, color_palette, preferred_layout } = req.body;
  try {
    await sql`
      UPDATE instagram_accounts 
      SET master_prompt = ${master_prompt},
          visual_theme = ${visual_theme},
          color_palette = ${color_palette},
          preferred_layout = ${preferred_layout}
      WHERE id = ${id}
    `;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── STATUS ────────────────────────────────────────────────────────────────────

app.get('/api/instagram/status', async (req, res) => {
  const accountId = req.query.accountId || 1;
  try {
    const [schedules, lastPost, tokenRow, autoRow] = await Promise.all([
      sql`SELECT * FROM instagram_schedules WHERE account_id = ${accountId} ORDER BY id ASC`,
      sql`SELECT * FROM instagram_history WHERE account_id = ${accountId} ORDER BY id DESC LIMIT 1`,
      sql`SELECT access_token, facebook_access_token, expires_at FROM instagram_accounts WHERE id = ${accountId}`,
      sql`SELECT value FROM instagram_settings WHERE key = 'instagram_automation_enabled'`,
    ]);

    const token = tokenRow[0];
    const isTokenValid = !!((token?.access_token || token?.facebook_access_token) && (!token.expires_at || new Date(token.expires_at) > new Date()));

    res.json({
      schedules,
      lastPost: lastPost[0] || null,
      instagramToken: isTokenValid,
      automation_enabled: autoRow[0]?.value || 'true',
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── HISTORY ───────────────────────────────────────────────────────────────────

app.get('/api/instagram/history', async (req, res) => {
  const accountId = req.query.accountId;
  try {
    const history = accountId
      ? await sql`SELECT * FROM instagram_history WHERE account_id = ${accountId} ORDER BY created_at DESC LIMIT 15`
      : await sql`SELECT * FROM instagram_history ORDER BY created_at DESC LIMIT 15`;
    res.json(history || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── SCHEDULES ─────────────────────────────────────────────────────────────────

app.post('/api/instagram/schedules', async (req, res) => {
  const { custom_prompt, accountId } = req.body;
  try {
    await sql`
      INSERT INTO instagram_schedules (account_id, custom_prompt, is_active)
      VALUES (${accountId}, ${custom_prompt || null}, 1)
    `;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/instagram/schedules/:id', async (req, res) => {
  try {
    await sql`DELETE FROM instagram_schedules WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/instagram/schedules/:id/toggle', async (req, res) => {
  try {
    await sql`
      UPDATE instagram_schedules 
      SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END
      WHERE id = ${req.params.id}
    `;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── SETTINGS ──────────────────────────────────────────────────────────────────

app.get('/api/instagram/settings', async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM instagram_settings`;
    const obj = {};
    rows.forEach(r => obj[r.key] = r.value);
    res.json(obj);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/instagram/settings', async (req, res) => {
  try {
    for (const [key, value] of Object.entries(req.body)) {
      await sql`
        INSERT INTO instagram_settings (key, value) VALUES (${key}, ${value})
        ON CONFLICT (key) DO UPDATE SET value = ${value}
      `;
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/instagram/settings/toggle-automation', async (req, res) => {
  try {
    const current = await sql`SELECT value FROM instagram_settings WHERE key = 'instagram_automation_enabled'`;
    const newValue = current[0]?.value === 'false' ? 'true' : 'false';
    await sql`
      INSERT INTO instagram_settings (key, value) VALUES ('instagram_automation_enabled', ${newValue})
      ON CONFLICT (key) DO UPDATE SET value = ${newValue}
    `;
    res.json({ success: true, enabled: newValue === 'true' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── CORE: POST CAROUSEL ───────────────────────────────────────────────────────

async function runInstagramPost(accountId, customPrompt = null) {
  // Get account details
  const account = await sql`SELECT * FROM instagram_accounts WHERE id = ${accountId}`;
  if (!account.length) throw new Error(`Instagram account ${accountId} not found`);

  const masterPrompt = account[0].master_prompt || '';
  const visualTheme = account[0].visual_theme || '';
  const colorPalette = account[0].color_palette || null;
  const preferredLayout = account[0].preferred_layout !== null ? account[0].preferred_layout : -1;

  console.log(`[Instagram-Post] Generating content for account ${accountId}...`);

  const accountName = account[0].name || "@instagram";

  // Step 1: Generate slide contents + caption
  const { slides, caption, hashtags } = await generateInstagramContent(customPrompt, masterPrompt, visualTheme, accountName, accountId);
  console.log(`[Instagram-Post] ${slides.length} slides generated`);

  // Detect Affiliate Product for Dynamic Color Palette
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

  // Step 2: Determine if today is a Video Day or Carousel Day
  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const witaTime = new Date(utcTime + (3600000 * 8)); 
  const dayOfWeek = witaTime.getDay(); // 0 (Sun) to 6 (Sat)
  
  // Carousel days: Monday (1), Wednesday (3), Friday (5)
  const isCarouselDay = [1, 3, 5].includes(dayOfWeek);
  
  let mediaUrls = [];

  if (isCarouselDay) {
    console.log(`[Instagram-Post] Today (${dayOfWeek}) is a Carousel day. Rendering and uploading images directly to Supabase...`);
    // returnBuffers = false -> uploads to Supabase and returns URLs
    mediaUrls = await generateInstagramSlideImages(slides, dynamicPalette, accountName, false);
    console.log(`[Instagram-Post] ${mediaUrls.length} images generated and uploaded to Supabase`);
  } else {
    console.log(`[Instagram-Post] Today (${dayOfWeek}) is a Video day. Rendering slides to buffers...`);
    // Step 2.1: Render slides via Satori/ImgLy to raw buffers
    const imageBuffers = await generateInstagramSlideImages(slides, dynamicPalette, accountName, true);
    console.log(`[Instagram-Post] ${imageBuffers.length} images generated as buffers.`);

    // Step 3: Convert buffers to Video (Reels) and Upload to Supabase
    const rawBuffers = imageBuffers.map(img => img.buffer);
    const videoUrl = await createVideoFromImages(rawBuffers, 3);
    console.log(`[Instagram-Post] Video generated and uploaded to Supabase: ${videoUrl}`);
    mediaUrls = [videoUrl];
  }

  // Step 4: Publish to Instagram
  const hashtagStr = hashtags.map(h => `#${h}`).join(' ');
  const finalCaption = `${caption}\n\n${hashtagStr}`;
  
  const { publishId, status } = await postToInstagram(mediaUrls, finalCaption, accountId);

  // Step 5: Publish to Facebook (if enabled)
  console.log(`[Instagram-Post] Attempting Facebook crosspost for account ${accountId}...`);
  const fbResult = await postToFacebook(mediaUrls, finalCaption, accountId);
  if (fbResult.publishId) {
    console.log(`[Facebook-Post] Successfully crossposted to FB with ID: ${fbResult.publishId}`);
  }

  // Step 6: Save success to history
  await sql`
    INSERT INTO instagram_history (account_id, caption, slide_count, image_urls, creation_id, status)
    VALUES (
      ${accountId},
      ${caption || ''},
      ${slides ? slides.length : 0},
      ${JSON.stringify(mediaUrls) || '[]'},
      ${publishId || ''},
      ${status || 'success'}
    )
  `;

  return { publishId, status, slideCount: slides.length };
}

// POST /api/instagram/post-now
app.post('/api/instagram/post-now', async (req, res) => {
  const { accountId, customPrompt } = req.body;
  if (!accountId) return res.status(400).json({ error: 'accountId required' });

  try {
    let finalPrompt = customPrompt;
    if (!finalPrompt) {
      const pending = await sql`SELECT custom_prompt FROM instagram_schedules WHERE account_id = ${accountId} AND is_active = 1`;
      if (pending.length > 0) {
        finalPrompt = pending[Math.floor(Math.random() * pending.length)].custom_prompt;
      }
    }

    const result = await runInstagramPost(parseInt(accountId), finalPrompt);
    res.json({ success: true, ...result });
  } catch (e) {
    console.error('[Instagram-PostNow] Error:', e.message);
    try {
      await sql`
        INSERT INTO instagram_history (account_id, caption, status, error_message)
        VALUES (${accountId}, ${customPrompt || 'Manual post'}, 'failed', ${e.message || String(e)})
      `;
    } catch (_) {}
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── CRON: AUTOMATION SCHEDULER ────────────────────────────────────────────────

export async function runInstagramCron() {
  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const witaTime = new Date(utcTime + (3600000 * 8)); 
  
  const currentHour = witaTime.getHours();
  const todayStr = witaTime.toISOString().split('T')[0];
  const totalMinutesLeft = Math.max(1, (23 - currentHour) * 60 + (60 - witaTime.getMinutes()));

  try {
    const globalStatus = await sql`SELECT value FROM instagram_settings WHERE key = 'instagram_automation_enabled'`;
    if (globalStatus[0]?.value === 'false') {
      return { success: true, status: 'Instagram automation disabled globally.' };
    }

    const accounts = await sql`SELECT id, name FROM instagram_accounts WHERE is_active = 1`;
    const executed = [];

    for (const acc of accounts) {
      const ranToday = await sql`
        SELECT COUNT(*) as count FROM instagram_schedules
        WHERE account_id = ${acc.id} AND last_run_date = ${todayStr}
      `;
      const postsToday = parseInt(ranToday[0]?.count || 0, 10);
      
      const dailyLimit = 1; // User requested 1x per day for all IG

      if (postsToday >= dailyLimit) {
        console.log(`[Instagram-Cron] Acc ${acc.name}: hit ${dailyLimit}-post daily limit.`);
        continue;
      }

      const pending = await sql`
        SELECT * FROM instagram_schedules
        WHERE account_id = ${acc.id}
          AND is_active = 1
          AND (last_run_date IS NULL OR last_run_date != ${todayStr})
      `;

      if (!pending.length) continue;

      const postsRemaining = dailyLimit - postsToday;
      const numToMake = Math.min(postsRemaining, pending.length);
      const chance = (numToMake / totalMinutesLeft) * 3;
      const roll = Math.random();

      console.log(`[Instagram-Cron] ${acc.name}: postsToday=${postsToday}/5, pending=${pending.length}, chance=${chance.toFixed(4)}, roll=${roll.toFixed(4)}`);

      if (roll < chance) {
        const chosen = pending[Math.floor(Math.random() * pending.length)];
        try {
          const result = await runInstagramPost(acc.id, chosen.custom_prompt);
          // Only mark as ran today if it actually succeeded
          await sql`UPDATE instagram_schedules SET last_run_date = ${todayStr} WHERE id = ${chosen.id}`;
          
          executed.push({ account: acc.name, scheduleId: chosen.id, ...result });
          console.log(`[Instagram-Cron] ✅ Posted for ${acc.name}`);
        } catch (postErr) {
          console.error(`[Instagram-Cron] Post failed for ${acc.name}:`, postErr.message);
          await sql`
            INSERT INTO instagram_history (account_id, caption, status, error_message)
            VALUES (${acc.id}, ${chosen.custom_prompt || 'Auto post'}, 'failed', ${postErr.message || String(postErr)})
          `;
        }
      }
    }

    return { success: true, executed };
  } catch (e) {
    console.error('[Instagram-Cron] Error:', e.message);
    throw e;
  }
}

app.get('/api/instagram/cron', async (req, res) => {
  const expectedSecret = process.env.CRON_SECRET || 'super_chaos_secret_99';
  const authHeader = req.headers.authorization;
  const secretParam = req.query.secret;

  if (process.env.CRON_SECRET) {
    if (authHeader !== `Bearer ${expectedSecret}` && secretParam !== expectedSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    const result = await runInstagramCron();
    res.json(result);
  } catch (e) {
    res.status(200).json({ success: false, error: e.message });
  }
});

export default app;
