// server.js
const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const cors = require('cors');

// Create app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Home page
app.get('/', (req, res) => {
  res.send('<h1>Welcome to Super Lure Sandbox</h1><p>Use POST /get-rates to get Canada Post sandbox rates.</p>');
});

// Canada Post sandbox credentials from environment variables
const CUSTOMER_NUMBER = process.env.CP_CUSTOMER_NUMBER; // Sandbox customer number
const USERNAME = process.env.CP_USERNAME;               // Sandbox API username
const PASSWORD = process.env.CP_PASSWORD;               // Sandbox API password

// Sandbox API URL
const API_URL = 'https://ct.soa-gw.canadapost.ca/rs/ship/price';

// Endpoint to get Canada Post rates
app.post('/get-rates', async (req, res) => {
  try {
    const { originPostal, destPostal, weight, length, width, height } = req.body;

    if (!originPostal || !destPostal || !weight || !length || !width || !height) {
      return res.json({ status: 'error', error: 'Missing required fields in request body' });
    }

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

    // Send request to Canada Post sandbox
    const response = await axios.post(API_URL, xmlRequest, {
      headers: {
        'Content-Type': 'application/vnd.cpc.ship.rate-v4+xml',
        Accept: 'application/vnd.cpc.ship.rate-v4+xml',
      },
      auth: {
        username: USERNAME,
        password: PASSWORD,
      },
    });

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

// Optional test endpoint for quick sandbox check
app.get('/test-rate', async (req, res) => {
  req.body = {
    originPostal: 'L4L9BK',
    destPostal: 'L4B2B9',
    weight: 1,
    length: 13,
    width: 13,
    height: 5
  };
  return app._router.handle(req, res, () => {});
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
