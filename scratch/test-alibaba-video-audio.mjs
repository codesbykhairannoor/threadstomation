import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import ffmpegStatic from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import sql from '../lib/database.js';
import axios from 'axios';
import { getInstagramAccessToken } from '../lib/instagram.js';
import { createClient } from '@supabase/supabase-js';
import * as googleTTS from 'google-tts-api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

ffmpeg.setFfmpegPath(ffmpegStatic);

const DASH_KEY = process.env.ALIBABA_CLOUD_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

async function generateAlibabaVoice(text, outputPath) {
  console.log('[TTS] Trying Alibaba DashScope CosyVoice...');
  try {
    const res = await fetch('https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text2audio/text2audio', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASH_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'cosyvoice-v1',
        input: { text: text },
        parameters: { voice: 'longxiaochun' }
      })
    });
    
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await res.json();
      throw new Error(`Alibaba TTS Error: ${data.message || JSON.stringify(data)}`);
    }

    const buffer = await res.buffer();
    fs.writeFileSync(outputPath, buffer);
    console.log('[TTS] Alibaba voice generated successfully!');
    return true;
  } catch (err) {
    console.error('[TTS] Alibaba TTS failed:', err.message);
    return false;
  }
}

async function generateGoogleVoice(text, outputPath) {
  console.log('[TTS] Falling back to Google TTS...');
  try {
    const url = googleTTS.getAudioUrl(text, {
      lang: 'id',
      slow: false,
      host: 'https://translate.google.com',
    });
    const res = await fetch(url);
    if (!res.ok) throw new Error('Google TTS failed');
    const buffer = await res.buffer();
    fs.writeFileSync(outputPath, buffer);
    console.log('[TTS] Google voice generated successfully!');
  } catch (error) {
    throw new Error(`Google TTS failed: ${error.message}`);
  }
}

async function startVideoGeneration(prompt, duration) {
  const endpoint = `https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis`;
  const payload = {
    model: 'wanx2.1-t2v-turbo',
    input: { prompt: prompt },
    parameters: { size: '1280*720', duration: duration }
  };

  console.log(`[Video] Starting DashScope video generation for ${duration}s...`);
  let res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DASH_KEY}`,
      'X-DashScope-Async': 'enable',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  let data = await res.json();
  if (!res.ok || data.code) {
    console.log(`[Video] Retry with wan2.7-t2v...`);
    payload.model = 'wan2.7-t2v';
    res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASH_KEY}`,
        'X-DashScope-Async': 'enable',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    data = await res.json();
    if (!res.ok || data.code) throw new Error(`Video failed: ${JSON.stringify(data)}`);
  }
  return data.output.task_id;
}

async function pollTask(taskId) {
  const endpoint = `https://dashscope-intl.aliyuncs.com/api/v1/tasks/${taskId}`;
  while (true) {
    const res = await fetch(endpoint, { headers: { 'Authorization': `Bearer ${DASH_KEY}` } });
    const data = await res.json();
    if (data.output.task_status === 'SUCCEEDED') return data.output.video_url;
    if (data.output.task_status === 'FAILED') throw new Error('Task Failed');
    console.log(`[Video] Polling task... Status: ${data.output.task_status}`);
    await new Promise(r => setTimeout(r, 15000));
  }
}

