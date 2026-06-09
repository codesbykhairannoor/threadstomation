import fetch from 'node-fetch';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const API_KEY = process.env.ALIBABA_CLOUD_API_KEY;
const URL_BASE = 'https://dashscope-intl.aliyuncs.com/api/v1';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function startVideoGeneration() {
  const endpoint = `${URL_BASE}/services/aigc/video-generation/video-synthesis`;
  
  const payload = {
    model: 'wanx2.1-t2v-turbo', // Common DashScope video model
    input: {
      prompt: 'Cinematic wide shot of a futuristic Islamic city with neon lights and flying cars, night time, cyberpunk style, hyperrealistic, highly detailed.'
    },
    parameters: {
      size: '1280*720'
    }
  };

  console.log(`[DashScope] Starting video generation with prompt: ${payload.input.prompt}`);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'X-DashScope-Async': 'enable',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok || data.code) {
    console.error(`[DashScope] Failed to start task:`, data);
    
    // Try fallback model if wanx2.1-t2v-turbo fails
    console.log('[DashScope] Retrying with model wan2.7-t2v...');
    payload.model = 'wan2.7-t2v';
    const resFallback = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'X-DashScope-Async': 'enable',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const fallbackData = await resFallback.json();
    if (!resFallback.ok || fallbackData.code) {
        console.error(`[DashScope] Fallback failed:`, fallbackData);
        process.exit(1);
    }
    return fallbackData.output.task_id;
  }
  
  return data.output.task_id;
}

async function pollTask(taskId) {
  const endpoint = `${URL_BASE}/tasks/${taskId}`;
  
  while (true) {
    console.log(`[DashScope] Polling task status: ${taskId}...`);
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    const data = await res.json();
    if (data.output.task_status === 'SUCCEEDED') {
      console.log(`[DashScope] Task SUCCEEDED!`);
      console.log(`[DashScope] Usage:`, data.usage);
      return data.output.video_url;
    } else if (data.output.task_status === 'FAILED' || data.output.task_status === 'CANCELED') {
      console.error(`[DashScope] Task failed or canceled:`, data);
      process.exit(1);
    }

    console.log(`[DashScope] Status is ${data.output.task_status}. Waiting 15 seconds...`);
    await delay(15000);
  }
}

async function run() {
  try {
    const taskId = await startVideoGeneration();
    console.log(`[DashScope] Task created. Task ID: ${taskId}`);
    
    const videoUrl = await pollTask(taskId);
    console.log(`[DashScope] Generated Video URL: ${videoUrl}`);
    
    // Download video
    console.log(`[Downloader] Downloading video to scratch directory...`);
    const vidRes = await fetch(videoUrl);
    const buffer = await vidRes.buffer();
    const savePath = path.join(__dirname, 'test-output.mp4');
    fs.writeFileSync(savePath, buffer);
    console.log(`[Downloader] Video saved to ${savePath}`);
    
    console.log(`\n--- ALL DONE ---`);
    console.log(`Next step: We will upload this video using lib/instagram.js to Adhlil.co`);

  } catch (e) {
    console.error('Error during run:', e);
  }
}

run();
