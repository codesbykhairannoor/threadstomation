import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../data/database.sqlite');

// Ensure data directory exists
import fs from 'fs';
if (!fs.existsSync(join(__dirname, '../data'))) {
    fs.mkdirSync(join(__dirname, '../data'));
}

const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS tokens (
    id INTEGER PRIMARY KEY DEFAULT 1,
    access_token TEXT,
    refresh_token TEXT,
    expires_at DATETIME,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS post_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT,
    media_url TEXT,
    status TEXT,
    platform TEXT DEFAULT 'threads',
    threads_id TEXT,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    time TEXT, -- HH:mm format
    is_active INTEGER DEFAULT 1
  );
`);

// Seed default schedules if empty
const schedules = db.prepare('SELECT COUNT(*) as count FROM schedules').get();
if (schedules.count === 0) {
    const insert = db.prepare('INSERT INTO schedules (time) VALUES (?)');
    ['09:00', '14:00', '20:00'].forEach(time => insert.run(time));
}

// Seed default settings if empty
const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get();
if (settingsCount.count === 0) {
    const insert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    insert.run('prompt', 'Anda adalah asisten cerdas yang membagikan wawasan harian di Threads.\nTopik: Hal-hal pahit tentang dunia, fakta gelap (dark facts), serta tips dan trik untuk menjadi pribadi yang lebih baik.\nBahasa: Indonesia.\nGaya: Singkat, menarik, dan provokatif tapi bermanfaat.\nBatas: Maksimal 450 karakter.\nPENTING: JANGAN gunakan hashtag (#) sama sekali. JANGAN gunakan label seperti "Threads:".');
    insert.run('gemini_api_key', process.env.GEMINI_API_KEY || '');
    insert.run('threads_app_id', process.env.THREADS_APP_ID || '');
    insert.run('threads_app_secret', process.env.THREADS_APP_SECRET || '');
}

// Seed/Update access token from env
if (process.env.THREADS_ACCESS_TOKEN) {
    const tokenExists = db.prepare('SELECT id FROM tokens WHERE id = 1').get();
    if (tokenExists) {
        db.prepare('UPDATE tokens SET access_token = ? WHERE id = 1').run(process.env.THREADS_ACCESS_TOKEN);
    } else {
        db.prepare('INSERT INTO tokens (id, access_token, expires_at) VALUES (1, ?, "2026-04-24 13:00:00")').run(process.env.THREADS_ACCESS_TOKEN);
    }
}

export default db;
