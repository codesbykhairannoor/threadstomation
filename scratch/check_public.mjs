import axios from 'axios';

const igIds = ['27238273945782775', '27661348450149277'];

async function checkPublic() {
  for (const id of igIds) {
    try {
      console.log(`Checking ${id} publicly...`);
      const res = await axios.get(`https://graph.facebook.com/v19.0/${id}`);
      console.log('Result:', JSON.stringify(res.data, null, 2));
    } catch (e) {
      console.log(`${id} is private/not found without token`);
    }
  }
}

checkPublic();
