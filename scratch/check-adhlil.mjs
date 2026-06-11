import sql from '../lib/database.js';

async function test() {
  console.log("--- Instagram Accounts ---");
  const accounts = await sql`SELECT id, name, is_active FROM instagram_accounts WHERE name ILIKE '%adhlil%'`;
  console.log(accounts);

  if (accounts.length > 0) {
    const accId = accounts[0].id;
    console.log("\n--- Schedules ---");
    const schedules = await sql`SELECT id, is_active, last_run_date FROM schedules WHERE account_id = ${accId}`;
    console.log(schedules);

    console.log("\n--- History Today ---");
    const history = await sql`SELECT id, status, error_message, created_at FROM instagram_history WHERE account_id = ${accId} ORDER BY created_at DESC LIMIT 5`;
    console.log(history);
  }
  process.exit();
}
test();
