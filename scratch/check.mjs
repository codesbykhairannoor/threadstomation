import sql from '../lib/database.js';
async function run() {
  const accounts = await sql`SELECT * FROM instagram_accounts`;
  console.log(accounts);
  process.exit(0);
}
run();
