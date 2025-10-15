const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(express.json());

app.get("/api/shipping", (req, res) => {
  const { country, qty } = req.query;
  const baseRate = 1.25;
  const rate = country === "Canada" ? 1.15 : 1.35;
  const total = (qty || 1) * baseRate * rate;
  res.json({ shipping: total });
});

app.listen(port, () => console.log(`✅ Server running on ${port}`));
