// canadapost_test.cjs
// Ready-to-run Canada Post sandbox example using CommonJS

require('dotenv').config();
const CanadaPostClient = require('./lib/canadapost.js'); // GitHub library

// ---- Your sandbox credentials ----
const cpc = new CanadaPostClient(
  'dff97199c141452c',       // CPC_USERNAME
  '50ac9a124b447a12304947', // CPC_PASSWORD
  '000122327'               // CPC_CUSTOMER
);

// ---- Example: get domestic shipping rates ----
async function main() {
  try {
    const rates = await cpc.getRates({
      parcelCharacteristics: { weight: 1 },
      originPostalCode: 'V5C2H2',         // Change as needed
      destination: { domestic: { postalCode: 'V0N1B6' } } // Change as needed
    });

    console.log('Sandbox Shipping Rates:', rates);
  } catch (err) {
    console.error('Error fetching rates:', err);
  }
}

main();
