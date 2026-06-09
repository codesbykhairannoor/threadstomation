import axios from 'axios';
import sql from '../lib/database.js';

async function findPages() {
  const igAccounts = await sql`SELECT name, instagram_business_id, access_token FROM instagram_accounts WHERE name IN ('oneformind', 'Sharesa Space')`;
  
  for (const ig of igAccounts) {
    try {
      console.log(`Checking linked Page for ${ig.name} using its OWN token...`);
      // Most IG tokens in this DB seem to be Page-scoped or have permission
      const res = await axios.get(`https://graph.facebook.com/v19.0/${ig.instagram_business_id}?fields=connected_facebook_page{id,name}&access_token=${ig.access_token}`);
      console.log('Result:', JSON.stringify(res.data, null, 2));
    } catch (e) {
      console.error(`Error for ${ig.name}:`, e.response?.data || e.message);
    }
  }
}

findPages().then(() => process.exit(0));
