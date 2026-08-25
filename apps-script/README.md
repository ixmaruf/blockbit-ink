# Whitelist Backend — Google Sheets

This document explains how to wire the `whitelist.html` form up to a private Google Sheet so every submission lands in a spreadsheet only you (the project admin) can see.

## Why this approach?

- **Free** — no hosting, no database, no monthly bill.
- **Spreadsheet-native** — review submissions, sort/filter by clan, and export to CSV directly from the sheet.
- **Google Apps Script** — Apps Script Web Apps give us a POST endpoint with a real `doPost(e)` handler, schema validation, and rate limiting.

## Architecture

```
┌──────────────────┐     POST {twitter,wallet,clan,serial}      ┌──────────────────────┐
│  whitelist.html  │ ──────────────────────────────────────────▶ │ Apps Script Web App  │
│  (whitelist.js)  │     Content-Type: text/plain;charset=utf-8   │ (Code.gs deployed    │
└──────────────────┘     body = JSON.stringify({...})             │  as "Anyone")        │
                                                                   └──────────┬───────────┘
                                                                              │ appendRow
                                                                              ▼
                                                                   ┌──────────────────────┐
                                                                   │ Google Sheet         │
                                                                   │ "Submissions" tab    │
                                                                   │ (only you see)       │
                                                                   └──────────────────────┘
```

## Setup (one time, ~5 minutes)

1. **Create a Google Sheet**
   - Go to https://sheets.google.com → **+ Blank**.
   - Rename `Sheet1` to `Submissions` (bottom-left tab). The Apps Script reads/writes this exact tab name.
   - You can leave the sheet open in your browser — submissions will appear in real time.

2. **Open the Apps Script editor**
   - In the Sheet: **Extensions → Apps Script**.
   - A new tab opens with a stub `function myFunction() {}`. Delete it.

3. **Paste the script**
   - Open `apps-script/Code.gs` from this repo, copy the entire content, paste it into the Apps Script editor.
   - Press **Ctrl/Cmd + S** to save. Name the project `Blockbit Ink Whitelist`.

4. **Initialise the header row (one click)**
   - In the Apps Script editor, ensure the function dropdown (top toolbar) shows `setupSheet`.
   - Click **Run**. The first time it will prompt for Google authorization — review the permissions and allow.
   - Switch back to your Sheet. You should see a frozen header row:
     ```
     Timestamp | Twitter Handle | Wallet Address | Clan | Serial | User Agent | IP Hint
     ```
   - (The `IP Hint` column will normally be empty because Apps Script can't read the client's IP. Keep it for future use.)

5. **Deploy as a Web App**
   - In the Apps Script editor: top-right **Deploy → New deployment**.
   - Click the gear icon ⚙ → **Web app**.
   - Configure:
     - **Description:** `Blockbit Ink whitelist collector v1`
     - **Execute as:** `Me (your-email@gmail.com)`
     - **Who has access:** `Anyone`
       - Use `Anyone with a Google account` if you want a soft spam guard (only signed-in Google users can submit). Trade-off: real users have to sign in.
   - Click **Deploy**.
   - Copy the **Web app URL** — it will end with `/exec`. Treat this URL like a password.

6. **Wire the URL into the website**
   - In the project root, copy `whitelist-config.example.js` → `whitelist-config.js`.
   - Paste the URL into the `sheetEndpoint` field.
   - `whitelist-config.js` is gitignored — your URL never leaves your machine.

7. **Test end-to-end**
   - Open `whitelist.html` locally (`node server.js` → http://localhost:3456/whitelist.html).
   - Walk through all four steps.
   - Check the Sheet — your row should appear within ~1 second.

## Operational notes

### Submission limits

The Apps Script enforces:
- **Strict format validation** — Twitter handle regex, EVM address regex, clan ∈ {Kaze, Honoo, Mizu, Tsuchi, Hikari, Kage}, serial matches `BBI-####-XXXXXX`.
- **One submission per wallet** — `MAX_PER_WALLET = 1`. To allow multiple, edit the constant in `Code.gs`.
- **Rate limit** — `MIN_INTERVAL_MS = 30s` between consecutive submissions for the same wallet.

### What the admin sees

The Sheet shows:
| Timestamp | Twitter Handle | Wallet Address | Clan | Serial | User Agent | IP Hint |
|---|---|---|---|---|---|---|
| 2026-08-25 14:32:11 | @BlockbitInk | 0x742d…bD18 | Honoo | BBI-0421-A9F3C1 | Mozilla/5.0… | |

The `Twitter Handle` column is normalised to include the leading `@`. The `Wallet Address` column preserves the user's input verbatim (no normalisation, so checksummed addresses round-trip cleanly).

### Exporting to OpenSea Allowlist

OpenSea Allowlist CSV requires `wallet_address` and (optionally) `email` columns. Run this in any empty cell of the Sheet:

```
=ARRAYFORMULA(
  TEXT(D2:D, "0") & "," & B2:B
)
```

…then copy the result column and save as `opensea_allowlist.csv`. For 1,999 entries you may want to use **Extensions → Macros** with a small Apps Script that writes the file to Drive — happy to add this if you need it.

### Updating the script later

When you change `Code.gs`:
1. In the Apps Script editor: **Deploy → Manage deployments → pencil icon → Version: New version → Deploy**.
2. The Web App URL stays the same — your `whitelist-config.js` keeps working.
3. If you change the deployment access setting, you get a new URL.

### Why not just hardcode the URL?

Two reasons:
1. **Security** — keeping the URL out of git prevents it from being indexed by search engines and prevents abuse if the repo is ever made public.
2. **Rotation** — if you ever need to invalidate the endpoint, you can deploy a new version OR a brand new web app and swap the URL in `whitelist-config.js`. The rest of the site is untouched.

### Quotas

Apps Script free tier:
- **URL Fetch calls: 100 / day** (your web app POST counts as one)
- **Script runtime: 90 min / day**
- **Triggers total runtime: 90 min / day**

For a 1,999-NFT whitelist with one submission per user, you will never hit these limits.

### Disabling submissions

To close the whitelist, redeploy the web app and select **Who has access: Only myself**. Existing `whitelist-config.js` will get HTTP 403 from the URL, and `whitelist.js` will display a friendly error.

## Verifying the setup works

After deploying, you can run a one-off test in any browser console:

```javascript
fetch('YOUR_WEB_APP_URL', {
  method: 'POST',
  body: JSON.stringify({
    twitter: 'BlockbitTest',
    wallet: '0x0000000000000000000000000000000000000001',
    clan: 'Kaze',
    serial: 'BBI-0001-AAAA00'
  })
}).then(r => r.json()).then(console.log);
```

You should see `{ ok: true, message: 'Whitelist submission recorded.', serial: 'BBI-0001-AAAA00' }` and a new row in the Sheet.

If you see `{ ok: false, error: '...' }`, double-check the deployment is **Execute as: Me** and **Who has access: Anyone**.

## Roadmap (optional enhancements)

1. **Wallet signature verification** — have the client ask the wallet to sign a message like `I want to join Blockbit Ink whitelist at blockbitink.xyz`. Apps Script can verify the signature with `ethers.js` via the `cWeb3` library or a tiny SHA3 helper. Adds genuine proof-of-ownership.
2. **Discord webhook notification** — in `doPost`, also ping a Discord channel webhook so you see submissions on mobile.
3. **Auto-approve/deny columns** — add `Status` and `Notes` columns; admin manually reviews each one.
4. **OpenSea CSV export endpoint** — a separate web app that returns the CSV directly.