import dotenv from 'dotenv';
dotenv.config();

const urlboxKey = process.env.URLBOX_API_KEY;
console.log(`Testing URLBox with key length: ${urlboxKey ? urlboxKey.length : 0}`);
console.log(`Key value: [${urlboxKey}]`);

async function testUrlbox() {
  try {
    const res = await fetch('https://api.urlbox.com/v1/render/sync', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${urlboxKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        html: '<html><body><h1>Hello World</h1></body></html>',
        format: 'jpg',
        width: 300,
        height: 300
      })
    });
    
    console.log(`Status: ${res.status}`);
    const data = await res.text();
    console.log(`Response: ${data}`);
  } catch (e) {
    console.error("Fetch error:", e.message);
  }
}

testUrlbox();
