import sql from './lib/database.js';

async function check() {
  try {
    console.log("Checking instagram_schedules...");
    const s = await sql`SELECT * FROM instagram_schedules LIMIT 1`;
    console.log("schedules OK");
    console.log("Checking instagram_history...");
    const h = await sql`SELECT * FROM instagram_history LIMIT 1`;
    console.log("history OK");
  } catch(e) {
    console.error("DB Error:", e);
  } finally {
    process.exit(0);
  }
}

check();
