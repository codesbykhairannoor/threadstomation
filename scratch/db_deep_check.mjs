import sql from '../lib/database.js';

async function check() {
  try {
    const ig = await sql`SELECT * FROM instagram_accounts`;
    const fb = await sql`SELECT * FROM facebook_accounts`;
    const st = await sql`SELECT * FROM facebook_settings`;
    const tk = await sql`SELECT * FROM tokens`;
    
    console.log('--- INSTAGRAM ACCOUNTS ---');
    console.log(JSON.stringify(ig, null, 2));
    
    console.log('--- FACEBOOK ACCOUNTS ---');
    console.log(JSON.stringify(fb, null, 2));
    
    console.log('--- FACEBOOK SETTINGS ---');
    console.log(JSON.stringify(st, null, 2));

    console.log('--- LEGACY TOKENS ---');
    console.log(JSON.stringify(tk, null, 2));

  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
check();
