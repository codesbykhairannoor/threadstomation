import sql from './lib/database.js';

async function check() {
  try {
    const accs = await sql`SELECT id, name, instagram_business_id, is_active, created_at FROM instagram_accounts ORDER BY id ASC`;
    console.log(JSON.stringify(accs));
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
check();
