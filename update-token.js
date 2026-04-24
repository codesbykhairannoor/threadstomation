import sql from './lib/database.js';

async function updateToken() {
  // Token exactly as provided in the user's last message
  const token = 'THAAedHhZAY9O9BYmJ3Tm5LaUo0ZA0NWTzFoTEpLMTh1WUNDdW42anZAsb05sd18tQ0d3RHpHSzNMTVgxbmY0dWZAIUHhXWHl0bWhEcGdOalJ5Nl9CcWtYNEgwWnVmYzVJWW9nXzNfaG0xRF9wWGxZAV1duVDVPME9tOUw1amtMQVFlYmpJUnhzOXJaNzRreHJRSndleXhjVF8zbVFPa0QzLURkd0FQdGIZD';
  const expiresAt = '2026-06-23'; 
  
  try {
    const result = await sql`
      UPDATE tokens 
      SET access_token = ${token}, expires_at = ${expiresAt}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = 1
      RETURNING *
    `;
    if (result.length > 0) {
        console.log('✅ Token Updated Successfully in DB!');
        console.log('New Token Start:', result[0].access_token.substring(0, 20) + '...');
    } else {
        console.log('❌ Row not found, inserting...');
        await sql`INSERT INTO tokens (id, access_token, expires_at) VALUES (1, ${token}, ${expiresAt})`;
        console.log('✅ Token Inserted Successfully!');
    }
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    process.exit(0);
  }
}
updateToken();
