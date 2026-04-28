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

export const initDb = async () => {
  try {
    console.log('[DB] Initializing PostgreSQL tables (Multi-Account Edition)...');
    
    // 1. Accounts table
    await sql`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        name TEXT,
        threads_user_id TEXT UNIQUE,
        master_prompt TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 2. Tokens table
    await sql`
      CREATE TABLE IF NOT EXISTS tokens (
        id SERIAL PRIMARY KEY,
        account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
        access_token TEXT,
        refresh_token TEXT,
        expires_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 3. Settings table
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `;

    // 4. Post history table
    await sql`
      CREATE TABLE IF NOT EXISTS post_history (
        id SERIAL PRIMARY KEY,
        account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
        content TEXT,
        media_url TEXT,
        status TEXT,
        platform TEXT DEFAULT 'threads',
        threads_id TEXT,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 5. Schedules table
    await sql`
      CREATE TABLE IF NOT EXISTS schedules (
        id SERIAL PRIMARY KEY,
        account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
        time TEXT, -- HH:mm format
        custom_prompt TEXT,
        image_url TEXT,
        is_active INTEGER DEFAULT 1
      )
    `;

    // --- MIGRATIONS ---
    console.log('[DB] Running migrations...');
    try {
        await sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS master_prompt TEXT`;
        await sql`ALTER TABLE tokens ADD COLUMN IF NOT EXISTS account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE`;
        await sql`ALTER TABLE post_history ADD COLUMN IF NOT EXISTS account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE`;
        await sql`ALTER TABLE schedules ADD COLUMN IF NOT EXISTS account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE`;
        await sql`ALTER TABLE schedules ADD COLUMN IF NOT EXISTS custom_prompt TEXT`;
        await sql`ALTER TABLE schedules ADD COLUMN IF NOT EXISTS image_url TEXT`;
    } catch (migErr) {
        console.log('[DB] Migration note (already up to date):', migErr.message);
    }

    // --- AUTO-RESCUE ORPHANED DATA ---
    const mainAccount = await sql`SELECT id FROM accounts ORDER BY id ASC LIMIT 1`;
    if (mainAccount.length > 0) {
        const aid = mainAccount[0].id;
        await sql`UPDATE schedules SET account_id = ${aid} WHERE account_id IS NULL`;
        await sql`UPDATE tokens SET account_id = ${aid} WHERE account_id IS NULL`;
        await sql`UPDATE post_history SET account_id = ${aid} WHERE account_id IS NULL`;
    }

    // Seed default settings if empty
    const settingsCount = await sql`SELECT COUNT(*) as count FROM settings`;
    if (parseInt(settingsCount[0].count) === 0) {
      await sql`INSERT INTO settings (key, value) VALUES ('prompt', 'Anda adalah asisten cerdas yang membagikan wawasan harian di Threads.\nTopik: Hal-hal pahit tentang dunia, fakta gelap (dark facts), serta tips dan trik untuk menjadi pribadi yang lebih baik.\nBahasa: Indonesia.\nGaya: Singkat, menarik, dan provokatif tapi bermanfaat.\nBatas: Maksimal 450 karakter.\nPENTING: JANGAN gunakan hashtag (#) sama sekali. JANGAN gunakan label seperti "Threads:".')`;
      await sql`INSERT INTO settings (key, value) VALUES ('gemini_api_key', ${process.env.GEMINI_API_KEY || ''})`;
      await sql`INSERT INTO settings (key, value) VALUES ('threads_app_id', ${process.env.THREADS_APP_ID || ''})`;
      await sql`INSERT INTO settings (key, value) VALUES ('threads_app_secret', ${process.env.THREADS_APP_SECRET || ''})`;
    }

    console.log('[DB] PostgreSQL initialization complete.');
  } catch (error) {
    console.error('[DB] Initialization error:', error.message);
  }
};

export default sql;
