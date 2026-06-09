import axios from 'axios';

const TOKEN = 'EAAc7tb0KPdkBRueLOoDfY44mquTQUNeQ034gZBZAP7X5Qci7pTNF2NHNjXnwJwkrxuvIZB0ZCooFtT6V4hy4oslVAzr6CKRvNTQNMReBPA9bHc7Pnbll37qrTGQiMKIqoW84ZCofVtaDBlQSoGMOu0XIvqpDMcwKYBcvnhXJ4FAghnrzUqexDqqKOgOGGpeK4LLM5W3lojNwH4exFinbiXR2WIZBoGxaFVA2SuNhWjKmtE1RzClC5T87ZBPZBZBqxoHMn4wWXB9dCo9qzutatnHWvtY5M';
const PAGE_ID = '61572056301259'; // Oneformind

async function testPost() {
  try {
    console.log(`Testing post permission for Page ${PAGE_ID}...`);
    // Try to get Page Access Token first
    const res = await axios.get(`https://graph.facebook.com/v19.0/${PAGE_ID}?fields=access_token&access_token=${TOKEN}`);
    console.log('Page Token Response:', JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error('Permission Error:', e.response?.data?.error?.message || e.message);
  }
}

testPost();
