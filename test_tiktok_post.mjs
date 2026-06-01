import sql from './lib/database.js';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ override: true });

async function testPost() {
  console.log('Fetching active TikTok account from DB...');
  const accounts = await sql`SELECT id, name, access_token FROM tiktok_accounts WHERE is_active = 1 LIMIT 1`;
  if (!accounts.length) {
    console.log('No active TikTok account found.');
    process.exit(1);
  }
  
  const acc = accounts[0];
  console.log(`Testing post for account: ${acc.name}`);

  const mockImage = 'https://threadstomation.vercel.app/api/tiktok/media?path=tiktok/1779890104246-slide-1.jpg'; // use an existing image
  
  console.log('Sending direct API request to TikTok /v2/post/publish/content/init/ ...');
  
  try {
    const res = await axios.post(
      `https://open.tiktokapis.com/v2/post/publish/content/init/`,
      {
        post_mode: 'DIRECT_POST',
        media_type: 'PHOTO',
        post_info: {
          title: 'Test Debug',
          description: 'Testing TikTok API Error',
          privacy_level: 'SELF_ONLY',
          disable_comment: false,
          auto_add_music: true,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          photo_images: [mockImage],
          photo_cover_index: 0,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${acc.access_token}`,
          'Content-Type': 'application/json; charset=UTF-8',
        }
      }
    );
    console.log('SUCCESS! TikTok accepted the request. Response:');
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error('FAILED! TikTok rejected the request.');
    if (e.response) {
      console.error('Status:', e.response.status);
      console.error('Data:', JSON.stringify(e.response.data, null, 2));
    } else {
      console.error('Error:', e.message);
    }
  }
  process.exit(0);
}

testPost();
