import sql, { initDb } from '../lib/database.js';

const NPUB = 'npub18zahva5xg3j59hh8azaxj88q3vket2ft90yjh392qq2qgadc2e2swudhtk';
const PUBKEY_HEX = '38bb767686446542dee7e8ba691ce08b2d95a92b2bc92bc4aa00140475b85655';

async function main() {
  console.log('[Setup-Nostr] Initializing DB tables...');
  await initDb();

  // 1. Create tables
  await sql`
    CREATE TABLE IF NOT EXISTS nostr_accounts (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      username TEXT NOT NULL,
      npub TEXT NOT NULL UNIQUE,
      pubkey_hex TEXT NOT NULL,
      nsec TEXT,
      relays JSONB DEFAULT '["wss://relay.damus.io","wss://nos.lol","wss://relay.primal.net","wss://relay.snort.social","wss://purplerelay.com"]'::jsonb,
      is_active INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS nostr_schedules (
      id SERIAL PRIMARY KEY,
      account_id INTEGER NOT NULL,
      website_key TEXT NOT NULL,
      website_url TEXT NOT NULL,
      custom_prompt TEXT,
      last_run_date TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS nostr_history (
      id SERIAL PRIMARY KEY,
      account_id INTEGER NOT NULL,
      note_id TEXT,
      content TEXT,
      website_url TEXT,
      relays_broadcasted JSONB,
      status TEXT,
      error_message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS nostr_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    INSERT INTO nostr_settings (key, value)
    VALUES ('nostr_automation_enabled', 'true')
    ON CONFLICT (key) DO UPDATE SET value = 'true'
  `;

  // 2. Upsert Account
  const existingAcc = await sql`SELECT id FROM nostr_accounts WHERE npub = ${NPUB}`;
  let accountId;
  if (existingAcc.length > 0) {
    accountId = existingAcc[0].id;
    const BUNKER_URI = 'bunker://4674bf5e85ed9e256bd2e223b19d968ca5f3b6df87464efc53deb5aa12c54d4d?relay=wss%3A%2F%2Fauth.njump.me';
    await sql`
      UPDATE nostr_accounts
      SET name = 'Adhlil',
          username = 'khaithisran',
          pubkey_hex = ${PUBKEY_HEX},
          nsec = ${BUNKER_URI},
          is_active = 1
      WHERE id = ${accountId}
    `;
    console.log(`[Setup-Nostr] Updated existing account ID ${accountId} with Bunker URI!`);
  } else {
    const inserted = await sql`
      INSERT INTO nostr_accounts (name, username, npub, pubkey_hex, is_active)
      VALUES ('Adhlil', 'khaithisran', ${NPUB}, ${PUBKEY_HEX}, 1)
      RETURNING id
    `;
    accountId = inserted[0].id;
    console.log(`[Setup-Nostr] Inserted new account ID: ${accountId}`);
  }

  // 3. Seed 5 Target Websites for Nostr
  const TARGET_WEBSITES = [
    {
      key: 'tranvas',
      url: 'https://tranvas.com',
      prompt: 'Promote Tranvas (https://tranvas.com) - A fast, local-first unified life OS replacing 7 bloated subscriptions. Focus on sovereign privacy, zero tracking, and clutter-free habit/task execution.'
    },
    {
      key: 'solvemymedia',
      url: 'https://solvemymedia.com',
      prompt: 'Promote SolveMyMedia (https://solvemymedia.com) - In-browser media tools (compress, convert, transcribe, cut) powered by WASM & WebCodecs. 100% private in browser RAM, zero cloud uploads, zero paywalls.'
    },
    {
      key: 'createmyqr',
      url: 'https://createmy-qr.com',
      prompt: 'Promote CreateMy-QR (https://createmy-qr.com) - 37 client-side QR & barcode generators. Expose predatory SaaS holding QR menus hostage with expiring links. 100% free, offline, permanent forever.'
    },
    {
      key: 'helpmyimg',
      url: 'https://helpmyimg.com',
      prompt: 'Promote HelpMyImg (https://helpmyimg.com) - Client-side image suite (compress, crop, convert, bg-strip) running in-browser via WebAssembly. Zero signups, zero server uploads, pure privacy.'
    },
    {
      key: 'handlemyfile',
      url: 'https://handlemyfile.com',
      prompt: 'Promote HandleMyFile (https://handlemyfile.com) - Private client-side PDF & document toolbox (merge, compress, OCR, e-sign). Stop sending confidential contracts to shady cloud servers; process locally in browser.'
    }
  ];

  for (const site of TARGET_WEBSITES) {
    const existingSched = await sql`
      SELECT id FROM nostr_schedules 
      WHERE account_id = ${accountId} AND website_key = ${site.key}
    `;
    if (existingSched.length === 0) {
      await sql`
        INSERT INTO nostr_schedules (account_id, website_key, website_url, custom_prompt, is_active)
        VALUES (${accountId}, ${site.key}, ${site.url}, ${site.prompt}, 1)
      `;
      console.log(`[Setup-Nostr] Added schedule for: ${site.key}`);
    } else {
      console.log(`[Setup-Nostr] Schedule already exists for: ${site.key}`);
    }
  }

  console.log('[Setup-Nostr] Setup completed successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error('[Setup-Nostr] Error:', err);
  process.exit(1);
});
