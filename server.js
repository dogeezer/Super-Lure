import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config'; // Required to load .env variables
import fetch from 'node-fetch'; // For making HTTP requests
import { parseString } from 'xml2js'; // For parsing XML response

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from 'public' folder (Assuming your HTML/JS are here)
app.use(express.static(join(__dirname, 'public')));

// Basic test route
app.get('/test', (req, res) => {
    res.send('Server is working!');
});

// --- CANADA POST RATING API ENDPOINT ---
app.post('/api/get-shipping-rates', async (req, res) => {
    // 1. Get credentials from environment variables
    const username = process.env.CPC_USER;
    const password = process.env.CPC_PASS;
    const originPostalCode = process.env.ORIGIN_POSTAL_CODE;

    if (!username || !password || !originPostalCode) {
        return res.status(500).json({ error: 'Canada Post credentials or origin postal code are missing in environment variables.' });
    }
    
    // 2. Extract destination and package details from request body (e.g., from your checkout form)
    // NOTE: This is a placeholder. You need to send this data from your frontend.
    const { 
        destinationPostalCode = 'H3C 3J7', // Example: Montreal, QC
        weight = 1.0, // kg
        length = 10, // cm
        width = 10, // cm
        height = 10 // cm
    } = req.body;

    // 3. Construct the XML request body for the Canada Post API
    const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<mailing-scenario xmlns="http://www.canadapost.ca/ws/ship/rate-v4">
  <customer-number>2004386</customer-number>
  <parcel-characteristics>
    <weight>${weight.toFixed(2)}</weight>
    <dimensions>
      <length>${length.toFixed(2)}</length>
      <width>${width.toFixed(2)}</width>
      <height>${height.toFixed(2)}</height>
    </dimensions>
  </parcel-characteristics>
  <origin-postal-code>${originPostalCode}</origin-postal-code>
  <destination>
    <domestic>
      <postal-code>${destinationPostalCode.replace(/\s/g, '').toUpperCase()}</postal-code>
    </domestic>
  </destination>
</mailing-scenario>`;

    // 4. Set up the API endpoint and Basic Authentication header
    const apiEndpoint = 'https://ct.soa-gw.canadapost.ca/rs/ship/price'; // Certification (Test) endpoint
    // Use the production endpoint for live rates: 
    // const apiEndpoint = 'https://soa-gw.canadapost.ca/rs/ship/price';
    
    const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;

    try {
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Accept': 'application/vnd.cpc.ship.rate-v4+xml',
                'Content-Type': 'application/vnd.cpc.ship.rate-v4+xml',
            },
            body: xmlBody,
        });

        const xmlResponse = await response.text();

        // 5. Parse the XML response
        parseString(xmlResponse, { explicitArray: false }, (err, result) => {
            if (err) {
                console.error('Error parsing XML:', err);
                return res.status(500).json({ error: 'Failed to parse Canada Post response.' });
            }

            // Check for errors in the CP response (e.g., invalid postal code)
            if (result['mailing-scenario:price-quotes'] && result['mailing-scenario:price-quotes']['price-quote']) {
                // Success: Transform the quotes into a cleaner JSON format
                const quotes = Array.isArray(result['mailing-scenario:price-quotes']['price-quote'])
                    ? result['mailing-scenario:price-quotes']['price-quote']
                    : [result['mailing-scenario:price-quotes']['price-quote']];

                const rates = quotes.map(quote => ({
                    serviceName: quote['service-name'],
                    price: parseFloat(quote['price-details']['due']),
                    deliveryDate: quote['service-standard']['expected-delivery-date'],
                    currency: quote['price-details']['currency']
                }));
                
                res.json(rates);
            } else if (result['mailing-scenario:messages'] && result['mailing-scenario:messages']['message']) {
                // CP API returned an error message
                const error = result['mailing-scenario:messages']['message'];
                console.error('Canada Post Error:', error);
                res.status(400).json({ 
                    error: 'Canada Post API Error', 
                    message: error.description
                });
            } else {
                // Unexpected response structure
                res.status(500).json({ error: 'Unexpected response from Canada Post API.' });
            }
        });

    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ error: 'Failed to connect to Canada Post API.' });
    }
});
// --- END OF CANADA POST RATING API ENDPOINT ---

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
