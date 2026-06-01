import axios from 'axios';

async function checkStatus() {
  console.log('Fetching TikTok API status...');
  try {
    const res = await axios.get('https://threadstomation.vercel.app/api/tiktok/status');
    console.log('Status 200 OK');
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error('API Error:', e.message);
    if (e.response) {
      console.error('Status Code:', e.response.status);
      console.error('Response Data:', e.response.data);
    }
  }
}

checkStatus();
