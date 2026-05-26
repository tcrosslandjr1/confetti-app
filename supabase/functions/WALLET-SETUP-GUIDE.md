# Confetti Wallet Pass — Setup & Deployment Guide

## Overview

Two Supabase Edge Functions power wallet passes:

| Function | Purpose |
|---|---|
| `generate-wallet-pass` | Creates new Apple/Google Wallet passes for Confetti Black subscribers |
| `update-wallet-pass` | Updates balances after redemption, handles Apple web service callbacks, revokes passes |

---

## Step 1: Google Cloud Setup

Your project: **hazel-planet-496714-r8** (free trial)

### 1a. Enable the Google Wallet API

1. Go to https://console.cloud.google.com/apis/library
2. Search **"Google Wallet API"**
3. Click **Enable**

### 1b. Create a Service Account

1. Go to https://console.cloud.google.com/iam-admin/serviceaccounts
2. Click **Create Service Account**
3. Name: `confetti-wallet`
4. Role: **Editor** (or create a custom role with Wallet permissions)
5. Click **Done**
6. Click the new service account → **Keys** tab → **Add Key** → **Create new key** → **JSON**
7. Download the JSON file — this is your `GOOGLE_WALLET_SERVICE_ACCOUNT_JSON`

### 1c. Get Your Wallet Issuer ID

1. Go to https://pay.google.com/business/console
2. If first time: Click **Get started** → accept terms
3. Your **Issuer ID** is shown at the top (a numeric string like `3388000000012345678`)
4. Under **Manage** → **API access**, add your service account email as a user

### 1d. Set Supabase Secrets

In Supabase Dashboard → Edge Functions → Secrets:

```
GOOGLE_WALLET_ISSUER_ID = 3388000000012345678
GOOGLE_WALLET_SERVICE_ACCOUNT_JSON = {"type":"service_account","project_id":"hazel-planet-496714-r8",...}
```

Paste the **entire JSON file contents** as the value (one line, no line breaks).

---

## Step 2: Apple Developer Setup

### 2a. Enroll in Apple Developer Program

1. Go to https://developer.apple.com/programs/enroll/
2. Cost: $99/year
3. You need this to create Pass Type IDs and certificates

### 2b. Create a Pass Type ID

1. Go to https://developer.apple.com/account/resources/identifiers/list/passTypeId
2. Click **+** → select **Pass Type IDs**
3. Description: `Confetti Black`
4. Identifier: `pass.app.confetti.black`
5. Click **Register**

### 2c. Create a Pass Certificate

1. Click your new Pass Type ID → **Create Certificate**
2. Upload a Certificate Signing Request (CSR):
   - Open **Keychain Access** on Mac → Certificate Assistant → Request a Certificate
   - Save to disk
3. Upload the CSR, download the `.cer` file
4. Double-click the `.cer` to install in Keychain
5. In Keychain Access, find the certificate, right-click → **Export** as `.p12`
6. Set a password (this is `APPLE_PASS_CERT_PASSWORD`)
7. Base64-encode the .p12:
   ```bash
   base64 -i Certificates.p12 -o cert.txt
   ```
   The contents of `cert.txt` is your `APPLE_PASS_CERT_P12_BASE64`

### 2d. Download Apple WWDR Certificate

1. Download from https://www.apple.com/certificateauthority/
2. Get the **"Apple Worldwide Developer Relations Certification Authority"** cert
3. The G4 cert (valid through 2030) is recommended
4. Export as PEM format:
   ```bash
   openssl x509 -in AppleWWDRCAG4.cer -inform DER -out wwdr.pem -outform PEM
   ```
5. The contents of `wwdr.pem` is your `APPLE_WWDR_CERT_PEM`

### 2e. Create an APNs Auth Key (for push updates)

1. Go to https://developer.apple.com/account/resources/authkeys/list
2. Click **+** → enable **Apple Push Notifications service (APNs)**
3. Download the `.p8` file (you can only download it once!)
4. Note the **Key ID** shown
5. Base64-encode the .p8:
   ```bash
   base64 -i AuthKey_XXXXXXXXXX.p8 -o apns_key.txt
   ```

### 2f. Set Supabase Secrets

