import sql from './lib/database.js';

async function fixOrphanedData() {
  console.log('🩹 Menjalankan Operasi Penyelamatan Data...');
  
  try {
    // 1. Pastikan ada minimal 1 akun
    const accounts = await sql`SELECT id FROM accounts ORDER BY id ASC LIMIT 1`;
    if (accounts.length === 0) {
      console.log('⚠️ Tidak ada akun ditemukan. Tidak bisa menyelamatkan data.');
      return;
    }
    const mainAccountId = accounts[0].id;
    console.log(`🏠 Menggunakan Akun ID: ${mainAccountId} sebagai rumah utama.`);

    // 2. Link Schedules yang account_id-nya NULL
    const sFix = await sql`UPDATE schedules SET account_id = ${mainAccountId} WHERE account_id IS NULL`;
    console.log(`✅ Berhasil menyelamatkan ${sFix.count} jadwal lama.`);

    // 3. Link Post History yang account_id-nya NULL
    const hFix = await sql`UPDATE post_history SET account_id = ${mainAccountId} WHERE account_id IS NULL`;
    console.log(`✅ Berhasil menyelamatkan ${hFix.count} histori lama.`);

    // 4. Link Tokens yang account_id-nya NULL
    const tFix = await sql`UPDATE tokens SET account_id = ${mainAccountId} WHERE account_id IS NULL`;
    console.log(`✅ Berhasil menyelamatkan ${tFix.count} token lama.`);

    console.log('🎉 SEMUA DATA BERHASIL DISELAMATKAN!');
  } catch (e) {
    console.error('❌ Gagal menyelamatkan data:', e.message);
  } finally {
    process.exit(0);
  }
}

fixOrphanedData();
