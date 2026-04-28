import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('WARNING: DATABASE_URL not set. Database operations will fail.');
}

const sql = postgres(connectionString, {
  ssl: 'require',
  connect_timeout: 10,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
});

// Helper for better-sqlite3 compatibility (though we'll refactor most things)
// We'll add a 'prepare' shim if possible, but it's better to refactor.
export const initDb = async () => {
  try {
    console.log('[DB] Initializing PostgreSQL tables...');
    
    // Tokens table
    await sql`
      CREATE TABLE IF NOT EXISTS tokens (
        id SERIAL PRIMARY KEY,
        access_token TEXT,
        refresh_token TEXT,
        expires_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Settings table
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `;

    // Post history table
    await sql`
      CREATE TABLE IF NOT EXISTS post_history (
        id SERIAL PRIMARY KEY,
        content TEXT,
        media_url TEXT,
        status TEXT,
        platform TEXT DEFAULT 'threads',
        threads_id TEXT,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Schedules table
    await sql`
      CREATE TABLE IF NOT EXISTS schedules (
        id SERIAL PRIMARY KEY,
        time TEXT, -- HH:mm format
        custom_prompt TEXT,
        image_url TEXT,
        is_active INTEGER DEFAULT 1
      )
    `;

    // Migration: Add columns if they don't exist
    try {
      await sql`ALTER TABLE schedules ADD COLUMN IF NOT EXISTS custom_prompt TEXT`;
      await sql`ALTER TABLE schedules ADD COLUMN IF NOT EXISTS image_url TEXT`;
    } catch (migErr) {
      console.log('[DB] Migration note:', migErr.message);
    }

    // Seed default schedules if empty
    const schedules = await sql`SELECT COUNT(*) as count FROM schedules`;
    if (parseInt(schedules[0].count) === 0) {
      const times = ['09:00', '14:00', '20:00'];
      for (const time of times) {
        await sql`INSERT INTO schedules (time) VALUES (${time})`;
      }
    }

    // Seed default settings if empty
    const settings = await sql`SELECT COUNT(*) as count FROM settings`;
    if (parseInt(settings[0].count) === 0) {
      await sql`INSERT INTO settings (key, value) VALUES ('prompt', 'Anda adalah asisten cerdas yang membagikan wawasan harian di Threads.\nTopik: Hal-hal pahit tentang dunia, fakta gelap (dark facts), serta tips dan trik untuk menjadi pribadi yang lebih baik.\nBahasa: Indonesia.\nGaya: Singkat, menarik, dan provokatif tapi bermanfaat.\nBatas: Maksimal 450 karakter.\nPENTING: JANGAN gunakan hashtag (#) sama sekali. JANGAN gunakan label seperti "Threads:".')`;
      await sql`INSERT INTO settings (key, value) VALUES ('gemini_api_key', ${process.env.GEMINI_API_KEY || ''})`;
      await sql`INSERT INTO settings (key, value) VALUES ('threads_app_id', ${process.env.THREADS_APP_ID || ''})`;
      await sql`INSERT INTO settings (key, value) VALUES ('threads_app_secret', ${process.env.THREADS_APP_SECRET || ''})`;
    }

    // Seed/Update access token from env
    if (process.env.THREADS_ACCESS_TOKEN) {
      const token = await sql`SELECT id FROM tokens WHERE id = 1`;
      if (token.length > 0) {
        await sql`UPDATE tokens SET access_token = ${process.env.THREADS_ACCESS_TOKEN} WHERE id = 1`;
      } else {
        await sql`INSERT INTO tokens (id, access_token, expires_at) VALUES (1, ${process.env.THREADS_ACCESS_TOKEN}, '2026-04-24 13:00:00')`;
      }
    }

    console.log('[DB] PostgreSQL initialization complete.');
  } catch (error) {
    console.error('[DB] Initialization error:', error.message);
  }
};

export default sql;
