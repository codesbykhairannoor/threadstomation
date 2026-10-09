import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
process.env.FONTCONFIG_PATH = join(__dirname, '../lib/fonts');

export const maxDuration = 60;

import express from 'express';
import cors from 'cors';
import sql, { initDb, cleanupOldHistory } from '../lib/database.js';
import { generateThreadsContent } from '../lib/gemini.js';
import { postToPlatforms } from '../lib/threads_service.js';
import { evaluateStochasticPostTrigger, getDailyDynamicTargetSlot } from '../lib/stealth_reach_engine.js';
import fs from 'fs';
import tiktokApp from './tiktok.mjs';
import instagramApp from './instagram.mjs';
import facebookApp from './facebook.mjs';
import tumblrApp from './tumblr.mjs';
import mastodonApp from './mastodon.mjs';
import devtoApp from './devto.mjs';
import blueskyApp from './bluesky.mjs';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Mount platform specific routers
app.use(tiktokApp);
app.use(instagramApp);
app.use(facebookApp);
app.use(tumblrApp);
app.use(mastodonApp);
app.use(devtoApp);
app.use(blueskyApp);

// Global DB Init Middleware
app.use(async (req, res, next) => {
  try { await initDb(); next(); } catch (e) { next(); }
});

const PORT = process.env.PORT || 3000;

// ── VERCEL CRON JOB FOR 4 NEW MEDSOS ──────────────────────────────────────


// ── THREADS API ROUTES ────────────────────────────────────────────────────────

