import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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
    insert.run('prompt', 'You are a helpful assistant sharing daily tech insights on Threads. Keep it short, engaging, and under 450 characters.');
    insert.run('gemini_api_key', '');
    insert.run('threads_app_id', '');
    insert.run('threads_app_secret', '');
}

export default db;
