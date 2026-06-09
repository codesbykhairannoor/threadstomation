import sql from '../lib/database.js';

async function checkTokens() {
  console.log('--- ALL TOKENS ---');
  const tokens = await sql`SELECT * FROM tokens`;
  console.log(JSON.stringify(tokens, null, 2));
}

checkTokens().then(() => process.exit(0));
