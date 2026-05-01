import sql from './lib/database.js';

async function auditSchedules() {
  console.log('📊 LAPORAN JADWAL OTOMASI (SEMUA AKUN)\n');
  
  try {
    const accounts = await sql`SELECT id, name, account_type FROM accounts ORDER BY id ASC`;
    
    for (const acc of accounts) {
      console.log(`👤 AKUN: ${acc.name} (ID: ${acc.id}) [Tipe: ${acc.account_type}]`);
      const schedules = await sql`SELECT * FROM schedules WHERE account_id = ${acc.id} ORDER BY time ASC`;
      
      if (schedules.length === 0) {
        console.log('  📭 Tidak ada jadwal.');
      } else {
        schedules.forEach(s => {
          const status = s.is_active === 1 ? '🟢 AKTIF' : '⚪ NON-AKTIF';
          console.log(`  [${s.time}] ${status} | Prompt: ${s.custom_prompt ? (s.custom_prompt.substring(0, 40) + '...') : '(Pake Master Prompt)'}`);
        });
      }
      console.log('--------------------------------------------------');
    }
    
    const globalStatus = await sql`SELECT value FROM settings WHERE key = 'automation_enabled'`;
    console.log(`\n🚨 STATUS MASTER SWITCH: ${globalStatus[0]?.value === 'false' ? '🛑 MATI (SEMUA BERHENTI)' : '🟢 NYALA (SISTEM JALAN)'}`);
    
  } catch (e) {
    console.error('❌ Gagal audit:', e.message);
  } finally {
    process.exit(0);
  }
}

auditSchedules();
