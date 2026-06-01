import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config({ override: true });

async function testKey(keyName, keyValue) {
  if (!keyValue) {
    console.log(`[${keyName}] ❌ EMPTY/NOT FOUND`);
    return;
  }
  
  try {
    const genAI = new GoogleGenerativeAI(keyValue);
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    const result = await model.generateContent('Hi, reply with exactly the word "OK"');
    console.log(`[${keyName}] ✅ ALIVE (Response: ${result.response.text().trim()})`);
  } catch (e) {
    const msg = e.message.includes('403 Forbidden') ? 'LEAKED/BLOCKED (403)' :
                e.message.includes('API key not valid') ? 'INVALID KEY' : e.message;
    console.log(`[${keyName}] ❌ FAILED: ${msg}`);
  }
}

async function run() {
  console.log('Testing all Gemini keys in .env...\n');
  await testKey('GEMINI_API_KEY', process.env.GEMINI_API_KEY);
  await testKey('GEMINI_API_KEY_2', process.env.GEMINI_API_KEY_2);
  await testKey('GEMINI_API_KEY_3', process.env.GEMINI_API_KEY_3);
  await testKey('GEMINI_API_KEY_4', process.env.GEMINI_API_KEY_4);
}

run();
