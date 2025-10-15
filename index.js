require('dotenv').config();
const express = require('express');
const fetch = (...args) => import('node-fetch').then(m => m.default(...args));
const { parseStringPromise } = require('xml2js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper: build XML for Canada Post rate request
function buildMailingScenario({ weightKg, lengthCm, widthCm, heightCm, originPostal, destPostal, destCountry }) {
  // Canada Post XML format (rate-v4). Adjust fields if your account requires other nodes.
  // Using weight in KG (Canada Post expects weight in kg)
  return `<?xml version="1.0" encoding="UTF-8"?>
<mailing-scenario xmlns="http://www.canadapost.ca/ws/ship/rate-v4">
  <customer-number></customer-number>
  <parcel-characteristics>
    <weight>${weightKg}</weight>
    <dimension>
      <length>${lengthCm}</length>
      <width>${widthCm}</width>
      <height>${heightCm}</height>
    </dimension>
  </parcel-characteristics>
  <origin-postal-code>${originPostal}</origin-postal-code>
  <destination>
    ${destCountry === 'CA' ? `<domestic><postal-code>${destPostal}</postal-code></domestic>` :
      (destCountry === 'US' ? `<usa><postal-code>${destPostal}</postal-code></usa>` :
        `<international><country-code>${destCountry}</country-code></international>`)}
  </destination>
</mailing-scenario>`;
}

app.post('/calculate-shipping', async (req, res) => {
  try {
    // Request body expected: { destinationPostal, destinationCountry, weightKg?, lengthCm?, widthCm?, heightCm? }
    const {
      destinationPostal = '',
      destinationCountry = 'CA',
      weightKg = 0.2,      // default 0.2 kg (200g)
      lengthCm = 15,
      widthCm = 5,
      heightCm = 10
    } = req.body || {};

    const originPostal = process.env.ORIGIN_POSTAL || 'N0B1M0';
    const apiKey = process.env.CANADA_POST_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Server misconfigured: missing Canada Post API key' });

    const xmlBody = buildMailingScenario({
      weightKg,
      lengthCm,
      widthCm,
      heightCm,
      originPostal,
      destPostal: destinationPostal,
      destCountry: destinationCountry
    });

    // Canada Post rate endpoint (commercial test / CT gateway)
    const endpoint = 'https://ct.soa-gw.canadapost.ca/rs/ship/price';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(apiKey).toString('base64')}`,
        'Accept': 'application/vnd.cpc.ship.rate-v4+xml',
        'Content-Type': 'application/vnd.cpc.ship.rate-v4+xml'
      },
      body: xmlBody
    });

    const text = await response.text();

    // If non-2xx, return text for debugging
    if (!response.ok) {
      return res.status(response.status).send({ error: 'Canada Post error', details: text });
    }

    // Parse XML response
    const parsed = await parseStringPromise(text, { explicitArray: false, ignoreAttrs: true });

    // The structure varies; try to extract price-quote entries
    // Typical path: price-quotes > price-quote (array)
    const quotesRoot = parsed['price-quotes'] || parsed['price-quotes-response'] || parsed;
    let priceQuotes = [];

    if (quotesRoot && quotesRoot['price-quote']) {
      const pq = quotesRoot['price-quote'];
      if (Array.isArray(pq)) {
        priceQuotes = pq;
      } else {
        priceQuotes = [pq];
      }
    }

    // Map to simple JSON list {serviceName, serviceCode, price}
    const results = priceQuotes.map(q => {
      // price details may exist at q['price-details'] -> 'due' or 'total' depending on version
      const serviceName = q['service-name'] || q['service-code'] || '';
      let price = null;

      // Try common paths:
      if (q['price-details'] && q['price-details']['due']) price = q['price-details']['due'];
      else if (q['price-details'] && q['price-details']['total']) price = q['price-details']['total'];
      else if (q['price']) price = q['price'];
      // fallback: look for 'price-details' children concatenated
      if (price && typeof price === 'object') {
        // if price object has '_' or '#text'
        price = price._ || price['#text'] || JSON.stringify(price);
      }

      return {
        serviceName: serviceName,
        raw: q,
        price: price
      };
    });

    res.json({ success: true, results, rawXml: text });
  } catch (err) {
    console.error('Error /calculate-shipping:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});