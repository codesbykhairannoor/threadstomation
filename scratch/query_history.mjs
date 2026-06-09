import sql from '../lib/database.js';

async function checkHistory() {
  const history = await sql`SELECT * FROM post_history WHERE platform = 'facebook' LIMIT 10`;
  console.log('Facebook History:', JSON.stringify(history, null, 2));

  const igHistory = await sql`SELECT * FROM instagram_history LIMIT 10`;
  console.log('Instagram History:', JSON.stringify(igHistory, null, 2));
}

checkHistory().then(() => process.exit(0));
