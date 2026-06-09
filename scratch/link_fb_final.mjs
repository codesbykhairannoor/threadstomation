import sql from '../lib/database.js';

const TOKEN = 'EAAc7tb0KPdkBRueLOoDfY44mquTQUNeQ034gZBZAP7X5Qci7pTNF2NHNjXnwJwkrxuvIZB0ZCooFtT6V4hy4oslVAzr6CKRvNTQNMReBPA9bHc7Pnbll37qrTGQiMKIqoW84ZCofVtaDBlQSoGMOu0XIvqpDMcwKYBcvnhXJ4FAghnrzUqexDqqKOgOGGpeK4LLM5W3lojNwH4exFinbiXR2WIZBoGxaFVA2SuNhWjKmtE1RzClC5T87ZBPZBZBqxoHMn4wWXB9dCo9qzutatnHWvtY5M';

const accounts = [
  { name: 'ONEFORMIND', pageId: '61572056301259' },
  { name: 'SHARESA SPACE', pageId: '339530095918629' }
];

async function link() {
  console.log('Linking Facebook accounts to DB...');
  for (const acc of accounts) {
    await sql`
      INSERT INTO facebook_accounts (name, facebook_page_id, access_token)
      VALUES (${acc.name}, ${acc.pageId}, ${TOKEN})
      ON CONFLICT (facebook_page_id) DO UPDATE 
      SET access_token = EXCLUDED.access_token, name = EXCLUDED.name
    `;
    console.log(`✅ Linked ${acc.name} (${acc.pageId})`);
  }
}

link().then(() => process.exit(0));
