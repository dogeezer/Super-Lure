const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('<h1>Super Lure is live!</h1><p>Welcome to the site.</p>');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});