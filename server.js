// server.js
const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const cors = require('cors');
// server.js (or app.js)

// 1. Import express
const app = express();

// 2. Middleware to parse JSON
app.use(express.json()); // allows your server to read POST JSON

// 3. Serve static files (your HTML, CSS, JS)
app.use(express.static('public')); // <-- put your index.html, checkout.html, and JS in a folder called 'public'

// 4. POST route for shipping rates
app.post('/checkout/get-rates', (req, res) => {
  const { cart, destPostal } = req.body;

  // Example calculation (replace with your real shipping API later)
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = cart.reduce((sum, item) => sum + item.qty * 1.28, 0); // $1.28 per item
  const total = subtotal + shipping;

  res.json({ subtotal, shipping, total });
});

// 5. Start the server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
// Create app
const app = express();

// Middleware
app.use(cors());           // allow cross-origin requests
app.use(express.json());   // parse JSON request bodies
app.use(express.static('public'));
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
    // Use request body or fallback defaults
    const {
      originPostal = 'N0B1M0',
      destPostal = 'L4B2B9',
      weight = 0.15,
      length = 15,
      width = 5,
      height = 10
    } = req.body || {};

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

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
