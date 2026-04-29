import { GoogleGenerativeAI } from '@google/generative-ai';
import sql from './database.js';
import dotenv from 'dotenv';

dotenv.config();

// --- ROTATION UTILS ---
async function getAllGeminiKeys() {
  const keys = new Set();

  // 1. Ambil dari Environment Variables (Railway / .env)
  // Kita scan semua yang depannya GEMINI_API_KEY
  Object.keys(process.env).forEach(envKey => {
    if (envKey.startsWith('GEMINI_API_KEY')) {
      keys.add(process.env[envKey]);
    }
  });

  // 2. Ambil dari Database Settings (sebagai cadangan)
  const rows = await sql`SELECT value FROM settings WHERE key LIKE 'gemini_api_key%' ORDER BY key ASC`;
  rows.forEach(r => keys.add(r.value));

  return Array.from(keys).filter(v => !!v && v.length > 5);
}

// --- MAIN CONTENT GENERATOR ---
export async function generateThreadsContent(platform = 'threads', imageData = null, customPromptOverride = null, accountId = 1) {
  const apiKeys = await getAllGeminiKeys();
  if (apiKeys.length === 0) throw new Error('No Gemini API Keys found in Environment or Settings.');

  const globalPromptRow = await sql`SELECT value FROM settings WHERE key = 'prompt'`;
  const accountRow = await sql`SELECT master_prompt FROM accounts WHERE id = ${accountId}`;

  const masterPrompt = accountRow[0]?.master_prompt || globalPromptRow[0]?.value || 'Share a helpful insight.';
  const specificTask = customPromptOverride ? `TODAY'S TOPIC: ${customPromptOverride}` : '';

  const platformPrompt = `
CORE PERSONALITY & STYLE:
${masterPrompt}

CURRENT TASK:
${specificTask || 'Generate a standard high-quality post based on your core personality.'}

STRICT RULES:
- Strictly for THREADS. 
- ABSOLUTE CHARACTER LIMIT: 450 characters.
- ${imageData ? 'IMPORTANT: Analyze the attached image and write a post about it matching your style.' : ''}
- IMPORTANT: DO NOT USE HASHTAGS.
- Output ONLY the final post content.`;

  const modelNames = [
    'gemini-2.5-flash', 
    'gemini-2.0-flash', 
    'gemini-2.0-flash-lite', 
    'gemini-flash-latest', 
    'gemini-pro-latest',
    'gemini-2.5-pro'
  ];

  let lastError = null;

  for (let i = 0; i < apiKeys.length; i++) {
    const apiKey = apiKeys[i];
    const genAI = new GoogleGenerativeAI(apiKey);
    console.log(`[System-Acc:${accountId}] Using Gemini Key #${i + 1} (Source: ${apiKey.startsWith('AIza') ? 'Active' : 'Unknown'})...`);

    for (const modelName of modelNames) {
      try {
        console.log(`[Gemini-Acc:${accountId}] Attempting ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });

        let result;
        if (imageData) {
          let mimeType = imageData.startsWith("data:") ? imageData.split(';')[0].split(':')[1] : "image/jpeg";
          result = await model.generateContent([platformPrompt, { inlineData: { data: imageData.split(',')[1] || imageData, mimeType } }]);
        } else {
          result = await model.generateContent(platformPrompt);
        }

        let text = result.response.text().trim();
        text = text.replace(/^(Threads|Post):/i, '').trim();
        text = text.replace(/#\w+/g, '').replace(/\s+/g, ' ').trim();

        if (text.length <= 500) {
          console.log(`[Gemini-Acc:${accountId}] ✅ Success using Key #${i + 1} with ${modelName}`);
          return text;
        }
      } catch (e) {
        const msg = e.message.toLowerCase();
        console.warn(`[Gemini-Acc:${accountId}] Key #${i + 1} (${modelName}) failed.`);
        lastError = e;
        // Try other models for this key
        continue;
      }
    }
  }

  throw new Error(`All Gemini Keys failed: ${lastError?.message}`);
}

// --- SHOPEE AFFILIATE GENERATOR ---
export async function generateShopeeAffiliatePost(product, accountId = 1) {
  const apiKeys = await getAllGeminiKeys();
  if (apiKeys.length === 0) throw new Error('No Gemini API Keys found.');

  const prompt = `
    You are a professional social media influencer who shares the best product recommendations in Indonesia.
    Your goal is to write an engaging Threads post for this product:
    Title: "${product.title}"
    Price: "${product.price}"
    Link: "${product.shopeeUrl}"
    
    GUIDELINES:
    - Use friendly and casual Indonesian (Bahasa santai tapi sopan).
    - Start with an interesting hook about the product's benefits.
    - Mention the price using "Rp" or "Rupiah".
    - End with a call to action and the link.
    - BE CREATIVE and varied in your delivery.
    
    STRICT RULES:
    - NO HASHTAGS.
    - Max 450 characters total.
    - Link MUST be at the very end.
    - Output ONLY the caption text.
  `;

  let lastError = null;
  const geminiModels = [
    'gemini-2.5-flash', 
    'gemini-2.0-flash', 
    'gemini-2.0-flash-lite', 
    'gemini-flash-latest', 
    'gemini-pro-latest',
    'gemini-2.5-pro'
  ];

  for (let i = 0; i < apiKeys.length; i++) {
    const apiKey = apiKeys[i];
    const genAI = new GoogleGenerativeAI(apiKey);

    for (const modelName of geminiModels) {
      try {
        console.log(`[Gemini-Shopee] Using Key #${i + 1} with ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();
        text = text.replace(/^(Threads|Post|Caption):/i, '').trim();
        
        if (text.length <= 500) {
          console.log(`[Gemini-Shopee] ✅ Success using Key #${i + 1} with ${modelName}`);
          return text;
        }
      } catch (e) {
        const msg = e.message.toLowerCase();
        
        // Skenario 503: Server Google lagi pusing, coba nunggu 2 detik dulu sekali lagi
        if (msg.includes('503') || msg.includes('service unavailable')) {
          console.warn(`[Gemini-Shopee] Model ${modelName} busy (503). Retrying in 2s...`);
          await new Promise(r => setTimeout(r, 2000));
          try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            let text = result.response.text().trim();
            if (text.length <= 500) return text;
          } catch (retryErr) {
            console.warn(`[Gemini-Shopee] Retry for ${modelName} failed.`);
          }
        }

        console.warn(`[Gemini-Shopee] Key #${i + 1} (${modelName}) failed: ${e.message.split('\n')[0]}`);
        lastError = e;
        continue;
      }
    }
  }

  throw new Error(`Shopee generator failed all keys: ${lastError?.message}`);
}
