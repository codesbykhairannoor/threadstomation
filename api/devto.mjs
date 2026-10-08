export const maxDuration = 60;
import express from 'express';
import cors from 'cors';
import sql, { initDb } from '../lib/database.js';
import { getDevtoUserInfo, postToDevto } from '../lib/devto.js';
import { generateDevtoArticle } from '../lib/devto_content.js';

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
    const existing = await sql`SELECT * FROM devto_accounts WHERE username = ${user.username}`;
    
    let accountId;
    if (existing.length > 0) {
      await sql`
        UPDATE devto_accounts SET
          name = ${user.name || user.username},
          api_key = ${apiKey},
          is_active = 1
        WHERE id = ${existing[0].id}
      `;
      accountId = existing[0].id;
    } else {
      const inserted = await sql`
        INSERT INTO devto_accounts (name, username, api_key, is_active)
        VALUES (${user.name || user.username}, ${user.username}, ${apiKey}, 1)
        RETURNING id
      `;
      accountId = inserted[0].id;
    }

    res.json({ success: true, accountId, username: user.username });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── SCHEDULES ────────────────────────────────────────────────────────────────

app.get('/api/devto/schedules', async (req, res) => {
  try {
    const schedules = await sql`SELECT * FROM devto_schedules ORDER BY id ASC`;
    res.json(schedules);
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

// ── CORE: POST TECHNICAL ARTICLE TO DEV.TO ───────────────────────────────────

export async function runDevtoPost(accountId, customPrompt = null) {
  const accountRow = await sql`SELECT * FROM devto_accounts WHERE id = ${accountId}`;
  if (!accountRow.length) throw new Error(`Dev.to account ${accountId} not found`);
  const account = accountRow[0];

  console.log(`[Devto-Post] Generating high-impact technical article for @${account.username}...`);
  const { title, body_markdown, tags, cover_image, canonical_url } = await generateDevtoArticle(customPrompt);

  console.log(`[Devto-Post] Publishing article "${title}" to DEV.TO with cover: ${cover_image}`);
  const response = await postToDevto(
    account.api_key,
    title,
    body_markdown,
    tags,
    cover_image,
    canonical_url
  );

  console.log(`[Devto-Post] Successfully published to DEV.TO. Post ID: ${response.id} | URL: ${response.url}`);
  return {
    publishId: response.id,
    url: response.url,
    title,
    status: 'success'
  };
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

    const pendingInsert = await sql`
      INSERT INTO devto_history (account_id, status) VALUES (${accountId}, 'pending') RETURNING id
    `;
    const historyId = pendingInsert[0].id;

    const result = await runDevtoPost(accountId, finalPrompt);
    
    await sql`
      UPDATE devto_history SET
        status = 'success',
        post_id = ${String(result.publishId)},
        caption = ${result.title}
      WHERE id = ${historyId}
    `;

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

// ── CRON ENGINE: SAFE 24-HOUR ANTI-BAN PACING ────────────────────────────────

export async function runDevtoCron(force = false) {
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

  console.log(`[Devto-Cron] Tick started at ${todayStr} ${currentHour.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')} WITA (Force: ${force})`);

  // ── DEDICATED STAGGERED WINDOW FOR DEV.TO (WITA = UTC+8) ────────────────
  // Golden Hour Window for Global Developer Traffic: 18:15 - 19:30 WITA (10:15 - 11:30 UTC)
  // Reaches Europe during peak midday tech scrollers (12:15 - 13:30 CET)
  // and reaches US East Coast as early tech risers wake up (06:15 - 07:30 EST).
  // Zero collision with Threads (adhlil ends 18:15, Sharesa starts 19:45), Bluesky, or Tumblr!
  const inDevtoWindow = (currentHour === 18 && currentMinutes >= 15) || (currentHour === 19 && currentMinutes <= 30);
  if (!force && !inDevtoWindow) {
    console.log(`[Devto-Cron] 🌙 Current time ${currentHour.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')} WITA is outside golden window (18:15 - 19:30 WITA). Sleeping.`);
    return { success: true, status: 'Outside DEV.TO global prime-time window (18:15 - 19:30 WITA)' };
  }

  const globalStatus = await sql`SELECT value FROM devto_settings WHERE key = 'devto_automation_enabled'`;
  if (globalStatus[0]?.value === 'false' && !force) {
    console.log('[Devto-Cron] Automation globally disabled in settings.');
    return { success: true, status: 'Dev.to automation disabled globally.' };
  }

  const accounts = await sql`SELECT id, name, username FROM devto_accounts WHERE is_active = 1`;
  const executed = [];

  for (const acc of accounts) {
    // 1. Safe Anti-Ban Daily Limit: Maximum 1 high-impact technical article per day
    // Community Best Practice: Eliminates feed self-cannibalization, avoids spam flags,
    // and maximizes algorithmic dwell time so the article can accumulate reactions and rank in "Top of the Week".
    const dailyLimit = 1;

    const ranToday = await sql`
      SELECT COUNT(*) as count FROM devto_history
      WHERE account_id = ${acc.id} AND status = 'success'
        AND TO_CHAR(created_at + INTERVAL '8 hours', 'YYYY-MM-DD') = ${todayStr}
    `;
    const postsToday = parseInt(ranToday[0]?.count || 0, 10);

    if (postsToday >= dailyLimit && !force) {
      console.log(`[Devto-Cron] @${acc.username}: Daily quota satisfied (${postsToday}/${dailyLimit} article posted today).`);
      continue;
    }

    // 2. Strict Anti-Ban: Minimum 18 to 21 hours cooldown between successive articles
    const lastSuccessRow = await sql`
      SELECT EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 AS hours_since
      FROM devto_history
      WHERE account_id = ${acc.id} AND status = 'success'
      ORDER BY id DESC
      LIMIT 1
    `;

    if (!force && lastSuccessRow.length > 0) {
      const hoursSinceLast = parseFloat(lastSuccessRow[0].hours_since || 0);
      const jitter = ((acc.id * 31 + currentHour * 7) % 100) / 100;
      const minCooldownHours = 18.0 + jitter * 3.0; // 18.0 - 21.0 hours gap

      if (hoursSinceLast < minCooldownHours) {
        console.log(`[Devto-Cron] ⏸️ @${acc.username}: In anti-spam cooldown (${hoursSinceLast.toFixed(2)}h / ${minCooldownHours.toFixed(2)}h). Skipping.`);
        continue;
      }
    }


    // 3. Find pending schedules that haven't run today
    let pending = await sql`
      SELECT * FROM devto_schedules
      WHERE account_id = ${acc.id}
        AND is_active = 1
        AND (last_run_date IS NULL OR last_run_date != ${todayStr})
      ORDER BY last_run_date ASC NULLS FIRST
    `;

    if (!pending.length) {
      // If all ran, pick any active schedule
      pending = await sql`
        SELECT * FROM devto_schedules
        WHERE account_id = ${acc.id} AND is_active = 1
        ORDER BY last_run_date ASC NULLS FIRST
      `;
    }

    if (!pending.length) {
      console.log(`[Devto-Cron] No active schedules found for @${acc.username}.`);
      continue;
    }

    const chosen = pending[0];
    console.log(`[Devto-Cron] 🚀 Ready to post for @${acc.username}: Schedule ID ${chosen.id} (${chosen.custom_prompt})`);

    try {
      const pendingInsert = await sql`
        INSERT INTO devto_history (account_id, status) VALUES (${acc.id}, 'pending') RETURNING id
      `;
      const historyId = pendingInsert[0].id;

      // Randomized human micro-jitter delay (3s - 8s) to break clockwork request signatures
      const humanDelayMs = 3000 + Math.floor(Math.random() * 5000);
      console.log(`[Devto-Cron] Applying ${humanDelayMs}ms human jitter before dispatching to DEV.TO...`);
      await new Promise(r => setTimeout(r, humanDelayMs));

      const result = await runDevtoPost(acc.id, chosen.custom_prompt);

      if (chosen.id) {
        await sql`UPDATE devto_schedules SET last_run_date = ${todayStr} WHERE id = ${chosen.id}`;
      }

      await sql`
        UPDATE devto_history SET
          status = 'success',
          post_id = ${String(result.publishId)},
          caption = ${result.title}
        WHERE id = ${historyId}
      `;

      console.log(`[Devto-Cron] ✅ Successfully published for @${acc.username}: "${result.title}" -> ${result.url}`);
      executed.push({ account: acc.username, scheduleId: chosen.id, ...result });
    } catch (postErr) {
      console.error(`[Devto-Cron] Post failed for @${acc.username}:`, postErr.message);
      await sql`
        INSERT INTO devto_history (account_id, caption, status, error_message)
        VALUES (${acc.id}, ${chosen.custom_prompt || 'Auto post'}, 'failed', ${postErr.message || String(postErr)})
      `;
    }
  }

  return { success: true, executed };
}

app.get('/api/devto/cron', async (req, res) => {
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
    const result = await runDevtoCron(isForce);
    res.json(result);
  } catch (e) {
    console.error('[Devto-Cron] Route Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

export default app;
