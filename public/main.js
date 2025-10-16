document.getElementById("calculate").addEventListener("click", async () => {
  const postalCode = document.getElementById("postalCode").value;
  const country = document.getElementById("country").value;
  const resultDiv = document.getElementById("shipping-result");
  resultDiv.innerHTML = "Calculating...";

  try {
    const response = await fetch("/get-rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destinationPostalCode: postalCode, country }),
    });

    if (!response.ok) throw new Error("Failed to get rates");
    const text = await response.text();
    resultDiv.innerHTML = `<pre>${text}</pre>`;
  } catch (err) {
    resultDiv.innerHTML = "Error calculating shipping.";
    console.error(err);
  }
});
