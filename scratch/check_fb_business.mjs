import axios from 'axios';

const TOKEN = 'EAAc7tb0KPdkBRqFyI1OEFKzuPcoaZAna6AEgRvNZC4iVTsLPtksIPgSt7io9y6r7pr2fLjoG3kacmwNfw99n966z332ekgTrMMVgve3cQnURDBsacD6A3c4a12jUBEG26D2k1q8HZBDRTFUHnazyjCPPGBZAgreFivVZC1AJZAfsrqI5MW7t8Hgw1nT159JmDFOFh7UasTPFuHqPLeZBYkpXjpp0i7gXcEnxKoOJsQv8MEFpZACjIl7iZAr3VUAKnUssfL6ZANzOoEsWvFBjXaRuL5QdT9';

async function checkBusiness() {
  console.log('--- CHECKING BUSINESS ---');
  try {
    const biz = await axios.get(`https://graph.facebook.com/v19.0/me/businesses?access_token=${TOKEN}`);
    console.log('Businesses:', JSON.stringify(biz.data, null, 2));

    for (const b of biz.data.data) {
        console.log(`Checking Pages for Business: ${b.name} (${b.id})...`);
        const pages = await axios.get(`https://graph.facebook.com/v19.0/${b.id}/client_pages?access_token=${TOKEN}`);
        console.log('Client Pages:', JSON.stringify(pages.data, null, 2));
        
        const ownedPages = await axios.get(`https://graph.facebook.com/v19.0/${b.id}/owned_pages?access_token=${TOKEN}`);
        console.log('Owned Pages:', JSON.stringify(ownedPages.data, null, 2));
    }
  } catch (e) {
    console.error('Error:', e.response?.data || e.message);
  }
}

checkBusiness();
