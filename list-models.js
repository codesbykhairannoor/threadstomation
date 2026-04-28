import { GoogleGenerativeAI } from '@google/generative-ai';
import sql from './lib/database.js';

async function listAllModels() {
  const apiKeyRow = await sql`SELECT value FROM settings WHERE key = 'gemini_api_key'`;
  const apiKey = apiKeyRow[0]?.value;

  if (!apiKey) {
    console.error('❌ API KEY TIDAK DITEMUKAN!');
    process.exit(1);
  }

  console.log('📡 MEMINTA DAFTAR RESMI MODEL DARI GOOGLE...');
  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    // Kita coba fetch daftar model yang beneran ada buat kunci ini
    // Note: SDK mungkin butuh method yang bener
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
    const data = await response.json();
    
    if (data.error) {
        console.error('❌ Error dari Google:', data.error.message);
        process.exit(1);
    }

    console.log('\n✅ DAFTAR MODEL YANG TERSEDIA BUAT LU:');
    data.models.forEach(m => {
        console.log(`- ${m.name} (${m.displayName})`);
        console.log(`  Capabilities: ${m.supportedGenerationMethods.join(', ')}`);
    });

  } catch (e) {
    console.error('❌ GAGAL MENGHUBUNGI GOOGLE:', e.message);
  }

  process.exit(0);
}

listAllModels();
