import puppeteer from 'puppeteer';
import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COOKIE_PATH = join(__dirname, '../data/cookies.json');

async function debugThreads() {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1024 });

  if (fs.existsSync(COOKIE_PATH)) {
    const cookies = JSON.parse(fs.readFileSync(COOKIE_PATH));
    await page.setCookie(...cookies);
  }

  await page.goto('https://www.threads.net/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 5000));

  const dom = await page.evaluate(() => {
    return document.body.innerHTML;
  });

  fs.writeFileSync('threads_dom_dump.html', dom);
  await browser.close();
  console.log('DOM dumped to threads_dom_dump.html');
}

debugThreads();
