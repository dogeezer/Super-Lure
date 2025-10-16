import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(bodyParser.json());

// 1️⃣ Define the /checkout/get-rates POST route
app.post("/checkout/get-rates", async (req, res) => {
  console.log("GET RATES HIT"); // <- debug, check logs
  const { destinationPostalCode, country } = req.body;

  if (!destinationPostalCode || !country) {
    return res.status(400).json({ error: "Missing postal code or country" });
  }

  // Placeholder: here’s where you call Canada Post API later
  res.json({ success: true, country, postalCode: destinationPostalCode });
});

// 2️⃣ Serve frontend
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "checkout.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
