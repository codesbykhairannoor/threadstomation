import sql from '../lib/database.js';

async function check() {
  const ig = await sql`SELECT * FROM instagram_accounts LIMIT 1`;
  if (ig.length > 0) {
    console.log('Columns in instagram_accounts:', Object.keys(ig[0]));
  } else {
    console.log('No instagram accounts found.');
  }
}

check().then(() => process.exit(0));
