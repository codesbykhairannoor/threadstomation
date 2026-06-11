import sql from '../lib/database.js';

async function migrate() {
  console.log("Migrating schedules...");
  const oldSchedules = await sql`SELECT * FROM schedules WHERE account_id IN (1, 7)`;
  
  for (const sch of oldSchedules) {
    const targetAccountId = sch.account_id === 7 ? 4 : sch.account_id;

    const existing = await sql`SELECT id FROM instagram_schedules WHERE account_id = ${targetAccountId} AND custom_prompt = ${sch.custom_prompt}`;
    if (existing.length === 0) {
      await sql`
        INSERT INTO instagram_schedules (account_id, custom_prompt, is_active, last_run_date)
        VALUES (${targetAccountId}, ${sch.custom_prompt}, ${sch.is_active}, ${sch.last_run_date})
      `;
      console.log(`Migrated schedule from account ${sch.account_id} to instagram account ${targetAccountId}`);
    } else {
      console.log(`Schedule already exists for instagram account ${targetAccountId}`);
    }
  }
  console.log("Done.");
  process.exit();
}

migrate();
