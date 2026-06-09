import axios from 'axios';

const TOKEN = 'EAAc7tb0KPdkBRueLOoDfY44mquTQUNeQ034gZBZAP7X5Qci7pTNF2NHNjXnwJwkrxuvIZB0ZCooFtT6V4hy4oslVAzr6CKRvNTQNMReBPA9bHc7Pnbll37qrTGQiMKIqoW84ZCofVtaDBlQSoGMOu0XIvqpDMcwKYBcvnhXJ4FAghnrzUqexDqqKOgOGGpeK4LLM5W3lojNwH4exFinbiXR2WIZBoGxaFVA2SuNhWjKmtE1RzClC5T87ZBPZBZBqxoHMn4wWXB9dCo9qzutatnHWvtY5M';
const PAGE_ID = '339530095918629'; // Sharesa Space

async function check() {
  try {
    // 1. Get Page Token
    const res = await axios.get(`https://graph.facebook.com/v19.0/${PAGE_ID}?fields=access_token&access_token=${TOKEN}`);
    const pageToken = res.data.access_token;
    console.log('Page Token received.');

    // 2. Check Permissions of the Page Token
    const perms = await axios.get(`https://graph.facebook.com/v19.0/me/permissions?access_token=${pageToken}`);
    console.log('Page Token Permissions:', JSON.stringify(perms.data, null, 2));
  } catch (e) {
    console.error('Error:', e.response?.data || e.message);
  }
}

check();
