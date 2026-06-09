import axios from 'axios';

const TOKEN = 'EAAc7tb0KPdkBRqFyI1OEFKzuPcoaZAna6AEgRvNZC4iVTsLPtksIPgSt7io9y6r7pr2fLjoG3kacmwNfw99n966z332ekgTrMMVgve3cQnURDBsacD6A3c4a12jUBEG26D2k1q8HZBDRTFUHnazyjCPPGBZAgreFivVZC1AJZAfsrqI5MW7t8Hgw1nT159JmDFOFh7UasTPFuHqPLeZBYkpXjpp0i7gXcEnxKoOJsQv8MEFpZACjIl7iZAr3VUAKnUssfL6ZANzOoEsWvFBjXaRuL5QdT9';

async function checkFeed() {
  try {
    const res = await axios.get(`https://graph.facebook.com/v19.0/me/feed?limit=5&access_token=${TOKEN}`);
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error(e.response?.data || e.message);
  }
}

checkFeed();
