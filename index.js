import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import cors from 'cors';
import { parseStringPromise } from 'xml2js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

app.post('/get-shipping', async (req, res) => {
  try {
    const { postalCode, weight } = req.body;

    if (!postalCode || !weight) {
      return res.status(400).json({ error: 'postalCode and weight are required' });
    }

    const xmlRequest = `
      <mailing-scenario xmlns="http://www.canadapost.ca/ws/ship/rate-v4">
        <parcel-characteristics>
          <weight>${weight}</weight>
        </parcel-characteristics>
        <origin-postal-code>${process.env.ORIGIN_POSTAL_CODE}</origin-postal-code>
        <destination>
          <domestic>
            <postal-code>${postalCode}</postal-code>
          </domestic>
        </destination>
      </mailing-scenario>
    `;

    const response = await fetch('https://ct.soa-gw.canadapost.ca/rs/ship/price', {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.cpc.ship.rate-v4+xml',
        'Content-Type': 'application/vnd.cpc.ship.rate-v4+xml',
        'Authorization': `Basic ${Buffer.from(`${process.env.CPC_USER}:${process.env.CPC_PASS}`).toString('base64')}`,
      },
      body: xmlRequest
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).send(text);
    }

    const xmlResponse = await response.text();
    const result = await parseStringPromise(xmlResponse, { explicitArray: false });
    res.json(result);
  } catch (error) {
    console.error('Error fetching rates:', error);
    res.status(500).json({ error: 'Failed to fetch shipping rates' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
