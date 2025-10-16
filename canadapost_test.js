import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

const ORIGIN_POSTAL_CODE = "N0B1M0";

app.post("/checkout/get-rates", async (req, res) => {
  const { destinationPostalCode, country } = req.body;

  if (!destinationPostalCode || !country) {
    return res.status(400).json({ error: "Missing postal code or country" });
  }

  const xmlRequest = `<?xml version="1.0" encoding="UTF-8"?>
<mailing-scenario xmlns="http://www.canadapost.ca/ws/ship/rate-v4">
  <customer-number>${process.env.CANADA_POST_USER}</customer-number>
  <parcel-characteristics>
    <weight>0.015</weight>
  </parcel-characteristics>
  <origin-postal-code>${ORIGIN_POSTAL_CODE}</origin-postal-code>
  <destination>
    <country-code>${country}</country-code>
    <postal-zip-code>${destinationPostalCode}</postal-zip-code>
  </destination>
</mailing-scenario>`;

  try {
    const response = await axios.post(
      "https://ct.soa-gw.canadapost.ca/rs/ship/price",
      xmlRequest,
      {
        headers: {
          "Content-Type": "application/vnd.cpc.ship.rate-v4+xml",
          Accept: "application/vnd.cpc.ship.rate-v4+xml",
        },
        auth: {
          username: process.env.CANADA_POST_USER,
          password: process.env.CANADA_POST_PASS,
        },
      }
    );

    res.type("application/xml").send(response.data);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error fetching shipping rates.");
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "checkout.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
