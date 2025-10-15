require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Example shipping calculator endpoint
app.post('/calculate-shipping', async (req, res) => {
  try {
    // Normally you'd use real parcel info here.
    const response = await fetch("https://ct.soa-gw.canadapost.ca/rs/ship/price", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(process.env.CANADA_POST_API_KEY).toString('base64')}`,
        "Accept": "application/vnd.cpc.ship.rate-v4+xml",
        "Content-Type": "application/vnd.cpc.ship.rate-v4+xml",
      },
      body: `
        <mailing-scenario xmlns="http://www.canadapost.ca/ws/ship/rate-v4">
          <customer-number>2004381</customer-number>
          <parcel-characteristics>
            <weight>1.5</weight>
          </parcel-characteristics>
          <origin-postal-code>K1A0B1</origin-postal-code>
          <destination>
            <domestic>
              <postal-code>K1A0B1</postal-code>
            </domestic>
          </destination>
        </mailing-scenario>
      `
    });

    const text = await response.text();
    res.send(text);
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));