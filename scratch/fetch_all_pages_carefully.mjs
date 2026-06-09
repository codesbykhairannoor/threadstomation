import axios from 'axios';

const TOKEN = 'EAAc7tb0KPdkBRueLOoDfY44mquTQUNeQ034gZBZAP7X5Qci7pTNF2NHNjXnwJwkrxuvIZB0ZCooFtT6V4hy4oslVAzr6CKRvNTQNMReBPA9bHc7Pnbll37qrTGQiMKIqoW84ZCofVtaDBlQSoGMOu0XIvqpDMcwKYBcvnhXJ4FAghnrzUqexDqqKOgOGGpeK4LLM5W3lojNwH4exFinbiXR2WIZBoGxaFVA2SuNhWjKmtE1RzClC5T87ZBPZBZBqxoHMn4wWXB9dCo9qzutatnHWvtY5M';

async function fetchAll() {
  try {
    console.log('Fetching me/accounts...');
    const res = await axios.get(`https://graph.facebook.com/v19.0/me/accounts?access_token=${TOKEN}`);
    console.log('Accounts Data:', JSON.stringify(res.data, null, 2));

    if (res.data.data && res.data.data.length > 0) {
        console.log('Found Pages:', res.data.data.map(p => p.name).join(', '));
    } else {
        console.log('NO PAGES FOUND IN me/accounts');
    }
  } catch (e) {
    console.error('Error:', e.response?.data || e.message);
  }
}

fetchAll();
