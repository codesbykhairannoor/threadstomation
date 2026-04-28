import { GoogleGenerativeAI } from '@google/generative-ai';
import sql from './lib/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function auditKeys() {
  console.log('🔍 MEMULAI AUDIT KUNCI GEMINI...\n');
  
  // Ambil semua key
  const keys = new Set();
  Object.keys(process.env).forEach(envKey => {
    if (envKey.startsWith('GEMINI_API_KEY')) {
      keys.add(process.env[envKey]);
    }
  });
  const dbKeys = await sql`SELECT value FROM settings WHERE key LIKE 'gemini_api_key%'`;
  dbKeys.forEach(r => keys.add(r.value));
  
  const apiKeys = Array.from(keys).filter(v => !!v && v.length > 5);
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

  for (let i = 0; i < apiKeys.length; i++) {
    const key = apiKeys[i];
    console.log(`🔑 MENGETES KEY #${i + 1}: ${key.substring(0, 10)}...`);
    const genAI = new GoogleGenerativeAI(key);

    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Test");
        const text = result.response.text();
        console.log(`  ✅ ${modelName}: BERHASIL`);
      } catch (e) {
        console.log(`  ❌ ${modelName}: GAGAL (${e.message.split('\n')[0]})`);
      }
    }
    console.log('');
  }
  process.exit(0);
}

auditKeys();
