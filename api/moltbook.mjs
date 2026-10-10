export const maxDuration = 60;
import express from 'express';
import cors from 'cors';
import sql, { initDb } from '../lib/database.js';
import { 
  getMoltbookAgentStatus, 
  getMoltbookAgentMe, 
  postToMoltbook, 
  getMoltbookSubmolts 
} from '../lib/moltbook.js';
import { generateMoltbookPost } from '../lib/moltbook_content.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Global DB Init
app.use(async (req, res, next) => {
  try { await initDb(); next(); } catch (e) { next(); }
});

// ── STATUS & ACCOUNTS ──────────────────────────────────────────────────────────

app.get('/api/moltbook/status', async (req, res) => {
  try {
    const [accounts, schedules, lastPost, autoRow] = await Promise.all([
      sql`SELECT id, name, agent_id, agent_name, claim_url, verification_code, is_claimed, is_active FROM moltbook_accounts ORDER BY id ASC`,
      sql`SELECT * FROM moltbook_schedules ORDER BY id ASC`,
      sql`SELECT * FROM moltbook_history ORDER BY id DESC LIMIT 1`,
      sql`SELECT value FROM moltbook_settings WHERE key = 'moltbook_automation_enabled'`
    ]);

    const activeAccount = accounts[0];
    let liveStatus = null;
    if (activeAccount && process.env.MOLTBOOK_API_KEY) {
      try {
        liveStatus = await getMoltbookAgentStatus(process.env.MOLTBOOK_API_KEY);
      } catch (err) {
        liveStatus = { error: err.message };
      }
    }

    res.json({
      account: activeAccount || null,
      liveStatus,
      schedules: schedules || [],
      lastPost: lastPost[0] || null,
      automation_enabled: autoRow[0]?.value !== 'false'
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/moltbook/settings/toggle-automation', async (req, res) => {
  try {
    const current = await sql`SELECT value FROM moltbook_settings WHERE key = 'moltbook_automation_enabled'`;
    const newValue = current[0]?.value === 'false' ? 'true' : 'false';
    await sql`
      INSERT INTO moltbook_settings (key, value) VALUES ('moltbook_automation_enabled', ${newValue})
      ON CONFLICT (key) DO UPDATE SET value = ${newValue}
    `;
    res.json({ success: true, enabled: newValue === 'true' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/moltbook/history', async (req, res) => {
  try {
    const history = await sql`SELECT * FROM moltbook_history ORDER BY created_at DESC LIMIT 20`;
    res.json(history || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/moltbook/post-now', async (req, res) => {
  const { websiteKey = 'tranvas', submolt = 'builds' } = req.body;
  try {
    const result = await runMoltbookPost(websiteKey, submolt);
    res.json({ success: true, ...result });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/moltbook/cron', async (req, res) => {
  const isForce = req.query.force === 'true';
  try {
    const result = await runMoltbookCron(isForce);
    res.json({ success: true, result });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── CORE POST LOGIC ──────────────────────────────────────────────────────────

export async function runMoltbookPost(websiteKey = 'tranvas', submoltOverride = null) {
  const accountRows = await sql`SELECT * FROM moltbook_accounts WHERE is_active = 1 LIMIT 1`;
  const account = accountRows[0];
  const apiKey = account?.api_key || process.env.MOLTBOOK_API_KEY;

  if (!apiKey) {
    throw new Error('Moltbook API Key is not configured.');
  }

  // Generate content for target website
  const contentData = await generateMoltbookPost(websiteKey);
  const submolt = submoltOverride || contentData.submolt_name || 'builds';

  console.log(`[Moltbook] Posting for ${websiteKey} in submolt "${submolt}"...`);
  const postResult = await postToMoltbook({
    submolt_name: submolt,
    title: contentData.title,
    content: contentData.content,
    url: contentData.url
  }, apiKey);

  return {
    publishId: postResult.post_id || postResult?.post?.id,
    title: contentData.title,
    submolt,
    url: contentData.url,
    verified: postResult.verified || false
  };
}

// ── CRON: AUTOMATION SCHEDULER ────────────────────────────────────────────────

export async function runMoltbookCron(force = false) {
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

  console.log(`[Moltbook-Cron] 🦞 Tick started at ${todayStr} ${currentHour.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')} WITA (Force: ${force})`);

  // Active daylight window: 08:00 - 23:00 WITA
  const isTooEarly = currentHour < 8;
  const isTooLate = currentHour >= 23;
  if (!force && (isTooEarly || isTooLate)) {
    console.log(`[Moltbook-Cron] 🌙 Outside active daytime window (08:00 - 23:00 WITA). Sleeping.`);
    return { success: true, status: 'Outside active daytime hours' };
  }

  try {
    const globalStatus = await sql`SELECT value FROM moltbook_settings WHERE key = 'moltbook_automation_enabled'`;
    if (globalStatus[0]?.value === 'false') {
      console.log('[Moltbook-Cron] Moltbook automation disabled globally.');
      return { success: true, status: 'Moltbook automation disabled' };
    }

    const accounts = await sql`SELECT * FROM moltbook_accounts WHERE is_active = 1 LIMIT 1`;
    if (!accounts.length) {
      console.log('[Moltbook-Cron] No active Moltbook account found in database.');
      return { success: false, status: 'No active account' };
    }
    const acc = accounts[0];
    const apiKey = acc.api_key || process.env.MOLTBOOK_API_KEY;

    // Check live claim status
    let liveStatus = null;
    try {
      liveStatus = await getMoltbookAgentStatus(apiKey);
      if (liveStatus?.status === 'claimed' && acc.is_claimed !== 1) {
        await sql`UPDATE moltbook_accounts SET is_claimed = 1 WHERE id = ${acc.id}`;
        acc.is_claimed = 1;
        console.log('[Moltbook-Cron] 🎉 Agent is verified and claimed!');
      }
    } catch (statusErr) {
      console.warn('[Moltbook-Cron] Status check warning:', statusErr.message);
    }

    if (acc.is_claimed !== 1 && liveStatus?.status !== 'claimed') {
      const claimMsg = `Agent "${acc.agent_name}" is pending claim. Please claim agent at: ${acc.claim_url}`;
      console.log(`[Moltbook-Cron] ⚠️ ${claimMsg}`);
      return { success: false, status: 'pending_claim', claim_url: acc.claim_url };
    }

    // Daily limit: 1 post per day (rotating across the 5 websites)
    const dailyLimit = 1;
    const ranToday = await sql`
      SELECT COUNT(*) as count FROM moltbook_history
      WHERE account_id = ${acc.id} AND status = 'success' AND TO_CHAR(created_at + INTERVAL '8 hours', 'YYYY-MM-DD') = ${todayStr}
    `;
    const postsToday = parseInt(ranToday[0]?.count || 0, 10);
    if (!force && postsToday >= dailyLimit) {
      console.log(`[Moltbook-Cron] Already completed daily quota (${postsToday}/${dailyLimit}) for ${todayStr}.`);
      return { success: true, status: `Daily limit reached (${postsToday}/${dailyLimit})` };
    }

    // Round-robin selection: pick the schedule with oldest last_run_date (or never run)
    const pending = await sql`
      SELECT * FROM moltbook_schedules
      WHERE account_id = ${acc.id} AND is_active = 1
      ORDER BY last_run_date ASC NULLS FIRST, id ASC
    `;

    if (!pending.length) {
      console.log('[Moltbook-Cron] No active schedules configured.');
      return { success: false, status: 'No schedules configured' };
    }

    const chosen = pending[0];
    const websiteKey = chosen.custom_prompt || 'tranvas';
    const targetSubmolt = chosen.submolt_name || 'builds';

    console.log(`[Moltbook-Cron] 🚀 Posting daily website "${websiteKey}" to submolt "${targetSubmolt}"...`);

    const pendingInsert = await sql`
      INSERT INTO moltbook_history (account_id, status) VALUES (${acc.id}, 'pending') RETURNING id
    `;
    const historyId = pendingInsert[0].id;

    try {
      const result = await runMoltbookPost(websiteKey, targetSubmolt);

      await sql`UPDATE moltbook_schedules SET last_run_date = ${todayStr} WHERE id = ${chosen.id}`;
      await sql`
        UPDATE moltbook_history 
        SET status = 'success', 
            post_id = ${String(result.publishId)}, 
            title = ${result.title},
            submolt = ${result.submolt}
        WHERE id = ${historyId}
      `;

      console.log(`[Moltbook-Cron] ✅ Successfully posted "${result.title}" (ID: ${result.publishId})!`);
      return { success: true, result };
    } catch (postErr) {
      console.error('[Moltbook-Cron] ❌ Post failed:', postErr.message);
      await sql`
        UPDATE moltbook_history 
        SET status = 'failed', error_message = ${postErr.message || String(postErr)} 
        WHERE id = ${historyId}
      `;
      return { success: false, error: postErr.message };
    }

  } catch (err) {
    console.error('[Moltbook-Cron] ❌ Fatal error:', err.message);
    return { success: false, error: err.message };
  }
}

export default app;
