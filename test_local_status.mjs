import axios from 'axios';

async function checkLocalStatus() {
  console.log('Fetching local status on 5173...');
  try {
    const res = await axios.get('http://localhost:5173/api/instagram/status');
    console.log('Status 200 OK');
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error('API Error:', e.message);
  }
}

checkLocalStatus();
