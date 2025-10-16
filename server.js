// server.js
const CP_USERNAME = process.env.CP_USERNAME;
const CP_PASSWORD = process.env.CP_PASSWORD;
const CP_CUSTOMER_NUMBER = process.env.CP_CUSTOMER_NUMBER;
const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const cors = require('cors');
app.use(cors()); // Add this near the top, after creating `app`

const app = express();
app.use(express.json());
app.get('/', (req, res) => {
  res.send('<h1>Welcome to Super Lure</h1><p>Use POST /get-rates to get Canada Post rates.</p>');
});
// Canada Post credentials from Render environment
const CUSTOMER_NUMBER = process.env.CP_CUSTOMER_NUMBER;
const USERNAME = process.env.CP_USERNAME;
const PASSWORD = process.env.CP_PASSWORD;

// Example endpoint: /get-rates
app.post('/get-rates', async (req, res) => {
  try {
    const { originPostal, destPostal, weight, length, width, height } = req.body;

    // Build XML request
    const xmlRequest = `
      <mailing-scenario xmlns="http://www.canadapost.ca/ws/ship/rate-v4">
        <customer-number>${CUSTOMER_NUMBER}</customer-number>
        <parcel-characteristics>
          <weight>${weight}</weight>
          <dimensions>
            <length>${length}</length>
            <width>${width}</width>
            <height>${height}</height>
          </dimensions>
        </parcel-characteristics>
        <origin-postal-code>${originPostal}</origin-postal-code>
        <destination>
          <domestic>
            <postal-code>${destPostal}</postal-code>
          </domestic>
        </destination>
      </mailing-scenario>
    `;

    const response = await axios.post(
      'https://soa-gw.canadapost.ca/rs/ship/price',
      xmlRequest,
      {
        headers: {
          'Content-Type': 'application/vnd.cpc.ship.rate-v4+xml',
          Accept: 'application/vnd.cpc.ship.rate-v4+xml',
        },
        auth: {
          username: USERNAME,
          password: PASSWORD,
        },
      }
    );

    // Parse XML to JSON
    xml2js.parseString(response.data, { explicitArray: false }, (err, result) => {
      if (err) return res.json({ status: 'error', error: 'XML Parsing Failed' });

      const rates = [];
      const quotes = result['price-quotes']?.['price-quote'];
      if (quotes) {
        (Array.isArray(quotes) ? quotes : [quotes]).forEach(q => {
          rates.push({
            service: q['service-name'],
            price: q['price-details']?.due
          });
        });
      }

      res.json({ status: 'success', rates });
    });

  } catch (e) {
    res.json({ status: 'error', error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
