import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAllGeminiKeys } from '../lib/gemini.js';
import dotenv from 'dotenv';
dotenv.config();

async function testAllKeys() {
  const keys = await getAllGeminiKeys();
  console.log(`Found ${keys.length} API keys.`);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const maskedKey = key.substring(0, 8) + '...';
    console.log(`\n================================`);
    console.log(`Testing Key #${i + 1} (${maskedKey})`);
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
      if (!response.ok) {
        console.log(`[ERROR] Failed to list models for Key #${i+1}. Status: ${response.status}`);
        continue;
      }
      const data = await response.json();
      const models = data.models.map(m => m.name.replace('models/', ''));
      
      const targetModels = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-flash-latest'];
      console.log(`Available Target Models:`);
      targetModels.forEach(tm => {
         const isAvail = models.includes(tm);
         console.log(` - ${tm}: ${isAvail ? '✅ YES' : '❌ NO'}`);
      });
      
      // Let's do a tiny ping to gemini-1.5-flash to check rate limit status
      if (models.includes('gemini-1.5-flash')) {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const res = await model.generateContent("Say 'PING'");
        console.log(` - Ping test gemini-1.5-flash: ✅ SUCCESS (${res.response.text().trim()})`);
      }

    } catch (err) {
      console.log(`[ERROR] Key #${i + 1} failed: ${err.message}`);
    }
    
    // Sleep a bit to avoid instant rate limiting while testing
    await new Promise(r => setTimeout(r, 2000));
  }
}

testAllKeys();
