import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

async function listAllModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    // Di SDK terbaru kita gak bisa listModels langsung lewat genAI, 
    // tapi kita bisa coba panggil model 1.5 dengan nama yang bener
    console.log('🧪 MENGETES NAMA MODEL 1.5...');
    const testModels = ['gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-1.5-pro-latest'];
    
    for (const m of testModels) {
        try {
            const model = genAI.getGenerativeModel({ model: m });
            await model.generateContent("test");
            console.log(`✅ ${m}: VALID`);
        } catch (e) {
            console.log(`❌ ${m}: INVALID (${e.message.split('\n')[0]})`);
        }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

listAllModels();
