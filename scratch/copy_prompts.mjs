import sql from '../lib/database.js';

async function run() {
  const adhlil_schedules = await sql`SELECT custom_prompt FROM schedules WHERE account_id = 1`;
  console.log("Adhlil schedules:", adhlil_schedules.map(s => s.custom_prompt));

  // The tiktok account id is 3
  const tt_account_id = 3;

  for (const s of adhlil_schedules) {
    if (s.custom_prompt) {
      await sql`
        INSERT INTO tiktok_schedules (account_id, custom_prompt, is_active)
        VALUES (${tt_account_id}, ${s.custom_prompt}, 1)
      `;
    }
  }

  console.log("Inserted schedules into TikTok account.");
  process.exit(0);
}
run();
