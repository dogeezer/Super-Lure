// server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // serve static files

// Example endpoint for shipping calculation (replace with your API logic)
app.post('/calculate-shipping', (req, res) => {
  const { weight } = req.body;
  // dummy calculation
  const shipping = weight * 2; 
  res.json({ shipping });
});

// Serve checkout page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
