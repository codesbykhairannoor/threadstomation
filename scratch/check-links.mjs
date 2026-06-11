import sql from '../lib/database.js';

async function check() {
  const rows = await sql`SELECT custom_prompt FROM schedules WHERE account_id = 7 LIMIT 5`;
  console.log(rows);
  process.exit(0);
}
check();
