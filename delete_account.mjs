import sql from './lib/database.js';
async function test() {
  await sql`DELETE FROM tiktok_accounts WHERE id = 1`;
  console.log("Deleted old account id 1");
  process.exit(0);
}
test();
