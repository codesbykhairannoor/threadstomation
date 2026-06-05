import sql from './lib/database.js';

async function testHistory() {
  const accountId = 2;
  try {
    const history = await sql`SELECT * FROM instagram_history WHERE account_id = ${accountId} ORDER BY created_at DESC LIMIT 15`;
    console.log("History rows:", history.length);
  } catch(e) {
    console.error("Crash:", e);
  } finally {
    process.exit(0);
  }
}

testHistory();
