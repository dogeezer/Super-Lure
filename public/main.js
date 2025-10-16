document.getElementById("checkoutForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const postalCode = document.getElementById("postalCode").value.trim();
  const country = document.getElementById("country").value;

  if (!postalCode || !country) {
    document.getElementById("shippingResult").innerText = "Please enter postal code and country.";
    return;
  }

  try {
    const response = await fetch("/checkout/get-rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destinationPostalCode: postalCode, country }),
    });

    if (!response.ok) throw new Error("Error calculating shipping.");

    const text = await response.text();
    document.getElementById("shippingResult").innerText = text;
  } catch (err) {
    console.error(err);
    document.getElementById("shippingResult").innerText = "Error calculating shipping.";
  }
});
