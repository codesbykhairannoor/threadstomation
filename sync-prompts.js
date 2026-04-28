import sql from './lib/database.js';

async function sync() {
  const globalPrompt = await sql`SELECT value FROM settings WHERE key = 'prompt'`;
  if (globalPrompt.length > 0) {
    const val = globalPrompt[0].value;
    await sql`UPDATE accounts SET master_prompt = ${val} WHERE master_prompt IS NULL`;
    console.log('✅ Global prompt synced to accounts.');
  }
  process.exit(0);
}
sync();
