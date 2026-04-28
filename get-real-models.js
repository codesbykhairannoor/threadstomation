import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

function getRealModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
  
  https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      const json = JSON.parse(data);
      console.log('--- DAFTAR MODEL RESMI UNTUK KEY LU ---');
      if (json.models) {
        json.models.forEach(m => {
          console.log(`- ${m.name.replace('models/', '')} (${m.displayName})`);
        });
      } else {
        console.log('Tidak ada model ditemukan. Pesan:', json.error?.message);
      }
      process.exit(0);
    });
  }).on('error', (err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}

getRealModels();
