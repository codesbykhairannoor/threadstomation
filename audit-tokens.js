import sql from './lib/database.js';
import axios from 'axios';

async function auditTokens() {
  console.log('🔍 MEMULAI AUDIT TOKEN (Operasi KTP)...');
  
  try {
    const tokens = await sql`SELECT * FROM tokens`;
    
    for (const t of tokens) {
      try {
        console.log(`\nChecking Token ID: ${t.id} (Linked to Account ID: ${t.account_id})...`);
        
        // Cek identitas asli ke Meta
        const res = await axios.get(`https://graph.threads.net/v1.0/me?fields=id,username&access_token=${t.access_token}`);
        const { id: real_threads_id, username: real_username } = res.data;
        
        console.log(`👤 Identitas Asli: ${real_username} (${real_threads_id})`);

        // Cari akun yang cocok di tabel accounts
        const [account] = await sql`SELECT id, name FROM accounts WHERE threads_user_id = ${real_threads_id}`;
        
        if (account) {
          if (account.id !== t.account_id) {
            console.log(`⚠️ SALAH ALAMAT! Token ini harusnya buat Akun ID: ${account.id} (${account.name})`);
            await sql`UPDATE tokens SET account_id = ${account.id} WHERE id = ${t.id}`;
            console.log(`✅ BERHASIL DIPINDAHKAN ke Akun ID: ${account.id}`);
          } else {
            console.log(`✅ SUDAH BENAR. Token ini memang milik ${account.name}`);
          }
        } else {
            console.log(`⚠️ AKUN TIDAK DITEMUKAN. Mendaftarkan akun baru: ${real_username}`);
            const [newAcc] = await sql`
                INSERT INTO accounts (name, threads_user_id) 
                VALUES (${real_username}, ${real_threads_id}) 
                RETURNING id
            `;
            await sql`UPDATE tokens SET account_id = ${newAcc.id} WHERE id = ${t.id}`;
            console.log(`✅ Akun baru terdaftar dengan ID: ${newAcc.id}`);
        }

      } catch (e) {
        console.error(`❌ Gagal audit token ${t.id}:`, e.response?.data?.error?.message || e.message);
      }
    }

    console.log('\n🎉 AUDIT SELESAI. Semua token sudah di rumah yang benar.');
  } catch (err) {
    console.error('❌ Error Fatal Audit:', err.message);
  } finally {
    process.exit(0);
  }
}

auditTokens();
