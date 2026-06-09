import sql from '../lib/database.js';

async function main() {
  try {
    const history = await sql`
      SELECT id, account_id, caption, slide_count, image_urls, status, error_message, created_at
      FROM instagram_history
      WHERE account_id = 2
      ORDER BY id DESC
    `;
    console.log(JSON.stringify(history, null, 2));
  } catch (e) {
    console.error('Error fetching history:', e);
  } finally {
    process.exit(0);
  }
}

main();
