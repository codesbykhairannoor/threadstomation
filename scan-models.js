import { GoogleGenerativeAI } from '@google/generative-ai';
import sql from './lib/database.js';

async function scanModels() {
  const apiKeyRow = await sql`SELECT value FROM settings WHERE key = 'gemini_api_key'`;
  const apiKey = apiKeyRow[0]?.value;

  if (!apiKey) {
    console.error('❌ API KEY TIDAK DITEMUKAN!');
    process.exit(1);
  }

  console.log('📡 MEMULAI SCANNING MODEL GEMINI...');
  const genAI = new GoogleGenerativeAI(apiKey);

  // Daftar model yang mau kita tes
  const candidates = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro',
    'gemini-1.5-pro-latest',
    'gemini-pro',
    'gemini-1.0-pro',
    'gemini-2.0-flash-exp'
  ];

  for (const name of candidates) {
    try {
      console.log(`\n🧪 Testing: ${name}...`);
      const model = genAI.getGenerativeModel({ model: name });
      const result = await model.generateContent("Say 'OK'");
      const text = result.response.text();
      console.log(`✅ BERHASIL! Model ${name} merespon: ${text}`);
    } catch (e) {
      console.log(`❌ GAGAL: ${name}`);
      console.log(`   Pesan: ${e.message.split('\n')[0]}`);
    }
  }

  console.log('\n🏁 SCANNING SELESAI.');
  process.exit(0);
}

scanModels();
