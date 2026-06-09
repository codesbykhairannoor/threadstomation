import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

async function checkSiliconFlow(key, label) {
  try {
    const res = await fetch('https://api.siliconflow.cn/v1/user/info', {
      headers: { 'Authorization': `Bearer ${key}`, 'Accept': 'application/json' }
    });
    const data = await res.json();
    console.log(`[SiliconFlow ${label}] Status: ${res.status}`);
    console.log(`[SiliconFlow ${label}] Message:`, data.message || data);
  } catch (e) {
    console.error(`[SiliconFlow ${label}] Error:`, e.message);
  }
}

async function checkAlibaba(key) {
  const endpoints = [
    { name: 'Domestic (China)', url: 'https://dashscope.aliyuncs.com/api/v1/models' },
    { name: 'International', url: 'https://dashscope-intl.aliyuncs.com/api/v1/models' }
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      const data = await res.json();
      console.log(`[Alibaba Cloud - ${ep.name}] Status: ${res.status}`);
      if (data.code) {
        console.log(`[Alibaba Cloud - ${ep.name}] Error Code:`, data.code);
      } else {
        console.log(`[Alibaba Cloud - ${ep.name}] SUCCESS! Models available:`, data.data?.length);
      }
    } catch (e) {
      console.error(`[Alibaba Cloud - ${ep.name}] Error:`, e.message);
    }
  }
}

async function checkHuggingFace(key) {
  try {
    const res = await fetch('https://huggingface.co/api/whoami-v2', {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    const data = await res.json();
    console.log(`[Hugging Face] Status: ${res.status}`);
    if (res.ok) {
      console.log(`[Hugging Face] SUCCESS! Logged in as: ${data.name} (${data.type})`);
      console.log(`[Hugging Face] Email Verified:`, data.emailVerified);
    } else {
      console.log(`[Hugging Face] Error:`, data.error || data);
    }
  } catch (e) {
    console.error(`[Hugging Face] Error:`, e.message);
  }
}

async function run() {
  console.log('--- Checking All Image Generation APIs ---\n');
  
  await checkSiliconFlow(process.env.SILICONFLOW_API_KEY, 'Key 1');
  console.log('------------------------------------------');
  await checkSiliconFlow(process.env.SILICONFLOW_API_KEY_2, 'Key 2');
  console.log('------------------------------------------');
  
  await checkAlibaba(process.env.ALIBABA_CLOUD_API_KEY);
  console.log('------------------------------------------');
  
  await checkHuggingFace(process.env.HF_TOKEN);
  console.log('------------------------------------------');
}

run();
