import sql from './lib/database.js';

async function migrate() {
  try {
    await sql`ALTER TABLE schedules ADD COLUMN IF NOT EXISTS last_run_date TEXT`;
    console.log('✅ [DB] Column last_run_date added successfully.');
  } catch (e) {
    console.error('❌ [DB] Migration failed:', e.message);
  } finally {
    process.exit(0);
  }
}

migrate();
