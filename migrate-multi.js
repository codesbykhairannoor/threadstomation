import sql from './lib/database.js';
import axios from 'axios';

async function migrateToMultiAccount() {
  console.log('🚀 Memulai Migrasi Arsitektur Multi-Account...');

  try {
    // 1. Buat Tabel Accounts
    await sql`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        name TEXT,
        threads_user_id TEXT UNIQUE,
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 2. Modifikasi Tabel Tokens (tambah account_id)
    try {
      await sql`ALTER TABLE tokens ADD COLUMN account_id INTEGER REFERENCES accounts(id)`;
    } catch (e) {
      console.log('Column account_id might already exist in tokens.');
    }

    // 3. Modifikasi Tabel Schedules (tambah account_id)
    try {
      await sql`ALTER TABLE schedules ADD COLUMN account_id INTEGER REFERENCES accounts(id)`;
    } catch (e) {
      console.log('Column account_id might already exist in schedules.');
    }

    // 4. Modifikasi Tabel Post History (tambah account_id)
    try {
      await sql`ALTER TABLE post_history ADD COLUMN account_id INTEGER REFERENCES accounts(id)`;
    } catch (e) {
      console.log('Column account_id might already exist in post_history.');
    }

    console.log('✅ Struktur Database Baru Siap.');
  } catch (err) {
    console.error('❌ Gagal migrasi struktur:', err.message);
  }
}

async function registerAccount(token, name) {
    try {
        console.log(`\n🔍 Mendaftarkan Akun: ${name}...`);
        
        // Fetch User ID from Meta
        const res = await axios.get(`https://graph.threads.net/v1.0/me?fields=id,username&access_token=${token}`);
        const { id: threads_id, username } = res.data;
        
        // Insert into accounts
        const [account] = await sql`
            INSERT INTO accounts (name, threads_user_id)
            VALUES (${name || username}, ${threads_id})
            ON CONFLICT (threads_user_id) DO UPDATE SET name = EXCLUDED.name
            RETURNING id
        `;
        
        // Update Token mapping
        await sql`
            UPDATE tokens 
            SET account_id = ${account.id} 
            WHERE access_token = ${token}
        `;
        
        // If it's a new token not in DB yet
        const checkToken = await sql`SELECT id FROM tokens WHERE access_token = ${token}`;
        if (checkToken.length === 0) {
            await sql`INSERT INTO tokens (account_id, access_token) VALUES (${account.id}, ${token})`;
        }

        console.log(`✅ Akun ${name} (${username}) Berhasil Terdaftar (ID: ${account.id})`);
        return account.id;
    } catch (e) {
        console.error(`❌ Gagal daftar akun ${name}:`, e.response?.data || e.message);
    }
}

async function main() {
    await migrateToMultiAccount();
    
    // Akun 1 (Existing)
    const oldToken = await sql`SELECT access_token FROM tokens WHERE id = 1`;
    if (oldToken.length > 0) {
        await registerAccount(oldToken[0].access_token, 'Akun Utama');
    }

    // Akun 2 (Jasa Web)
    const newToken = 'THAAedHhZAY9O9BYmIwQWp6OGViSlNIZAGZApckh4bkJHUk1uLThtaGRCdE9JMDBYQllqMEttYV9XdTRUNG9XXzJKQjdVdTVXQ25rN3FJenAxV181Um1GQzZArOTJoUnBtY2J6N052NllDTGM2cHEwcXNXajNyZAmRiSm1rb1FjN2NuN3dxM0w5TVZAENk50RGRraXN2WU5XN1ZAHdmEydlpGalp1WGZAwT2sZD';
    await registerAccount(newToken, 'Jasa Web');
    
    process.exit(0);
}

main();
