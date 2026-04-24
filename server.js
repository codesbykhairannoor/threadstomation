import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sql, { initDb } from './lib/database.js';
import { generateThreadsContent } from './lib/gemini.js';
import { postToPlatforms } from './lib/threads_service.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize DB on startup
initDb();

const app = express();
app.use(cors());
app.use(express.json());

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
    const settings = await sql`SELECT * FROM settings`;
    const obj = {};
    settings.forEach(s => obj[s.key] = s.value);
    res.json(obj);
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
    const { platforms } = req.body;
    try {
        const content = await generateThreadsContent();
        const results = await postToPlatforms(content, platforms);
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
    await sql`INSERT INTO schedules (time) VALUES (${req.body.time})`;
    res.json({ success: true });
});

app.delete('/api/schedules/:id', async (req, res) => {
    await sql`DELETE FROM schedules WHERE id = ${req.params.id}`;
    res.json({ success: true });
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

async function runScheduledTask() {
    try {
        const content = await generateThreadsContent('threads');
        await postToPlatforms(content, ['threads']);
    } catch (error) {
        console.error('[Scheduler] Error:', error.message);
    }
}

cron.schedule('* * * * *', async () => {
    const d = new Date();
    const now = d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
    console.log(`[Scheduler] Checking time: ${now}`);
    try {
        const matches = await sql`SELECT * FROM schedules WHERE time = ${now} AND is_active = 1`;
        if (matches.length > 0) await runScheduledTask();
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
