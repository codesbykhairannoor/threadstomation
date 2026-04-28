import sql from './lib/database.js';

async function check() {
  const accounts = await sql`SELECT * FROM accounts`;
  const tokens = await sql`SELECT * FROM tokens`;
  console.log('Accounts:', JSON.stringify(accounts, null, 2));
  console.log('Tokens:', JSON.stringify(tokens, null, 2));
  process.exit(0);
}
check();
