import { exchangeShortLivedToken } from './lib/threads.js';
import sql from './lib/database.js';

async function revitalizeAdhlil() {
  const token = 'THAAedHhZAY9O9BYmIxNTFXSGp3SUpWOHBjcnlnYzNvVksteUc5SzZAGY190d1FFNWZAJV3lKakNGRGFFenAxanktLWgwQjZA0RXhGZAWZApVXk1WjZACOU8yNHBEeXFpcVM3TTk0TThaMHQtM2ZAFczJPV0Q1aFlHTXdJU3hnSHcyM0wxdGx6Y19UWm1WMVNzSWV2YVhlb2JRMHdXaFY2bEt6MV9pSnNfT25zUQZDZD';
  
  console.log('🔄 Menghidupkan Kembali Akun Adhlil.co dengan Token Baru...');
  
  try {
    const longLivedToken = await exchangeShortLivedToken(token, 1);
    console.log(`✅ BERHASIL TOTAL! Akun Adhlil (ID: 1) sudah aktif kembali dengan token 60 hari.`);
  } catch (e) {
    console.error('❌ Gagal revitalisasi:', e.response?.data?.error?.message || e.message);
  } finally {
    process.exit(0);
  }
}

revitalizeAdhlil();
