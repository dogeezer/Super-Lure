// main.js
import express from "express";
import axios from "axios";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

const CANADA_POST_USER = "dff97199c141452c";
const CANADA_POST_PASS = "50ac9a124b447a12304947";
const ORIGIN_POSTAL_CODE = "N0B1M0";

// Shipping rates route
app.post("/get-rates", async (req, res) => {
  try {
    const { destinationPostalCode, country } = req.body;

    if (!destinationPostalCode || !country) {
      return res.status(400).json({ error: "Missing postal code or country" });
    }

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
    console.error("Canada Post API Error:", err.message);
    res.status(500).json({ error: "Failed to get rates" });
  }
});
