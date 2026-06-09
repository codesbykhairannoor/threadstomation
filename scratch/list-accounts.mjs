import sql from '../lib/database.js';

async function listAccounts() {
  const res = await sql`SELECT id, name, master_prompt FROM accounts`;
  console.log(res);
  process.exit(0);
}
listAccounts();
