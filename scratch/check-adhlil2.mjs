import sql from '../lib/database.js';
async function test() {
  const s = await sql`SELECT id, last_run_date FROM schedules WHERE account_id = 1`;
  console.log(s);
  process.exit();
}
test();
