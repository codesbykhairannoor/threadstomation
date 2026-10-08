export const maxDuration = 60;
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
import { generateInstagramSlideImages, generateNativeBannerImage } from '../lib/instagram_carousel.js';
import { generateTumblrPost } from '../lib/tumblr_content.js';

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

    const inserted = await sql`
      INSERT INTO tumblr_accounts (name, blog_name, access_token, refresh_token, expires_at, is_active)
      VALUES (${userInfo.name}, ${blogName}, ${tokens.access_token}, ${tokens.refresh_token}, ${expiresAt}, 1)
      ON CONFLICT (blog_name) DO UPDATE SET
        access_token = ${tokens.access_token},
        refresh_token = ${tokens.refresh_token},
        expires_at = ${expiresAt},
        is_active = 1
      RETURNING id
    `;
    const accountId = inserted[0]?.id;

    res.send(`
      <script>
        window.opener.postMessage({ type: 'TUMBLR_AUTH_SUCCESS', accountId: ${accountId} }, '*');
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

async function runTumblrPost(accountId, customPrompt = null, forceNoImage = false) {
  const accountRow = await sql`SELECT * FROM tumblr_accounts WHERE id = ${accountId}`;
  if (!accountRow.length) throw new Error(`Tumblr account ${accountId} not found`);
  const account = accountRow[0];

  const accessToken = await refreshTumblrTokenIfNeeded(account);

  const masterPrompt = account.master_prompt || '';
  const visualTheme = account.visual_theme || '';
  const colorPalette = account.color_palette || null;

  console.log(`[Tumblr-Post] Generating content for blog ${account.blog_name}...`);

  // Dedicated 7-Archetype narrative storytelling engine for airanfadh (or target web platforms)
  if (account.blog_name?.toLowerCase().includes('airanfadh') || account.name?.toLowerCase().includes('airanfadh') || customPrompt) {
    console.log(`[Tumblr-Post] Using airanfadh 7-Archetype storytelling engine...`);
    const { title, body, caption, tags, imageUrls = [] } = await generateTumblrPost(customPrompt);
    let response;
    try {
      response = await postToTumblr(account.blog_name, accessToken, imageUrls, body || caption, tags, title);
    } catch (err) {
      if (err.response?.status === 401) {
        console.warn(`[Tumblr-Post] 401 Unauthorized on post. Attempting forced token refresh...`);
        const newTokens = await refreshTumblrToken(account.refresh_token);
        const expiresAt = newTokens.expires_in ? new Date(Date.now() + newTokens.expires_in * 1000) : null;
        await sql`
          UPDATE tumblr_accounts SET
            access_token = ${newTokens.access_token},
            refresh_token = ${newTokens.refresh_token},
            expires_at = ${expiresAt}
          WHERE id = ${account.id}
        `;
        accessToken = newTokens.access_token;
        console.log(`[Tumblr-Post] Token refreshed. Retrying post...`);
        response = await postToTumblr(account.blog_name, accessToken, imageUrls, body || caption, tags, title);
      } else {
        throw err;
      }
    }
    console.log(`[Tumblr-Post] Successfully posted to Tumblr with Title [${title}]. Post ID: ${response.id}`);
    return { publishId: response.id, status: 'success', title, text: (body || caption).substring(0, 100) };
  }

  const accountName = "caridisinishop_tumblr"; // Force caridisinishop persona instead of Adhlil for Tumblr

  const content = await generateTumblrContent(customPrompt, masterPrompt, visualTheme, accountName, accountId, forceNoImage);
  const slides = content.slides || [];
  const caption = content.caption || '';
  const hashtags = content.hashtags || [];
  const full_image_prompt = content.full_image_prompt || null;
  console.log(`[Tumblr-Post] Generated Content`);

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
  let imagePrompt = full_image_prompt;
  if (!imagePrompt && slides && slides.length > 0) {
    imagePrompt = slides[0].title_part1 || slides[0].text || null;
  }

  if (imagePrompt) {
    const nativeImages = await generateNativeBannerImage(imagePrompt, caption, dynamicPalette);
    if (nativeImages && nativeImages.length > 0) {
      imageUrls = nativeImages;
      console.log(`[Tumblr-Post] Native image generated and uploaded to Supabase`);
    }
  } 

  if (imageUrls.length === 0 && !forceNoImage) {
    console.log(`[Tumblr-Post] Native AI failed or no prompt, falling back to Satori layout.`);
    let fallbackText = customPrompt ? customPrompt.substring(0, 50) : "Learn More";
    if (caption) {
      const cleaned = caption.replace(/<[^>]+>/g, '').trim();
      const match = cleaned.match(/^([^\.\!\?]+[\.\!\?]?)/);
      if (match) fallbackText = match[1];
    }
    const fallbackSlide = (slides && slides.length > 0) ? slides.slice(0, 1) : [{
      layout_type: 'TextHeavy',
      title_part1: fallbackText.substring(0, 60),
      text: "Read more details below.",
      foreground_subject_prompt: null
    }];
    imageUrls = await generateInstagramSlideImages(fallbackSlide, dynamicPalette, accountName);
  } else if (forceNoImage) {
    console.log(`[Tumblr-Post] TEXT-ONLY mode activated. No images generated.`);
  }

  let cleanText = caption.replace(/<a\s+(?:[^>]*?\s+)?href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, (match, url, anchorText) => {
    if (url === anchorText || anchorText.includes('http')) return url;
    return `${anchorText} (${url})`;
  }).replace(/<[^>]+>/g, '').trim();
  const tagsList = hashtags || [];

  let response;
  try {
    response = await postToTumblr(account.blog_name, accessToken, imageUrls, cleanText, tagsList);
  } catch (err) {
    if (err.response?.status === 401) {
      console.warn(`[Tumblr-Post] 401 Unauthorized on post. Attempting forced token refresh...`);
      try {
        const newTokens = await refreshTumblrToken(account.refresh_token);
        const expiresAt = newTokens.expires_in ? new Date(Date.now() + newTokens.expires_in * 1000) : null;
        await sql`
          UPDATE tumblr_accounts SET
            access_token = ${newTokens.access_token},
            refresh_token = ${newTokens.refresh_token},
            expires_at = ${expiresAt}
          WHERE id = ${account.id}
        `;
        accessToken = newTokens.access_token;
        console.log(`[Tumblr-Post] Token refreshed. Retrying post...`);
        response = await postToTumblr(account.blog_name, accessToken, imageUrls, cleanText, tagsList);
      } catch (refreshErr) {
        throw new Error(`Token expired/invalid, and forced refresh failed: ${refreshErr.message}`);
      }
    } else {
      throw err;
    }
  }
  console.log(`[Tumblr-Post] Successfully posted to Tumblr. Post ID: ${response.id}`);

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

    const pendingInsert = await sql`
      INSERT INTO tumblr_history (account_id, status) VALUES (${accountId}, 'pending') RETURNING id
    `;
    const historyId = pendingInsert[0].id;

    const result = await runTumblrPost(accountId, finalPrompt, false);
    
    await sql`
      UPDATE tumblr_history SET status = 'success', post_id = ${String(result.publishId)} WHERE id = ${historyId}
    `;

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

export async function runTumblrCron(force = false) {
  const now = new Date();
  const witaFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Makassar',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
  });
  const parts = {};
  witaFormatter.formatToParts(now).forEach(x => parts[x.type] = x.value);
  const todayStr = `${parts.year}-${parts.month}-${parts.day}`;
  const currentHour = parseInt(parts.hour === '24' ? '0' : parts.hour, 10);
  const currentMinutes = parseInt(parts.minute, 10);

  console.log(`[Tumblr-Cron] Tick started at ${todayStr} ${currentHour.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')} WITA (Force: ${force})`);

  // ── DEDICATED STAGGERED WINDOWS FOR TUMBLR (WITA = UTC+8) ───────────────
  // Staggered to ensure ZERO template/hour collisions with Threads, Bluesky, or DEV.TO:
  // Session 1 (Siang/Sore): 13:30 - 15:00 WITA (UTC 05:30 - 07:00) -> European morning tech & design wake-up
  // Session 2 (Larut Malam): 23:15 - 01:30 WITA (UTC 15:15 - 17:30) -> US East Coast peak midday scrollers (11:15 - 13:30 EST)
  const inSession1 = (currentHour === 13 && currentMinutes >= 30) || (currentHour === 14) || (currentHour === 15 && currentMinutes === 0);
  const inSession2 = (currentHour === 23 && currentMinutes >= 15) || (currentHour === 0) || (currentHour === 1 && currentMinutes <= 30);

  if (!force && !inSession1 && !inSession2) {
    console.log(`[Tumblr-Cron] 🌙 Current time ${currentHour.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')} WITA is outside Tumblr staggered windows (13:30-15:00 WITA & 23:15-01:30 WITA). Sleeping.`);
    return { success: true, status: 'Outside Tumblr staggered windows (13:30-15:00 WITA & 23:15-01:30 WITA)' };
  }

  try {
    const globalStatus = await sql`SELECT value FROM tumblr_settings WHERE key = 'tumblr_automation_enabled'`;
    if (globalStatus[0]?.value === 'false') {
      console.log('[Tumblr-Cron] Tumblr automation is disabled globally in settings.');
      return { success: true, status: 'Tumblr automation disabled globally.' };
    }

    const accounts = await sql`SELECT id, name, blog_name FROM tumblr_accounts WHERE is_active = 1`;
    const executed = [];

    for (const acc of accounts) {
      // 1. Strict Community Anti-Spam Daily Limit: Maximum 2 high-impact posts per day
      // Community consensus: Prevents "Dashboard Clogging", protects follower retention,
      // and lets each post accumulate reblogs instead of burying it under a flood of posts.
      const dailyLimit = 2;

      const ranToday = await sql`
        SELECT COUNT(*) as count FROM tumblr_history
        WHERE account_id = ${acc.id} AND status = 'success' AND TO_CHAR(created_at + INTERVAL '8 hours', 'YYYY-MM-DD') = ${todayStr}
      `;
      const postsToday = parseInt(ranToday[0]?.count || 0, 10);

      if (postsToday >= dailyLimit && !force) {
        console.log(`[Tumblr-Cron] Acc ${acc.blog_name || acc.name}: Daily quota satisfied (${postsToday}/${dailyLimit} posts today).`);
        continue;
      }

      // 2. Anti-Spam Inter-Session Cooldown: 7.5 to 9.5 hours gap between Session 1 & Session 2
      const lastPostRows = await sql`
        SELECT EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 AS hours_since
        FROM tumblr_history 
        WHERE account_id = ${acc.id} AND status = 'success' 
        ORDER BY id DESC LIMIT 1
      `;
      if (lastPostRows.length > 0 && !force) {
        const hoursSinceLastPost = parseFloat(lastPostRows[0].hours_since || 0);
        const jitter = ((acc.id * 89 + postsToday * 29 + currentHour * 17) % 100) / 100;
        const minCooldownHours = 7.5 + jitter * 2.0; // 7.5 - 9.5 hours gap

        if (hoursSinceLastPost < minCooldownHours) {
          console.log(`[Tumblr-Cron] ⏸️ ${acc.blog_name || acc.name}: In anti-spam cooldown (${hoursSinceLastPost.toFixed(2)}h / ${minCooldownHours.toFixed(2)}h). Skipping.`);
          continue;
        }
      }

      // 3. FIFO Schedule Rotation: Fair sequential cycle through all 5 web apps
      let pending = await sql`
        SELECT * FROM tumblr_schedules
        WHERE account_id = ${acc.id}
          AND is_active = 1
          AND (last_run_date IS NULL OR last_run_date != ${todayStr})
        ORDER BY last_run_date ASC NULLS FIRST, id ASC
      `;

      if (!pending.length) {
        pending = await sql`
          SELECT * FROM tumblr_schedules
          WHERE account_id = ${acc.id} AND is_active = 1
          ORDER BY last_run_date ASC NULLS FIRST, id ASC
        `;
      }

      if (!pending.length) {
        console.log(`[Tumblr-Cron] Acc ${acc.blog_name || acc.name}: No active schedules found.`);
        continue;
      }

      const chosen = pending[0];
      let finalPrompt = chosen.custom_prompt || 'tranvas';

      console.log(`[Tumblr-Cron] 🚀 Ready to post for ${acc.blog_name || acc.name}: postsToday=${postsToday}/${dailyLimit}, prompt="${finalPrompt}" (Schedule ID ${chosen.id})`);

      try {
        const pendingInsert = await sql`
          INSERT INTO tumblr_history (account_id, status) VALUES (${acc.id}, 'pending') RETURNING id
        `;
        const historyId = pendingInsert[0].id;

        // Randomized human micro-jitter delay (3s - 7s) to break clockwork request signatures
        const humanDelayMs = 3000 + Math.floor(Math.random() * 4000);
        console.log(`[Tumblr-Cron] Applying ${humanDelayMs}ms human jitter before dispatching to Tumblr...`);
        await new Promise(r => setTimeout(r, humanDelayMs));

        const result = await runTumblrPost(acc.id, finalPrompt, false);
        if (chosen.id) {
          await sql`UPDATE tumblr_schedules SET last_run_date = ${todayStr} WHERE id = ${chosen.id}`;
        }

        await sql`
          UPDATE tumblr_history SET status = 'success', post_id = ${String(result.publishId)}, caption = ${result.text || chosen.custom_prompt || 'Tumblr Post'} WHERE id = ${historyId}
        `;

        console.log(`[Tumblr-Cron] ✅ Successfully posted for ${acc.blog_name || acc.name} (${chosen.custom_prompt})`);
        executed.push({ account: acc.blog_name || acc.name, scheduleId: chosen.id, ...result });
      } catch (postErr) {
        console.error(`[Tumblr-Cron] ❌ Post failed for ${acc.blog_name || acc.name}:`, postErr.message);
        await sql`
          UPDATE tumblr_history SET
            status = 'failed',
            caption = ${chosen.custom_prompt || 'Auto post'},
            error_message = ${postErr.message || String(postErr)}
          WHERE id = ${historyId}
        `;
      }
    }

    return { success: true, executed };
  } catch (e) {
    console.error('[Tumblr-Cron] Error:', e.message);
    throw e;
  }
}

app.get('/api/tumblr/cron', async (req, res) => {
  const expectedSecret = process.env.CRON_SECRET || 'super_chaos_secret_99';
  const authHeader = req.headers.authorization;
  const secretParam = req.query.secret;

  if (process.env.CRON_SECRET) {
    if (authHeader !== `Bearer ${expectedSecret}` && secretParam !== expectedSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    const isForce = req.query.force === 'true';
    const result = await runTumblrCron(isForce);
    res.json(result);
  } catch (e) {
    res.status(200).json({ success: false, error: e.message });
  }
});

export default app;
