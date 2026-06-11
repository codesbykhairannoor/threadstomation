import sql from '../lib/database.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env'), override: true });

async function insertMastodon() {
  const token = process.env.MASTODON_ACCESS_TOKEN;
  if (!token) throw new Error('No token found');
  
  await sql`
    INSERT INTO mastodon_accounts (name, username, access_token, is_active) 
    VALUES ('Threadstomation', 'threadstomation', ${token}, 1)
    ON CONFLICT (username) DO UPDATE SET access_token = ${token}
  `;
  console.log('Mastodon account inserted');
  process.exit(0);
}

insertMastodon().catch(console.error);
