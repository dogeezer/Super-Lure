async function getShipping() {
  const response = await fetch('/shipping');
  const data = await response.json();
  console.log(data); // or display it in HTML
}

getShipping();
