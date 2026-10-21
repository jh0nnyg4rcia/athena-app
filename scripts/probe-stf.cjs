const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, data: d }));
    }).on('error', reject);
  });
}

(async () => {
  const p = await get('https://portal.stf.jus.br/jurisprudencia/jurisprudencia.asp');
  console.log('Status:', p.status);
  const re = /<script[^>]*src=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(p.data)) !== null) {
    if (m[1].includes('jurisprudencia') || m[1].includes('pesquisa')) {
      console.log('Script:', m[1]);
    }
  }
})();
