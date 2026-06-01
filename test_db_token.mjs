import sql from './lib/database.js';

async function check() {
  const res = await sql`SELECT id, name, expires_at FROM tiktok_accounts`;
  console.log(res);
  process.exit(0);
}

check();