app.get('/api/accounts', async (req, res) => {
    try {
        const accounts = await sql`SELECT * FROM accounts ORDER BY id ASC`;
        res.json(accounts);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/status', async (req, res) => {
    try {
        const accountId = req.query.accountId ? parseInt(req.query.accountId, 10) : 1;
        const schedules = await sql`SELECT * FROM schedules WHERE account_id = ${accountId} ORDER BY id ASC`;
        const tokens = await sql`SELECT access_token FROM tokens WHERE account_id = ${accountId}`;
        const lastPost = await sql`SELECT * FROM post_history WHERE account_id = ${accountId} ORDER BY created_at DESC LIMIT 1`;
        const automationStatus = await sql`SELECT value FROM settings WHERE key = 'automation_enabled'`;

        res.json({
            schedules,
            threadsToken: tokens.length > 0 && !!tokens[0].access_token,
            lastPost: lastPost[0] || null,
            automation_enabled: automationStatus[0]?.value || 'true'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/history', async (req, res) => {
    try {
        const accountId = req.query.accountId ? parseInt(req.query.accountId, 10) : 1;
        const history = await sql`SELECT * FROM post_history WHERE account_id = ${accountId} ORDER BY created_at DESC LIMIT 50`;
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/settings', async (req, res) => {
    try {
        const rows = await sql`SELECT * FROM settings`;
        const settings = {};
        rows.forEach(r => settings[r.key] = r.value);
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/settings/toggle-automation', async (req, res) => {
    try {
        const current = await sql`SELECT value FROM settings WHERE key = 'automation_enabled'`;
        const newValue = (current[0]?.value === 'false') ? 'true' : 'false';
        await sql`INSERT INTO settings (key, value) VALUES ('automation_enabled', ${newValue}) ON CONFLICT (key) DO UPDATE SET value = ${newValue}`;
        res.json({ success: true, enabled: newValue === 'true' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/post-now', async (req, res) => {
    const { isManual, accountId, imageUrl, customPrompt } = req.body;
    try {
        let content;
        if (isManual) {
            content = ["Ini adalah postingan uji coba manual dari dashboard."];
        } else {
            let imageBase64 = null;
            if (imageUrl) {
                try {
                    const response = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 8000 });
                    imageBase64 = Buffer.from(response.data, 'binary').toString('base64');
                } catch (e) { console.warn('Image fetch failed:', e.message); }
            }
            content = await generateThreadsContent('threads', imageBase64 || imageUrl, customPrompt, accountId);
        }

        if (content) {
            const result = await postToPlatforms(content, ['threads'], imageUrl, accountId);
            res.json({ success: true, result });
        } else {
            res.status(500).json({ error: 'Failed to generate content' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ── TOKEN AUTO-REFRESH ENDPOINT ──────────────────────────────────────────────
// Can be called by a weekly cron to proactively refresh Threads tokens
app.get('/api/threads/refresh-tokens', async (req, res) => {
    const secretParam = req.query.secret;
    const expectedSecret = process.env.CRON_SECRET || 'super_chaos_secret_99';
    if (secretParam !== expectedSecret) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const tokens = await sql`SELECT id, account_id, access_token, expires_at FROM tokens WHERE platform = 'threads'`;
        const results = [];
        for (const t of tokens) {
            const daysLeft = (new Date(t.expires_at) - Date.now()) / (1000 * 60 * 60 * 24);
            if (daysLeft < 30) {
                try {
                    const newToken = await refreshThreadsToken(t.access_token, t.account_id);
                    results.push({ account_id: t.account_id, status: 'refreshed' });
                } catch (e) {
                    results.push({ account_id: t.account_id, status: 'failed', error: e.message });
                }
            } else {
                results.push({ account_id: t.account_id, status: 'ok', days_left: Math.round(daysLeft) });
            }
        }
        res.json({ success: true, results });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ── CRON SYSTEM ────────────────────────────────────────────────────────────────

app.get('/api/cron', async (req, res) => {
    const secretParam = req.query.secret;
    const authHeader = req.headers.authorization;
    const expectedSecret = process.env.CRON_SECRET || 'super_chaos_secret_99';

    if (secretParam !== expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const targetAccountId = req.query.accountId ? parseInt(req.query.accountId, 10) : null;
    const isMasterPing = req.query.master === 'true'; // Only trigger cascades if explicitly requested

    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const witaTime = new Date(utcTime + (3600000 * 8)); 
    
    const todayStr = witaTime.toISOString().split('T')[0];
    const currentHour = witaTime.getHours();
    const totalMinutesLeft = Math.max(1, (23 - currentHour) * 60 + (60 - witaTime.getMinutes()));

    try {
        const host = req.headers.host || 'threadstomation.vercel.app';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const baseUrl = `${protocol}://${host}`;

        const globalStatus = await sql`SELECT value FROM settings WHERE key = 'automation_enabled'`.catch(() => [{value: 'true'}]);
        if (globalStatus[0]?.value === 'false') {
            return res.status(200).json({ success: true, status: 'Automation disabled globally.' });
        }

        if (isMasterPing) {
            const subCrons = ['tumblr', 'mastodon', 'devto', 'bluesky', 'tiktok', 'instagram', 'facebook'];
            // Fire and forget to prevent Master Cron from timing out
            subCrons.forEach(platform => {
                fetch(`${baseUrl}/api/${platform}/cron?secret=${expectedSecret}`)
                    .catch(() => {}); // Ignore disconnects
            });
            // Wait 1.5 seconds to ensure all requests leave the network interface
            await new Promise(r => setTimeout(r, 1500));
        }

        let accounts = [];
        if (targetAccountId) {
            accounts = await sql`SELECT id, name FROM accounts WHERE id = ${targetAccountId} AND is_active = 1`;
        } else {
            console.log('[Cron] Threads internal Vercel execution disabled. Use /api/threads/cron directly.');
        }

        res.status(200).json({ success: true, message: 'Master ping executed successfully.' });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ── ISOLATED THREADS CRON (FOR GITHUB ACTIONS) ─────────────────────────────────
export async function runThreadsCron(awaitTasks = false, force = false) {
    const now = new Date();
    // Gunakan Intl DateTimeFormat untuk penentuan waktu WITA (Asia/Makassar, UTC+8) yang 100% presisi di semua environment
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

    const globalStatus = await sql`SELECT value FROM settings WHERE key = 'automation_enabled'`.catch(() => [{value: 'true'}]);
    if (globalStatus[0]?.value === 'false') {
        return { success: true, status: 'Automation disabled globally.' };
    }

    const accounts = await sql`SELECT id, name FROM accounts WHERE is_active = 1`;
    const executed = [];
    const pendingTasks = [];
    
    for (const acc of accounts) {
        try {
            const nName = acc.name ? acc.name.toLowerCase() : '';
            // Safe Anti-Ban & Algorithmic Growth Engine (2026 Meta Threads Protocol):
            // Maximum 2 posts per day across all active accounts (Midday & Evening sessions).
            // Eliminates "Content Mill / Broadcast Spammer" penalties and self-cannibalization.
            let dailyLimit = 2;
            if (nName.includes('tranvas')) {
                dailyLimit = 1; // 1 curated post per day for Tranvas
            }

            const [ranToday] = await sql`SELECT COUNT(*) as count FROM schedules WHERE account_id = ${acc.id} AND last_run_date = ${todayStr}`;
            const postsToday = parseInt(ranToday?.count || 0);
            if (postsToday >= dailyLimit && !force) continue;

            // ── CIRCADIAN HUMAN GUARD (07:30 - 23:00 WITA) ─────────────────
            // Akun aktif di jam sadar manusia. Tidur total di subuh/malam (23:00 - 07:30 WITA) untuk anti-bot security.
            if (!force && (currentHour < 7 || (currentHour === 7 && currentMinute < 30) || currentHour >= 23)) {
                console.log(`[Threads-Cron] ${acc.name}: Current time ${currentHour}:${String(currentMinute).padStart(2, '0')} WITA is sleeping hours (23:00 - 07:30 WITA). Sleeping.`);
                continue;
            }

            // ── BIOLOGICAL INTER-POST COOLDOWN GUARD ───────────────────────
            // Memberi jeda alami 5.5 hingga 7.5 jam antar-post agar feed tidak spamming dan tidak self-cannibalize
            const lastPostRows = await sql`
                SELECT EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 AS hours_since
                FROM post_history 
                WHERE account_id = ${acc.id} AND status = 'success' 
                ORDER BY created_at DESC LIMIT 1
            `;
            if (lastPostRows.length > 0 && !force) {
                const hoursSinceLastPost = parseFloat(lastPostRows[0].hours_since || 0);
                const jitter = ((acc.id * 53 + postsToday * 19 + currentHour * 11) % 100) / 100;
                let minCooldownHours = 5.5 + (jitter * 2.0); // 5.5 - 7.5 hours gap
                if (nName.includes('tranvas')) {
                    minCooldownHours = 16.0 + (jitter * 3.0); // Tranvas 1 post per day
                }

                if (hoursSinceLastPost < minCooldownHours) {
                    console.log(`[Threads-Cron] ⏸️ ${acc.name}: In biological cooldown (${hoursSinceLastPost.toFixed(1)}h / ${minCooldownHours.toFixed(2)}h). Skipping.`);
                    continue;
                }
            }

            // ── DETERMINISTIC STAGGERED QUEUE SLOTS ARCHITECTURE (ALA BUFFER/POSTIZ) ──
            // Each account has dedicated non-overlapping windows across the day with dynamic daily jitter.
            // Guarantees that accounts NEVER post at the same time or minute, and changes every single day!
            let windowConfig;
            if (nName.includes('adhlil')) {
                // adhlil.co: Slot 1 (08:30 - 12:30), Slot 2 (18:30 - 20:30)
                windowConfig = (postsToday === 0) ? [8, 30, 12, 30] : [18, 30, 20, 30];
            } else if (nName.includes('sharesa')) {
                // Sharesa Space: Slot 1 (12:45 - 15:45), Slot 2 (20:30 - 23:00)
                windowConfig = (postsToday === 0) ? [12, 45, 15, 45] : [20, 30, 23, 0];
            } else {
                // Tranvas (1 post/day): Slot 1 (15:45 - 18:30)
                windowConfig = [15, 45, 18, 30];
            }

            const [startH, startM, endH, endM] = windowConfig;
            const targetSlot = getDailyDynamicTargetSlot(
                todayStr,
                `threads-${acc.name}`,
                `slot-${postsToday + 1}`,
                startH, startM, endH, endM,
                currentHour, currentMinute
            );

            console.log(`[Threads-Cron] 🎯 ${acc.name}: Slot ${postsToday + 1}/${dailyLimit} target=${targetSlot.formatted} WITA (Now: ${String(currentHour).padStart(2,'0')}:${String(currentMinute).padStart(2,'0')}, isDue: ${targetSlot.isDue})`);

            if (!force && !targetSlot.isDue) {
                continue;
            }

            const pending = await sql`
                SELECT * FROM schedules 
                WHERE account_id = ${acc.id} AND is_active = 1 AND (last_run_date IS NULL OR last_run_date != ${todayStr})
                ORDER BY last_run_date ASC NULLS FIRST, id ASC
            `;
            if (!pending.length) continue;

            if (true) {
                let sch = null;

                if (nName.includes('sharesa')) {
                    // ── 5 KATEGORI DYNAMIC SHUFFLE (SHARESA SPACE) ──────────────────
                    const ranTodaySchedules = await sql`
                        SELECT custom_prompt FROM schedules 
                        WHERE account_id = ${acc.id} AND last_run_date = ${todayStr}
                    `;
                    const executedCategories = new Set();
                    for (const r of ranTodaySchedules) {
                        const match = (r.custom_prompt || '').match(/\[KATEGORI\s+(\d)/i);
                        if (match) executedCategories.add(parseInt(match[1]));
                    }

                    const remainingCategories = [1, 2, 3, 4, 5].filter(c => !executedCategories.has(c));
                    const targetCategory = remainingCategories.length > 0 
                        ? remainingCategories[Math.floor(Math.random() * remainingCategories.length)]
                        : null;

                    if (targetCategory) {
                        const catPending = pending.filter(s => {
                            const m = (s.custom_prompt || '').match(/\[KATEGORI\s+(\d)/i);
                            return m && parseInt(m[1]) === targetCategory;
                        });
                        if (catPending.length > 0) {
                            sch = catPending[Math.floor(Math.random() * catPending.length)];
                        }
                    }

                    if (!sch) {
                        sch = pending[Math.floor(Math.random() * pending.length)];
                    }
                } else {
                    sch = pending[Math.floor(Math.random() * pending.length)];
                }
                
                const taskPromise = runScheduledTask(sch, todayStr)
                    .then(() => {
                        executed.push({ account: acc.name, scheduleId: sch.id });
                    })
                    .catch(e => console.error(`[Cron-Task] ${acc.name} Error:`, e.message));
                    
                if (awaitTasks) {
                    pendingTasks.push(taskPromise);
                }

                // ── SINGLE-ACCOUNT EXECUTION LOCK PER CRON RUN ──
                // Enforce maximum 1 Threads account posting per 15-minute cron cycle.
                // Prevents simultaneous burst posting across multiple accounts!
                console.log(`[Threads-Cron] 🔒 Dispatched post for ${acc.name}. Locking out other Threads accounts for this 15-minute cycle.`);
                break;
            }
        } catch (accErr) { console.error(`[Cron-Acc] ${acc.name}:`, accErr.message); }
    }

    if (awaitTasks && pendingTasks.length > 0) {
        await Promise.all(pendingTasks);
    }

    return { success: true, executed };
}

app.get('/api/threads/cron', async (req, res) => {
    const secretParam = req.query.secret;
    const expectedSecret = process.env.CRON_SECRET || 'super_chaos_secret_99';

    if (secretParam !== expectedSecret && req.headers.authorization !== `Bearer ${expectedSecret}`) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        const result = await runThreadsCron(false);
        res.status(200).json(result);
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

async function runScheduledTask(schedule, todayStr = null) {
    const accountId = schedule.account_id;
    const account = await sql`SELECT account_type FROM accounts WHERE id = ${accountId}`.then(r => r[0]);

    const customPrompt = schedule.custom_prompt || null;
    const imageUrl = schedule.image_url || null;
    let imageBase64 = null;

    if (imageUrl) {
        try {
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 5000 });
            imageBase64 = Buffer.from(response.data, 'binary').toString('base64');
        } catch (e) { console.warn('[Task] Image fetch failed:', e.message); }
    }
        
    const content = await generateThreadsContent('threads', imageBase64 || imageUrl, customPrompt, accountId);
    if (content) {
        // Randomized human micro-jitter delay (3s - 7s) to break clockwork request signatures
        const humanDelayMs = 3000 + Math.floor(Math.random() * 4000);
        console.log(`[Threads-Cron] Applying ${humanDelayMs}ms human jitter before dispatching to Threads...`);
        await new Promise(r => setTimeout(r, humanDelayMs));

        const postResult = await postToPlatforms(content, ['threads'], imageUrl, accountId);
        const hasSuccess = Array.isArray(postResult) ? postResult.some(r => r.success) : !!postResult?.success;
        if (todayStr && hasSuccess) {
            await sql`UPDATE schedules SET last_run_date = ${todayStr} WHERE id = ${schedule.id}`;
        }
        return postResult;
    }
}

app.get('/api', (req, res) => res.json({ status: 'Online', time: new Date() }));

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[Global-Error]', err);
    res.status(200).json({ success: false, error: 'Internal system error', detail: err.message });
});

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (!process.env.VERCEL && isMainModule) {
    app.listen(PORT, '0.0.0.0', () => console.log(`[Local] Server at ${PORT}`));
}

export default app;
