import sql from '../lib/database.js';

async function run() {
  try {
    const accs = await sql`SELECT * FROM instagram_accounts`;
    console.log('Instagram Accounts:', accs);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

run();
