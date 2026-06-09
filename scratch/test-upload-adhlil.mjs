import sql from '../lib/database.js';
import axios from 'axios';
import { getInstagramAccessToken } from '../lib/instagram.js';

async function uploadVideoToAdhlil() {
  const accounts = await sql`SELECT * FROM instagram_accounts`;
  let account = accounts.find(a => a.name.toLowerCase().includes('adhlil'));
  if (!account) {
    console.error("Adhlil account not found. Available:", accounts.map(a => a.name));
    process.exit(1);
  }
  
  const accessToken = await getInstagramAccessToken(account.id);
  const igBusinessId = account.instagram_business_id;
  const base = accessToken.startsWith('IG') ? 'https://graph.instagram.com/v21.0' : 'https://graph.facebook.com/v21.0';

  const videoUrl = 'https://dashscope-463f.oss-accelerate.aliyuncs.com/1d/36/20260608/61460676/23585022-metadata_user_f890d183f6cf30bb.mp4?Expires=1780982310&OSSAccessKeyId=LTAI5t6ybWkD6u9sDryNkdo6&Signature=fYy91%2FBDUNW98%2FxalTwySEXxF1U%3D';
  const caption = "Futuristic Islamic City - Testing DashScope Video Generation 🌃🏎️";

  console.log(`[Instagram] Creating Reels container for ${account.name} using base ${base}...`);
  try {
    const containerRes = await axios.post(`${base}/${igBusinessId}/media`, null, {
      params: {
        media_type: 'REELS',
        video_url: videoUrl,
        caption: caption,
        access_token: accessToken,
      },
    });

    const containerId = containerRes.data.id;
    console.log(`[Instagram] Container ID: ${containerId}`);

    console.log(`[Instagram] Waiting for container to be ready...`);
    for (let attempt = 0; attempt < 20; attempt++) {
      await new Promise(r => setTimeout(r, 4000));
      const statusRes = await axios.get(`${base}/${containerId}`, {
        params: {
          fields: 'status_code',
          access_token: accessToken,
        },
      });
      const status = statusRes.data.status_code;
      console.log(`[Instagram] Status (attempt ${attempt+1}): ${status}`);
      if (status === 'FINISHED') break;
      if (status === 'ERROR') throw new Error('Container failed processing');
    }

    console.log(`[Instagram] Publishing video...`);
    const publishRes = await axios.post(`${base}/${igBusinessId}/media_publish`, null, {
      params: {
        creation_id: containerId,
        access_token: accessToken,
      },
    });

    console.log(`[Instagram] Publish success! ID: ${publishRes.data.id}`);
  } catch (e) {
    console.error(`[Instagram] Error:`, e.response?.data?.error || e.message);
  }
  
  process.exit(0);
}

uploadVideoToAdhlil();
