import sql from './lib/database.js';

async function checkToken() {
  try {
    const rows = await sql`SELECT id, access_token, expires_at FROM tokens WHERE id = 1`;
    if (rows.length > 0) {
      console.log('--- Current Token in DB ---');
      console.log('ID:', rows[0].id);
      console.log('Token (start):', rows[0].access_token.substring(0, 20) + '...');
      console.log('Expires At:', rows[0].expires_at);
    } else {
      console.log('❌ No token found in DB for ID 1');
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    process.exit(0);
  }
}
checkToken();
