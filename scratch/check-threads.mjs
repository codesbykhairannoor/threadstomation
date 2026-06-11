import sql from '../lib/database.js';
async function test() {
  const accs = await sql`SELECT id, name FROM accounts`;
  console.log(accs);
  process.exit();
}
test();
