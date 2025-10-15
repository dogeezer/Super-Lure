// server.js
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch'; // Node 18+ can use global fetch

const app = express();
const PORT = process.env.PORT || 3000;

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Production Canada Post credentials ---
const CANADAPOST_USERNAME = '399dd571f6bd9717';
const CANADAPOST_PASSWORD = '0c44766df20c50f62771a9';
const CANADAPOST_URL = 'https://ws.canadapost.ca/rs/ship/price'; // Production URL

// --- Canada Post Rate API ---
app.post('/api/canadapost-rate', async (req, res) => {
  const { postal, country, weight, length, width, height } = req.body;

  if (!postal || !weight || !length || !width || !height) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const xml = `
<mailing-scenario xmlns="http://www.canadapost.ca/ws/ship/rate-v4">
  <customer-number>0001223271</customer-number>
  <parcel-characteristics>
    <weight>${weight}</weight>
    <dimensions>
      <length>${length}</length>
      <width>${width}</width>
      <height>${height}</height>
    </dimensions>
  </parcel-characteristics>
  <origin-postal-code>M5V3L9</origin-postal-code>
  <destination>
    <domestic>
      <postal-code>${postal}</postal-code>
    </domestic>
  </destination>
</mailing-scenario>
`;

    const response = await fetch(CANADAPOST_URL, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${CANADAPOST_USERNAME}:${CANADAPOST_PASSWORD}`).toString('base64'),
        'Content-Type': 'application/vnd.cpc.ship.rate-v4+xml',
        'Accept': 'application/vnd.cpc.ship.rate-v4+xml'
      },
      body: xml
    });

    const xmlText = await response.text();

    if (!response.ok) {
      return res.status(500).json({ error: 'Canada Post API error', details: xmlText });
    }

    // Minimal parsing to get service names and prices
    const rates = [];
    const regex = /<service-name>(.*?)<\/service-name>[\s\S]*?<price>(.*?)<\/price>/g;
    let match;
    while ((match = regex.exec(xmlText)) !== null) {
      rates.push({ name: match[1], price: parseFloat(match[2]) });
    }

    // Log the XML response for debugging
    console.log('Canada Post XML Response:', xmlText);

    res.json(rates);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Serve checkout.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
});

app.listen(PORT, () => console.log(`N0B1M0 checkout server running on port ${PORT}`));
