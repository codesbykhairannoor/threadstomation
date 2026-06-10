import sql from '../lib/database.js';
async function run() {
  try { await sql`ALTER TABLE instagram_accounts ADD COLUMN facebook_page_id TEXT`; console.log("Added fb id"); } catch(e) { console.error(e.message); }
  try { await sql`ALTER TABLE instagram_accounts ADD COLUMN crosspost_to_facebook INTEGER DEFAULT 1`; console.log("Added crosspost"); } catch(e) { console.error(e.message); }
  process.exit(0);
}
run();
