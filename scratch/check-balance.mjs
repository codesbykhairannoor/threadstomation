import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

async function checkSiliconFlow(key) {
  try {
    const res = await fetch('https://api.siliconflow.cn/v1/user/info', {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    const data = await res.json();
    console.log('SiliconFlow Info:', data);
  } catch (e) {
    console.error('SiliconFlow Error:', e.message);
  }
}

async function checkSiliconFlowBalance(key) {
  try {
    const res = await fetch('https://api.siliconflow.cn/v1/user/balance', {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    const data = await res.json();
    console.log('SiliconFlow Balance:', data);
  } catch (e) {
    console.error('SiliconFlow Balance Error:', e.message);
  }
}

async function checkAlibaba() {
  // We'll just try to hit a generic endpoint if available, but usually dashscope doesn't have a simple balance API documented. 
  // We'll see if there's any public dashboard API.
  console.log("Alibaba DashScope balance API is generally not publicly exposed without complex signing. I will check the SiliconFlow first.");
}

async function run() {
  console.log('--- SiliconFlow Key 1 ---');
  await checkSiliconFlow(process.env.SILICONFLOW_API_KEY);
  await checkSiliconFlowBalance(process.env.SILICONFLOW_API_KEY);
  
  console.log('\n--- SiliconFlow Key 2 ---');
  await checkSiliconFlow(process.env.SILICONFLOW_API_KEY_2);
  await checkSiliconFlowBalance(process.env.SILICONFLOW_API_KEY_2);

  console.log('\n--- Alibaba Cloud ---');
  await checkAlibaba();
}

run();
