import Database from 'better-sqlite3';

const db = new Database('./data/database.sqlite');
const apiKey = db.prepare("SELECT value FROM settings WHERE key = 'gemini_api_key'").get()?.value;

if (!apiKey) {
  console.log('API Key not found');
  process.exit(1);
}

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.models) {
      console.log('--- MODELS FOUND ---');
      data.models.forEach(m => {
        const methods = m.supportedMethods || [];
        if (methods.includes('generateContent')) {
          console.log(`- ${m.name}`);
        } else {
          console.log(`- ${m.name} (Other methods)`);
        }
      });
      console.log('--------------------');
    } else {
      console.log('No models found or error:', data);
    }
  } catch (e) {
    console.error('Fetch error:', e.message);
  }
}

listModels();
