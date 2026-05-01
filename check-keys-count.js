import { getAllGeminiKeys } from './lib/gemini.js';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  const keys = await getAllGeminiKeys();
  console.log(`🗝️ TOTAL KUNCI YANG TERDETEKSI: ${keys.length}`);
  keys.forEach((k, i) => {
    console.log(`  [${i+1}] ${k.substring(0, 10)}...`);
  });
  process.exit(0);
}
check();
