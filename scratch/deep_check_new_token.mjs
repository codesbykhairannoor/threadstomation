import axios from 'axios';

const TOKEN = 'EAAc7tb0KPdkBRueLOoDfY44mquTQUNeQ034gZBZAP7X5Qci7pTNF2NHNjXnwJwkrxuvIZB0ZCooFtT6V4hy4oslVAzr6CKRvNTQNMReBPA9bHc7Pnbll37qrTGQiMKIqoW84ZCofVtaDBlQSoGMOu0XIvqpDMcwKYBcvnhXJ4FAghnrzUqexDqqKOgOGGpeK4LLM5W3lojNwH4exFinbiXR2WIZBoGxaFVA2SuNhWjKmtE1RzClC5T87ZBPZBZBqxoHMn4wWXB9dCo9qzutatnHWvtY5M';

async function deepCheck() {
  const endpoints = ['me/accounts', 'me/businesses', 'me/pages'];
  for (const ep of endpoints) {
    try {
      console.log(`--- Checking ${ep} ---`);
      const res = await axios.get(`https://graph.facebook.com/v19.0/${ep}?access_token=${TOKEN}`);
      console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
      console.log(`Endpoint ${ep} failed:`, e.response?.data?.error?.message || e.message);
    }
  }
}

deepCheck();
