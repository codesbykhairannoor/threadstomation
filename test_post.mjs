import { runInstagramPost } from './api/instagram.mjs';
import { initDb } from './lib/database.js';

async function testPost() {
  await initDb();
  console.log('Running post...');
  try {
    const result = await runInstagramPost(1);
    console.log('Success:', result);
  } catch (e) {
    console.error('Failed:', e);
  }
  process.exit(0);
}

testPost();
