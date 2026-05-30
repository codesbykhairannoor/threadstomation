import sql, { initDb } from './lib/database.js';
async function run() {
  await initDb();
  const tokenRow = await sql`SELECT access_token, expires_at FROM instagram_accounts WHERE id = 1`;
  const token = tokenRow[0];
  console.log("Token row:", token);
  const isTokenValid = !!(token?.access_token && (!token.expires_at || new Date(token.expires_at) > new Date()));
  console.log("isTokenValid:", isTokenValid);
  process.exit(0);
}
run().catch(console.error);
