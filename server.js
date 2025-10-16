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

// Canada Post credentials
const CP_USER = 'YOUR_CANADAPOST_USERNAME';
const CP_PASS = 'YOUR_CANADAPOST_PASSWORD';
const ORIGIN_POSTAL = 'N0B1M0'; // your postal code

// Calculate shipping
app.post('/calculate-shipping', async (req, res) => {
  const { postalCode, country, weight } = req.body;

  const requestXML = `
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
    </mailing-scenario>
  `;

  const options = {
    hostname: 'ct.soa-gw.canadapost.ca',
    path: '/rs/ship/price',
    method: 'POST',
    auth: `${CP_USER}:${CP_PASS}`,
    headers: {
      'Content-Type': 'application/vnd.cpc.ship.rate-v4+xml',
      'Accept': 'application/vnd.cpc.ship.rate-v4+xml',
    },
  };

  const request = https.request(options, (response) => {
    let data = '';
    response.on('data', chunk => data += chunk);
    response.on('end', async () => {
      try {
        const parsed = await xml2js.parseStringPromise(data);
        const rates = parsed['price-quotes']['price-quote'].map(pq => ({
          service: pq['service-code'][0],
          price: pq['price-details'][0]['due'][0]['$']['value']
        }));
        res.json({ rates });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error parsing Canada Post response' });
      }
    });
  });

  request.on('error', (err) => {
    console.error(err);
    res.status(500).json({ error: 'Error contacting Canada Post API' });
  });

  request.write(requestXML);
  request.end();
});

// Serve checkout page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
