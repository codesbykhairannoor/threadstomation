import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
process.env.FONTCONFIG_PATH = join(__dirname, '../lib/fonts');

import express from 'express';
import cors from 'cors';
import sql, { initDb, cleanupOldHistory } from '../lib/database.js';
import { generateThreadsContent, generateShopeeAffiliatePost } from '../lib/gemini.js';
import { getRandomShopeeProduct } from '../lib/shopee.js';
import { postToPlatforms } from '../lib/threads_service.js';
import axios from 'axios';
import fs from 'fs';

// axios, fs already imported


const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Global DB Init
app.use(async (req, res, next) => {
  try { await initDb(); next(); } catch (e) { next(); }
});

const PORT = process.env.PORT || 3000;

app.get('/api/accounts', async (req, res) => {
    try {
        const accounts = await sql`SELECT * FROM accounts ORDER BY id ASC`;
        res.json(accounts);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/cron', async (req, res) => {
    const secretParam = req.query.secret;
    const expectedSecret = process.env.CRON_SECRET || 'super_chaos_secret_99';

    if (process.env.CRON_SECRET && secretParam !== expectedSecret) {
        return res.status(200).json({ success: false, error: 'Unauthorized' });
    }

    const targetAccountId = req.query.accountId ? parseInt(req.query.accountId, 10) : null;
    const isMasterPing = req.query.master === 'true' || !targetAccountId;

    // Robust WITA (UTC+8) Time Calculation
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
        
        // PING OTHERS (NON-BLOCKING)
        if (isMasterPing) {
            const pingOptions = { timeout: 5000 }; 
            setTimeout(() => {
                axios.get(`${baseUrl}/api/tiktok/cron?secret=${expectedSecret}`, pingOptions).catch(() => {});
                axios.get(`${baseUrl}/api/instagram/cron?secret=${expectedSecret}`, pingOptions).catch(() => {});
                axios.get(`${baseUrl}/api/facebook/cron?secret=${expectedSecret}`, pingOptions).catch(() => {});
            }, 5);
        }

        // Check global switch
        const globalStatus = await sql`SELECT value FROM settings WHERE key = 'automation_enabled'`.catch(() => [{value: 'true'}]);
        if (globalStatus[0]?.value === 'false') {
            return res.status(200).json({ success: true, status: 'Automation disabled globally.' });
        }

        // BATCH FETCH ACCOUNTS & SCHEDULES
        const accounts = targetAccountId 
            ? await sql`SELECT id, name FROM accounts WHERE id = ${targetAccountId} AND is_active = 1`
            : await sql`SELECT id, name FROM accounts WHERE is_active = 1`;

        if (accounts.length === 0) return res.json({ success: true, status: 'No active accounts' });

        const executed = [];
        for (const acc of accounts) {
            try {
                // Check daily limit
                const [ranToday] = await sql`SELECT COUNT(*) as count FROM schedules WHERE account_id = ${acc.id} AND last_run_date = ${todayStr}`;
                const postsToday = parseInt(ranToday?.count || 0, 10);
                if (postsToday >= 5) continue;

                // Check pending
                const pending = await sql`
                    SELECT * FROM schedules 
                    WHERE account_id = ${acc.id} AND is_active = 1 AND (last_run_date IS NULL OR last_run_date != ${todayStr})
                    LIMIT 1
                `;
                
                if (pending.length === 0) continue;

                const chance = (5 - postsToday) / totalMinutesLeft;
                if (Math.random() < chance) {
                    const sch = pending[0];
                    await sql`UPDATE schedules SET last_run_date = ${todayStr} WHERE id = ${sch.id}`;
                    
                    // Trigger async task
                    runScheduledTask(sch).catch(e => console.error(`[Cron-Task] Failed for ${acc.name}:`, e.message));
                    executed.push({ account: acc.name, scheduleId: sch.id });
                }
            } catch (accErr) {
                console.error(`[Cron-Acc] ${acc.name} Error:`, accErr.message);
            }
        }

        cleanupOldHistory().catch(() => {});
        res.status(200).json({ success: true, executed });
    } catch (e) {
        console.error('[Cron-Master] Error:', e.message);
        res.status(200).json({ success: false, error: e.message });
    }
});

async function runScheduledTask(schedule) {
    const accountId = schedule.account_id;
    const account = await sql`SELECT account_type FROM accounts WHERE id = ${accountId}`.then(r => r[0]);

    if (account?.account_type === 'shopee') {
        const product = await getRandomShopeeProduct();
        const caption = await generateShopeeAffiliatePost(product, accountId);
        await postToPlatforms(caption, ['threads'], product.imageUrl, accountId);
    } else {
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
            await postToPlatforms(content, ['threads'], imageUrl, accountId);
        }
    }
}

app.get('/api', (req, res) => res.json({ status: 'Online', time: new Date() }));

// Global Error Handler - The Last Resort to prevent 500
app.use((err, req, res, next) => {
    console.error('[Global-Error]', err);
    res.status(200).json({ success: false, error: 'Internal system error but we caught it.', detail: err.message });
});

if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`[Local] Server at ${PORT}`);
    });
}

export default app;
