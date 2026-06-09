import sql from '../lib/database.js';

async function main() {
  try {
    const accounts = await sql`
      SELECT id, name, instagram_business_id, is_active, created_at, 
             master_prompt, visual_theme, color_palette, preferred_layout 
      FROM instagram_accounts
    `;
    console.log(JSON.stringify(accounts, null, 2));
  } catch (e) {
    console.error('Error fetching accounts:', e);
  } finally {
    process.exit(0);
  }
}

main();
