// server.js
import express from "express";
import axios from "axios";
import xml2js from "xml2js";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // serve your HTML/JS/CSS

const CUSTOMER_NUMBER = process.env.CP_CUSTOMER_NUMBER;
const USERNAME = process.env.CP_USERNAME;
const PASSWORD = process.env.CP_PASSWORD;
const ORIGIN_POSTAL = process.env.ORIGIN_POSTAL || "N0B1M0";

const API_URL = "https://ct.soa-gw.canadapost.ca/rs/ship/price";

// --- API endpoint for checkout ---
app.post("/checkout/get-rates", async (req, res) => {
  try {
    const { destPostal, weight = 0.015 } = req.body;

    if (!destPostal)
      return res.status(400).json({ error: "Destination postal code required." });

    const xmlRequest = `
      <mailing-scenario xmlns="http://www.canadapost.ca/ws/ship/rate-v4">
        <customer-number>${CUSTOMER_NUMBER}</customer-number>
        <parcel-characteristics>
          <weight>${weight}</weight>
        </parcel-characteristics>
        <origin-postal-code>${ORIGIN_POSTAL}</origin-postal-code>
        <destination>
          <domestic>
            <postal-code>${destPostal}</postal-code>
          </domestic>
        </destination>
      </mailing-scenario>
    `;

    const response = await axios.post(API_URL, xmlRequest, {
      headers: {
        "Content-Type": "application/vnd.cpc.ship.rate-v4+xml",
        Accept: "application/vnd.cpc.ship.rate-v4+xml",
      },
      auth: { username: USERNAME, password: PASSWORD },
    });

    xml2js.parseString(response.data, { explicitArray: false }, (err, result) => {
      if (err) return res.status(500).json({ error: "XML Parse Error" });

      const quotes = result["price-quotes"]["price-quote"];
      const rates = (Array.isArray(quotes) ? quotes : [quotes]).map((q) => ({
        service: q["service-name"],
        price: q["price-details"]["due"],
      }));

      res.json({ status: "success", rates });
    });
  } catch (error) {
    console.error("Canada Post Error:", error.message);
    res.status(500).json({ status: "error", message: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
