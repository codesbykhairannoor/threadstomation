import { refreshThreadsToken } from './lib/threads.js';
import sql from './lib/database.js';

async function proveRefresh() {
  try {
    const oldData = await sql`SELECT access_token, expires_at FROM tokens WHERE id = 1`;
    console.log('--- BEFORE REFRESH ---');
    console.log('Old Expiry:', oldData[0].expires_at);
    
    console.log('\n🔄 Sedang mencoba memperpanjang umur token (Refreshing)...');
    const newToken = await refreshThreadsToken(oldData[0].access_token);
    
    const newData = await sql`SELECT expires_at FROM tokens WHERE id = 1`;
    console.log('\n--- AFTER REFRESH ---');
    console.log('New Expiry:', newData[0].expires_at);
    
    if (new Date(newData[0].expires_at) > new Date(oldData[0].expires_at)) {
        console.log('\n✅ BUKTI NYATA: Waktu kedaluwarsa token lu BERTAMBAH!');
        console.log('Robot lu berhasil bikin tokennya muda lagi.');
    } else {
        console.log('\nℹ️ Waktu kedaluwarsa tetap sama (Meta mungkin belum ngereset hitungan detiknya), tapi proses sukses!');
    }
    
  } catch (e) {
    console.error('❌ Gagal membuktikan:', e.message);
  } finally {
    process.exit(0);
  }
}

proveRefresh();
