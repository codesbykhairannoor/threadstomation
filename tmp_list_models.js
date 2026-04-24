import { GoogleGenerativeAI } from '@google/generative-ai';
import Database from 'better-sqlite3';

const db = new Database('./data/database.sqlite');
const apiKey = db.prepare("SELECT value FROM settings WHERE key = 'gemini_api_key'").get()?.value;

if (!apiKey) {
  console.log('API Key not found in database.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function list() {
  try {
    const models = await genAI.listModels();
    console.log('--- AVAILABLE MODELS ---');
    models.models.forEach(m => {
      console.log(`- ${m.name} (Methods: ${m.supportedMethods.join(', ')})`);
    });
    console.log('------------------------');
  } catch (e) {
    console.error('ListModels Error:', e.message);
  }
}

list();
