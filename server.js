// server.js
const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());                     // Allow cross-origin requests
app.use(express.json());             // Parse JSON request bodies
app.use(express.static('public'));   // Serve static files (HTML, CSS, JS)

// --- BASIC CHECKOUT CALCULATOR ENDPOINT ---
app.post('/checkout/get-rates', (req, res) => {
  const { cart, destPostal } = req.body;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = cart.reduce((sum, item) => sum + item.qty * 1.28, 0); // $1.28 per item
  const total = subtotal + shipping;

  res.json({ subtotal, shipping, total });
});

// --- HOME PAGE ---
app.get('/', (req, res) => {
  res.send('<h1>Welcome to Super Lure Sandbox</h1><p>Use POST /get-rates to get Canada Post sandbox rates.</p>');
});

// --- CANADA POST SANDBOX SETTINGS ---
const CUSTOMER_NUMBER = process.env.CP_CUSTOMER_NUMBER;
const USERNAME = process.env.CP_USERNAME;
const PASSWORD = process.env.CP_PASSWORD;
const API_URL = 'https://ct.soa-gw.canadapost.ca/rs/ship/price';

// --- CANADA POST RATE ENDPOINT ---
app.post('/get-rates', async (req, res) => {
  try {
    const {
      originPostal = 'N0B1M0',
      destPostal = 'L4B2B9',
      weight = 0.15,
      length = 15,
      width = 5,
      height = 10
    } = req.body || {};

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

// --- START SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
