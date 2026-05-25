const https = require('https');

const URL = 'https://financeiro-tcc-backend.onrender.com/api/health';

setInterval(() => {
  https.get(URL, (res) => {
    console.log(`[keep-alive] ping ${new Date().toLocaleTimeString()} — status ${res.statusCode}`);
  }).on('error', (e) => {
    console.error('[keep-alive] erro:', e.message);
  });
}, 10 * 60 * 1000);

module.exports = {};