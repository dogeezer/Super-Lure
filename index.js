const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Route for homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route for checkout page
app.get('/checkout', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});