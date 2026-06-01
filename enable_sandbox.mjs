import sql from './lib/database.js';

async function setSandbox() {
  await sql`
    INSERT INTO tiktok_settings (key, value) VALUES ('tiktok_sandbox_mode', 'true')
    ON CONFLICT (key) DO UPDATE SET value = 'true'
  `;
  console.log('Sandbox mode enabled in DB!');
  process.exit(0);
}

setSandbox();
