import axios from 'axios';

async function testPollinations() {
  try {
    const W = 1080;
    const H = 1350;
    const cleanPrompt = "Islamic pattern, beautiful mosque, high quality, 4k";
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=${W}&height=${H}`;
    console.log('Fetching:', url);
    
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    console.log('Success! Buffer size:', response.data.length);
  } catch (e) {
    console.error('Error fetching Pollinations:', e.message);
    if (e.response) {
      console.error('Status:', e.response.status);
      console.error('Data:', e.response.data.toString());
    }
  }
}

testPollinations();
