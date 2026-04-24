import sql from './lib/database.js';

async function test() {
  try {
    const res = await sql`SELECT 1`;
    console.log('DB OK');
  } catch (e) {
    console.error('DB FAIL:', e.message);
  } finally {
    process.exit(0);
  }
}
test();
