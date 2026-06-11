import axios from 'axios';

async function testStatus() {
  try {
    const res = await axios.get('http://localhost:3000/api/instagram/status?accountId=4');
    console.log("IG Status for caridisinishop:", res.data);
  } catch(e) {
    console.log("Error:", e.message);
  }
}
testStatus();
