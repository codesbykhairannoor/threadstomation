import sql from '../lib/database.js';

async function check() {
  const row = await sql`SELECT * FROM instagram_accounts WHERE name = 'caridisinishop'`;
  console.log(row[0]);
  process.exit(0);
}
check();
