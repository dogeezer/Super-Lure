import express from 'express';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Canada Post API example endpoint
app.post('/calculate-shipping', async (req, res) => {
  const { postalCode, country, weight } = req.body;
  
  // Replace with your Canada Post credentials
  const CANADA_POST_USER = 'dff97199c141452c';
  const CANADA_POST_PASS = '50ac9a124b447a12304947';
  
  const originPostal = 'N0B1M0'; // your origin
  const destinationPostal = postalCode;
  const destinationCountry = country;
  
  // Simple Canada Post API URL (REST example)
  const url = `https://ct.soa-gw.canadapost.ca/rs/ship/price`;
  
  try {
    // This is a placeholder — Canada Post uses XML requests
    // You would need to construct an XML body with weight, origin, destination
    // Here we just return a dummy value for testing
    const shippingCost = weight * 2.5; // dummy calculation
    res.json({ shipping: shippingCost.toFixed(2) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error calculating shipping' });
  }
});

// Serve checkout page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
