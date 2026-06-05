import sql from '../lib/database.js';

async function seedSharesa() {
  const token = "IGAAYZCHxheA5VBZAGE4R05YR1YxeGRsRFFXMS12NUNmczZAWVHhsU2QtMjJwQ2N6cjFFTFRua2RDV0FuLVhEWkZALVEpGNTcxWWJEMWwwaHlQMHhacXNWTjBMNnZAXbjVIaVFjb1dVY0RTS1Y1a2c2U2tWN1JfU2N0VHpTWWlaM3RtWQZDZD";
  
  // Try to exchange for a long-lived token (if this token isn't already) just to be safe about the "tidak basi" requirement
  let finalToken = token;
  try {
    const res = await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`);
    const data = await res.json();
    if (data.access_token) {
      finalToken = data.access_token;
      console.log('Successfully refreshed to a long-lived token!');
    } else {
      console.log('Refresh returned:', data, 'Proceeding with original token.');
    }
  } catch (e) {
    console.log('Refresh endpoint failed, using original token.', e.message);
  }

  // 1. Find Account
  const accountRes = await sql`
    SELECT id FROM instagram_accounts WHERE name = 'Sharesa Space' LIMIT 1;
  `;
  const accId = accountRes[0].id;
  console.log('Found Sharesa Space with ID:', accId);

  // 2. Insert 5 Prompts
  const prompts = [
    "Why 80% of users abandon poorly designed websites in 3 seconds, and how UI/UX fixes it.",
    "The difference between a generic template website and a custom-built digital experience that converts.",
    "Dark mode isn't just an aesthetic trend; it's a fundamental shift in user accessibility. Here's why your app needs it.",
    "Stop treating your branding as an afterthought. How cohesive visual identities drive customer trust and higher revenue.",
    "Micro-interactions: The secret sauce to making your web app feel premium, responsive, and alive."
  ];

  for (const p of prompts) {
    await sql`
      INSERT INTO instagram_schedules (account_id, custom_prompt, is_active)
      VALUES (${accId}, ${p}, 1)
    `;
    console.log('Inserted prompt:', p);
  }

  console.log('Seeding complete!');
  process.exit(0);
}

seedSharesa();
