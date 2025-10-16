import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import xml2js from 'xml2js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const CP_USER = 'YOUR_CANADAPOST_USERNAME';
const CP_PASS = 'YOUR_CANADAPOST_PASSWORD';
const ORIGIN_POSTAL = 'N0B1M0';

// Canada Post API endpoint
const CP_HOST = 'ct.soa-gw.canadapost.ca'; // sandbox; prod is 'soa-gw.canadapost.ca'

app.post('/calculate-shipping', async (req, res) => {
  const { postalCode, country, weight } = req.body;

  const xml = `
  <mailing-scenario xmlns="http://www.canadapost.ca/ws/ship/rate-v4">
    <customer-number>${CP_USER}</customer-number>
    <parcel-characteristics>
      <weight>${weight}</weight>
    </parcel-characteristics>
    <origin-postal-code>${ORIGIN_POSTAL}</origin-postal-code>
    <destination>
      ${country.toUpperCase() === 'CA'
        ? `<domestic><postal-code>${postalCode}</postal-code></domestic>`
        : `<international><country-code>${country}</country-code></international>`}
    </destination>
  </mailing-scenario>`;

  const options = {
    hostname: CP_HOST,
    path: '/rs/ship/price',
    method: 'POST',
    auth: `${CP_USER}:${CP_PASS}`,
    headers: {
      'Content-Type': 'application/vnd.cpc.ship.rate-v4+xml',
      'Accept': 'application/vnd.cpc.ship.rate-v4+xml'
    }
  };

  const request = https.request(options, response => {
    let data = '';
    response.on('data', chunk => data += chunk);
    response.on('end', async () => {
      try {
        const parsed = await xml2js.parseStringPromise(data);
        const quotes = parsed['price-quotes']?.['price-quote'] || [];
        const rates = quotes.map(pq => ({
          service: pq['service-code']?.[0],
          price: pq['price-details']?.[0]['due']?.[0]?._ || 'N/A'
        }));
        res.json({ rates });
      } catch (err) {
        console.error('Parse error:', err);
        res.status(500).json({ error: 'Failed to parse Canada Post response' });
      }
    });
  });

  request.on('error', err => {
    console.error('Canada Post request failed:', err);
    res.status(500).json({ error: 'Failed to contact Canada Post' });
  });

  request.write(xml);
  request.end();
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
