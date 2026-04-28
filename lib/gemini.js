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

  const modelNames = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-pro', 'gemini-pro'];

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
        console.warn(`[Gemini-Acc:${accountId}] Model ${modelName} failed.`);
        lastError = e;

        if (msg.includes('quota') || msg.includes('429')) {
          console.warn(`[System-Acc:${accountId}] 🚨 Key #${i + 1} hit quota limit. Switching to next key...`);
          break;
        }
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
    You are a high-conversion social media influencer on Threads known for finding the best "racun Shopee".
    Your goal is to make people stop scrolling and want to buy this product:
    Title: "${product.title}"
    Price: "${product.price}"
    Link: "${product.shopeeUrl}"
    
    CREATIVITY GUIDELINES:
    - BE VARIED: Don't always start the same way. Use different angles: "Aesthetic finds", "Problem-solver", "Budget-friendly", or "Must-have trends".
    - STORYTELLING: Start with a relatable problem or a "wow" moment. (e.g., "Gak nyangka harganya cuma...", "Buat kalian yang males ribet...", "Auto ganteng/cantik pake ini...").
    - TONE: Super casual, enthusiastic, like talking to a best friend. Use a few relevant emojis (but don't overdo it).
    - PRICE: Mandatory mention of "Rp" or "Rupiah".
    
    STRICT RULES:
    - NO HASHTAGS.
    - Max 450 characters total.
    - Link MUST be at the very end on its own line.
    - Output ONLY the final creative caption. No labels.
  `;

  let lastError = null;
  const geminiModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-pro'];

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
        if (text.length <= 500) return text;
      } catch (e) {
        const msg = e.message.toLowerCase();
        lastError = e;
        if (msg.includes('quota') || msg.includes('429')) break;
      }
    }
  }
  throw new Error(`Shopee generator failed all keys.`);
}
