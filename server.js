// server.js
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

// Setup __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Canada Post API credentials
const ENV = 'sandbox'; // change to 'production' when live
const CUSTOMER_NUMBER = '0001223271';
const USERNAME = '399dd571f6bd9717';
const PASSWORD = '0c44766df20c50f62771a9';
const SERVICE_URL = ENV === 'sandbox'
  ? 'https://ct.soa-gw.canadapost.ca/rs/ship/price'
  : 'https://soa-gw.canadapost.ca/rs/ship/price';

// --- API endpoint ---
app.post('/api/canadapost-rate', async (req, res) => {
  const { postal, weight, length, width, height } = req.body;

  if (!postal) return res.status(400).json({ error: 'Missing postal code' });

  const originPostalCode = 'N0B1M0'; // your origin
  const xmlRequest = `<?xml version="1.0" encoding="UTF-8"?>
<mailing-scenario xmlns="http://www.canadapost.ca/ws/ship/rate-v4">
  <customer-number>${CUSTOMER_NUMBER}</customer-number>
  <parcel-characteristics>
    <weight>${weight || 0.015}</weight>
    <dimensions>
      <length>${length || 15}</length>
      <width>${width || 5}</width>
      <height>${height || 10}</height>
    </dimensions>
  </parcel-characteristics>
  <origin-postal-code>${originPostalCode}</origin-postal-code>
  <destination>
    <domestic>
      <postal-code>${postal}</postal-code>
    </domestic>
  </destination>
</mailing-scenario>`;

  try {
    const response = await fetch(SERVICE_URL, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64'),
        'Content-Type': 'application/vnd.cpc.ship.rate-v4+xml',
        Accept: 'application/vnd.cpc.ship.rate-v4+xml'
      },
      body: xmlRequest
    });

    const xmlText = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        status: 'error',
        error: 'Canada Post API error',
        details: xmlText
      });
    }

    // --- Parse minimal XML (regex-based, like SimpleXML) ---
    const rates = [];
    const quoteRegex = /<price-quote>[\s\S]*?<service-name>(.*?)<\/service-name>[\s\S]*?<due>(.*?)<\/due>[\s\S]*?<\/price-quote>/g;
    let match;
    while ((match = quoteRegex.exec(xmlText)) !== null) {
      rates.push({ service: match[1], price: parseFloat(match[2]) });
    }

    return res.json({ status: 'success', rates });
  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({ status: 'error', error: 'Server error' });
  }
});

// Serve checkout.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ N0B1M0 Canada Post rate server running on port ${PORT}`);
});
