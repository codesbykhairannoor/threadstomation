import express from 'express';
import cors from 'cors';
import sql, { initDb } from '../lib/database.js';
import { runFacebookCarouselPost } from '../lib/facebook.js';

const app = express();
app.use(cors());
app.use(express.json());

// DB INIT MIDDLEWARE
app.use(async (req, res, next) => {
  try { await initDb(); next(); } catch (e) { next(); }
});

// ── STATUS ────────────────────────────────────────────────────────────────────

app.get('/api/facebook/status', async (req, res) => {
  const accountId = req.query.accountId || 1;
  try {
    const [schedules, lastPost, tokenRow, autoRow] = await Promise.all([
      sql`SELECT * FROM facebook_schedules WHERE account_id = ${accountId} ORDER BY id ASC`,
      sql`SELECT * FROM facebook_history WHERE account_id = ${accountId} ORDER BY id DESC LIMIT 1`,
      sql`SELECT access_token, expires_at FROM facebook_accounts WHERE id = ${accountId}`,
      sql`SELECT value FROM facebook_settings WHERE key = 'automation_enabled'`,
    ]);

    const token = tokenRow[0];
    const isTokenValid = !!(token?.access_token && (!token.expires_at || new Date(token.expires_at) > new Date()));

    res.json({
      schedules,
      lastPost: lastPost[0] || null,
      facebookToken: isTokenValid,
      automation_enabled: autoRow[0]?.value || 'true',
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── ACCOUNTS ──────────────────────────────────────────────────────────────────

app.get('/api/facebook/accounts', async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM facebook_accounts ORDER BY id ASC`;
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/facebook/accounts', async (req, res) => {
  const { name, pageId, accessToken } = req.body;
  if (!pageId || !accessToken) return res.status(400).json({ error: 'pageId and accessToken required' });

  try {
    const result = await sql`
      INSERT INTO facebook_accounts (name, facebook_page_id, access_token)
      VALUES (${name || 'Unnamed Page'}, ${pageId}, ${accessToken})
      ON CONFLICT (facebook_page_id) DO UPDATE 
      SET access_token = EXCLUDED.access_token, name = EXCLUDED.name
      RETURNING *
    `;
    res.json(result[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/facebook/accounts/:id', async (req, res) => {
  try {
    await sql`DELETE FROM facebook_accounts WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/facebook/accounts/:id/config', async (req, res) => {
  const { id } = req.params;
  const { master_prompt, visual_theme, color_palette, preferred_layout } = req.body;
  try {
    await sql`
      UPDATE facebook_accounts 
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

// ── SETTINGS ──────────────────────────────────────────────────────────────────

app.post('/api/facebook/settings/toggle-automation', async (req, res) => {
  try {
    const current = await sql`SELECT value FROM facebook_settings WHERE key = 'automation_enabled'`;
    const newValue = (current[0]?.value === 'false') ? 'true' : 'false';
    await sql`
      INSERT INTO facebook_settings (key, value) VALUES ('automation_enabled', ${newValue})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `;
    res.json({ success: true, enabled: newValue === 'true' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── SCHEDULES ─────────────────────────────────────────────────────────────────

app.get('/api/facebook/schedules', async (req, res) => {
  const { accountId } = req.query;
  try {
    const rows = await sql`SELECT * FROM facebook_schedules WHERE account_id = ${accountId} ORDER BY id ASC`;
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/facebook/schedules', async (req, res) => {
  const { custom_prompt, accountId } = req.body;
  try {
    await sql`
      INSERT INTO facebook_schedules (account_id, custom_prompt, is_active)
      VALUES (${accountId}, ${custom_prompt || null}, 1)
    `;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/facebook/schedules/:id', async (req, res) => {
  try {
    await sql`DELETE FROM facebook_schedules WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── HISTORY ───────────────────────────────────────────────────────────────────

app.get('/api/facebook/history', async (req, res) => {
  const { accountId } = req.query;
  try {
    const history = accountId
      ? await sql`SELECT * FROM facebook_history WHERE account_id = ${accountId} ORDER BY created_at DESC LIMIT 15`
      : await sql`SELECT * FROM facebook_history ORDER BY created_at DESC LIMIT 15`;
    res.json(history || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── ACTIONS ───────────────────────────────────────────────────────────────────

app.post('/api/facebook/post-now', async (req, res) => {
  const { accountId, customPrompt } = req.body;
  if (!accountId) return res.status(400).json({ error: 'accountId required' });

  try {
    const result = await runFacebookCarouselPost(parseInt(accountId), customPrompt);
    res.json({ success: true, ...result });
  } catch (e) {
    console.error('[Facebook-PostNow] Error:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── CRON ──────────────────────────────────────────────────────────────────────

app.get('/api/facebook/cron', async (req, res) => {
  const expectedSecret = process.env.CRON_SECRET || 'super_chaos_secret_99';
  const secretParam = req.query.secret;

  if (secretParam !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const witaTime = new Date(utcTime + (3600000 * 8)); 
  const todayStr = witaTime.toISOString().split('T')[0];
  const currentHour = witaTime.getHours();
  const totalMinutesLeft = Math.max(1, (23 - currentHour) * 60 + (60 - witaTime.getMinutes()));

  try {
    const autoRow = await sql`SELECT value FROM facebook_settings WHERE key = 'automation_enabled'`;
    if (autoRow[0]?.value === 'false') return res.json({ success: true, status: 'Automation disabled' });

    const accounts = await sql`SELECT id, name FROM facebook_accounts WHERE is_active = 1`;
    const executed = [];

    for (const acc of accounts) {
      const [{ count: postsToday }] = await sql`SELECT COUNT(*) as count FROM facebook_history WHERE account_id = ${acc.id} AND created_at::date = CURRENT_DATE AND status = 'success'`;
      if (parseInt(postsToday) >= 5) continue;

      const pending = await sql`
        SELECT * FROM facebook_schedules
        WHERE account_id = ${acc.id} AND is_active = 1 AND (last_run_date IS NULL OR last_run_date != ${todayStr})
      `;
      if (!pending.length) continue;

      const chance = (5 - parseInt(postsToday)) / totalMinutesLeft;
      if (Math.random() < chance) {
        const chosen = pending[Math.floor(Math.random() * pending.length)];
        try {
          const result = await runFacebookCarouselPost(acc.id, chosen.custom_prompt);
          await sql`UPDATE facebook_schedules SET last_run_date = ${todayStr} WHERE id = ${chosen.id}`;
          executed.push({ account: acc.name, scheduleId: chosen.id, ...result });
        } catch (postErr) {
          console.error(`[Facebook-Cron] Post failed for ${acc.name}:`, postErr.message);
        }
      }
    }
    res.json({ success: true, executed });
  } catch (e) {
    res.status(200).json({ success: false, error: e.message });
  }
});

export default app;
