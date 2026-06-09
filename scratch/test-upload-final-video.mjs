import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import sql from '../lib/database.js';
import axios from 'axios';
import { getInstagramAccessToken } from '../lib/instagram.js';
import FormData from 'form-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

async function uploadToInstagram(videoPath, caption) {
  console.log("[Upload] Preparing upload to Adhlil IG account...");
  const accounts = await sql`SELECT * FROM instagram_accounts`;
  const account = accounts.find(a => a.name.toLowerCase().includes('adhlil'));
  if (!account) throw new Error("Adhlil account not found in DB.");
  
  const accessToken = await getInstagramAccessToken(account.id);
  const igBusinessId = account.instagram_business_id;
  const base = accessToken.startsWith('IG') ? 'https://graph.instagram.com/v21.0' : 'https://graph.facebook.com/v21.0';

  console.log(`[Upload] Uploading video temporarily to tmpfiles.org...`);
  const form = new FormData();
  form.append('file', fs.createReadStream(videoPath));
  
  const uploadRes = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
    headers: form.getHeaders()
  });
  
  const pageUrl = uploadRes.data.data.url;
  const publicVideoUrl = pageUrl.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
  console.log(`[Upload] Video uploaded to tmpfiles: ${publicVideoUrl}`);

  console.log(`[Upload] Creating Reels container in Instagram API...`);
  const containerRes = await axios.post(`${base}/${igBusinessId}/media`, null, {
    params: {
      media_type: 'REELS',
      video_url: publicVideoUrl,
      caption: caption,
      access_token: accessToken,
    },
  });

  const containerId = containerRes.data.id;
  console.log(`[Upload] Container ID: ${containerId}. Waiting for readiness...`);

  for (let attempt = 0; attempt < 25; attempt++) {
    await new Promise(r => setTimeout(r, 4000));
    const statusRes = await axios.get(`${base}/${containerId}`, {
      params: { fields: 'status_code', access_token: accessToken },
    });
    const status = statusRes.data.status_code;
    console.log(`[Upload] IG Status (attempt ${attempt+1}): ${status}`);
    if (status === 'FINISHED') break;
    if (status === 'ERROR') throw new Error('Instagram Container failed processing');
  }

  console.log(`[Upload] Publishing video...`);
  const publishRes = await axios.post(`${base}/${igBusinessId}/media_publish`, null, {
    params: {
      creation_id: containerId,
      access_token: accessToken,
    },
  });

  console.log(`[Upload] Publish success! ID: ${publishRes.data.id}`);
  process.exit(0);
}

const finalVideoPath = path.join(__dirname, 'test-video-final.mp4');
const finalCaption = "Peringatan Hari Akhir ⏳🌍 (Testing Video AI 14 Detik + Voice Over)";

uploadToInstagram(finalVideoPath, finalCaption).catch(e => {
  console.error("Upload error:", e);
  process.exit(1);
});
