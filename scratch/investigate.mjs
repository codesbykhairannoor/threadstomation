import sql from '../lib/database.js';

async function investigate() {
  console.log("=== THREADS POST HISTORY ===");
  const threadsHistory = await sql`SELECT account_id, status, error_message, created_at FROM post_history ORDER BY created_at DESC LIMIT 5`;
  console.log(threadsHistory);

  console.log("\n=== INSTAGRAM POST HISTORY ===");
  const igHistory = await sql`SELECT account_id, status, error_message, created_at FROM instagram_history ORDER BY created_at DESC LIMIT 5`;
  console.log(igHistory);

  console.log("\n=== THREADS SCHEDULES ===");
  const threadsSchedules = await sql`SELECT * FROM schedules`;
  console.log(threadsSchedules);

  console.log("\n=== INSTAGRAM SCHEDULES ===");
  const igSchedules = await sql`SELECT * FROM instagram_schedules`;
  console.log(igSchedules);

  process.exit(0);
}

investigate().catch(console.error);
