// server.js
import express from "express";
import bodyParser from "body-parser";
import path from "path";
import fetch from "node-fetch"; // make sure you installed this: npm install node-fetch
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

// Resolve dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// === Canada Post credentials ===
const CANADAPOST_USERNAME = "399dd571f6bd9717";
const CANADAPOST_PASSWORD = "0c44766df20c50f62771a9";
const CUSTOMER_NUMBER = "0001223271"; // your customer number here
const ORIGIN_POSTAL_CODE = "N0B1M0"; // your origin
const CANADAPOST_URL = "https://soa-gw.canadapost.ca/rs/ship/price";

// === API route ===
app.post("/api/canadapost-rate", async (req, res) => {
  const { postal, country, weight, length, width, height } = req.body;

  if (!postal || !weight || !length || !width || !height) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const xml = `
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
  <origin-postal-code>${ORIGIN_POSTAL_CODE}</origin-postal-code>
  <destination>
    ${country.toUpperCase() === "CA"
      ? `<domestic><postal-code>${postal}</postal-code></domestic>`
      : `<international><country-code>${country}</country-code></international>`}
  </destination>
</mailing-scenario>
  `;

  try {
    const response = await fetch(CANADAPOST_URL, {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${CANADAPOST_USERNAME}:${CANADAPOST_PASSWORD}`).toString(
            "base64"
          ),
        "Content-Type": "application/vnd.cpc.ship.rate-v4+xml",
        Accept: "application/vnd.cpc.ship.rate-v4+xml",
      },
      body: xml,
    });

    const xmlText = await response.text();

    if (!response.ok) {
      console.error("Canada Post Error:", xmlText);
      return res.status(500).json({ error: "Canada Post API error", details: xmlText });
    }

    const rates = [];
    const regex = /<service-name>(.*?)<\/service-name>[\s\S]*?<price>(.*?)<\/price>/g;
    let match;
    while ((match = regex.exec(xmlText)) !== null) {
      rates.push({ name: match[1], price: parseFloat(match[2]) });
    }

    res.json({ rates });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// === Serve your checkout page ===
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "checkout.html"));
});
// Serve the first page (cart + shipping)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
});

// Serve the payment page
app.get('/checkout', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'payment.html'));
});
app.listen(PORT, () => console.log(`✅ Super-Lure server running on port ${PORT}`));