```
APPLE_PASS_TYPE_ID = pass.app.confetti.black
APPLE_TEAM_ID = YOUR_10_CHAR_TEAM_ID
APPLE_PASS_CERT_P12_BASE64 = (contents of cert.txt)
APPLE_PASS_CERT_PASSWORD = (password you set when exporting .p12)
APPLE_WWDR_CERT_PEM = (contents of wwdr.pem — include BEGIN/END lines)
APPLE_APNS_KEY_P8_BASE64 = (contents of apns_key.txt)
APPLE_APNS_KEY_ID = (10-char key ID from Apple Developer)
```

---

## Step 3: Deploy Edge Functions

### Using Supabase CLI

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy both functions
supabase functions deploy generate-wallet-pass
supabase functions deploy update-wallet-pass
```

### Via GitHub (auto-deploy)

Push to your repo — Vercel/Supabase CI auto-deploys edge functions from `supabase/functions/`.

---

## Step 4: Test

### Generate a Google Wallet pass

```bash
curl -X POST \
  'https://YOUR_PROJECT.supabase.co/functions/v1/generate-wallet-pass' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "test-user-1",
    "platform": "google",
    "creditBalance": 150.00,
    "memberName": "Tyrone Crossland"
  }'
```

Response includes a `saveUrl` — open it on an Android device or Chrome to add to Google Wallet.

### Update a pass balance

```bash
curl -X POST \
  'https://YOUR_PROJECT.supabase.co/functions/v1/update-wallet-pass?action=update' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "serialNumber": "CNFT-XXXXXXXX",
    "platform": "google",
    "newBalance": 100.00,
    "memberName": "Tyrone Crossland",
    "userId": "test-user-1"
  }'
```

### Redeem via barcode

```bash
curl -X POST \
  'https://YOUR_PROJECT.supabase.co/functions/v1/update-wallet-pass?action=redeem' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "barcode": "ABC12345",
    "amount": 50.00,
    "venue": "Rare Steakhouse"
  }'
```

---

## Step 5: Connect Frontend

In your React code, call the edge functions via Supabase client:

```typescript
import { supabase } from "@/integrations/supabase/client";

// Generate a new pass
const { data, error } = await supabase.functions.invoke("generate-wallet-pass", {
  body: {
    userId: user.id,
    platform: "google", // or "apple" or "both"
    creditBalance: 150.00,
    memberName: user.name,
  },
});

// data.google.saveUrl → redirect user to add pass
// data.apple.passUrl → serve as download for .pkpass

// Update balance after redemption
await supabase.functions.invoke("update-wallet-pass", {
  body: {
    serialNumber: pass.serialNumber,
    platform: pass.platform,
    newBalance: newBalance,
    memberName: user.name,
    userId: user.id,
  },
});
```

---

## Architecture

```
┌─────────────┐     POST /generate-wallet-pass     ┌──────────────────┐
│  Confetti    │ ──────────────────────────────────► │  Supabase Edge   │
│  React App   │                                     │  Function        │
│              │ ◄────── { saveUrl / passUrl } ───── │                  │
└─────────────┘                                     └───────┬──────────┘
      │                                                      │
      │  POST /update-wallet-pass?action=update              │
      │ ────────────────────────────────────────────►         │
      │                                                      │
      │                                          ┌───────────▼──────────┐
      │                                          │  Google Wallet API   │
      │                                          │  (REST / PATCH)      │
      │                                          └──────────────────────┘
      │                                          ┌──────────────────────┐
      │                                          │  Apple APNs          │
      │                                          │  (push → refresh)   │
      │                                          └──────────────────────┘
```

---

## Secrets Checklist

| Secret | Source | Status |
|---|---|---|
| `GOOGLE_WALLET_ISSUER_ID` | Google Pay Console | ⬜ Need to set up |
| `GOOGLE_WALLET_SERVICE_ACCOUNT_JSON` | Google Cloud IAM | ⬜ Need to create |
| `APPLE_PASS_TYPE_ID` | Apple Developer | ⬜ Need $99 enrollment |
| `APPLE_TEAM_ID` | Apple Developer | ⬜ Need enrollment |
| `APPLE_PASS_CERT_P12_BASE64` | Apple Developer | ⬜ Need enrollment |
| `APPLE_PASS_CERT_PASSWORD` | You set this | ⬜ Need enrollment |
| `APPLE_WWDR_CERT_PEM` | apple.com/certificateauthority | ⬜ Can download now |
| `APPLE_APNS_KEY_P8_BASE64` | Apple Developer | ⬜ Need enrollment |
| `APPLE_APNS_KEY_ID` | Apple Developer | ⬜ Need enrollment |

**Start with Google** — it's free and you already have the Cloud project. Apple requires the $99/year developer enrollment.
