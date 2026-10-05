import sql from '../lib/database.js';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = 'eGJX8DgLX2A2BCG66h3fbXx4';
const USERNAME = 'khaithisran';
const NAME = 'thisran';

async function setup() {
  console.log('--- Setting up DEV.TO Account & Schedules in DB ---');

  // 1. Upsert or update devto_accounts
  const existing = await sql`SELECT * FROM devto_accounts WHERE username = ${USERNAME} OR id = 1`;
  let accountId;

  if (existing.length > 0) {
    accountId = existing[0].id;
    await sql`
      UPDATE devto_accounts SET
        name = ${NAME},
        username = ${USERNAME},
        api_key = ${API_KEY},
        is_active = 1
      WHERE id = ${accountId}
    `;
    console.log(`✅ Updated DEV.TO Account ID ${accountId} (@${USERNAME}) with fresh API Key`);
  } else {
    const inserted = await sql`
      INSERT INTO devto_accounts (name, username, api_key, is_active)
      VALUES (${NAME}, ${USERNAME}, ${API_KEY}, 1)
      RETURNING id
    `;
    accountId = inserted[0].id;
    console.log(`✅ Created DEV.TO Account ID ${accountId} (@${USERNAME})`);
  }

  // 2. Clear old schedules for this account
  await sql`DELETE FROM devto_schedules WHERE account_id = ${accountId}`;

  // 3. Insert 5 high-converting schedules for the 5 web platforms
  const schedules = [
    { target: 'solvemymedia', prompt: 'SolveMyMedia: In-Browser Video Compressor via WebCodecs & WebGPU (No Cloud Limits)' },
    { target: 'handlemyfile', prompt: 'HandleMyFile: Client-Side Document & PDF Workstation via WASM and Web Workers' },
    { target: 'createmyqr', prompt: 'CreateMyQR: 37 Client-Side QR & Barcode Tools via HTML5 Canvas & Reed-Solomon Math' },
    { target: 'solvemymedia', prompt: 'SolveMyMedia: Local Neural AI Speech-to-Text via WebAssembly (Zero Server Uploads)' },
    { target: 'helpmyimg', prompt: 'HelpMyIMG: In-Browser Image Suite & AI Background Removal with Zero Cloud Uploads' },
    { target: 'solvemymedia', prompt: 'SolveMyMedia: Screen & Camera Studio (Private In-Browser Recording)' },
    { target: 'tranvas', prompt: 'Tranvas: Unified Life OS Architecture (Planner, Habits, Finance, Calendar) Built on Next.js' },
    { target: 'solvemymedia', prompt: 'SolveMyMedia: Lossless 0.4s Video Trimmer in Browser RAM' }
  ];

  for (const s of schedules) {
    await sql`
      INSERT INTO devto_schedules (account_id, custom_prompt, is_active)
      VALUES (${accountId}, ${s.prompt}, 1)
    `;
  }
  console.log(`✅ Configured 5 active rotation schedules for Account ID ${accountId}`);

  // 4. Verify settings
  await sql`
    INSERT INTO devto_settings (key, value)
    VALUES ('devto_automation_enabled', 'true')
    ON CONFLICT (key) DO UPDATE SET value = 'true'
  `;
  console.log(`✅ DEV.TO Automation enabled in settings`);

  process.exit(0);
}

setup().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
