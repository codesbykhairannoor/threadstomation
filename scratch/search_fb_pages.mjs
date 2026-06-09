import axios from 'axios';

const TOKEN = 'EAAc7tb0KPdkBRqFyI1OEFKzuPcoaZAna6AEgRvNZC4iVTsLPtksIPgSt7io9y6r7pr2fLjoG3kacmwNfw99n966z332ekgTrMMVgve3cQnURDBsacD6A3c4a12jUBEG26D2k1q8HZBDRTFUHnazyjCPPGBZAgreFivVZC1AJZAfsrqI5MW7t8Hgw1nT159JmDFOFh7UasTPFuHqPLeZBYkpXjpp0i7gXcEnxKoOJsQv8MEFpZACjIl7iZAr3VUAKnUssfL6ZANzOoEsWvFBjXaRuL5QdT9';

async function searchPage() {
  const names = ['ONEFORMIND', 'Sharesa Space'];
  for (const name of names) {
    try {
      console.log(`Searching for ${name}...`);
      const res = await axios.get(`https://graph.facebook.com/v19.0/pages/search?q=${encodeURIComponent(name)}&fields=id,name&access_token=${TOKEN}`);
      console.log('Result:', JSON.stringify(res.data, null, 2));
    } catch (e) {
      console.error(`Error for ${name}:`, e.response?.data || e.message);
    }
  }
}

searchPage();
