import sql, { initDb } from '../lib/database.js';

async function main() {
  await initDb();
  console.log('[Setup-Mastodon] Connected to database.');

  const username = process.env.MASTODON_USERNAME || process.argv[3] || 'khaithisran';
  const token = process.env.MASTODON_ACCESS_TOKEN || process.argv[2];
  const instanceUrl = process.env.MASTODON_INSTANCE_URL || 'https://mastodon.social';

  if (!token) {
    console.error('Error: Please provide MASTODON_ACCESS_TOKEN env or pass it as first argument');
    process.exit(1);
  }

  const existing = await sql`SELECT id FROM mastodon_accounts WHERE username = ${username}`;
  let accountId;
  if (existing.length > 0) {
    accountId = existing[0].id;
    await sql`
      UPDATE mastodon_accounts 
      SET access_token = ${token}, instance_url = ${instanceUrl}, is_active = 1 
      WHERE id = ${accountId}
    `;
    console.log(`[Setup-Mastodon] Updated existing account ID ${accountId}.`);
  } else {
    const inserted = await sql`
      INSERT INTO mastodon_accounts (name, username, instance_url, access_token, is_active)
      VALUES (${username}, ${username}, ${instanceUrl}, ${token}, 1)
      RETURNING id
    `;
    accountId = inserted[0].id;
    console.log(`[Setup-Mastodon] Inserted new account with ID ${accountId}.`);
  }

  // Set up 5 schedules for the 5 target websites for khaithisran on Mastodon
  const sites = ['tranvas', 'solvemymedia', 'createmyqr', 'helpmyimg', 'handlemyfile'];
  
  // Clear any old schedules for this account
  await sql`DELETE FROM mastodon_schedules WHERE account_id = ${accountId}`;

  for (const site of sites) {
    await sql`
      INSERT INTO mastodon_schedules (account_id, custom_prompt, is_active)
      VALUES (${accountId}, ${site}, 1)
    `;
  }
  console.log(`[Setup-Mastodon] Created 5 target website schedules for account ID ${accountId}.`);

  const schedules = await sql`SELECT id, custom_prompt FROM mastodon_schedules WHERE account_id = ${accountId}`;
  console.log('[Setup-Mastodon] Current schedules:', schedules);

  process.exit(0);
}

main().catch(e => {
  console.error('[Setup-Mastodon] Error:', e);
  process.exit(1);
});
