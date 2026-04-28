import sql from './lib/database.js';
import axios from 'axios';
import { exchangeShortLivedToken } from './lib/threads.js';

async function addAccount4() {
  const token = 'THAAedHhZAY9O9BYmI5aWlNX05nV0JCRWZAMam94YVdLMEluaWpvbW9zSU5rY2JoSWNmRmhDakVtdUNGZA05UR1hsZAmFyNTBUdEN5ZAW5kcTVyYXVLZA0NqYWJzRTRsRE9XUUFoZAHkzdDhzWlZAmQlYzZAVhoalFxaThQT3Jnc3R4MmVNU2p4M1FVOGQ4WEtkQnJaUDByRkZAqV1lCbTNjR241Nmx6ek5tTk0ZD';
  
  console.log('📡 Mendaftarkan Akun ke-4: Cari Disini Shop...');
  
  try {
    // 1. Cek identitas
    const res = await axios.get(`https://graph.threads.net/v1.0/me?fields=id,username&access_token=${token}`);
    const { id: threads_id, username } = res.data;
    console.log(`👤 Identitas Ditemukan: ${username} (${threads_id})`);

    // 2. Simpan Akun (dengan label Shopee)
    // Kita perlu tambah kolom account_type dulu kalau belum ada
    try {
        await sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'manual'`;
    } catch(e) {}

    const [existingAcc] = await sql`SELECT id FROM accounts WHERE threads_user_id = ${threads_id}`;
    let accountId;
    
    if (existingAcc) {
      accountId = existingAcc.id;
      await sql`UPDATE accounts SET account_type = 'shopee' WHERE id = ${accountId}`;
      console.log(`♻️ Akun sudah ada (ID: ${accountId}), Diubah ke Mode Shopee.`);
    } else {
      const [newAcc] = await sql`
        INSERT INTO accounts (name, threads_user_id, account_type) 
        VALUES (${username}, ${threads_id}, 'shopee') 
        RETURNING id
      `;
      accountId = newAcc.id;
      console.log(`✅ Akun baru terdaftar dengan ID: ${accountId} (Mode Shopee Aktif)`);
    }

    // 3. Tuker Token
    await exchangeShortLivedToken(token, accountId);

    console.log(`🎉 SUKSES! Akun ${username} siap jualan otomatis.`);
  } catch (e) {
    console.error('❌ GAGAL:', e.response?.data?.error?.message || e.message);
  } finally {
    process.exit(0);
  }
}

addAccount4();
