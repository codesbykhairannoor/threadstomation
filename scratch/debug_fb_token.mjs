import axios from 'axios';

const TOKEN = 'EAAc7tb0KPdkBRqFyI1OEFKzuPcoaZAna6AEgRvNZC4iVTsLPtksIPgSt7io9y6r7pr2fLjoG3kacmwNfw99n966z332ekgTrMMVgve3cQnURDBsacD6A3c4a12jUBEG26D2k1q8HZBDRTFUHnazyjCPPGBZAgreFivVZC1AJZAfsrqI5MW7t8Hgw1nT159JmDFOFh7UasTPFuHqPLeZBYkpXjpp0i7gXcEnxKoOJsQv8MEFpZACjIl7iZAr3VUAKnUssfL6ZANzOoEsWvFBjXaRuL5QdT9';

async function debug() {
  console.log('--- DEBUGGING TOKEN ---');
  try {
    // 1. Check /me
    const me = await axios.get(`https://graph.facebook.com/v19.0/me?fields=id,name,accounts&access_token=${TOKEN}`);
    console.log('Me Response:', JSON.stringify(me.data, null, 2));

    // 2. Check /me/accounts specifically if not in /me
    if (!me.data.accounts) {
        const accounts = await axios.get(`https://graph.facebook.com/v19.0/me/accounts?access_token=${TOKEN}`);
        console.log('Accounts Response:', JSON.stringify(accounts.data, null, 2));
    }
  } catch (e) {
    console.error('Error Details:', e.response?.data || e.message);
  }
}

debug();
