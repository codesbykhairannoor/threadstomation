import { exchangeShortLivedToken } from './lib/threads.js';
import sql from './lib/database.js';

async function updateAndExchange() {
  const shortToken = 'THAAedHhZAY9O9BYmFhWEhmTDZARR01TemtFZADVpY0VQSXRZAdG92YnJWZAjF2N3NjY3N1ZAmRKekFKTUJCcjNKZATZAJUy1JQTRhTWxhQi1jR1J3LWE4WU93MWM3dzRXcmF6VW5zUmJIaXdnUEd3VzNSLUFhWkhaTlF6NkNQUkJKQTNNbm5YVHZAsZAjMzUjJWaG9uSXdXdWdMaE9DZAXg4aVFiX095b0x6WFcZD';
  
  try {
    console.log('🚀 Menjalankan proses tukar token (Final Fix)...');
    
    // First, save it to DB
    await sql`UPDATE tokens SET access_token = ${shortToken}, updated_at = CURRENT_TIMESTAMP WHERE id = 1`;
    
    // Exchange for 60-day token
    const longToken = await exchangeShortLivedToken(shortToken);
    
    console.log('✅ BERHASIL! Token lu sekarang udah jadi 60 HARI lagi.');
    console.log('Masa Berlaku: Hingga Akhir Juni 2026.');
    
  } catch (e) {
    console.error('❌ GAGAL:', e.message);
  } finally {
    process.exit(0);
  }
}

updateAndExchange();
