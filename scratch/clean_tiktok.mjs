import sql from '../lib/database.js';

async function run() {
  const accounts = await sql`SELECT id, name, tiktok_open_id FROM tiktok_accounts ORDER BY created_at ASC`;
  console.log("Accounts:", accounts);

  // Keep the first one, delete the rest if they have the same name
  const nameMap = {};
  for (const acc of accounts) {
    if (!nameMap[acc.name]) {
      nameMap[acc.name] = acc;
    } else {
      console.log("Deleting duplicate:", acc);
      await sql`DELETE FROM tiktok_accounts WHERE id = ${acc.id}`;
    }
  }

  process.exit(0);
}
run();
