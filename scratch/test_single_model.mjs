import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAllGeminiKeys } from '../lib/gemini.js';

async function testModel() {
  const keys = await getAllGeminiKeys();
  const genAI = new GoogleGenerativeAI(keys[0]);
  
  const modelsToTest = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash'];
  
  for (const m of modelsToTest) {
    try {
      console.log(`Testing: ${m}`);
      const model = genAI.getGenerativeModel({ model: m });
      const res = await model.generateContent("Hello");
      console.log(`Success ${m}: ${res.response.text().trim()}`);
    } catch (e) {
      console.error(`Failed ${m}: ${e.message}`);
    }
  }
}
testModel();
