async function calculateShipping() {
  const button = document.getElementById("shipping-btn");
  button.disabled = true;
  button.textContent = "Calculating...";

  try {
    const res = await fetch("/calculate-shipping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });

    const text = await res.text();
    document.getElementById("shipping-result").innerText = text;
  } catch (err) {
    document.getElementById("shipping-result").innerText = "Error: " + err.message;
  }

  button.disabled = false;
  button.textContent = "Check Shipping Cost";
}
