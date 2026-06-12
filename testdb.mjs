import sql from './lib/database.js';

async function test() {
  const res = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'tumblr_history'`;
  console.log(res.map(r => r.column_name));
  process.exit(0);
}
test();
