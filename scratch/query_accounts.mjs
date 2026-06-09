import sql from '../lib/database.js';

async function check() {
  console.log('--- INSTAGRAM ACCOUNTS ---');
  const ig = await sql`SELECT * FROM instagram_accounts`;
  console.log(JSON.stringify(ig, null, 2));

  console.log('--- THREADS ACCOUNTS ---');
  const th = await sql`SELECT * FROM accounts`;
  console.log(JSON.stringify(th, null, 2));
}

check().then(() => process.exit(0));
