import sql from '../lib/database.js';

const token = 'IGAAYZCHxheA5VBZAGE4R05YR1YxeGRsRFFXMS12NUNmczZAWVHhsU2QtMjJwQ2N6cjFFTFRua2RDV0FuLVhEWkZALVEpGNTcxWWJEMWwwaHlQMHhacXNWTjBMNnZAXbjVIaVFjb1dVY0RTS1Y1a2c2U2tWN1JfU2N0VHpTWWlaM3RtWQZDZD';

async function run() {
  try {
    // 1. Fetch from Instagram Graph API
    const res = await fetch(`https://graph.instagram.com/v21.0/me?fields=id,username&access_token=${token}`);
    const data = await res.json();
    console.log('Instagram Graph API v21.0 me:', data);
    
    if (data && data.id) {
      const igId = data.id;
      // 2. Update DB
      await sql`
        UPDATE instagram_accounts 
        SET instagram_business_id = ${igId} 
        WHERE name = 'Sharesa Space'
      `;
      console.log('Updated Sharesa Space with Instagram Business ID:', igId);
    } else {
      console.log('Failed to retrieve ID. Response was:', data);
    }
  } catch (e) {
    console.error('Error:', e);
  }
  process.exit(0);
}
run();
