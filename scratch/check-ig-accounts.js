import sql from '../lib/database.js';

async function check() {
  try {
    const accounts = await sql`SELECT id, name, instagram_business_id, master_prompt, visual_theme, color_palette, preferred_layout FROM instagram_accounts`;
    console.log('--- INSTAGRAM ACCOUNTS ---');
    console.log(JSON.stringify(accounts, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    process.exit(0);
  }
}
check();
