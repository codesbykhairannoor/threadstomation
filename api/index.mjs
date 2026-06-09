import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
process.env.FONTCONFIG_PATH = join(__dirname, '../lib/fonts');

import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import sql, { initDb, cleanupOldHistory } from '../lib/database.js';
import { generateThreadsContent, generateShopeeAffiliatePost } from '../lib/gemini.js';
import { getRandomShopeeProduct } from '../lib/shopee.js';
import { postToPlatforms } from '../lib/threads_service.js';
import { uploadImage } from '../lib/supabase_storage.js';
import axios from 'axios';
import fs from 'fs';
import tiktokApp from './tiktok.mjs';
import instagramApp from './instagram.mjs';
import facebookApp from './facebook.mjs';

const app = express();
app.use(tiktokApp); 
app.use(instagramApp); 
app.use(facebookApp); 
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const PORT = process.env.PORT || 3000;

app.use('/api', async (req, res, next) => {
  try {
    await initDb();
    next();
  } catch (e) {
    console.error('[Middleware] DB init failed:', e.message);
    next();
  }
});

app.get('/api/accounts', async (req, res) => {
    try {
        const accounts = await sql`SELECT * FROM accounts ORDER BY id ASC`;
        res.json(accounts);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/shopee-status', async (req, res) => {
    try {
        const product = await getRandomShopeeProduct();
        res.json({ status: 'online', sample: product.title });
    } catch (e) {
        res.status(200).json({ status: 'offline', error: e.message });
    }
});

app.get('/api/status', async (req, res) => {
    const accountId = req.query.accountId || 1;
    try {
        const schedules = await sql`SELECT * FROM schedules WHERE account_id = ${accountId} ORDER BY time ASC`;
        const lastPost = await sql`SELECT * FROM post_history WHERE account_id = ${accountId} ORDER BY id DESC LIMIT 1`;
        const token = await sql`SELECT access_token FROM tokens WHERE account_id = ${accountId}`;
        const autoSetting = await sql`SELECT value FROM settings WHERE key = 'automation_enabled'`;
        res.json({ 
            schedules, 
            lastPost: lastPost[0] || null, 
            threadsToken: !!token[0]?.access_token,
            automation_enabled: autoSetting[0]?.value || 'true'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/settings', async (req, res) => {
    try {
        const settings = await sql`SELECT * FROM settings`;
        const obj = {};
        settings.forEach(s => obj[s.key] = s.value);
        res.json(obj);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/settings', async (req, res) => {
    const settings = req.body;
    try {
        for (const [key, value] of Object.entries(settings)) {
            await sql`
              INSERT INTO settings (key, value) VALUES (${key}, ${value})
              ON CONFLICT (key) DO UPDATE SET value = ${value}
            `;
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/post-now', async (req, res) => {
    const { platforms, image, accountId } = req.body;
    const targetAccountId = accountId || 1;
    try {
        const account = await sql`SELECT account_type FROM accounts WHERE id = ${targetAccountId}`.then(r => r[0]);
        let content = '';
        let imageUrl = image;

        if (account?.account_type === 'shopee') {
            console.log(`[Manual-Shopee] Generating random product post for Acc:${targetAccountId}`);
            const product = await getRandomShopeeProduct();
            content = await generateShopeeAffiliatePost(product, targetAccountId);
            imageUrl = product.imageUrl;
        } else {
            content = await generateThreadsContent('threads', image, null, targetAccountId);
        }

        const results = await postToPlatforms(content, platforms, imageUrl, targetAccountId);
        res.json({ success: true, results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/history', async (req, res) => {
    const accountId = req.query.accountId;
    try {
        let history;
        if (accountId) {
            history = await sql`SELECT * FROM post_history WHERE account_id = ${accountId} ORDER BY created_at DESC LIMIT 15`;
        } else {
            history = await sql`SELECT * FROM post_history ORDER BY created_at DESC LIMIT 15`;
        }
        res.json(history || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/schedules', async (req, res) => {
    const { time, custom_prompt, image, accountId } = req.body;
    try {
        await sql`
          INSERT INTO schedules (time, custom_prompt, image_url, account_id)
          VALUES (${time || null}, ${custom_prompt || null}, ${image || null}, ${accountId})
        `;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/schedules/:id', async (req, res) => {
    try {
        await sql`DELETE FROM schedules WHERE id = ${req.params.id}`;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/schedules/:id/toggle', async (req, res) => {
    try {
        await sql`UPDATE schedules SET is_active = 1 - is_active WHERE id = ${req.params.id}`;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API: Vercel Serverless Webhook Cron Trigger
app.get('/api/cron', async (req, res) => {
    const secretParam = req.query.secret;
    const expectedSecret = process.env.CRON_SECRET || 'super_chaos_secret_99';

    if (process.env.CRON_SECRET && secretParam !== expectedSecret) {
        return res.status(401).json({ error: 'Unauthorized: Invalid CRON_SECRET' });
    }

    const targetAccountId = req.query.accountId ? parseInt(req.query.accountId, 10) : null;
    const isMasterPing = req.query.master === 'true' || !targetAccountId;

    // Robust WITA (UTC+8) Time Calculation
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const witaTime = new Date(utcTime + (3600000 * 8)); 
    
    const todayStr = witaTime.toISOString().split('T')[0];
    const currentHour = witaTime.getHours();
    const currentMinute = witaTime.getMinutes();
    const totalMinutesLeft = Math.max(1, (23 - currentHour) * 60 + (60 - currentMinute));

    try {
        // Stagger execution by a few ms to prevent "thundering herd" on the DB pool
        await new Promise(r => setTimeout(r, Math.random() * 300)); 

        const host = req.headers.host || 'threadstomation.vercel.app';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const baseUrl = `${protocol}://${host}`;
        
        // PING OTHERS: Only on master call
        if (isMasterPing) {
            console.log(`[Cron-Master] Triggering sub-crons via ${baseUrl}...`);
            const pingOptions = { timeout: 8000 }; 
            // FIRE AND FORGET - Absolutely non-blocking
            setTimeout(() => {
                axios.get(`${baseUrl}/api/tiktok/cron?secret=${expectedSecret}`, pingOptions).catch(() => {});
                axios.get(`${baseUrl}/api/instagram/cron?secret=${expectedSecret}`, pingOptions).catch(() => {});
                axios.get(`${baseUrl}/api/facebook/cron?secret=${expectedSecret}`, pingOptions).catch(() => {});
            }, 10);
        }

        // SAKLAR UTAMA
        const globalStatus = await sql`SELECT value FROM settings WHERE key = 'automation_enabled'`.catch(() => [{value: 'true'}]);
        if (globalStatus[0]?.value === 'false') {
            return res.status(200).json({ success: true, status: 'Automation disabled globally.' });
        }

        // MAIN LOOP
        let accounts = [];
        try {
            accounts = targetAccountId 
                ? await sql`SELECT id, name FROM accounts WHERE id = ${targetAccountId} AND is_active = 1`
                : await sql`SELECT id, name FROM accounts WHERE is_active = 1`;
        } catch (dbErr) {
            console.error('[Cron] DB Account Fetch Failed:', dbErr.message);
            return res.status(200).json({ success: false, error: 'DB Fetch Failed' });
        }

        const executed = [];
        for (const acc of accounts) {
            try {
                const ranToday = await sql`SELECT COUNT(*) as count FROM schedules WHERE account_id = ${acc.id} AND last_run_date = ${todayStr}`;
                const postsToday = parseInt(ranToday[0]?.count || 0, 10);

                if (postsToday >= 5) continue;

                const pendingSchedules = await sql`
                    SELECT * FROM schedules 
                    WHERE account_id = ${acc.id} AND is_active = 1 AND (last_run_date IS NULL OR last_run_date != ${todayStr})
                `;
                
                if (pendingSchedules.length === 0) continue;

                const chance = (5 - postsToday) / totalMinutesLeft;
                const roll = Math.random();

                if (roll < chance) {
                    const scheduleToRun = pendingSchedules[Math.floor(Math.random() * pendingSchedules.length)];
                    await sql`UPDATE schedules SET last_run_date = ${todayStr} WHERE id = ${scheduleToRun.id}`;
                    console.log(`[Cron] 🎲 CHAOS HIT! Running ID: ${scheduleToRun.id} for ${acc.name}`);
                    
                    // Run task but don't let it crash the whole loop
                    runScheduledTask(scheduleToRun).catch(e => console.error(`[Task-Async] Error for ${acc.name}:`, e.message));
                    
                    executed.push({ account: acc.name, scheduleId: scheduleToRun.id });
                }
            } catch (accErr) {
                console.error(`[Cron] Error processing account ${acc.name}:`, accErr.message);
            }
        }

        // Cleanup in background
        cleanupOldHistory().catch(() => {});
        
        return res.status(200).json({ success: true, executed, time: witaTime.toISOString() });
    } catch (e) {
        console.error('[Cron] Final Catch:', e.message);
        return res.status(200).json({ success: false, error: e.message });
    }
});

async function runScheduledTask(schedule) {
    try {
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
                    const response = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 10000 });
                    imageBase64 = Buffer.from(response.data, 'binary').toString('base64');
                } catch (fetchErr) {
                    console.error(`[Task] Image fetch failed for ${imageUrl}:`, fetchErr.message);
                }
            }
            
            const content = await generateThreadsContent('threads', imageBase64 || imageUrl, customPrompt, accountId);
            if (content) {
                await postToPlatforms(content, ['threads'], imageUrl, accountId);
            }
        }
    } catch (error) {
        console.error(`[Task] Error for account ${schedule.account_id}:`, error.message);
    }
}

// Root API status
app.get('/api', (req, res) => {
    res.json({ status: 'Socmed AI API Online', timestamp: new Date() });
});

// START SERVER
const distPath = join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
}

if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`[Server] Multi-Account Threads running at port ${PORT}`);
        initDb().catch(e => console.error('[DB] Async init failed:', e.message));
        
        cron.schedule('*/5 * * * *', async () => {
            const secret = process.env.CRON_SECRET || 'super_chaos_secret_99';
            const base = `http://localhost:${PORT}`;
            await axios.get(`${base}/api/tiktok/cron?secret=${secret}`).catch(() => {});
            await axios.get(`${base}/api/instagram/cron?secret=${secret}`).catch(() => {});
            await axios.get(`${base}/api/facebook/cron?secret=${secret}`).catch(() => {});
        });
    });
}

if (fs.existsSync(join(distPath, 'index.html'))) {
    app.get(/.*/, (req, res) => {
        res.sendFile(join(distPath, 'index.html'));
    });
}

export default app;
