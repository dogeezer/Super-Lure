const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Example endpoint for shipping (replace with your real API)
app.post("/get-shipping", (req, res) => {
  const { postalCode } = req.body;
  // TODO: integrate Canada Post or other shipping calculation
  const shippingCost = 1.28 * 2; // demo: 2 items × 1.28
  res.send(`$${shippingCost.toFixed(2)} CAD`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));