async function testEndpoints() {
  const urls = [
    'https://zenlove.me/api/templates',
    'https://zenlove.me/api/template',
    'https://zenlove.me/api/v1/templates',
    'https://zenlove.me/api/landing/templates',
    'https://api.zenlove.me/templates',
    'https://api.zenlove.me/api/v1/templates'
  ];

  for (const u of urls) {
    try {
      const res = await fetch(u, { headers: { 'Accept': 'application/json' } });
      console.log(u, res.status, res.headers.get('content-type'));
      if (res.ok) {
        const data = await res.text();
        console.log('Response preview:', data.slice(0, 300));
      }
    } catch(e) {
      console.log(u, 'Failed:', e.message);
    }
  }
}

testEndpoints();
