import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Get Canada Post shipping rates
 * @param {string} originPostal - e.g., "K2B8J6"
 * @param {string} destPostal - e.g., "J0E1X0"
 * @param {number} weight - in kg
 */
export async function getCanadaPostRate(originPostal, destPostal, weight=1) {
  const url = 'https://ct.soa-gw.canadapost.ca/rs/ship/price';
  
  const xmlBody = `
  <mailing-scenario xmlns="http://www.canadapost.ca/ws/ship/rate-v4">
    <customer-number>${process.env.CPC_USER}</customer-number>
    <parcel-characteristics>
      <weight>${weight}</weight>
    </parcel-characteristics>
    <origin-postal-code>${originPostal}</origin-postal-code>
    <destination>
      <domestic>
        <postal-code>${destPostal}</postal-code>
      </domestic>
    </destination>
  </mailing-scenario>`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/vnd.cpc.ship.rate-v4+xml',
      'Accept': 'application/vnd.cpc.ship.rate-v4+xml',
      'Authorization': 'Basic ' + Buffer.from(`${process.env.CPC_USER}:${process.env.CPC_PASS}`).toString('base64')
    },
    body: xmlBody
  });

  if (!response.ok) {
    throw new Error(`Canada Post API error: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  return text; // XML response
}
