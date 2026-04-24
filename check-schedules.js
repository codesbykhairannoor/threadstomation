import sql from './lib/database.js';

async function checkSchedules() {
  const rows = await sql`SELECT * FROM schedules`;
  console.log('Current Schedules:', rows);
  process.exit(0);
}
checkSchedules();
