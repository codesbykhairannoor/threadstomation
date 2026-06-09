import sql from '../lib/database.js';

async function sync() {
  try {
    const igAccounts = await sql`SELECT * FROM instagram_accounts`;
    console.log(`Found ${igAccounts.length} Instagram accounts.`);

    for (const ig of igAccounts) {
      console.log(`- Account: ${ig.name}`);
      console.log(`  Master Prompt: ${ig.master_prompt ? 'YES' : 'NO'}`);
      console.log(`  Visual Theme: ${ig.visual_theme ? 'YES' : 'NO'}`);
      console.log(`  Color Palette: ${ig.color_palette ? 'YES' : 'NO'}`);
      console.log(`  Layout: ${ig.preferred_layout}`);

      // Try to find matching Facebook account by name
      const fbAccounts = await sql`SELECT id FROM facebook_accounts WHERE name = ${ig.name} OR name LIKE ${'%' + ig.name + '%'}`;
      
      if (fbAccounts.length > 0) {
        console.log(`  -> Syncing to FB account ID: ${fbAccounts[0].id}`);
        await sql`
          UPDATE facebook_accounts 
          SET master_prompt = ${ig.master_prompt},
              visual_theme = ${ig.visual_theme},
              color_palette = ${ig.color_palette},
              preferred_layout = ${ig.preferred_layout}
          WHERE id = ${fbAccounts[0].id}
        `;
      } else {
        console.log(`  -> No matching FB account found for "${ig.name}"`);
      }
    }
  } catch (e) {
    console.error('Sync error:', e.message);
  }
  process.exit(0);
}

sync();
