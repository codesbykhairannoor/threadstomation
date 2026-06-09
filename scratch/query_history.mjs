import sql from '../lib/database.js';

async function run() {
  try {
    const rows = await sql`
      SELECT * FROM instagram_history 
      ORDER BY id DESC 
      LIMIT 3
    `;
    console.log('Instagram History:', JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

run();
