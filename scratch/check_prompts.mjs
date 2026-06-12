import sql from '../lib/database.js';

async function run() {
  const accounts = await sql`SELECT id, name FROM accounts`; // Threads accounts
  console.log("Threads Accounts:", accounts);
  
  const tt_accounts = await sql`SELECT id, name FROM tiktok_accounts`;
  console.log("TikTok Accounts:", tt_accounts);

  const threads_master = await sql`SELECT value FROM settings WHERE key = 'threads_master_prompt'`;
  console.log('Threads Master:', threads_master[0]?.value);

  const tt_schedules = await sql`SELECT * FROM tiktok_schedules`;
  console.log('TT Schedules:', tt_schedules);

  const tt_master = await sql`SELECT value FROM tiktok_settings WHERE key = 'tiktok_master_prompt'`;
  console.log('TT Master:', tt_master[0]?.value);

  process.exit(0);
}
run();