async function uploadToInstagram(videoPath, caption) {
  console.log("[Upload] Preparing upload to Adhlil IG account...");
  const accounts = await sql`SELECT * FROM instagram_accounts`;
  const account = accounts.find(a => a.name.toLowerCase().includes('adhlil'));
  if (!account) throw new Error("Adhlil account not found in DB.");
  
  const accessToken = await getInstagramAccessToken(account.id);
  const igBusinessId = account.instagram_business_id;
  const base = accessToken.startsWith('IG') ? 'https://graph.instagram.com/v21.0' : 'https://graph.facebook.com/v21.0';

  if (!supabase) throw new Error("Supabase is not configured. Cannot host video temporarily.");

  console.log(`[Upload] Uploading video to Supabase Storage...`);
  const fileName = `test-video-${Date.now()}.mp4`;
  const fileBuffer = fs.readFileSync(videoPath);
  
  const { error: uploadError } = await supabase.storage
    .from('media')
    .upload(fileName, fileBuffer, {
      contentType: 'video/mp4',
      upsert: true
    });
  
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage
    .from('media')
    .getPublicUrl(fileName);
    
  const publicVideoUrl = publicUrlData.publicUrl;
  console.log(`[Upload] Video uploaded to Supabase: ${publicVideoUrl}`);

  console.log(`[Upload] Creating Reels container in Instagram API...`);
  const containerRes = await axios.post(`${base}/${igBusinessId}/media`, null, {
    params: {
      media_type: 'REELS',
      video_url: publicVideoUrl,
      caption: caption,
      access_token: accessToken,
    },
  });

  const containerId = containerRes.data.id;
  console.log(`[Upload] Container ID: ${containerId}. Waiting for readiness...`);

  for (let attempt = 0; attempt < 25; attempt++) {
    await new Promise(r => setTimeout(r, 4000));
    const statusRes = await axios.get(`${base}/${containerId}`, {
      params: { fields: 'status_code', access_token: accessToken },
    });
    const status = statusRes.data.status_code;
    console.log(`[Upload] IG Status (attempt ${attempt+1}): ${status}`);
    if (status === 'FINISHED') break;
    if (status === 'ERROR') throw new Error('Instagram Container failed processing');
  }

  console.log(`[Upload] Publishing video...`);
  const publishRes = await axios.post(`${base}/${igBusinessId}/media_publish`, null, {
    params: {
      creation_id: containerId,
      access_token: accessToken,
    },
  });

  console.log(`[Upload] Publish success! ID: ${publishRes.data.id}`);
}

async function run() {
  const scriptText = "Peringatan hari akhir. Waktu terus berjalan, dan kiamat semakin dekat. Bertobatlah sebelum semuanya terlambat.";
  const promptText = "Cinematic wide shot of a futuristic Islamic city under an apocalyptic red sky, meteors falling, cyberpunk style, hyperrealistic.";
  
  const audioPath = path.join(__dirname, 'test-voice.mp3');
  const videoTempPath = path.join(__dirname, 'test-video-silent.mp4');
  const finalVideoPath = path.join(__dirname, 'test-video-final.mp4');

  // 1. Voice
  const alibabaSuccess = await generateAlibabaVoice(scriptText, audioPath);
  if (!alibabaSuccess) {
    await generateGoogleVoice(scriptText, audioPath);
  }

  // 2. Video
  const taskId = await startVideoGeneration(promptText, 14); // 14 seconds
  const videoUrl = await pollTask(taskId);
  console.log(`[Video] Download URL: ${videoUrl}`);
  
  const vidRes = await fetch(videoUrl);
  const vidBuffer = await vidRes.buffer();
  fs.writeFileSync(videoTempPath, vidBuffer);
  console.log(`[Video] Silent video downloaded.`);

  // 3. Mux
  console.log(`[Mux] Merging audio and video with ffmpeg...`);
  await new Promise((resolve, reject) => {
    ffmpeg()
      .input(videoTempPath)
      .input(audioPath)
      .outputOptions(['-c:v copy', '-c:a aac', '-shortest'])
      .save(finalVideoPath)
      .on('end', () => {
        console.log(`[Mux] Muxing finished! File at ${finalVideoPath}`);
        resolve();
      })
      .on('error', (err) => {
        console.error(`[Mux] Error:`, err);
        reject(err);
      });
  });

  // 4. Upload to IG
  const finalCaption = "Peringatan Hari Akhir ⏳🌍 (Testing Video AI 14 Detik + Voice Over Muxing)";
  await uploadToInstagram(finalVideoPath, finalCaption);

  console.log("[Done] All testing steps complete.");
}

run();
