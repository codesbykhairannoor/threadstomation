export const maxDuration = 60;
import express from 'express';
import cors from 'cors';
import sql, { initDb } from '../lib/database.js';
import { publishNostrNote, deriveKeys } from '../lib/nostr.js';
import { generateNostrPost, NOSTR_TARGET_WEBSITES } from '../lib/nostr_content.js';
import { getDailyDynamicTargetSlot } from '../lib/stealth_reach_engine.js';

const app = express();
app.use(cors());
app.use(express.json());

// Init DB middleware
app.use(async (req, res, next) => {
  try { await initDb(); next(); } catch (e) { next(); }
});

// ── GET ACCOUNTS & STATUS ───────────────────────────────────────────────────

app.get('/api/nostr/accounts', async (req, res) => {
  try {
    const accounts = await sql`
      SELECT id, name, username, npub, pubkey_hex, relays, is_active, 
             CASE WHEN nsec IS NOT NULL AND length(nsec) > 0 THEN true ELSE false END as has_nsec
      FROM nostr_accounts
      WHERE is_active = 1
      ORDER BY id ASC
    `;
    res.json(accounts || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/nostr/status', async (req, res) => {
  const accountId = req.query.accountId || 1;
  try {
    const [accountRow, schedules, lastPost, autoRow] = await Promise.all([
      sql`SELECT id, name, username, npub, pubkey_hex, nsec, is_active FROM nostr_accounts WHERE id = ${accountId}`,
      sql`SELECT * FROM nostr_schedules WHERE account_id = ${accountId} ORDER BY id ASC`,
      sql`SELECT * FROM nostr_history WHERE account_id = ${accountId} ORDER BY id DESC LIMIT 1`,
      sql`SELECT value FROM nostr_settings WHERE key = 'nostr_automation_enabled'`,
    ]);

    const acc = accountRow[0] || null;
    const hasNsec = !!(acc?.nsec || process.env.NOSTR_NSEC);

    res.json({
      account: acc ? {
        id: acc.id,
        name: acc.name,
        username: acc.username,
        npub: acc.npub,
        pubkey_hex: acc.pubkey_hex,
        is_active: acc.is_active,
      } : null,
      hasNsec,
      schedules: schedules || [],
      lastPost: lastPost[0] || null,
      automation_enabled: autoRow[0]?.value || 'true',
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/nostr/history', async (req, res) => {
  const accountId = req.query.accountId || 1;
  try {
    const history = await sql`
      SELECT * FROM nostr_history 
      WHERE account_id = ${accountId}
      ORDER BY created_at DESC 
      LIMIT 20
    `;
    res.json(history || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── SAVE / UPDATE NSEC ───────────────────────────────────────────────────────

app.post('/api/nostr/keys/update-nsec', async (req, res) => {
  const { accountId, nsec } = req.body;
  if (!nsec || !nsec.trim()) {
    return res.status(400).json({ error: 'Nostr nsec (private key) is required.' });
  }

  try {
    const { pubkeyHex, npub } = deriveKeys(nsec.trim());
    await sql`
      UPDATE nostr_accounts
      SET nsec = ${nsec.trim()},
          pubkey_hex = ${pubkeyHex},
          npub = ${npub}
      WHERE id = ${accountId || 1}
    `;
    res.json({ success: true, message: 'Nostr private key updated and verified.', npub, pubkeyHex });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/nostr/settings/toggle-automation', async (req, res) => {
  try {
    const current = await sql`SELECT value FROM nostr_settings WHERE key = 'nostr_automation_enabled'`;
    const newValue = current[0]?.value === 'false' ? 'true' : 'false';
    await sql`
      INSERT INTO nostr_settings (key, value) VALUES ('nostr_automation_enabled', ${newValue})
      ON CONFLICT (key) DO UPDATE SET value = ${newValue}
    `;
    res.json({ success: true, enabled: newValue === 'true' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST NOW (MANUAL) ────────────────────────────────────────────────────────

app.post('/api/nostr/post-now', async (req, res) => {
  const { accountId = 1, websiteKey, customPrompt } = req.body;

  try {
    const accounts = await sql`SELECT * FROM nostr_accounts WHERE id = ${accountId}`;
    const acc = accounts[0];
    if (!acc) return res.status(404).json({ error: 'Account not found.' });

    const nsec = acc.nsec || process.env.NOSTR_NSEC;
    if (!nsec) {
      return res.status(400).json({ 
        error: 'Nostr private key (nsec) is missing. Please save your nsec in Settings or set NOSTR_NSEC in .env.' 
      });
    }

    const postData = await generateNostrPost(websiteKey || 'tranvas', customPrompt);
    const tags = [
      ['r', postData.website.url],
      ...(postData.hashtags || []).map(h => ['t', h])
    ];

    const result = await publishNostrNote(nsec, postData.text, tags, acc.relays || undefined);

    await sql`
      INSERT INTO nostr_history (account_id, note_id, content, website_url, relays_broadcasted, status)
      VALUES (
        ${acc.id},
        ${result.publishId},
        ${postData.text},
        ${postData.website.url},
        ${JSON.stringify(result.successfulRelays)},
        'success'
      )
    `;

    res.json({ success: true, ...result, content: postData.text });
  } catch (e) {
    console.error('[Nostr-Manual] Post error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── CRON: AUTOMATION SCHEDULER ────────────────────────────────────────────────

export async function runNostrCron(force = false) {
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
  const currentMinute = parseInt(parts.minute, 10);

  console.log(`[Nostr-Cron] Tick started at ${todayStr} ${String(currentHour).padStart(2,'0')}:${String(currentMinute).padStart(2,'0')} WITA (Force: ${force})`);

  // Active Daytime Hours: 08:00 - 23:00 WITA
  if (!force && (currentHour < 8 || currentHour >= 23)) {
    console.log(`[Nostr-Cron] 🌙 Current time ${currentHour}:${String(currentMinute).padStart(2,'0')} WITA is sleeping hours. Skipping.`);
    return { success: true, status: 'Nostr sleep hours (23:00 - 08:00 WITA)' };
  }

  const globalStatus = await sql`SELECT value FROM nostr_settings WHERE key = 'nostr_automation_enabled'`;
  if (globalStatus[0]?.value === 'false' && !force) {
    console.log('[Nostr-Cron] Automation globally disabled in settings.');
    return { success: true, status: 'Nostr automation disabled globally.' };
  }

  const accounts = await sql`SELECT * FROM nostr_accounts WHERE is_active = 1`;
  const executed = [];

  for (const acc of accounts) {
    const dailyLimit = 1; // 1 high-impact note per day

    // 1. Daily limit check
    const ranToday = await sql`
      SELECT COUNT(*) as count FROM nostr_history
      WHERE account_id = ${acc.id} AND status = 'success'
        AND TO_CHAR(created_at + INTERVAL '8 hours', 'YYYY-MM-DD') = ${todayStr}
    `;
    const postsToday = parseInt(ranToday[0]?.count || 0, 10);

    if (postsToday >= dailyLimit && !force) {
      console.log(`[Nostr-Cron] @${acc.username}: Daily quota satisfied (${postsToday}/${dailyLimit} note today).`);
      continue;
    }

    // 2. Private Key (nsec) validation
    const nsec = acc.nsec || process.env.NOSTR_NSEC;
    if (!nsec) {
      console.warn(`[Nostr-Cron] ⚠️ @${acc.username}: nsec (private key) is missing. Cannot sign note. Please configure nsec.`);
      continue;
    }

    // 3. Staggered Queue Slot: Dedicated window 11:30 - 16:30 WITA
    const targetSlot = getDailyDynamicTargetSlot(
      todayStr,
      `nostr-${acc.username || acc.id}`,
      's1',
      11, 30, 16, 30,
      currentHour, currentMinute
    );

    console.log(`[Nostr-Cron] 🎯 @${acc.username}: Slot 1/1 target=${targetSlot.formatted} WITA (Now: ${String(currentHour).padStart(2,'0')}:${String(currentMinute).padStart(2,'0')}, isDue: ${targetSlot.isDue})`);

    if (!force && !targetSlot.isDue) {
      continue;
    }

    // 4. Sequential FIFO rotation across 5 websites
    const pending = await sql`
      SELECT * FROM nostr_schedules
      WHERE account_id = ${acc.id}
        AND is_active = 1
        AND (last_run_date IS NULL OR last_run_date != ${todayStr})
      ORDER BY last_run_date ASC NULLS FIRST, id ASC
    `;

    if (!pending.length) {
      console.log(`[Nostr-Cron] @${acc.username}: All target website schedules have run today.`);
      continue;
    }

    const chosen = pending[0];
    console.log(`[Nostr-Cron] Selected website for today: ${chosen.website_key} (${chosen.website_url})`);

    try {
      const postData = await generateNostrPost(chosen.website_key, chosen.custom_prompt);
      const tags = [
        ['r', postData.website.url],
        ...(postData.hashtags || []).map(h => ['t', h])
      ];

      const result = await publishNostrNote(nsec, postData.text, tags, acc.relays || undefined);

      await sql`
        UPDATE nostr_schedules SET last_run_date = ${todayStr} WHERE id = ${chosen.id}
      `;

      await sql`
        INSERT INTO nostr_history (account_id, note_id, content, website_url, relays_broadcasted, status)
        VALUES (
          ${acc.id},
          ${result.publishId},
          ${postData.text},
          ${postData.website.url},
          ${JSON.stringify(result.successfulRelays)},
          'success'
        )
      `;

      console.log(`[Nostr-Cron] ✅ Successfully published note for @${acc.username} on ${result.successfulRelays.length} relays!`);
      executed.push({ account: acc.username, scheduleId: chosen.id, ...result });

      // ── SINGLE-ACCOUNT EXECUTION LOCK ──
      console.log(`[Nostr-Cron] 🔒 Dispatched post for @${acc.username}. Locking out other Nostr accounts for this 15-minute cycle.`);
      break;
    } catch (postErr) {
      console.error(`[Nostr-Cron] ❌ Post failed for @${acc.username}:`, postErr.message);
      await sql`
        INSERT INTO nostr_history (account_id, website_url, status, error_message)
        VALUES (${acc.id}, ${chosen.website_url}, 'failed', ${postErr.message || String(postErr)})
      `;
    }
  }

  return { success: true, executed };
}

app.get('/api/nostr/cron', async (req, res) => {
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
    const result = await runNostrCron(isForce);
    res.json(result);
  } catch (e) {
    console.error('[Nostr-Cron] Route Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

export default app;
