<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Checkout</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 500px; margin: 30px auto; }
  input, select, button { width: 100%; margin: 5px 0; padding: 10px; }
</style>
</head>
<body>
<h2>Checkout</h2>
<form id="checkoutForm">
  <input type="text" id="name" placeholder="Full Name" required />
  <input type="email" id="email" placeholder="Email" required />
  <input type="text" id="address" placeholder="Address" required />
  <input type="text" id="phone" placeholder="Phone Number" required />
  <input type="text" id="postal" placeholder="Postal Code" required />
  <select id="country">
    <option value="CA">Canada</option>
    <option value="US">United States</option>
    <option value="GB">United Kingdom</option>
    <option value="AU">Australia</option>
    <option value="FR">France</option>
    <option value="DE">Germany</option>
    <option value="JP">Japan</option>
  </select>
  <input type="number" id="weight" placeholder="Package weight (kg)" required />
  <button type="submit">Calculate Shipping</button>
</form>

<div id="results"></div>

<script>
const form = document.getElementById('checkoutForm');
const results = document.getElementById('results');

form.addEventListener('submit', async e => {
  e.preventDefault();
  results.textContent = 'Calculating...';

  const postalCode = document.getElementById('postal').value;
  const country = document.getElementById('country').value;
  const weight = document.getElementById('weight').value;

  const res = await fetch('/calculate-shipping', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postalCode, country, weight })
  });

  const data = await res.json();
  if (data.error) {
    results.innerHTML = `<p style="color:red;">${data.error}</p>`;
  } else {
    results.innerHTML = '<h3>Shipping Rates</h3>' + 
      data.rates.map(r => `<p>${r.service}: $${r.price}</p>`).join('');
  }
});
</script>
</body>
</html>
