import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(bodyParser.json());

// Define the route first
app.post("/checkout/get-rates", async (req, res) => {
  console.log("GET RATES HIT"); // debug
  const { destinationPostalCode, country } = req.body;
  if (!destinationPostalCode || !country) return res.status(400).json({ error: "Missing postal code or country" });
  // call Canada Post API here...
  res.json({ success: true, country, postalCode: destinationPostalCode });
});

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "checkout.html"));
});

app.listen(3000, () => console.log("✅ Server running on port 3000"));
