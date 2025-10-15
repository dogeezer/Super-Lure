// server.js (ES module)
import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import { Parser } from 'xml2js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Canada Post API info
const CANADA_POST_API = 'https://soa-gw.canadapost.ca/rs/ship/rate-v4';
const CUSTOMER_NUMBER = '0001223271';
const API_USER = '399dd571f6bd9717';
const API_PASS = '0c44766df20c50f62771a9';

app.post('/api/canadapost-rate', async (req, res) => {
  try {
    const { postalCode } = req.body;

    const xmlRequest = `
      <mailing-scenario xmlns="http://www.canadapost.ca/ws/ship/rate-v4">
        <customer-number>${CUSTOMER_NUMBER}</customer-number>
        <parcel-characteristics>
          <weight>0.015</weight>
          <dimensions>
            <length>15</length>
            <width>5</width>
            <height>10</height>
          </dimensions>
        </parcel-characteristics>
        <origin-postal-code>N0B1M0</origin-postal-code>
        <destination>
          <domestic>
            <postal-code>${postalCode}</postal-code>
          </domestic>
        </destination>
      </mailing-scenario>
    `;

    const response = await fetch(CANADA_POST_API, {
      method: 'POST',
      body: xmlRequest,
      headers: {
        'Content-Type': 'application/vnd.cpc.ship.rate-v4+xml',
        Accept: 'application/vnd.cpc.ship.rate-v4+xml',
        Authorization: 'Basic ' + Buffer.from(`${API_USER}:${API_PASS}`).toString('base64'),
      },
    });

    const xml = await response.text();
    const parser = new Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(xml);

    const quotesRaw = result['price-quotes']['price-quote'];
    const quotes = Array.isArray(quotesRaw) ? quotesRaw : [quotesRaw];

    const shippingRates = quotes.map(q => ({
      service: q['service-name'],
      due: parseFloat(q['price-details']['due']),
      expectedDelivery: q['service-standard']['expected-delivery-date'],
    }));

    res.json({ success: true, shippingRates });
  } catch (err) {
    console.error('Canada Post API error:', err);
    res.status(500).json({ success: false, error: 'Failed to get rates' });
  }
});

app.listen(10000, () => {
  console.log('N0B1M0 server running on port 10000');
});
