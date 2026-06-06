import sql from '../lib/database.js';

async function updatePalette() {
  try {
    const brandPalettes = JSON.stringify([
      { bg1: '#1e2a39', bg2: '#1e2a39', accent: '#00ff8c', text: '#ffffff' }, // Navy dominant
      { bg1: '#00ff8c', bg2: '#00ff8c', accent: '#1e2a39', text: '#1e2a39' }, // Green dominant
      { bg1: '#ffffff', bg2: '#ffffff', accent: '#00ff8c', text: '#1e2a39' }  // White dominant
    ]);
    await sql`UPDATE instagram_accounts SET color_palette = ${brandPalettes} WHERE name LIKE '%Sharesa%' OR name LIKE '%Jasa Website%'`;
    console.log('Successfully updated Sharesa Space palette to the 3 brand color tones (Navy, Green, White)!');
  } catch (err) {
    console.error('Failed to update:', err);
  } finally {
    process.exit(0);
  }
}

updatePalette();
