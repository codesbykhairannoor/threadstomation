import { GoogleGenerativeAI } from '@google/generative-ai';
import sql from './lib/database.js';
import dotenv from 'dotenv';
dotenv.config({ override: true });

async function listModels() {
  try {
    const apiKeyRow = await sql`SELECT value FROM settings WHERE key = 'gemini_api_key'`;
    const apiKey = apiKeyRow[0]?.value || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('API Key not found in DB or .env');
      process.exit(1);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // There is no direct listModels in the browser-style SDK easily accessible this way without the discovery API
    // But we can try the common ones or check the error message.
    
    console.log('Testing models one by one...');
    const tests = [
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro',
      'gemini-2.0-flash-exp',
      'gemini-2.0-flash',
      'gemini-pro'
    ];

    for (const m of tests) {
      try {
        const model = genAI.getGenerativeModel({ model: m });
        await model.generateContent('test');
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
