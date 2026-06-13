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
app.get('/api/cron', async (req, res) => {
    try {
        const baseUrl = req.headers.host.includes('localhost') 
            ? `http://localhost:${PORT}` 
            : `https://${req.headers.host}`;
        
        console.log(`[Cron] Triggering posts for 4 medsos at ${baseUrl}`);
        
        // Fire and forget to avoid Vercel 10s timeout on hobby plan
        axios.post(`${baseUrl}/api/tumblr/post-now`, { accountId: 1 }).catch(e => console.error('[Cron] Tumblr err:', e.message));
        axios.post(`${baseUrl}/api/bluesky/post-now`, { accountId: 1 }).catch(e => console.error('[Cron] Bluesky err:', e.message));
        axios.post(`${baseUrl}/api/mastodon/post-now`, { accountId: 1 }).catch(e => console.error('[Cron] Mastodon err:', e.message));
        axios.post(`${baseUrl}/api/devto/post-now`, { accountId: 1 }).catch(e => console.error('[Cron] DevTo err:', e.message));

        res.json({ success: true, message: 'Cron job successfully triggered for 4 medsos.' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

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

// ── CRON SYSTEM ────────────────────────────────────────────────────────────────

app.get('/api/cron', async (req, res) => {
    const secretParam = req.query.secret;
    const expectedSecret = process.env.CRON_SECRET || 'super_chaos_secret_99';

    if (secretParam !== expectedSecret) {
        return res.status(200).json({ success: false, error: 'Unauthorized' });
    }

    const targetAccountId = req.query.accountId ? parseInt(req.query.accountId, 10) : null;
    const isMasterPing = req.query.master === 'true' || !targetAccountId;

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
            await Promise.all(subCrons.map(platform => 
                fetch(`${baseUrl}/api/${platform}/cron?secret=${expectedSecret}`)
                    .catch(e => console.warn(`[Cron-Ping] ${platform} failed:`, e.message))
            ));
        }

        const accounts = targetAccountId 
            ? await sql`SELECT id, name FROM accounts WHERE id = ${targetAccountId} AND is_active = 1`
            : await sql`SELECT id, name FROM accounts WHERE is_active = 1`;

        const executed = [];
        for (const acc of accounts) {
            try {
                const [ranToday] = await sql`SELECT COUNT(*) as count FROM schedules WHERE account_id = ${acc.id} AND last_run_date = ${todayStr}`;
                if (parseInt(ranToday?.count || 0) >= 5) continue;

                const pending = await sql`
                    SELECT * FROM schedules 
                    WHERE account_id = ${acc.id} AND is_active = 1 AND (last_run_date IS NULL OR last_run_date != ${todayStr})
                `;
                if (!pending.length) continue;

                const chance = (5 - parseInt(ranToday?.count || 0)) / totalMinutesLeft;
                if (Math.random() < chance) {
                    const sch = pending[Math.floor(Math.random() * pending.length)];
                    await sql`UPDATE schedules SET last_run_date = ${todayStr} WHERE id = ${sch.id}`;
                    runScheduledTask(sch).catch(e => console.error(`[Cron-Task] ${acc.name} Error:`, e.message));
                    executed.push({ account: acc.name, scheduleId: sch.id });
                }
            } catch (accErr) { console.error(`[Cron-Acc] ${acc.name}:`, accErr.message); }
        }

        cleanupOldHistory().catch(() => {});
        res.status(200).json({ success: true, executed });
    } catch (e) {
        res.status(200).json({ success: false, error: e.message });
    }
});

async function runScheduledTask(schedule) {
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
    if (content) await postToPlatforms(content, ['threads'], imageUrl, accountId);
}

app.get('/api', (req, res) => res.json({ status: 'Online', time: new Date() }));

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[Global-Error]', err);
    res.status(200).json({ success: false, error: 'Internal system error', detail: err.message });
});

if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => console.log(`[Local] Server at ${PORT}`));
}

export default app;
