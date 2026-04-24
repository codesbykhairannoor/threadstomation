import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import axios from 'axios';
import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import db from './lib/database.js';
import { generateThreadsContent } from './lib/gemini.js';
import { postToPlatforms } from './lib/threads_service.js';
import { refreshThreadsToken } from './lib/threads.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COOKIE_PATH = join(__dirname, 'data/cookies.json');

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(join(__dirname, 'dist')));
}

const PORT = 3000;

app.get('/api/status', async (req, res) => {
    try {
        const schedules = db.prepare("SELECT * FROM schedules").all();
        const lastPost = db.prepare('SELECT * FROM post_history ORDER BY id DESC LIMIT 1').get();
        const cookieExists = fs.existsSync(COOKIE_PATH);
        const threadsToken = db.prepare('SELECT access_token FROM tokens WHERE id = 1').get();
        res.json({ 
            schedules, 
            lastPost, 
            threadsSession: cookieExists, 
            threadsToken: !!threadsToken
        });
    } catch (error) {
        console.error('[Status API Error]:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});



app.get('/api/settings', (req, res) => {
    const settings = db.prepare('SELECT * FROM settings').all();
    const obj = {};
    settings.forEach(s => obj[s.key] = s.value);
    res.json(obj);
});

app.post('/api/settings', (req, res) => {
    const settings = req.body;
    const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    for (const key in settings) {
        upsert.run(key, settings[key]);
    }
    res.json({ success: true });
});





app.post('/api/import-session', (req, res) => {
    try {
        const cookies = typeof req.body.cookies === 'string' ? JSON.parse(req.body.cookies) : req.body.cookies;
        fs.writeFileSync(COOKIE_PATH, JSON.stringify(cookies));
        res.json({ success: true });
    } catch (e) {
        res.status(400).json({ error: 'Invalid JSON' });
    }
});

app.post('/api/post-now', async (req, res) => {
    const { platforms } = req.body;
    try {
        const results = [];
        for (const platform of platforms) {
            if (platform !== 'threads') continue;
            const content = await generateThreadsContent(platform);
            const res = await postToPlatforms(content); // Default is threads
            results.push(...res);
        }
        res.json({ success: true, results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/test-post', async (req, res) => {
    const { platforms } = req.body;
    try {
        const content = `Test post! 🚀 Connected via Socmed Automator.`;
        const results = await postToPlatforms(content, platforms);
        res.json({ success: true, results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/history', (req, res) => {
    try {
        const platform = req.query.platform;
        let history;
        if (platform && platform !== 'all') {
            const stmt = db.prepare('SELECT * FROM post_history WHERE platform = ? ORDER BY created_at DESC LIMIT 15');
            history = stmt.all(platform);
        } else {
            const stmt = db.prepare('SELECT * FROM post_history ORDER BY created_at DESC LIMIT 15');
            history = stmt.all();
        }
        res.json(history || []);
    } catch (error) {
        console.error('[History API Error]:', error.message);
        res.status(500).json({ success: false, error: 'Database error while fetching history' });
    }
});

app.post('/api/schedules', (req, res) => {
    db.prepare('INSERT INTO schedules (time) VALUES (?)').run(req.body.time);
    res.json({ success: true });
});

app.delete('/api/schedules/:id', (req, res) => {
    db.prepare('DELETE FROM schedules WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

async function runScheduledTask() {
    try {
        const content = await generateThreadsContent('threads');
        await postToPlatforms(content, ['threads']);
    } catch (error) {
        console.error('[Scheduler] Error:', error.message);
    }
}

cron.schedule('* * * * *', () => {
    const d = new Date();
    const now = d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
    console.log(`[Scheduler] Checking time: ${now}`);
    const match = db.prepare('SELECT * FROM schedules WHERE time = ? AND is_active = 1').get(now);
    if (match) runScheduledTask();
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Threads Automation running at http://localhost:${PORT}`);
});

// Catch-all route for frontend in production
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        res.sendFile(join(__dirname, 'dist', 'index.html'));
    });
}
