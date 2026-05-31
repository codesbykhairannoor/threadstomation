import sql, { initDb } from './lib/database.js';
async function run() {
  await initDb();
  await sql`UPDATE instagram_schedules SET last_run_date = NULL`;
  console.log('Reset all instagram schedules');
  process.exit(0);
}
run().catch(console.error);
