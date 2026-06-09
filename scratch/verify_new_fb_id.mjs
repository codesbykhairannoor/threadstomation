import axios from 'axios';

const TOKEN = 'EAAc7tb0KPdkBRueLOoDfY44mquTQUNeQ034gZBZAP7X5Qci7pTNF2NHNjXnwJwkrxuvIZB0ZCooFtT6V4hy4oslVAzr6CKRvNTQNMReBPA9bHc7Pnbll37qrTGQiMKIqoW84ZCofVtaDBlQSoGMOu0XIvqpDMcwKYBcvnhXJ4FAghnrzUqexDqqKOgOGGpeK4LLM5W3lojNwH4exFinbiXR2WIZBoGxaFVA2SuNhWjKmtE1RzClC5T87ZBPZBZBqxoHMn4wWXB9dCo9qzutatnHWvtY5M';
const NEW_PAGE_ID = '1044012238797561';

async function verify() {
  try {
    console.log(`Verifying Page ID: ${NEW_PAGE_ID}...`);
    const res = await axios.get(`https://graph.facebook.com/v19.0/${NEW_PAGE_ID}?fields=id,name,access_token&access_token=${TOKEN}`);
    console.log('✅ Success! Found Page:', JSON.stringify(res.data, null, 2));
    return true;
  } catch (e) {
    console.error('❌ Failed:', e.response?.data?.error?.message || e.message);
    return false;
  }
}

verify();
