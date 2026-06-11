import sql from '../lib/database.js';
import { postFacebookSingleImage } from '../lib/instagram.js';

async function testOneformind() {
  console.log("Checking Oneformind account from DB...");
  const rows = await sql`SELECT * FROM instagram_accounts WHERE name ILIKE '%oneformind%'`;
  if (!rows.length) {
    console.log("Oneformind account not found in DB.");
    process.exit(1);
  }
  
  const acc = rows[0];
  console.log(`ID: ${acc.id}, Facebook Page ID: ${acc.facebook_page_id}, Token Starts With: ${acc.facebook_access_token?.slice(0, 15)}...`);
  
  const imageUrl = 'https://images.unsplash.com/photo-1707343843437-caacff5cfa74';
  
  try {
    console.log('Testing FB upload for Oneformind...');
    const res = await postFacebookSingleImage(imageUrl, 'Test Post from Threadstomation!🚀', acc.facebook_page_id, acc.facebook_access_token);
    console.log('✅ Result:', res);
  } catch(e) {
    console.log('❌ Failed:', e.response?.data?.error || e.message);
  }
  process.exit(0);
}

testOneformind();
