import { GoogleGenerativeAI } from '@google/generative-ai';
import sql from './lib/database.js';
import dotenv from 'dotenv';
dotenv.config({ override: true });

async function listModels() {
  try {
    const apiKeyRow = await sql`SELECT value FROM settings WHERE key = 'gemini_api_key'`;
    const apiKey = apiKeyRow[0]?.value || process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    
    const tests = [
      'gemini-flash-latest',
      'gemini-pro-latest',
      'gemini-pro'
    ];

    for (const m of tests) {
      try {
        const model = genAI.getGenerativeModel({ model: m });
        const res = await model.generateContent('test');
        console.log(`✅ ${m} is AVAILABLE`);
      } catch (e) {
        console.log(`❌ ${m} is NOT available: ${e.message}`);
      }
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    process.exit(0);
  }
}
listModels();
