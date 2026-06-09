import axios from 'axios';

const TOKEN = 'EAAc7tb0KPdkBRueLOoDfY44mquTQUNeQ034gZBZAP7X5Qci7pTNF2NHNjXnwJwkrxuvIZB0ZCooFtT6V4hy4oslVAzr6CKRvNTQNMReBPA9bHc7Pnbll37qrTGQiMKIqoW84ZCofVtaDBlQSoGMOu0XIvqpDMcwKYBcvnhXJ4FAghnrzUqexDqqKOgOGGpeK4LLM5W3lojNwH4exFinbiXR2WIZBoGxaFVA2SuNhWjKmtE1RzClC5T87ZBPZBZBqxoHMn4wWXB9dCo9qzutatnHWvtY5M';

async function debug() {
  try {
    const me = await axios.get(`https://graph.facebook.com/v19.0/me?fields=id,name,permissions&access_token=${TOKEN}`);
    console.log('Me Response:', JSON.stringify(me.data, null, 2));
    
    const accounts = await axios.get(`https://graph.facebook.com/v19.0/me/accounts?access_token=${TOKEN}`);
    console.log('Accounts Response:', JSON.stringify(accounts.data, null, 2));
  } catch (e) {
    console.error('Error:', e.response?.data || e.message);
  }
}

debug();
