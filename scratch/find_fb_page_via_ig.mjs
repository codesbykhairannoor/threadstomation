import axios from 'axios';

const TOKEN = 'EAAc7tb0KPdkBRqFyI1OEFKzuPcoaZAna6AEgRvNZC4iVTsLPtksIPgSt7io9y6r7pr2fLjoG3kacmwNfw99n966z332ekgTrMMVgve3cQnURDBsacD6A3c4a12jUBEG26D2k1q8HZBDRTFUHnazyjCPPGBZAgreFivVZC1AJZAfsrqI5MW7t8Hgw1nT159JmDFOFh7UasTPFuHqPLeZBYkpXjpp0i7gXcEnxKoOJsQv8MEFpZACjIl7iZAr3VUAKnUssfL6ZANzOoEsWvFBjXaRuL5QdT9';

const igBusinessIds = [
    { name: 'ONEFORMIND', id: '27238273945782775' },
    { name: 'Sharesa Space', id: '27661348450149277' }
];

async function findPages() {
  for (const ig of igBusinessIds) {
    try {
      console.log(`Checking linked Page for ${ig.name} (${ig.id})...`);
      const res = await axios.get(`https://graph.facebook.com/v19.0/${ig.id}?fields=connected_facebook_page{id,name}&access_token=${TOKEN}`);
      console.log('Result:', JSON.stringify(res.data, null, 2));
    } catch (e) {
      console.error(`Error for ${ig.name}:`, e.response?.data || e.message);
    }
  }
}

findPages();
