import axios from 'axios';

const TOKEN = 'EAAc7tb0KPdkBRqFyI1OEFKzuPcoaZAna6AEgRvNZC4iVTsLPtksIPgSt7io9y6r7pr2fLjoG3kacmwNfw99n966z332ekgTrMMVgve3cQnURDBsacD6A3c4a12jUBEG26D2k1q8HZBDRTFUHnazyjCPPGBZAgreFivVZC1AJZAfsrqI5MW7t8Hgw1nT159JmDFOFh7UasTPFuHqPLeZBYkpXjpp0i7gXcEnxKoOJsQv8MEFpZACjIl7iZAr3VUAKnUssfL6ZANzOoEsWvFBjXaRuL5QdT9';

async function check() {
  const ids = ['462226163641773', '122116041692348564'];
  for (const id of ids) {
    try {
      const res = await axios.get(`https://graph.facebook.com/v19.0/${id}?fields=id,name&access_token=${TOKEN}`);
      console.log(`ID ${id}:`, JSON.stringify(res.data, null, 2));
    } catch (e) {
      console.error(`ID ${id} failed:`, e.response?.data || e.message);
    }
  }
}

check();
