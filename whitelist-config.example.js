/**
 * Dudes Craft — Whitelist runtime configuration (template)
 *
 * Copy this file to `whitelist-config.js` and fill in your real values.
 * `whitelist-config.js` is in .gitignore so the URL stays private.
 *
 * The whitelist form POSTs to sheetEndpoint after step 4 is complete.
 * See apps-script/README.md for how to create and deploy the Web App URL.
 */

window.BLOCKBIT_CONFIG = {
  // Google Apps Script Web App URL ending in /exec.
  // Example: 'https://script.google.com/macros/s/AKfycbx.../exec'
  sheetEndpoint: '',

  // Optional human-readable label shown to users after submission.
  collectionName: 'Dudes Craft Genesis',

  // Maximum retries on network failure before showing a hard error.
  maxRetries: 2,

  // Request timeout in milliseconds.
  timeoutMs: 10000
};