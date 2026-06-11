import sql from './lib/database.js';
async function test() {
  const res = await sql`SELECT * FROM facebook_schedules`;
  console.log(res);
  process.exit();
}
test();
