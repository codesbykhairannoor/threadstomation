import sql from '../lib/database.js';

async function updatePrompt() {
  try {
    const result = await sql`SELECT id, name, master_prompt FROM instagram_accounts WHERE name LIKE '%Sharesa%'`;
    console.log('Before update:', result);

    const indonesianPrompt = "Anda adalah agensi pembuat website profesional di Indonesia (Sharesa Space). Gunakan Bahasa Indonesia yang sangat santai, gaul, namun edukatif dan profesional. Target audiens adalah pemilik bisnis lokal dan startup di Indonesia.";
    
    await sql`UPDATE instagram_accounts SET master_prompt = ${indonesianPrompt} WHERE name LIKE '%Sharesa%' OR name LIKE '%Jasa Website%'`;
    
    console.log('Successfully updated Sharesa Space master_prompt to Indonesian!');
  } catch (err) {
    console.error('Failed to update:', err);
  } finally {
    process.exit(0);
  }
}

updatePrompt();
