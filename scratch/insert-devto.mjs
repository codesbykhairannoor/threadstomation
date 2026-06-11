import sql, { initDb } from '../lib/database.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getDevtoUserInfo } from '../lib/devto.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env'), override: true });

async function insertDevto() {
  await initDb();
  const apiKey = process.env.DEVTO_API_KEY;
  if (!apiKey) throw new Error('No DEVTO_API_KEY found');

  console.log('Fetching Devto User...');
  const user = await getDevtoUserInfo(apiKey);
  console.log('User found:', user.username);

  const existing = await sql`SELECT id FROM devto_accounts WHERE username = ${user.username}`;
  if (existing.length > 0) {
    await sql`UPDATE devto_accounts SET api_key = ${apiKey}, is_active = 1 WHERE username = ${user.username}`;
  } else {
    await sql`
      INSERT INTO devto_accounts (name, username, api_key, is_active)
      VALUES (${user.name || user.username}, ${user.username}, ${apiKey}, 1)
    `;
  }
  console.log('Devto account inserted/updated');
  process.exit(0);
}

insertDevto().catch(e => {
  console.error(e);
  process.exit(1);
});
