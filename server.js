import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sql, { initDb } from './lib/database.js';
import { generateThreadsContent } from './lib/gemini.js';
import { postToPlatforms } from './lib/threads_service.js';
import { uploadImage } from './lib/supabase_storage.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize DB on startup
initDb();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// Serve frontend if dist exists
const distPath = join(__dirname, 'dist');
import fs from 'fs';
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
}

const PORT = process.env.PORT || 3000;

app.get('/api/status', async (req, res) => {
    try {
        const schedules = await sql`SELECT * FROM schedules ORDER BY time ASC`;
        const lastPost = await sql`SELECT * FROM post_history ORDER BY id DESC LIMIT 1`;
        const token = await sql`SELECT access_token FROM tokens WHERE id = 1`;
        res.json({ 
            schedules, 
            lastPost: lastPost[0] || null, 
            threadsToken: !!token[0]?.access_token
        });
    } catch (error) {
        console.error('[Status API Error]:', error.message);
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
              INSERT INTO settings (key, value) 
              VALUES (${key}, ${value})
              ON CONFLICT (key) DO UPDATE SET value = ${value}
            `;
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/test-post', async (req, res) => {
    const { platforms, image } = req.body;
    try {
        let imageUrl = null;
        if (image) {
            console.log('[API] Uploading image to Supabase...');
            imageUrl = await uploadImage(image);
            console.log('[API] Public URL:', imageUrl || 'FAILED');
        }
        const content = await generateThreadsContent('threads', image);
        console.log('[API] AI Content:', content.substring(0, 50) + '...');
        const results = await postToPlatforms(content, platforms, imageUrl);
        res.json({ success: true, results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/post-now', async (req, res) => {
    const { platforms, image } = req.body;
    try {
        let imageUrl = null;
        if (image) {
            console.log('[API] Uploading image to Supabase...');
            imageUrl = await uploadImage(image);
            console.log('[API] Public URL:', imageUrl || 'FAILED');
        }
        const content = await generateThreadsContent('threads', image);
        console.log('[API] AI Content:', content.substring(0, 50) + '...');
        const results = await postToPlatforms(content, platforms, imageUrl);
        res.json({ success: true, results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/history', async (req, res) => {
    try {
        const platform = req.query.platform;
        let history;
        if (platform) {
            history = await sql`SELECT * FROM post_history WHERE platform = ${platform} ORDER BY created_at DESC LIMIT 15`;
        } else {
            history = await sql`SELECT * FROM post_history ORDER BY created_at DESC LIMIT 15`;
        }
        res.json(history || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/schedules', async (req, res) => {
    const { time, custom_prompt, image } = req.body;
    try {
        let imageUrl = null;
        if (image) {
            console.log('[API] Uploading schedule image...');
            imageUrl = await uploadImage(image);
        }
        await sql`INSERT INTO schedules (time, custom_prompt, image_url) VALUES (${time}, ${custom_prompt}, ${imageUrl})`;
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
            console.log('[API] Updating schedule image...');
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

app.get('/api/cron', async (req, res) => {
    console.log('[Cron API] Triggered via Vercel Cron');
    try {
        await runScheduledTask();
        res.json({ success: true, message: 'Cron job executed' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

import axios from 'axios';

async function runScheduledTask(schedule = null) {
    try {
        const customPrompt = schedule?.custom_prompt || null;
        const imageUrl = schedule?.image_url || null;
        let imageBase64 = null;

        if (imageUrl) {
            try {
                console.log(`[Scheduler] Fetching image from: ${imageUrl}`);
                const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                imageBase64 = Buffer.from(response.data, 'binary').toString('base64');
            } catch (fetchErr) {
                console.error('[Scheduler] Failed to fetch image:', fetchErr.message);
            }
        }
        
        console.log(`[Scheduler] Generating content... ${customPrompt ? '(Custom Prompt)' : '(Default Prompt)'}`);
        const content = await generateThreadsContent('threads', imageBase64 || imageUrl, customPrompt);
        
        console.log(`[Scheduler] Posting content... ${imageUrl ? '(With Image)' : '(Text only)'}`);
        await postToPlatforms(content, ['threads'], imageUrl);
    } catch (error) {
        console.error('[Scheduler] Error:', error.message);
    }
}

cron.schedule('* * * * *', async () => {
    // Get time in Asia/Makassar (WITA)
    const nowInMakassar = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Makassar',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(new Date());
    
    console.log(`[Scheduler] Checking time (WITA): ${nowInMakassar}`);
    const now = nowInMakassar;
    try {
        const matches = await sql`SELECT * FROM schedules WHERE time = ${now} AND is_active = 1`;
        console.log(`[Scheduler] Found ${matches.length} active schedules for ${now}`);
        if (matches.length > 0) {
            for (const schedule of matches) {
                console.log(`[Scheduler] Triggering schedule ID: ${schedule.id} at ${now}`);
                await runScheduledTask(schedule);
            }
        }
    } catch (e) {
        console.error('[Scheduler] Cron error:', e.message);
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Threads Automation running at http://localhost:${PORT}`);
});

// Catch-all route for frontend
if (fs.existsSync(join(distPath, 'index.html'))) {
    app.get(/.*/, (req, res) => {
        res.sendFile(join(distPath, 'index.html'));
    });
}
