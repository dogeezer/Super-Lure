// index.js
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all origins (you can restrict later if needed)
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Serve static files (your HTML/CSS/JS)
app.use(express.static("public")); // put your checkout HTML in a folder called "public"

/* --------------------------
   Canada Post /get-shipping
   -------------------------- */
app.post("/get-shipping", async (req, res) => {
  const { postalCode } = req.body;

  if (!postalCode) return res.status(400).send("Postal code is required");

  try {
    // Canada Post API URL (example for domestic rates)
    const url = `https://ct.soa-gw.canadapost.ca/rs/ship/price`; 
    // NOTE: You'll need the correct API endpoint from Canada Post for shipping quotes

    const response = await fetch(url, {
      method: "GET", // or POST depending on API
      headers: {
        "Accept": "application/vnd.cpc.ship.rate-v4+xml", // Canada Post XML response
        "Authorization": "Basic " + Buffer.from(`${process.env.CP_USER}:${process.env.CP_KEY}`).toString("base64")
      }
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).send(text);
    }

    const shippingData = await response.text(); // or parse XML if needed
    res.send(shippingData);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching shipping rates");
  }
});

/* --------------------------
   Start server
   -------------------------- */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
