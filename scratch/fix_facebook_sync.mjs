import sql, { initDb } from '../lib/database.js';

async function fix() {
  try {
    await initDb();
    console.log('--- STARTING FACEBOOK SYSTEM FIX ---');
    
    // Ensure columns exist manually just in case
    await sql`ALTER TABLE facebook_accounts ADD COLUMN IF NOT EXISTS master_prompt TEXT`;
    await sql`ALTER TABLE facebook_accounts ADD COLUMN IF NOT EXISTS visual_theme TEXT`;
    await sql`ALTER TABLE facebook_accounts ADD COLUMN IF NOT EXISTS color_palette TEXT`;
    await sql`ALTER TABLE facebook_accounts ADD COLUMN IF NOT EXISTS preferred_layout INTEGER DEFAULT 0`;


    // 1. Ensure settings exist
    await sql`
      INSERT INTO facebook_settings (key, value) 
      VALUES ('automation_enabled', 'true')
      ON CONFLICT (key) DO NOTHING
    `;
    console.log('✅ Facebook settings initialized.');

    // 2. Fetch IG accounts to sync from
    const igAccounts = await sql`SELECT * FROM instagram_accounts`;
    
    for (const ig of igAccounts) {
      console.log(`Processing IG Account: ${ig.name}`);
      
      // Try to find matching FB account
      const fbAccounts = await sql`SELECT * FROM facebook_accounts WHERE name ILIKE ${'%' + ig.name + '%'}`;
      
      if (fbAccounts.length > 0) {
        for (const fb of fbAccounts) {
          console.log(`  -> Syncing Persona to FB: ${fb.name} (ID: ${fb.id})`);
          await sql`
            UPDATE facebook_accounts 
            SET master_prompt = ${ig.master_prompt},
                visual_theme = ${ig.visual_theme},
                color_palette = ${ig.color_palette},
                preferred_layout = ${ig.preferred_layout}
            WHERE id = ${fb.id}
          `;
          
          // Also sync schedules if FB has none
          const fbSch = await sql`SELECT count(*) FROM facebook_schedules WHERE account_id = ${fb.id}`;
          if (parseInt(fbSch[0].count) === 0) {
             const igSch = await sql`SELECT custom_prompt FROM instagram_schedules WHERE account_id = ${ig.id}`;
             for (const s of igSch) {
               await sql`INSERT INTO facebook_schedules (account_id, custom_prompt) VALUES (${fb.id}, ${s.custom_prompt})`;
             }
             console.log(`  -> Synced ${igSch.length} schedules.`);
          }
        }
      } else {
        console.log(`  -> No matching FB account for ${ig.name}. Creating a placeholder...`);
        // We don't have the token yet, but we can create the record so it shows up in UI
        // Actually, better not to create without token as it will fail API calls.
      }
    }

    console.log('--- SYNC COMPLETE ---');

  } catch (e) {
    console.error('❌ Fix failed:', e.message);
  }
  process.exit(0);
}

fix();
