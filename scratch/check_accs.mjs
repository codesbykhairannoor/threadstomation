import sql from '../lib/database.js';

async function run() {
  const accounts = await sql`SELECT id, name, is_active FROM tiktok_accounts`;
  console.log(accounts);
  process.exit(0);
}
run();
