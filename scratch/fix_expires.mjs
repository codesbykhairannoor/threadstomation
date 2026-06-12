import sql from '../lib/database.js';

async function run() {
  try {
    const accounts = await sql`SELECT id, name, expires_at FROM tiktok_accounts`;
    console.log("Accounts before:", accounts);
    
    for (const acc of accounts) {
        // Force the expires_at to a valid ISO string far in the future
        // so it doesn't try to refresh if the token is still actually valid
        const futureDate = new Date(Date.now() + 86400 * 1000).toISOString();
        await sql`UPDATE tiktok_accounts SET expires_at = ${futureDate} WHERE id = ${acc.id}`;
    }
    
    const accountsAfter = await sql`SELECT id, name, expires_at FROM tiktok_accounts`;
    console.log("Accounts after:", accountsAfter);
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
run();
