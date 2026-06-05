import sql from './lib/database.js';

async function check() {
  try {
    const sCols = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'instagram_schedules';
    `;
    console.log("instagram_schedules columns:", sCols.map(c => c.column_name));
    
    const hCols = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'instagram_history';
    `;
    console.log("instagram_history columns:", hCols.map(c => c.column_name));
  } catch(e) {
    console.error("DB Error:", e);
  } finally {
    process.exit(0);
  }
}

check();
