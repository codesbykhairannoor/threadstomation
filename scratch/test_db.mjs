import sql from '../lib/database.js';

async function test() {
  try {
    const res = await sql`SELECT 1 as connected`;
    console.log('✅ Database is ONLINE:', res);
  } catch (e) {
    console.error('❌ Database is OFFLINE:', e.message);
  }
}

test().then(() => process.exit(0));
