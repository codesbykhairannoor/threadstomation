import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sql, { initDb } from './lib/database.js';
import { generateThreadsContent } from './lib/gemini.js';
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
    const { custom_prompt, image } = req.body;
    const { id } = req.params;
    try {
        let imageUrl = null;
        if (image && image.startsWith('data:')) {
            imageUrl = await uploadImage(image);
        }
        
        if (imageUrl) {
            await sql`UPDATE schedules SET custom_prompt = ${custom_prompt}, image_url = ${imageUrl} WHERE id = ${id}`;
        } else {
            await sql`UPDATE schedules SET custom_prompt = ${custom_prompt} WHERE id = ${id}`;
        }
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

// --- SCHEDULER LOGIC ---

async function runScheduledTask(schedule) {
    try {
        const accountId = schedule.account_id;
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
        const content = await generateThreadsContent('threads', imageBase64 || imageUrl, customPrompt);
        
        console.log(`[Scheduler-Acc:${accountId}] Posting...`);
        await postToPlatforms(content, ['threads'], imageUrl, accountId);
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
                // Add a small delay between accounts to prevent rate limiting
                await new Promise(r => setTimeout(r, 2000));
                await runScheduledTask(schedule);
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
