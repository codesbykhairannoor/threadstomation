import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sql, { initDb } from './lib/database.js';
import { generateThreadsContent, generateShopeeAffiliatePost } from './lib/gemini.js';
import { getRandomShopeeProduct } from './lib/shopee.js';
import { postToPlatforms } from './lib/threads_service.js';
import { uploadImage } from './lib/supabase_storage.js';
import axios from 'axios';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
initDb();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const PORT = process.env.PORT || 3000;

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
        res.json({ 
            schedules, 
            lastPost: lastPost[0] || null, 
            threadsToken: !!token[0]?.access_token
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
        let imageUrl = null;
        if (image) {
            imageUrl = await uploadImage(image);
        }
        const content = await generateThreadsContent('threads', image);
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

// --- SCHEDULER LOGIC ---

async function runScheduledTask(schedule) {
    try {
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
    const now = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Makassar',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(new Date());
    
    try {
        const matches = await sql`SELECT * FROM schedules WHERE time = ${now} AND is_active = 1`;
        if (matches.length > 0) {
            console.log(`[Scheduler] Found ${matches.length} schedules to trigger at ${now}`);
            for (const schedule of matches) {
                // Tambahkan "Human Jitter": Delay acak 1-12 menit biar nggak keliatan robot banget
                const jitterMs = Math.floor(Math.random() * 12 * 60 * 1000); 
                const waitSec = Math.floor(jitterMs / 1000);
                
                console.log(`[Scheduler-Acc:${schedule.account_id}] 🕒 Human Jitter: Waiting ${waitSec}s before posting...`);
                
                // Jalankan di background agar tidak menghambat akun lain yang mungkin punya jitter lebih singkat
                setTimeout(async () => {
                    await runScheduledTask(schedule);
                }, jitterMs);

                // Beri jeda antar akun juga biar nggak barengan banget trigger-nya
                await new Promise(r => setTimeout(r, 10000)); 
            }
        }
    } catch (e) {
        console.error('[Scheduler] Cron error:', e.message);
    }
});

// Serve frontend
const distPath = join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Multi-Account Threads running at port ${PORT}`);
});

if (fs.existsSync(join(distPath, 'index.html'))) {
    app.get(/.*/, (req, res) => {
        res.sendFile(join(distPath, 'index.html'));
    });
}
