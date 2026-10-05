import sql, { initDb } from '../lib/database.js';

async function main() {
  await initDb();
  console.log('[Setup-Tumblr] Connected to database.');

  const blogName = 'airanfadh';

  const existing = await sql`SELECT id, name, blog_name, is_active FROM tumblr_accounts WHERE blog_name = ${blogName}`;
  let accountId;
  if (existing.length > 0) {
    accountId = existing[0].id;
    await sql`UPDATE tumblr_accounts SET is_active = 1 WHERE id = ${accountId}`;
    console.log(`[Setup-Tumblr] Activated existing account ID ${accountId} (${blogName}).`);
  } else {
    const inserted = await sql`
      INSERT INTO tumblr_accounts (name, blog_name, is_active)
      VALUES (${blogName}, ${blogName}, 1)
      RETURNING id
    `;
    accountId = inserted[0].id;
    console.log(`[Setup-Tumblr] Created new account with ID ${accountId}.`);
  }

  // Deactivate any other test accounts so only airanfadh runs in automation
  await sql`UPDATE tumblr_accounts SET is_active = 0 WHERE id != ${accountId}`;
  console.log(`[Setup-Tumblr] Ensured only account ID ${accountId} (${blogName}) is active.`);

  // Set up 5 schedules for the 5 target websites for airanfadh on Tumblr
  const sites = ['tranvas', 'solvemymedia', 'createmyqr', 'helpmyimg', 'handlemyfile'];

  // Clear old schedules for this account
  await sql`DELETE FROM tumblr_schedules WHERE account_id = ${accountId}`;

  for (const site of sites) {
    await sql`
      INSERT INTO tumblr_schedules (account_id, custom_prompt, is_active)
      VALUES (${accountId}, ${site}, 1)
    `;
  }
  console.log(`[Setup-Tumblr] Created 5 target website schedules for account ID ${accountId} (${blogName}).`);

  const schedules = await sql`SELECT id, custom_prompt, is_active FROM tumblr_schedules WHERE account_id = ${accountId}`;
  console.log('[Setup-Tumblr] Current schedules in DB:', schedules);

  process.exit(0);
}

main().catch(e => {
  console.error('[Setup-Tumblr] Error:', e);
  process.exit(1);
});
