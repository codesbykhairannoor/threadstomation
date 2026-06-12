import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const connectionString = process.env.DATABASE_URL;
let sql;
if (connectionString) {
  sql = postgres(connectionString, {
    ssl: 'require',
    connect_timeout: 30,
    idle_timeout: 10,
    max_lifetime: 60 * 30,
    max: 3,
    prepare: false,
  });
} else {
  console.warn('WARNING: DATABASE_URL not set. Stubbing database operations.');
  sql = (strings, ...values) => {
    throw new Error('Database is offline: DATABASE_URL environment variable is not configured in Vercel.');
  };
}

let isInitialized = false;
let initPromise = null;

export const initDb = async () => {
  if (isInitialized) return;
  if (initPromise) return initPromise;
  initPromise = _doInit();
  await initPromise;
  initPromise = null;
};

const _doInit = async () => {
  try {
    let isMigrated = false;
    try {
      const check = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'schedules' 
          AND column_name = 'last_run_date'
        )
      `;
      isMigrated = check[0]?.exists || false;
    } catch (e) {
      console.log('[DB] Migration check failed:', e.message);
    }

    // ── TOPIC HISTORY TABLE (for content variation tracking) ──
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS topic_history (
          id SERIAL PRIMARY KEY,
          platform TEXT NOT NULL,
          account_id INTEGER NOT NULL,
          topic TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      // Create index for fast lookups
      await sql`
        CREATE INDEX IF NOT EXISTS idx_topic_history_lookup 
        ON topic_history (platform, account_id, created_at DESC)
      `;
    } catch (topicDbErr) {
      console.log('[DB] Note: topic_history table init note:', topicDbErr.message);
    }

    // ── TIKTOK TABLES ──
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS tiktok_accounts (
          id SERIAL PRIMARY KEY,
          name TEXT,
          tiktok_open_id TEXT UNIQUE,
          access_token TEXT,
          refresh_token TEXT,
          expires_at TIMESTAMP,
          is_active INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS tiktok_schedules (
          id SERIAL PRIMARY KEY,
          account_id INTEGER REFERENCES tiktok_accounts(id) ON DELETE CASCADE,
          custom_prompt TEXT,
          is_active INTEGER DEFAULT 1,
          last_run_date TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS tiktok_history (
          id SERIAL PRIMARY KEY,
          account_id INTEGER REFERENCES tiktok_accounts(id) ON DELETE CASCADE,
          caption TEXT,
          slide_count INTEGER,
          image_urls TEXT,
          publish_id TEXT,
          status TEXT,
          error_message TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS tiktok_settings (
          key TEXT PRIMARY KEY,
          value TEXT
        )
      `;
    } catch (tiktokDbErr) {
      console.log('[DB] Note: TikTok tables init note:', tiktokDbErr.message);
    }

    // ── INSTAGRAM TABLES ──
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS instagram_accounts (
          id SERIAL PRIMARY KEY,
          name TEXT,
          instagram_business_id TEXT UNIQUE,
          facebook_page_id TEXT,
          access_token TEXT,
          expires_at TIMESTAMP,
          is_active INTEGER DEFAULT 1,
          crosspost_to_facebook INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      // Ensure backwards compatibility with existing databases
      try { await sql`ALTER TABLE instagram_accounts ADD COLUMN facebook_page_id TEXT`; } catch (e) {}
      try { await sql`ALTER TABLE instagram_accounts ADD COLUMN crosspost_to_facebook INTEGER DEFAULT 1`; } catch (e) {}
      await sql`
        CREATE TABLE IF NOT EXISTS instagram_schedules (
          id SERIAL PRIMARY KEY,
          account_id INTEGER REFERENCES instagram_accounts(id) ON DELETE CASCADE,
          custom_prompt TEXT,
          is_active INTEGER DEFAULT 1,
          last_run_date TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS instagram_history (
          id SERIAL PRIMARY KEY,
          account_id INTEGER REFERENCES instagram_accounts(id) ON DELETE CASCADE,
          caption TEXT,
          slide_count INTEGER,
          image_urls TEXT,
          creation_id TEXT,
          status TEXT,
          error_message TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS instagram_settings (
          key TEXT PRIMARY KEY,
          value TEXT
        )
      `;
    } catch (instagramDbErr) {
      console.log('[DB] Note: Instagram tables init note:', instagramDbErr.message);
    }

    // ── FACEBOOK TABLES ──
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS facebook_accounts (
          id SERIAL PRIMARY KEY,
          name TEXT,
          facebook_page_id TEXT UNIQUE,
          access_token TEXT,
          expires_at TIMESTAMP,
          is_active INTEGER DEFAULT 1,
          master_prompt TEXT,
          visual_theme TEXT,
          color_palette TEXT,
          preferred_layout INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS facebook_schedules (
          id SERIAL PRIMARY KEY,
          account_id INTEGER REFERENCES facebook_accounts(id) ON DELETE CASCADE,
          custom_prompt TEXT,
          is_active INTEGER DEFAULT 1,
          last_run_date TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS facebook_history (
          id SERIAL PRIMARY KEY,
          account_id INTEGER REFERENCES facebook_accounts(id) ON DELETE CASCADE,
          caption TEXT,
          slide_count INTEGER,
          image_urls TEXT,
          post_id TEXT,
          status TEXT,
          error_message TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS facebook_settings (
          key TEXT PRIMARY KEY,
          value TEXT
        )
      `;
    } catch (facebookDbErr) {
      console.log('[DB] Note: Facebook tables init note:', facebookDbErr.message);
    }

    // ── TUMBLR TABLES ──
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS tumblr_accounts (
          id SERIAL PRIMARY KEY,
          name TEXT,
          blog_name TEXT UNIQUE,
          access_token TEXT,
          refresh_token TEXT,
          expires_at TIMESTAMP,
          is_active INTEGER DEFAULT 1,
          master_prompt TEXT,
          visual_theme TEXT,
          color_palette TEXT,
          preferred_layout INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS tumblr_schedules (
          id SERIAL PRIMARY KEY,
          account_id INTEGER REFERENCES tumblr_accounts(id) ON DELETE CASCADE,
          custom_prompt TEXT,
          is_active INTEGER DEFAULT 1,
          last_run_date TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS tumblr_history (
          id SERIAL PRIMARY KEY,
          account_id INTEGER REFERENCES tumblr_accounts(id) ON DELETE CASCADE,
          caption TEXT,
          slide_count INTEGER,
          image_urls TEXT,
          post_id TEXT,
          status TEXT,
          error_message TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS tumblr_settings (
          key TEXT PRIMARY KEY,
          value TEXT
        )
      `;
    } catch (tumblrDbErr) {
      console.log('[DB] Note: Tumblr tables init note:', tumblrDbErr.message);
    }

    // ── DEV.TO TABLES ──
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS devto_accounts (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          username TEXT NOT NULL,
          api_key TEXT NOT NULL,
          is_active INTEGER DEFAULT 1,
          master_prompt TEXT,
          visual_theme TEXT,
          color_palette JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS devto_schedules (
          id SERIAL PRIMARY KEY,
          account_id INTEGER NOT NULL,
          custom_prompt TEXT,
          last_run_date TEXT,
          is_active INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS devto_history (
          id SERIAL PRIMARY KEY,
          account_id INTEGER NOT NULL,
          caption TEXT,
          slide_count INTEGER,
          image_urls JSONB,
          post_id TEXT,
          status TEXT,
          error_message TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS devto_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
    } catch (e) {
      console.log('[DB] Devto tables init error:', e.message);
    }
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS mastodon_accounts (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255),
          username VARCHAR(255) UNIQUE,
          instance_url VARCHAR(255) DEFAULT 'https://mastodon.social',
          access_token TEXT,
          is_active INTEGER DEFAULT 1,
          master_prompt TEXT,
          visual_theme TEXT,
          color_palette JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS mastodon_schedules (
          id SERIAL PRIMARY KEY,
          account_id INTEGER REFERENCES mastodon_accounts(id) ON DELETE CASCADE,
          custom_prompt TEXT,
          last_run_date VARCHAR(10),
          is_active INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS mastodon_history (
          id SERIAL PRIMARY KEY,
          account_id INTEGER REFERENCES mastodon_accounts(id) ON DELETE CASCADE,
          caption TEXT,
          slide_count INTEGER DEFAULT 0,
          image_urls JSONB,
          post_id VARCHAR(255),
          status VARCHAR(50),
          error_message TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS mastodon_settings (
          key VARCHAR(255) PRIMARY KEY,
          value TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
    } catch (e) {
      console.warn('[DB] Error creating mastodon tables:', e.message);
    }

    // ── BLUESKY TABLES ──
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS bluesky_accounts (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255),
          identifier VARCHAR(255) NOT NULL,
          app_password VARCHAR(255) NOT NULL,
          is_active INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS bluesky_schedules (
          id SERIAL PRIMARY KEY,
          account_id INTEGER REFERENCES bluesky_accounts(id) ON DELETE CASCADE,
          custom_prompt TEXT,
          is_active INTEGER DEFAULT 1,
          last_run_date TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS bluesky_history (
          id SERIAL PRIMARY KEY,
          account_id INTEGER REFERENCES bluesky_accounts(id) ON DELETE CASCADE,
          caption TEXT,
          slide_count INTEGER,
          image_urls TEXT,
          publish_id TEXT,
          status TEXT,
          error_message TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS bluesky_settings (
          key VARCHAR(255) PRIMARY KEY,
          value TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
    } catch (e) {
      console.warn('[DB] Error creating bluesky tables:', e.message);
    }

    if (isMigrated) {
      console.log('[DB] PostgreSQL tables and migrations are already up-to-date.');
      isInitialized = true;
      return;
    }

    console.log('[DB] Initializing PostgreSQL tables...');

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

    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `;

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

    await sql`
      CREATE TABLE IF NOT EXISTS schedules (
        id SERIAL PRIMARY KEY,
        account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
        time TEXT,
        custom_prompt TEXT,
        image_url TEXT,
        is_active INTEGER DEFAULT 1,
        last_run_date TEXT
      )
    `;

    // --- MIGRATIONS ---
    console.log('[DB] Running migrations...');
    try {
      await sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS master_prompt TEXT`;
      await sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'manual'`;
      await sql`ALTER TABLE tokens ADD COLUMN IF NOT EXISTS account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE`;
      await sql`ALTER TABLE post_history ADD COLUMN IF NOT EXISTS account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE`;
      await sql`ALTER TABLE post_history ADD COLUMN IF NOT EXISTS image_url TEXT`;
      await sql`ALTER TABLE schedules ADD COLUMN IF NOT EXISTS account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE`;
      await sql`ALTER TABLE schedules ADD COLUMN IF NOT EXISTS custom_prompt TEXT`;
      await sql`ALTER TABLE schedules ADD COLUMN IF NOT EXISTS image_url TEXT`;
      await sql`ALTER TABLE schedules ADD COLUMN IF NOT EXISTS last_run_date TEXT`;

      // Facebook Account Persona Migrations
      await sql`ALTER TABLE facebook_accounts ADD COLUMN IF NOT EXISTS master_prompt TEXT`;
      await sql`ALTER TABLE facebook_accounts ADD COLUMN IF NOT EXISTS visual_theme TEXT`;
      await sql`ALTER TABLE facebook_accounts ADD COLUMN IF NOT EXISTS color_palette TEXT`;
      await sql`ALTER TABLE facebook_accounts ADD COLUMN IF NOT EXISTS preferred_layout INTEGER DEFAULT 0`;
    } catch (migErr) {
      console.log('[DB] Migration note:', migErr.message);
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
    isInitialized = true;
  } catch (error) {
    console.error('[DB] Initialization error:', error.message);
  }
};

/**
 * Get recent topics from the last N days for a specific platform + account.
 * Returns array of topic strings to inject as "AVOID THESE TOPICS" in prompts.
 */
export async function getRecentTopics(platform, accountId, maxTopics = 30, days = 7) {
  try {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const rows = await sql`
      SELECT DISTINCT topic FROM topic_history 
      WHERE platform = ${platform} 
        AND account_id = ${accountId}
        AND created_at > ${cutoff}
      ORDER BY topic ASC
      LIMIT ${maxTopics}
    `;
    return rows.map(r => r.topic).filter(Boolean);
  } catch (e) {
    console.warn(`[DB] getRecentTopics error for ${platform}/${accountId}:`, e.message);
    return [];
  }
}

/**
 * Save a topic to topic_history to prevent repetition.
 */
export async function saveTopic(platform, accountId, topic) {
  if (!topic || topic.trim().length < 3) return;
  try {
    const cleanTopic = topic.trim().substring(0, 100);
    await sql`
      INSERT INTO topic_history (platform, account_id, topic) 
      VALUES (${platform}, ${accountId}, ${cleanTopic})
    `;
    console.log(`[DB-Topic] Saved topic "${cleanTopic}" for ${platform} acc:${accountId}`);
  } catch (e) {
    // Ignore duplicate topics (same topic posted multiple times is fine to track)
    if (!e.message.includes('duplicate')) {
      console.warn(`[DB] saveTopic error:`, e.message);
    }
  }
}

export async function cleanupOldHistory() {
  try {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

    await sql`DELETE FROM post_history WHERE created_at < ${twoDaysAgo}`;
    await sql`DELETE FROM tiktok_history WHERE created_at < ${twoDaysAgo}`;
    await sql`DELETE FROM instagram_history WHERE created_at < ${twoDaysAgo}`;
    await sql`DELETE FROM facebook_history WHERE created_at < ${twoDaysAgo}`;
    await sql`DELETE FROM tumblr_history WHERE created_at < ${twoDaysAgo}`;
    await sql`DELETE FROM devto_history WHERE created_at < ${twoDaysAgo}`;
    await sql`DELETE FROM mastodon_history WHERE created_at < ${twoDaysAgo}`;
    await sql`DELETE FROM bluesky_history WHERE created_at < ${twoDaysAgo}`;
    await sql`DELETE FROM topic_history WHERE created_at < ${twoDaysAgo}`;

    console.log('[DB-Cleanup] Cleaned up local database history older than 2 days.');
  } catch (e) {
    console.error('[DB-Cleanup] Failed to cleanup history:', e.message);
  }
}

export default sql;