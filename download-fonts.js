import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const fontsDir = path.join(__dirname, 'lib', 'fonts');
const fontUrl = 'https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/Montserrat%5Bwght%5D.ttf';
const destPath = path.join(fontsDir, 'Montserrat.ttf');

async function downloadFile(url, dest) {
  console.log(`Downloading ${url} -> ${dest}`);
  const response = await axios({
    method: 'GET',
    url: url,
    responseType: 'stream'
  });
  
  const writer = fs.createWriteStream(dest);
  response.data.pipe(writer);
  
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function main() {
  if (!fs.existsSync(fontsDir)) {
    fs.mkdirSync(fontsDir, { recursive: true });
    console.log(`Created directory: ${fontsDir}`);
  }
  
  try {
    await downloadFile(fontUrl, destPath);
    console.log(`Successfully downloaded Montserrat.ttf`);
  } catch (e) {
    console.error(`Failed to download Montserrat.ttf:`, e.message);
  }
}

main();
