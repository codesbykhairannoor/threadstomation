import fetch from 'node-fetch';

async function testSF(key) {
  const url = 'https://api.siliconflow.cn/v1/images/generations';
  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: 'a white cat',
      model: 'black-forest-labs/FLUX.1-schnell',
      width: 512,
      height: 512
    })
  };

  try {
    const res = await fetch(url, options);
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Data:', data);
  } catch (e) {
    console.error(e);
  }
}

testSF('sk-dpqgfpxsutmsdawhmqevcozsssfavqwbpcwvixdkeyxgsmxl');
