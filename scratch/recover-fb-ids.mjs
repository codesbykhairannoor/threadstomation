import sql from '../lib/database.js';
import axios from 'axios';

async function fetchPageIds() {
  const accounts = await sql`SELECT id, name, access_token, facebook_page_id FROM instagram_accounts`;
  console.log("Current accounts in DB:", accounts.map(a => ({ id: a.id, name: a.name, fb_page_id: a.facebook_page_id, token_start: a.access_token?.substring(0, 15) })));

  for (const acc of accounts) {
    if (!acc.access_token) continue;
    try {
      // Hit /me with the token. If it's a page token, /me returns the page info!
      const res = await axios.get(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${acc.access_token}`);
      console.log(`[Account ${acc.id}] Token belongs to:`, res.data);
      
      // Update DB automatically so user doesn't have to reconnect!
      if (res.data && res.data.id) {
         await sql`UPDATE instagram_accounts SET facebook_page_id = ${res.data.id} WHERE id = ${acc.id}`;
         console.log(`[Account ${acc.id}] Successfully saved facebook_page_id: ${res.data.id}`);
      }
    } catch (e) {
      console.error(`[Account ${acc.id}] Error fetching /me:`, e.response?.data || e.message);
    }
  }
}

fetchPageIds().then(() => process.exit(0)).catch(console.error);
