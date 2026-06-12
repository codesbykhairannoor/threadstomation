import sql from '../lib/database.js';

async function run() {
  const s = await sql`SELECT * FROM tiktok_schedules`;
  console.log("Schedules:", s);
  
  // Update schedules to point to id 6
  await sql`UPDATE tiktok_schedules SET account_id = 6 WHERE account_id = 3`;
  
  // Delete account 3
  await sql`DELETE FROM tiktok_accounts WHERE id = 3`;
  
  console.log("Deleted account 3 and moved schedules to account 6.");
  process.exit(0);
}
run();
