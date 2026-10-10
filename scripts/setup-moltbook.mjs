import sql, { initDb } from '../lib/database.js';
import { getMoltbookAgentStatus } from '../lib/moltbook.js';
import dotenv from 'dotenv';

dotenv.config({ override: true });

async function main() {
  console.log('[Setup-Moltbook] 🦞 Starting Moltbook Agent Setup & Database Seeding...');
  await initDb();
  console.log('[Setup-Moltbook] 📦 Connected to database.');

  // Explicitly ensure tables exist
  await sql`
    CREATE TABLE IF NOT EXISTS moltbook_accounts (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      agent_id VARCHAR(255),
      agent_name VARCHAR(255) UNIQUE,
      api_key TEXT,
      claim_url TEXT,
      verification_code VARCHAR(255),
      is_claimed INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS moltbook_schedules (
      id SERIAL PRIMARY KEY,
      account_id INTEGER REFERENCES moltbook_accounts(id) ON DELETE CASCADE,
      custom_prompt TEXT,
      submolt_name VARCHAR(255) DEFAULT 'builds',
      is_active INTEGER DEFAULT 1,
      last_run_date TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS moltbook_history (
      id SERIAL PRIMARY KEY,
      account_id INTEGER REFERENCES moltbook_accounts(id) ON DELETE CASCADE,
      title TEXT,
      content TEXT,
      submolt VARCHAR(255),
      post_id VARCHAR(255),
      status VARCHAR(50),
      error_message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS moltbook_settings (
      key VARCHAR(255) PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const agentName = process.env.MOLTBOOK_AGENT_NAME || 'khairanecosystemagent';
  const apiKey = process.env.MOLTBOOK_API_KEY || 'moltbook_sk_T6mZa7WLw2hFQkM2We67IdWS6-D_An0A';
  const agentId = process.env.MOLTBOOK_AGENT_ID || '6ccb03cf-288b-456f-8743-b317df2de6f9';
  const claimUrl = process.env.MOLTBOOK_CLAIM_URL || 'https://www.moltbook.com/claim/moltbook_claim_xtUtiaUqomK4DIPelXYHBFme2wFPYyVW';
  const verificationCode = process.env.MOLTBOOK_VERIFICATION_CODE || 'blue-BQ69';

  console.log(`[Setup-Moltbook] Checking live claim status on Moltbook API...`);
  let isClaimed = 0;
  try {
    const statusData = await getMoltbookAgentStatus(apiKey);
    console.log(`[Setup-Moltbook] Moltbook Live Status: "${statusData.status}"`);
    if (statusData.status === 'claimed') {
      isClaimed = 1;
    }
  } catch (err) {
    console.warn(`[Setup-Moltbook] Live status check warning:`, err.message);
  }

  // Insert or update agent account
  const existing = await sql`SELECT id FROM moltbook_accounts WHERE agent_name = ${agentName}`;
  let accountId;

  if (existing.length > 0) {
    accountId = existing[0].id;
    await sql`
      UPDATE moltbook_accounts
      SET api_key = ${apiKey},
          agent_id = ${agentId},
          claim_url = ${claimUrl},
          verification_code = ${verificationCode},
          is_claimed = ${isClaimed},
          is_active = 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${accountId}
    `;
    console.log(`[Setup-Moltbook] Updated existing account ID ${accountId}.`);
  } else {
    const inserted = await sql`
      INSERT INTO moltbook_accounts (name, agent_id, agent_name, api_key, claim_url, verification_code, is_claimed, is_active)
      VALUES (${agentName}, ${agentId}, ${agentName}, ${apiKey}, ${claimUrl}, ${verificationCode}, ${isClaimed}, 1)
      RETURNING id
    `;
    accountId = inserted[0].id;
    console.log(`[Setup-Moltbook] Inserted new account with ID ${accountId}.`);
  }

  // Seed the 5 target website schedules
  const targetWebsites = [
    { key: 'tranvas', submolt: 'builds' },
    { key: 'solvemymedia', submolt: 'builds' },
    { key: 'createmyqr', submolt: 'tooling' },
    { key: 'helpmyimg', submolt: 'builds' },
    { key: 'handlemyfile', submolt: 'tooling' }
  ];

  // Clear previous schedules for this account
  await sql`DELETE FROM moltbook_schedules WHERE account_id = ${accountId}`;

  for (const item of targetWebsites) {
    await sql`
      INSERT INTO moltbook_schedules (account_id, custom_prompt, submolt_name, is_active)
      VALUES (${accountId}, ${item.key}, ${item.submolt}, 1)
    `;
  }
  console.log(`[Setup-Moltbook] Seeded 5 target website schedules for account ID ${accountId}.`);

  // Enable automation in settings
  await sql`
    INSERT INTO moltbook_settings (key, value) VALUES ('moltbook_automation_enabled', 'true')
    ON CONFLICT (key) DO UPDATE SET value = 'true'
  `;

  console.log('\n======================================================');
  console.log('🎉 MOLTBOOK SETUP COMPLETED SUCCESSFULLY!');
  console.log('======================================================');
  console.log(`Agent Name        : ${agentName}`);
  console.log(`Agent ID          : ${agentId}`);
  console.log(`Claim Status      : ${isClaimed === 1 ? '✅ CLAIMED (Active)' : '⚠️ PENDING CLAIM'}`);
  console.log(`Verification Code : ${verificationCode}`);
  console.log(`Claim URL         : ${claimUrl}`);
  console.log('======================================================');
  if (isClaimed === 0) {
    console.log('👉 ACTION REQUIRED TO ACTIVATE POSTING:');
    console.log(`1. Buka browser dan kunjungi: ${claimUrl}`);
    console.log(`2. Masukkan email untuk verifikasi owner bot.`);
    console.log(`3. Tweet kode verifikasi "${verificationCode}" di akun X kamu.`);
    console.log('4. Begitu selesai di-claim, bot akan langsung otomatis memposting 5 website harian!');
  } else {
    console.log('Bot is fully active and ready to post autonomously!');
  }
  console.log('======================================================\n');

  process.exit(0);
}

main().catch(err => {
  console.error('[Setup-Moltbook] ❌ Fatal error:', err);
  process.exit(1);
});
