import sql from './lib/database.js';

async function check() {
  const fb = await sql`SELECT * FROM facebook_accounts`;
  console.log("FB Accounts:", fb);
  const fbSchedules = await sql`SELECT * FROM facebook_schedules`;
  console.log("FB Schedules:", fbSchedules);
  process.exit(0);
}
check();
