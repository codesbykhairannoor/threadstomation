import { exchangeShortLivedToken } from './lib/threads.js';
import sql from './lib/database.js';

async function updateAndExchange() {
  const shortToken = 'THAAedHhZAY9O9BYmE5UXQ4UHJ2dzJfUFJGVk1aYmp4SmJEQzM3X2JnUlZADWHF5dU9JOTdvYndsSUR1Y2NFZAENiQ2tOMlJnYlg5VFNWTzRTcl9qcmNYaDRUVTM4clN3Nk1QU2ZA4M3BtS0hqN0V6b0tyZAXJOSEVLLWpyU2NJWVZAud1BERkRCM2lFeGgxQjVuNjFVUTFzZA3VpQURDdVN3T1FaaHRTc3EZD';
  
  try {
    console.log('🚀 Menjalankan proses tukar token 2 jam -> 60 hari...');
    
    // First, save it temporarily
    await sql`UPDATE tokens SET access_token = ${shortToken}, updated_at = CURRENT_TIMESTAMP WHERE id = 1`;
    
    // Then exchange it
    const longToken = await exchangeShortLivedToken(shortToken);
    
    console.log('✅ BERHASIL! Token lu sekarang udah jadi Token 60 HARI.');
    console.log('Karakter Awal Token Baru:', longToken.substring(0, 20) + '...');
    
  } catch (e) {
    console.error('❌ GAGAL:', e.message);
    if (e.response?.data) {
        console.error('Error dari Meta:', JSON.stringify(e.response.data, null, 2));
    }
  } finally {
    process.exit(0);
  }
}

updateAndExchange();
