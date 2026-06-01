import axios from 'axios';
import fs from 'fs';

async function testProxy() {
  const prompt = "A vast desolate plain under an intensely close sun, depicting Padang Mahsyar.";
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1080&height=1350`;
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(pollinationsUrl)}`;
  
  console.log('Fetching from proxy:', proxyUrl);
  try {
    const res = await axios.get(proxyUrl, { responseType: 'arraybuffer' });
    console.log('Success! Buffer size:', res.data.length);
    fs.writeFileSync('test_proxy2.jpg', res.data);
  } catch (e) {
    console.error('Proxy failed:', e.message);
    if (e.response) {
      console.error('Status:', e.response.status);
    }
  }
}

testProxy();
