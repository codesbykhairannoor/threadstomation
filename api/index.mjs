import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
process.env.FONTCONFIG_PATH = join(__dirname, '../lib/fonts');

import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import sql, { initDb } from '../lib/database.js';
import { generateThreadsContent, generateShopeeAffiliatePost } from '../lib/gemini.js';
import { getRandomShopeeProduct } from '../lib/shopee.js';
import { postToPlatforms } from '../lib/threads_service.js';
import { uploadImage } from '../lib/supabase_storage.js';
import axios from 'axios';
import fs from 'fs';
import tiktokApp from './tiktok.mjs';
import instagramApp from './instagram.mjs';

const app = express();
app.use(tiktokApp); // Mount TikTok app routes locally
app.use(instagramApp); // Mount Instagram app routes locally
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const PORT = process.env.PORT || 3000;

// Middleware: Ensure DB is initialized before every API request (lazy init for serverless)
app.use('/api', async (req, res, next) => {
  try {
    await initDb();
    next();
  } catch (e) {
    console.error('[Middleware] DB init failed:', e.message);
    next(); // Still proceed, individual routes handle their own errors
  }
});

// API: List Accounts
app.get('/api/accounts', async (req, res) => {
    try {
        const accounts = await sql`SELECT * FROM accounts ORDER BY id ASC`;
        res.json(accounts);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// API: Shopee DB Health Check
app.get('/api/shopee-status', async (req, res) => {
    try {
        const product = await getRandomShopeeProduct();
        res.json({ status: 'online', sample: product.title });
    } catch (e) {
        res.status(200).json({ status: 'offline', error: e.message });
    }
});

// API: Status for specific account
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

// API: Settings (Global for now, but could be per-account)
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

// API: Post Now for specific account
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

// API: History per account
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

// API: Schedules per account
app.post('/api/schedules', async (req, res) => {
    const { time, custom_prompt, image, accountId } = req.body;
    const targetAccountId = accountId || 1;
    try {
        let imageUrl = null;
        if (image) {
            imageUrl = await uploadImage(image);
        }
        await sql`
            INSERT INTO schedules (time, custom_prompt, image_url, account_id) 
            VALUES (${time}, ${custom_prompt}, ${imageUrl}, ${targetAccountId})
        `;
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/schedules/:id', async (req, res) => {
    const { custom_prompt, image, time } = req.body;
    const { id } = req.params;
    try {
        let imageUrl = null;
        if (image && image.startsWith('data:')) {
            imageUrl = await uploadImage(image);
        }
        
        await sql`
            UPDATE schedules 
            SET custom_prompt = ${custom_prompt}, 
                time = ${time || sql`time`},
                image_url = ${imageUrl || sql`image_url`}
            WHERE id = ${id}
        `;
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// API: Toggle Schedule Status
app.post('/api/schedules/:id/toggle', async (req, res) => {
    const { id } = req.params;
    try {
        await sql`
            UPDATE schedules 
            SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END 
            WHERE id = ${id}
        `;
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/schedules/:id', async (req, res) => {
    try {
        await sql`DELETE FROM schedules WHERE id = ${req.params.id}`;
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// API: Update Account (Master Prompt, etc.)
app.put('/api/accounts/:id', async (req, res) => {
    const { id } = req.params;
    const { master_prompt, name } = req.body;
    try {
        await sql`
            UPDATE accounts 
            SET master_prompt = ${master_prompt}, name = ${name} 
            WHERE id = ${id}
        `;
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// API: Toggle Global Automation
app.post('/api/settings/toggle-automation', async (req, res) => {
    try {
        const current = await sql`SELECT value FROM settings WHERE key = 'automation_enabled'`;
        const newValue = current[0]?.value === 'false' ? 'true' : 'false';
        
        await sql`
            INSERT INTO settings (key, value) VALUES ('automation_enabled', ${newValue})
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        `;
        res.json({ success: true, enabled: newValue === 'true' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// API: Vercel Serverless Diagnostics Route
app.get('/api/debug', async (req, res) => {
    try {
        const test = await sql`SELECT 1 + 1 as result`;
        res.json({ success: true, db_connection: 'online', result: test[0]?.result });
    } catch (e) {
        res.status(200).json({ 
            success: false, 
            db_connection: 'offline', 
            error: e.message, 
            has_db_url: !!process.env.DATABASE_URL,
            db_url_length: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0
        });
    }
});

// API: Vercel Serverless Webhook Cron Trigger
app.get('/api/cron', async (req, res) => {
    // Keamanan: Cek token rahasia agar tidak sembarang orang bisa menembak
    const authHeader = req.headers.authorization;
    const secretParam = req.query.secret;
    const expectedSecret = process.env.CRON_SECRET || 'super_chaos_secret_99';

    if (process.env.CRON_SECRET) {
        if (authHeader !== `Bearer ${expectedSecret}` && secretParam !== expectedSecret) {
            return res.status(401).json({ error: 'Unauthorized: Invalid CRON_SECRET' });
        }
    }

    const targetAccountId = req.query.accountId ? parseInt(req.query.accountId, 10) : null;
    const now = new Date();
    // Timezone WITA (Makassar)
    const witaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Makassar"}));
    const currentHour = witaTime.getHours();
    const currentMinute = witaTime.getMinutes();
    const todayStr = witaTime.toISOString().split('T')[0];
    
    const totalMinutesLeft = Math.max(1, (23 - currentHour) * 60 + (60 - currentMinute));

    try {
        // Cek Saklar Utama
        const globalStatus = await sql`SELECT value FROM settings WHERE key = 'automation_enabled'`;
        if (globalStatus[0]?.value === 'false') {
            return res.json({ success: true, status: 'Automation disabled globally.' });
        }

        // Ambil list akun aktif (atau filter spesifik targetAccountId)
        let accounts = [];
        if (targetAccountId) {
            accounts = await sql`SELECT id, name FROM accounts WHERE id = ${targetAccountId} AND is_active = 1`;
        } else {
            accounts = await sql`SELECT id, name FROM accounts WHERE is_active = 1`;
        }

        const executed = [];

        for (const acc of accounts) {
            // Hitung postingan hari ini
            const ranToday = await sql`
                SELECT COUNT(*) as count 
                FROM schedules 
                WHERE account_id = ${acc.id} 
                AND last_run_date = ${todayStr}
            `;
            const postsToday = parseInt(ranToday[0]?.count || 0, 10);

            if (postsToday >= 5) {
                console.log(`[Vercel-Cron] Acc:${acc.name} already hit 5 posts limit today.`);
                continue;
            }

            const postsRemaining = 5 - postsToday;

            // Ambil jadwal aktif pending
            const pendingSchedules = await sql`
                SELECT * FROM schedules 
                WHERE account_id = ${acc.id} 
                AND is_active = 1 
                AND (last_run_date IS NULL OR last_run_date != ${todayStr})
            `;
            
            const numPending = pendingSchedules.length;
            if (numPending === 0) continue;

            const numToMake = Math.min(postsRemaining, numPending);
            const chance = numToMake / totalMinutesLeft;
            const roll = Math.random();

            console.log(`[Vercel-Cron] Checking Acc:${acc.name} (ID:${acc.id}) -> PostsToday: ${postsToday}/5, Pending: ${numPending}, Chance: ${chance.toFixed(5)}, Roll: ${roll.toFixed(5)}`);

            if (roll < chance) {
                const randomIndex = Math.floor(Math.random() * numPending);
                const scheduleToRun = pendingSchedules[randomIndex];

                console.log(`[Vercel-Cron] 🎲 CHAOS HIT! Running schedule ID: ${scheduleToRun.id} for Acc:${acc.name}`);
                
                // Update DB secara instan biar ga kepilih lagi
                await sql`UPDATE schedules SET last_run_date = ${todayStr} WHERE id = ${scheduleToRun.id}`;
                
                // Jalankan tugas (Synchronous di serverless)
                await runScheduledTask(scheduleToRun);
                executed.push({ account: acc.name, scheduleId: scheduleToRun.id });
            }
        }

        res.json({ success: true, executed });
    } catch (e) {
        console.error('[Vercel-Cron] Error:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// --- SCHEDULER LOGIC ---

async function runScheduledTask(schedule) {
    try {
        // Double check global switch inside task too
        const globalStatus = await sql`SELECT value FROM settings WHERE key = 'automation_enabled'`;
        if (globalStatus[0]?.value === 'false') {
            console.log('[Scheduler] 🛑 Task cancelled: Global Automation is OFF.');
            return;
        }
        
        const accountId = schedule.account_id;
        const account = await sql`SELECT account_type FROM accounts WHERE id = ${accountId}`.then(r => r[0]);

        if (account?.account_type === 'shopee') {
            console.log(`[Scheduler-Shopee] Triggering auto-spill for account ${accountId}`);
            const product = await getRandomShopeeProduct();
            const caption = await generateShopeeAffiliatePost(product, accountId);
            
            await postToPlatforms(caption, ['threads'], product.imageUrl, accountId);
            console.log(`✅ [Scheduler-Shopee] Auto-spill success!`);
        } else {
            const customPrompt = schedule.custom_prompt || null;
            const imageUrl = schedule.image_url || null;
            let imageBase64 = null;

            if (imageUrl) {
                try {
                    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                    imageBase64 = Buffer.from(response.data, 'binary').toString('base64');
                } catch (fetchErr) {
                    console.error(`[Scheduler-Acc:${accountId}] Image fetch failed:`, fetchErr.message);
                }
            }
            
            console.log(`[Scheduler-Acc:${accountId}] Generating content...`);
            const content = await generateThreadsContent('threads', imageBase64 || imageUrl, customPrompt, accountId);
            
            console.log(`[Scheduler-Acc:${accountId}] Posting...`);
            await postToPlatforms(content, ['threads'], imageUrl, accountId);
        }
    } catch (error) {
        console.error(`[Scheduler] Error for account ${schedule.account_id}:`, error.message);
    }
}

cron.schedule('* * * * *', async () => {
    // 1. Cek Saklar Utama
    const globalStatus = await sql`SELECT value FROM settings WHERE key = 'automation_enabled'`;
    if (globalStatus[0]?.value === 'false') return;

    const now = new Date();
    // Gunakan timezone WITA (Makassar)
    const witaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Makassar"}));
    const currentHour = witaTime.getHours();
    const currentMinute = witaTime.getMinutes();
    const todayStr = witaTime.toISOString().split('T')[0];
    
    // Sisa menit hari ini (sampai jam 23:59 WITA)
    const totalMinutesLeft = Math.max(1, (23 - currentHour) * 60 + (60 - currentMinute));

    try {
        const accounts = await sql`SELECT id FROM accounts WHERE is_active = 1`;
        
        for (const acc of accounts) {
            // Hitung berapa banyak post yang SUDAH jalan hari ini untuk akun ini
            const ranToday = await sql`
                SELECT COUNT(*) as count 
                FROM schedules 
                WHERE account_id = ${acc.id} 
                AND last_run_date = ${todayStr}
            `;
            const postsToday = parseInt(ranToday[0]?.count || 0, 10);

            // Batasi maksimal 5 postingan sehari per akun
            if (postsToday >= 5) continue;

            const postsRemaining = 5 - postsToday;

            // Ambil jadwal yang AKTIF dan BELUM jalan hari ini
            const pendingSchedules = await sql`
                SELECT * FROM schedules 
                WHERE account_id = ${acc.id} 
                AND is_active = 1 
                AND (last_run_date IS NULL OR last_run_date != ${todayStr})
            `;
            
            const numPending = pendingSchedules.length;
            if (numPending === 0) continue;

            // Jumlah target post yang MAU dan BISA kita buat hari ini
            const numToMake = Math.min(postsRemaining, numPending);

            // Logika Peluang: Jumlah target sisa postingan dibagi sisa waktu menit
            const chance = numToMake / totalMinutesLeft;
            const roll = Math.random();

            if (roll < chance) {
                // KOCOK! Pilih satu jadwal secara acak dari sisa yang ada
                const randomIndex = Math.floor(Math.random() * numPending);
                const scheduleToRun = pendingSchedules[randomIndex];

                console.log(`[Chaos-Scheduler] 🎲 PURE LUCK! Executing Random Schedule (ID: ${scheduleToRun.id}) for Acc:${acc.id}. Posts today: ${postsToday + 1}/5`);
                
                // Update DB biar nggak kepilih lagi hari ini
                await sql`UPDATE schedules SET last_run_date = ${todayStr} WHERE id = ${scheduleToRun.id}`;
                
                // Jitter kecil biar gak trigger barengan kalau ada banyak akun
                const jitterMs = Math.floor(Math.random() * 60000); 
                setTimeout(async () => {
                    await runScheduledTask(scheduleToRun);
                }, jitterMs);
            }
        }
    } catch (e) {
        console.error('[Chaos-Scheduler] Error:', e.message);
    }
});

// Serve frontend
const distPath = join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
}

if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`[Server] Multi-Account Threads running at port ${PORT}`);
        initDb().catch(e => console.error('[DB] Asynchronous initDb failed:', e.message));
        
        // Local Cron: trigger TikTok and Instagram automation flows every 5 minutes
        cron.schedule('*/5 * * * *', async () => {
            const expectedSecret = process.env.CRON_SECRET || 'super_chaos_secret_99';
            try {
                await axios.get(`http://localhost:${PORT}/api/tiktok/cron?secret=${expectedSecret}`);
            } catch (e) {
                console.error('[Local-Cron] TikTok trigger error:', e.message);
            }
            try {
                await axios.get(`http://localhost:${PORT}/api/instagram/cron?secret=${expectedSecret}`);
            } catch (e) {
                console.error('[Local-Cron] Instagram trigger error:', e.message);
            }
        });
    });
} else {
    // Vercel Serverless: DB is lazily initialized on first request via middleware above.
    console.log('[DB] Running on Vercel Serverless. DB will initialize on first request.');
}

if (fs.existsSync(join(distPath, 'index.html'))) {
    app.get(/.*/, (req, res) => {
        res.sendFile(join(distPath, 'index.html'));
    });
}

export default app;
