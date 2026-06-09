import sql from '../lib/database.js';

const OLD_PAGE_ID = '61572056301259';
const NEW_PAGE_ID = '1044012238797561';
const TOKEN = 'EAAc7tb0KPdkBRueLOoDfY44mquTQUNeQ034gZBZAP7X5Qci7pTNF2NHNjXnwJwkrxuvIZB0ZCooFtT6V4hy4oslVAzr6CKRvNTQNMReBPA9bHc7Pnbll37qrTGQiMKIqoW84ZCofVtaDBlQSoGMOu0XIvqpDMcwKYBcvnhXJ4FAghnrzUqexDqqKOgOGGpeK4LLM5W3lojNwH4exFinbiXR2WIZBoGxaFVA2SuNhWjKmtE1RzClC5T87ZBPZBZBqxoHMn4wWXB9dCo9qzutatnHWvtY5M';

async function update() {
  try {
    console.log(`Updating Oneformind Page ID from ${OLD_PAGE_ID} to ${NEW_PAGE_ID}...`);
    
    // Check if it exists
    const existing = await sql`SELECT id FROM facebook_accounts WHERE facebook_page_id = ${OLD_PAGE_ID}`;
    
    if (existing.length > 0) {
      await sql`
        UPDATE facebook_accounts 
        SET facebook_page_id = ${NEW_PAGE_ID},
            access_token = ${TOKEN}
        WHERE id = ${existing[0].id}
      `;
      console.log('✅ Update successful!');
    } else {
      // If somehow not found, insert fresh
      await sql`
        INSERT INTO facebook_accounts (name, facebook_page_id, access_token)
        VALUES ('ONEFORMIND', ${NEW_PAGE_ID}, ${TOKEN})
        ON CONFLICT (facebook_page_id) DO UPDATE 
        SET access_token = EXCLUDED.access_token
      `;
      console.log('✅ Fresh insert successful!');
    }
  } catch (e) {
    console.error('❌ Update failed:', e.message);
  }
}

update().then(() => process.exit(0));
