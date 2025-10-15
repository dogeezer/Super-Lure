// server.js
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // to call external APIs
require('dotenv').config(); // for environment variables

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // serve your HTML/JS from 'public' folder

// Example route for Canada Post shipping (POST /get-shipping)
app.post('/get-shipping', async (req, res) => {
  const { postalCode } = req.body;

  // Canada Post API credentials from environment variables
  const username = process.env.CANADAPOST_USERNAME;
  const password = process.env.CANADAPOST_PASSWORD;

  if (!username || !password) return res.status(500).send('Canada Post credentials missing');

  try {
    // Example: dummy fixed shipping calculation
    // Replace this with real Canada Post API call if you want
    const shippingCost = 5.00; // default $5 flat rate
    res.send(`$${shippingCost.toFixed(2)} CAD`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error calculating shipping');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
