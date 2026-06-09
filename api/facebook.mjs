import express from 'express';
import sql from '../lib/database.js';
import { runFacebookCarouselPost } from '../lib/facebook.js';

const app = express.Router();

// GET /api/facebook/accounts
app.get('/api/facebook/accounts', async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM facebook_accounts ORDER BY id ASC`;
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/facebook/settings
app.get('/api/facebook/settings', async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM facebook_settings`;
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/facebook/settings/toggle-automation
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

// POST /api/facebook/accounts
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

// GET /api/facebook/schedules
app.get('/api/facebook/schedules', async (req, res) => {
  const { accountId } = req.query;
  try {
    const rows = await sql`SELECT * FROM facebook_schedules WHERE account_id = ${accountId} ORDER BY id ASC`;
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/facebook/schedules
app.post('/api/facebook/schedules', async (req, res) => {
  const { accountId, customPrompt } = req.body;
  try {
    const result = await sql`
      INSERT INTO facebook_schedules (account_id, custom_prompt)
      VALUES (${accountId}, ${customPrompt})
      RETURNING *
    `;
    res.json(result[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/facebook/schedules/:id
app.delete('/api/facebook/schedules/:id', async (req, res) => {
  try {
    await sql`DELETE FROM facebook_schedules WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/facebook/history
app.get('/api/facebook/history', async (req, res) => {
  const { accountId } = req.query;
  try {
    const rows = await sql`
      SELECT * FROM facebook_history 
      WHERE account_id = ${accountId} 
      ORDER BY created_at DESC LIMIT 20
    `;
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/facebook/post-now
app.post('/api/facebook/post-now', async (req, res) => {
  const { accountId, customPrompt } = req.body;
  if (!accountId) return res.status(400).json({ error: 'accountId required' });

  try {
    const result = await runFacebookCarouselPost(parseInt(accountId), customPrompt);
    res.json({ success: true, ...result });
  } catch (e) {
    console.error('[Facebook-PostNow] Error:', e.message);
    try {
      await sql`
        INSERT INTO facebook_history (account_id, caption, status, error_message)
        VALUES (${accountId}, ${customPrompt || 'Manual post'}, 'failed', ${e.message || String(e)})
      `;
    } catch (_) {}
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET /api/facebook/cron
app.get('/api/facebook/cron', async (req, res) => {
  const expectedSecret = process.env.CRON_SECRET || 'super_chaos_secret_99';
  const secretParam = req.query.secret;

  if (process.env.CRON_SECRET && secretParam !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Robust WITA (UTC+8) Time Calculation
  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const witaTime = new Date(utcTime + (3600000 * 8)); 
  
  const currentHour = witaTime.getHours();
  const todayStr = witaTime.toISOString().split('T')[0];
  const totalMinutesLeft = Math.max(1, (23 - currentHour) * 60 + (60 - witaTime.getMinutes()));

  try {
    const globalStatus = await sql`SELECT value FROM facebook_settings WHERE key = 'automation_enabled'`;
    if (globalStatus[0]?.value === 'false') {
      return res.json({ success: true, status: 'Facebook automation disabled globally.' });
    }

    const accounts = await sql`SELECT id, name FROM facebook_accounts WHERE is_active = 1`;
    const executed = [];

    for (const acc of accounts) {
      const ranToday = await sql`
        SELECT COUNT(*) as count FROM facebook_history
        WHERE account_id = ${acc.id} AND status = 'success' AND created_at::date = ${todayStr}::date
      `;
      const postsToday = parseInt(ranToday[0]?.count || 0, 10);

      if (postsToday >= 5) {
        console.log(`[Facebook-Cron] Acc ${acc.name}: hit 5-post daily limit.`);
        continue;
      }

      const pending = await sql`
        SELECT * FROM facebook_schedules
        WHERE account_id = ${acc.id}
          AND is_active = 1
          AND (last_run_date IS NULL OR last_run_date != ${todayStr})
      `;

      if (!pending.length) continue;

      const postsRemaining = 5 - postsToday;
      const numToMake = Math.min(postsRemaining, pending.length);
      const chance = numToMake / totalMinutesLeft;
      const roll = Math.random();

      console.log(`[Facebook-Cron] ${acc.name}: postsToday=${postsToday}/5, pending=${pending.length}, chance=${chance.toFixed(4)}, roll=${roll.toFixed(4)}`);

      if (roll < chance) {
        const chosen = pending[Math.floor(Math.random() * pending.length)];
        try {
          const result = await runFacebookCarouselPost(acc.id, chosen.custom_prompt);
          await sql`UPDATE facebook_schedules SET last_run_date = ${todayStr} WHERE id = ${chosen.id}`;
          executed.push({ account: acc.name, scheduleId: chosen.id, ...result });
          console.log(`[Facebook-Cron] ✅ Posted for ${acc.name}`);
        } catch (postErr) {
          console.error(`[Facebook-Cron] Post failed for ${acc.name}:`, postErr.message);
          // Error handled inside runFacebookCarouselPost or by logging to facebook_history
        }
      }
    }

    res.json({ success: true, executed });
  } catch (e) {
    console.error('[Facebook-Cron] Error:', e.message);
    res.status(200).json({ success: false, error: e.message });
  }
});

export default app;
