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
import { refreshThreadsToken } from '../lib/threads.js';
import axios from 'axios';
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

            // ── ANTI-TEMPLATING ACCOUNT-SPECIFIC ACTIVE WINDOWS (WITA) ──────
            // Menjamin setiap akun Threads memiliki slot waktu terpisah tanpa saling tabrakan:
            // 1. adhlil.co (2x/hari):
            //    - Session 1: 09:30 - 11:00 WITA (Design & Agency Morning Peak)
            //    - Session 2: 16:45 - 18:15 WITA (Afternoon Commute Wrap-up)
            // 2. Sharesa Space (2x/hari):
            //    - Session 1: 11:15 - 13:15 WITA (Office Lunch Break Productivity Peak)
            //    - Session 2: 19:45 - 21:30 WITA (Prime-Time Evening Leisure Peak)
            // 3. Tranvas (1x/hari):
            //    - Session 1: 15:15 - 16:30 WITA (Mid-Afternoon Coffee Break Focus)
            let inAccountWindow = false;
            let windowDesc = '';

            if (nName.includes('adhlil')) {
                const s1 = (currentHour === 9 && currentMinute >= 30) || (currentHour === 10) || (currentHour === 11 && currentMinute === 0);
                const s2 = (currentHour === 16 && currentMinute >= 45) || (currentHour === 17) || (currentHour === 18 && currentMinute <= 15);
                inAccountWindow = s1 || s2;
                windowDesc = '09:30-11:00 WITA & 16:45-18:15 WITA';
            } else if (nName.includes('sharesa')) {
                const s1 = (currentHour === 11 && currentMinute >= 15) || (currentHour === 12) || (currentHour === 13 && currentMinute <= 15);
                const s2 = (currentHour === 19 && currentMinute >= 45) || (currentHour === 20) || (currentHour === 21 && currentMinute <= 30);
                inAccountWindow = s1 || s2;
                windowDesc = '11:15-13:15 WITA & 19:45-21:30 WITA';
            } else if (nName.includes('tranvas')) {
                inAccountWindow = (currentHour === 15 && currentMinute >= 15) || (currentHour === 16 && currentMinute <= 30);
                windowDesc = '15:15-16:30 WITA';
            } else {
                inAccountWindow = currentHour >= 9 && currentHour <= 21;
                windowDesc = '09:00-21:00 WITA';
            }

            if (!force && !inAccountWindow) {
                console.log(`[Threads-Cron] ${acc.name}: Current time ${currentHour}:${currentMinute.toString().padStart(2, '0')} WITA is outside account-specific window (${windowDesc}). Sleeping.`);
                continue;
            }

            // Anti-Spam Intelligent Adaptive Pacing Guard:
            const lastPostRows = await sql`
                SELECT EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 AS hours_since
                FROM post_history 
                WHERE account_id = ${acc.id} AND status = 'success' 
                ORDER BY created_at DESC LIMIT 1
            `;
            if (lastPostRows.length > 0 && !force) {
                const hoursSinceLastPost = parseFloat(lastPostRows[0].hours_since || 0);

                // STRATEGIC COOLDOWN (Inter-Session Pacing):
                // Minimum 6.0 to 7.5 hours gap between the 2 daily posts
                // Tranvas (1x/hari): 18.0 to 20.0 hours gap
                const jitter = ((acc.id * 53 + postsToday * 19 + currentHour * 11) % 100) / 100;
                let minCooldownHours = 6.0 + (jitter * 1.5); // 6.0 - 7.5 hours gap
                if (nName.includes('tranvas')) {
                    minCooldownHours = 18.0 + (jitter * 2.0); // Tranvas 1 post per day
                }

                if (hoursSinceLastPost < minCooldownHours) {
                    console.log(`[Threads-Cron] ⏸️ ${acc.name}: Last post was ${hoursSinceLastPost.toFixed(1)}h ago (strategic cooldown ${minCooldownHours.toFixed(2)}h). Skipping to let post accumulate organic engagement.`);
                    continue;
                }
            }

            const pending = await sql`
                SELECT * FROM schedules 
                WHERE account_id = ${acc.id} AND is_active = 1 AND (last_run_date IS NULL OR last_run_date != ${todayStr})
                ORDER BY last_run_date ASC NULLS FIRST, id ASC
            `;
            if (!pending.length) continue;

            const chance = 1.0;
            const roll = Math.random();
            console.log(`[Threads-Cron] ${acc.name}: postsToday=${postsToday}/${dailyLimit}, chance=${chance.toFixed(4)}, roll=${roll.toFixed(4)}`);

            if (roll < chance) {
                let sch = null;

                if (nName.includes('sharesa')) {
                    // ── 5 KATEGORI DYNAMIC SHUFFLE (SHARESA SPACE) ──────────────────
                    // 1. Cek kategori apa saja dari 1-5 yang SUDAH jalan hari ini
                    const ranTodaySchedules = await sql`
                        SELECT custom_prompt FROM schedules 
                        WHERE account_id = ${acc.id} AND last_run_date = ${todayStr}
                    `;
                    const executedCategories = new Set();
                    for (const r of ranTodaySchedules) {
                        const match = (r.custom_prompt || '').match(/\[KATEGORI\s+(\d)/i);
                        if (match) executedCategories.add(parseInt(match[1]));
                    }

                    // 2. Kategori yang BELUM jalan hari ini
                    const remainingCategories = [1, 2, 3, 4, 5].filter(c => !executedCategories.has(c));
                    
                    // 3. Shuffle / pilih kategori acak dari yang belum terbit hari ini
                    const targetCategory = remainingCategories.length > 0 
                        ? remainingCategories[Math.floor(Math.random() * remainingCategories.length)]
                        : null;

                    if (targetCategory) {
                        const catPending = pending.filter(s => {
                            const m = (s.custom_prompt || '').match(/\[KATEGORI\s+(\d)/i);
                            return m && parseInt(m[1]) === targetCategory;
                        });
                        if (catPending.length > 0) {
                            // Pilih sudut pandang (angle) secara acak dari pool kategori tersebut
                            sch = catPending[Math.floor(Math.random() * catPending.length)];
                        }
                    }

                    // Fallback jika tidak terpetakan
                    if (!sch) {
                        sch = pending[Math.floor(Math.random() * pending.length)];
                    }
                } else {
                    // Akun lain (termasuk Tranvas): Pilih acak dari pending
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
        const postResult = await postToPlatforms(content, ['threads'], imageUrl, accountId);
        if (todayStr && postResult) {
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
