import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const TOKEN = 'EAAc7tb0KPdkBRqFyI1OEFKzuPcoaZAna6AEgRvNZC4iVTsLPtksIPgSt7io9y6r7pr2fLjoG3kacmwNfw99n966z332ekgTrMMVgve3cQnURDBsacD6A3c4a12jUBEG26D2k1q8HZBDRTFUHnazyjCPPGBZAgreFivVZC1AJZAfsrqI5MW7t8Hgw1nT159JmDFOFh7UasTPFuHqPLeZBYkpXjpp0i7gXcEnxKoOJsQv8MEFpZACjIl7iZAr3VUAKnUssfL6ZANzOoEsWvFBjXaRuL5QdT9';
const APP_ID = process.env.THREADS_APP_ID;
const APP_SECRET = process.env.THREADS_APP_SECRET;

async function debugToken() {
  try {
    const appToken = `${APP_ID}|${APP_SECRET}`;
    const res = await axios.get(`https://graph.facebook.com/v19.0/debug_token`, {
      params: {
        input_token: TOKEN,
        access_token: appToken
      }
    });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error(e.response?.data || e.message);
  }
}

debugToken();
