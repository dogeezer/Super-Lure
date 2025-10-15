import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { parseStringPromise } from 'xml2js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// Canada Post Shipping API route
app.post('/shipping', async (req, res) => {
  try {
    const { destination_postal, weight, length, width, height } = req.body;

    const username = process.env.CPC_USER;
    const password = process.env.CPC_PASS;
    const origin_postal = process.env.ORIGIN_POSTAL_CODE;

    const url = `https://ct.soa-gw.canadapost.ca/rs/ship/price`;

    const xmlBody = `
      <mailing-scenario xmlns="http://www.canadapost.ca/ws/ship/rate-v4">
        <customer-number>${username}</customer-number>
        <parcel-characteristics>
          <weight>${weight}</weight>
          <dimensions>
            <length>${length}</length>
            <width>${width}</width>
            <height>${height}</height>
          </dimensions>
        </parcel-characteristics>
        <origin-postal-code>${origin_postal}</origin-postal-code>
        <destination>
          <domestic>
            <postal-code>${destination_postal}</postal-code>
          </domestic>
        </destination>
      </mailing-scenario>
    `;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
        'Content-Type': 'application/vnd.cpc.ship.rate-v4+xml',
        'Accept': 'application/vnd.cpc.ship.rate-v4+xml'
      },
      body: xmlBody
    });

    const text = await response.text();
    const result = await parseStringPromise(text, { explicitArray: false });

    let rates = [];
    if (result && result['price-quotes'] && result['price-quotes']['price-quote']) {
      const quotes = result['price-quotes']['price-quote'];
      if (Array.isArray(quotes)) {
        rates = quotes.map(q => ({
          service: q['service-name'],
          price: parseFloat(q['price-details']['due']).toFixed(2)
        }));
      } else {
        rates = [{
          service: quotes['service-name'],
          price: parseFloat(quotes['price-details']['due']).toFixed(2)
        }];
      }
    }

    res.json({ success: true, rates });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// fallback for SPA
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
