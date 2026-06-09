import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

async function checkAlibaba(key) {
  try {
    const res = await fetch('https://dashscope.aliyuncs.com/api/v1/models', {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    const data = await res.json();
    if (data.code) {
      console.log('Alibaba Error:', data);
    } else {
      console.log('Alibaba Key is VALID. Models available:', data.data.length);
    }
  } catch (e) {
    console.error('Alibaba DashScope Error:', e.message);
  }
}

async function run() {
  console.log('--- Alibaba Cloud ---');
  await checkAlibaba(process.env.ALIBABA_CLOUD_API_KEY);
}

run();
