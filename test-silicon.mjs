async function test(url, key) {
  try {
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${key}`, 'accept': 'application/json' } });
    console.log(url, res.status, await res.text());
  } catch(e) { console.error(e.message); }
}

async function run() {
  const k1 = 'sk-dpqgfpxsutmsdawhmqevcozsssfavqwbpcwvixdkeyxgsmxl';
  const k2 = 'sk-zloqwwhnmmlqlgcpurlknxxxtkrodvgcbtdwtvwyldbzxujw';
  
  await test('https://api.siliconflow.com/v1/user/info', k1);
  await test('https://api.siliconflow.cn/v1/user/info', k1);
  await test('https://api.siliconflow.com/v1/user/info', k2);
  await test('https://api.siliconflow.cn/v1/user/info', k2);
}
run();
