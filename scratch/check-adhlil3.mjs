import sql from '../lib/database.js';
async function test() {
  const h = await sql`SELECT id, created_at, status FROM history WHERE account_id = 1 ORDER BY id DESC LIMIT 5`;
  console.log(h);
  process.exit();
}
test();
