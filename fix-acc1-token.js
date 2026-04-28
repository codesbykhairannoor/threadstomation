import sql from './lib/database.js';

async function fix() {
  const token = 'THAAedHhZAY9O9BYmFhWEhmTDZARR01TemtFZADVpY0VQSXRZAdG92YnJWZAjF2N3NjY3N1ZAmRKekFKTUJCcjNKZATZAJUy1JQTRhTWxhQi1jR1J3LWE4WU93MWM3dzRXcmF6VW5zUmJIaXdnUEd3VzNSLUFhWkhaTlF6NkNQUkJKQTNNbm5YVHZAsZAjMzUjJWaG9uSXdXdWdMaE9DZAXg4aVFiX095b0x6WFcZD';
  
  // Ensure token entry exists for account 1
  const rows = await sql`SELECT id FROM tokens WHERE account_id = 1`;
  if (rows.length > 0) {
    await sql`UPDATE tokens SET access_token = ${token}, expires_at = '2026-06-27' WHERE account_id = 1`;
  } else {
    await sql`INSERT INTO tokens (account_id, access_token, expires_at) VALUES (1, ${token}, '2026-06-27')`;
  }
  
  console.log('✅ Kunci Adhlil.co berhasil dipasang kembali ke Akun 1');
  process.exit(0);
}
fix();
