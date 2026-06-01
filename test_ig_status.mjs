import axios from 'axios';

async function checkStatus() {
  console.log('Fetching IG API status...');
  try {
    const res = await axios.get('https://threadstomation.vercel.app/api/instagram/status');
    console.log('Status 200 OK');
  } catch (e) {
    console.error('API Error:', e.message);
  }
}

checkStatus();
