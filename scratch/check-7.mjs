import sql from '../lib/database.js';

async function test() {
  const c1 = await sql`SELECT count(*) FROM instagram_schedules WHERE account_id=7`;
  const c2 = await sql`SELECT count(*) FROM schedules WHERE account_id=7`;
  console.log('instagram_schedules:', c1[0].count);
  console.log('schedules:', c2[0].count);
  process.exit();
}
test();
