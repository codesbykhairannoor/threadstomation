import axios from 'axios';

const TOKEN = 'EAAc7tb0KPdkBRueLOoDfY44mquTQUNeQ034gZBZAP7X5Qci7pTNF2NHNjXnwJwkrxuvIZB0ZCooFtT6V4hy4oslVAzr6CKRvNTQNMReBPA9bHc7Pnbll37qrTGQiMKIqoW84ZCofVtaDBlQSoGMOu0XIvqpDMcwKYBcvnhXJ4FAghnrzUqexDqqKOgOGGpeK4LLM5W3lojNwH4exFinbiXR2WIZBoGxaFVA2SuNhWjKmtE1RzClC5T87ZBPZBZBqxoHMn4wWXB9dCo9qzutatnHWvtY5M';

async function check() {
  const targets = ['sharesaspace', '61572056301259'];
  for (const t of targets) {
    try {
      console.log(`Checking ${t}...`);
      const res = await axios.get(`https://graph.facebook.com/v19.0/${t}?fields=id,name&access_token=${TOKEN}`);
      console.log('Result:', JSON.stringify(res.data, null, 2));
    } catch (e) {
      console.error(`Error for ${t}:`, e.response?.data?.error?.message || e.message);
    }
  }
}

check();
