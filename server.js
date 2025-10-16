import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const CANADA_POST_USER = "dff97199c141452c";
const CANADA_POST_PASS = "50ac9a124b447a12304947";
const ORIGIN_POSTAL_CODE = "N0B1M0";

// Route to calculate shipping
app.post("/checkout/get-rates", async (req, res) => {
  const { destinationPostalCode, country } = req.body;

  if (!destinationPostalCode || !country) {
    return res.status(400).json({ error: "Missing postal code or country" });
  }

  try {
    const xmlRequest = `<?xml version="1.0" encoding="UTF-8"?>
<mailing-scenario xmlns="http://www.canadapost.ca/ws/ship/rate-v4">
  <customer-number>${CANADA_POST_USER}</customer-number>
  <parcel-characteristics>
    <weight>0.015</weight>
  </parcel-characteristics>
  <origin-postal-code>${ORIGIN_POSTAL_CODE}</origin-postal-code>
  <destination>
    <country-code>${country}</country-code>
    <postal-zip-code>${destinationPostalCode}</postal-zip-code>
  </destination>
</mailing-scenario>`;

    const response = await axios.post(
      "https://ct.soa-gw.canadapost.ca/rs/ship/price",
      xmlRequest,
      {
        headers: {
          "Content-Type": "application/vnd.cpc.ship.rate-v4+xml",
          Accept: "application/vnd.cpc.ship.rate-v4+xml",
        },
        auth: {
          username: CANADA_POST_USER,
          password: CANADA_POST_PASS,
        },
      }
    );

    res.type("application/xml").send(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get rates" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "checkout.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
