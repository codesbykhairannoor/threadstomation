import sql from './lib/database.js';
import axios from 'axios';

async function addAccount() {
  const token = 'THAAedHhZAY9O9BYlpmWTd0RWtWWk9vSVBDMV9qLVlnMWtkS1ZA6YXQ2TU9OMXo5LUhHXzJyanhrdXdTN0YzQlVXOEFKanZAha3NUTHE0NEM5WEQtTkZAZAWmpkWE9hZA2JzVUxaRVc2OFNKLWJtY1FGdkdoWnJLb2JuWmcyUmM1cmlKb3hIeWJZARUdUd245VTVRb0tvd0c1RDJkckN0QjZAHZADdWS0lLemQZD';
  
  console.log('📡 Mendaftarkan Akun Baru: ONEFORMIND...');
  
  try {
    // 1. Cek identitas asli ke Meta
    const res = await axios.get(`https://graph.threads.net/v1.0/me?fields=id,username&access_token=${token}`);
    const { id: threads_id, username } = res.data;
    console.log(`👤 Identitas Ditemukan: ${username} (${threads_id})`);

    // 2. Simpan ke tabel accounts
    const [existingAcc] = await sql`SELECT id FROM accounts WHERE threads_user_id = ${threads_id}`;
    let accountId;
    
    if (existingAcc) {
      accountId = existingAcc.id;
      console.log(`♻️ Akun sudah ada di database (ID: ${accountId}), mengupdate token...`);
    } else {
      const [newAcc] = await sql`
        INSERT INTO accounts (name, threads_user_id) 
        VALUES (${username}, ${threads_id}) 
        RETURNING id
      `;
      accountId = newAcc.id;
      console.log(`✅ Akun baru terdaftar dengan ID: ${accountId}`);
    }

    // 3. Simpan Token
    const [existingToken] = await sql`SELECT id FROM tokens WHERE account_id = ${accountId}`;
    if (existingToken) {
      await sql`UPDATE tokens SET access_token = ${token}, expires_at = '2026-06-27' WHERE account_id = ${accountId}`;
    } else {
      await sql`INSERT INTO tokens (account_id, access_token, expires_at) VALUES (${accountId}, ${token}, '2026-06-27')`;
    }

    console.log(`🎉 SUKSES! Akun ${username} siap digunakan.`);
  } catch (e) {
    console.error('❌ GAGAL:', e.response?.data?.error?.message || e.message);
  } finally {
    process.exit(0);
  }
}

addAccount();
