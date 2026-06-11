import sql from '../lib/database.js';

async function test() {
  const accs = await sql`SELECT id, name FROM instagram_accounts WHERE name ILIKE '%adhlil%'`;
  if (accs.length) {
    const accId = accs[0].id;
    console.log("Acc ID:", accId);
    try {
      const s1 = await sql`SELECT * FROM instagram_schedules WHERE account_id = ${accId}`;
      console.log("instagram_schedules:", s1);
    } catch(e) { console.log(e.message) }
    try {
      const s2 = await sql`SELECT * FROM schedules WHERE account_id = ${accId}`;
      console.log("schedules:", s2);
    } catch(e) { console.log(e.message) }
  }
  process.exit();
}
test();
