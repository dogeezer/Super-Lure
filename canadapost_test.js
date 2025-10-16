// canadapost_test.js
// Ready-to-run Canada Post sandbox example

import CanadaPostClient from './lib/canadapost.js'; // <-- This is from GitHub repo
import dotenv from 'dotenv';
dotenv.config();

// ---- Your sandbox credentials ----
const cpc = new CanadaPostClient(
  'dff97199c141452c',   // CPC_USERNAME
  '50ac9a124b447a12304947', // CPC_PASSWORD
  '000122327'            // CPC_CUSTOMER
);

// ---- Example: get domestic shipping rates ----
async function main() {
  try {
    const rates = await cpc.getRates({
      parcelCharacteristics: { weight: 1 },
      originPostalCode: 'V5C2H2',   // Your origin
      destination: { domestic: { postalCode: 'V0N1B6' } } // Destination
    });
    console.log('Shipping Rates:', rates);
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
