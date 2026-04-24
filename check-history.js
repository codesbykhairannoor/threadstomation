import sql from './lib/database.js';

async function checkHistory() {
  const rows = await sql`SELECT * FROM post_history ORDER BY created_at DESC LIMIT 5`;
  console.log('Recent History:', rows);
  process.exit(0);
}
checkHistory();
