import sql from './lib/database.js';
async function test() {
  const accounts = await sql`SELECT id, name, expires_at FROM tiktok_accounts`;
  console.log(accounts);
  process.exit(0);
}
test();
