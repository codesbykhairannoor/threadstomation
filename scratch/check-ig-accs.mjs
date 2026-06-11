import sql from '../lib/database.js';
async function test() {
  const accs = await sql`SELECT id, name FROM instagram_accounts`;
  console.log(accs);
  process.exit();
}
test();
