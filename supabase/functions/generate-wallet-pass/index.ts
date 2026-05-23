/**
 * Supabase Edge Function: generate-wallet-pass
 *
 * Generates real Apple Wallet (.pkpass) and Google Wallet passes
 * for Confetti Black subscribers.
 *
 * Required secrets (set in Supabase Dashboard → Edge Functions → Secrets):
 *   APPLE_PASS_TYPE_ID        — e.g. "pass.app.confetti.black"
 *   APPLE_TEAM_ID             — 10-char Apple Developer Team ID
 *   APPLE_PASS_CERT_P12_BASE64 — Base64-encoded .p12 certificate
 *   APPLE_PASS_CERT_PASSWORD  — Password for the .p12 file
 *   APPLE_WWDR_CERT_PEM       — Apple WWDR intermediate cert (PEM)
 *   GOOGLE_WALLET_ISSUER_ID   — From Google Pay & Wallet Console
 *   GOOGLE_WALLET_SERVICE_ACCOUNT_JSON — Full JSON key for service account
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import {
  encode as base64Encode,
  decode as base64Decode,
} from "https://deno.land/std@0.208.0/encoding/base64.ts";
import { crypto } from "https://deno.land/std@0.208.0/crypto/mod.ts";

// ─── CORS ────────────────────────────────────────────────
import { getCorsHeaders } from "../_shared/cors.ts";

// ─── Types ───────────────────────────────────────────────
interface PassRequest {
  userId: string;
  platform: "apple" | "google" | "both";
  creditBalance: number;
  memberName: string;
  serialNumber?: string; // optional — auto-generated if omitted
}

interface PassResponse {
  apple?: {
    serialNumber: string;
    barcode: string;
    passUrl: string; // data URL for .pkpass download
  };
  google?: {
    serialNumber: string;
    barcode: string;
    saveUrl: string; // Google Wallet "Add to Wallet" link
  };
}

// ─── Helpers ─────────────────────────────────────────────

function generateSerial(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "CNFT-";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function generateBarcode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/** SHA-1 hash a Uint8Array and return hex string */
async function sha1Hex(data: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-1", data);
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Create a minimal ZIP archive from a map of filename→Uint8Array entries */
function createZip(
  files: Map<string, Uint8Array>
): Uint8Array {
  const entries: {
    name: Uint8Array;
    data: Uint8Array;
    crc: number;
    offset: number;
  }[] = [];

  // CRC32 lookup table
  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crcTable[i] = c;
  }
  function crc32(data: Uint8Array): number {
    let crc = 0xffffffff;
    for (let i = 0; i < data.length; i++)
      crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  const parts: Uint8Array[] = [];
  let offset = 0;

  // Local file entries
  for (const [filename, data] of files) {
    const nameBytes = new TextEncoder().encode(filename);
    const crc = crc32(data);
    entries.push({ name: nameBytes, data, crc, offset });

    // Local file header (30 bytes + name + data)
    const header = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true); // signature
    view.setUint16(4, 20, true); // version needed
    view.setUint16(6, 0, true); // flags
    view.setUint16(8, 0, true); // compression: stored
    view.setUint16(10, 0, true); // mod time
    view.setUint16(12, 0, true); // mod date
    view.setUint32(14, crc, true); // crc32
    view.setUint32(18, data.length, true); // compressed size
    view.setUint32(22, data.length, true); // uncompressed size
    view.setUint16(26, nameBytes.length, true); // name length
    view.setUint16(28, 0, true); // extra length
    header.set(nameBytes, 30);

    parts.push(header);
    parts.push(data);
    offset += header.length + data.length;
  }

  // Central directory
  const cdStart = offset;
  for (const entry of entries) {
    const cd = new Uint8Array(46 + entry.name.length);
    const cdView = new DataView(cd.buffer);
    cdView.setUint32(0, 0x02014b50, true); // signature
    cdView.setUint16(4, 20, true); // version made by
    cdView.setUint16(6, 20, true); // version needed
    cdView.setUint16(8, 0, true); // flags
    cdView.setUint16(10, 0, true); // compression
    cdView.setUint16(12, 0, true); // mod time
    cdView.setUint16(14, 0, true); // mod date
    cdView.setUint32(16, entry.crc, true);
    cdView.setUint32(20, entry.data.length, true);
    cdView.setUint32(24, entry.data.length, true);
    cdView.setUint16(28, entry.name.length, true);
    cdView.setUint16(30, 0, true); // extra length
    cdView.setUint16(32, 0, true); // comment length
    cdView.setUint16(34, 0, true); // disk start
    cdView.setUint16(36, 0, true); // internal attrs
    cdView.setUint32(38, 0, true); // external attrs
    cdView.setUint32(42, entry.offset, true); // local header offset
    cd.set(entry.name, 46);
    parts.push(cd);
    offset += cd.length;
  }

  // End of central directory
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(4, 0, true);
  eocdView.setUint16(6, 0, true);
  eocdView.setUint16(8, entries.length, true);
  eocdView.setUint16(10, entries.length, true);
  eocdView.setUint32(12, offset - cdStart, true);
  eocdView.setUint32(16, cdStart, true);
  eocdView.setUint16(20, 0, true);
  parts.push(eocd);

  // Concatenate
  const totalLen = parts.reduce((s, p) => s + p.length, 0);
  const result = new Uint8Array(totalLen);
  let pos = 0;
  for (const p of parts) {
    result.set(p, pos);
    pos += p.length;
  }
  return result;
}

// ─── Apple Wallet Pass ───────────────────────────────────

/**
 * Build an Apple Wallet .pkpass file (ZIP archive).
 *
 * NOTE: Full .pkpass signing requires PKCS#7 (CMS) signature generation
 * which needs the Apple certificate + WWDR cert. Deno's crypto.subtle
 * does not support CMS/PKCS7 natively. For production, either:
 *   a) Use a Deno PKCS7 library (e.g., pkcs7-padding + forge via esm.sh)
 *   b) Delegate signing to a Cloud Function with Node.js + passkit-generator
 *   c) Use a signing microservice
 *
 * This implementation builds the complete pass bundle structure.
 * The signing step is marked with TODO — once you have the certs,
 * plug in the signing library.
 */
async function buildApplePass(
  serial: string,
  barcode: string,
  creditBalance: number,
  memberName: string
): Promise<{ pkpassBase64: string; passUrl: string }> {
  const passTypeId = Deno.env.get("APPLE_PASS_TYPE_ID")!;
  const teamId = Deno.env.get("APPLE_TEAM_ID")!;

  // pass.json — the core pass definition
  const passJson = {
    formatVersion: 1,
    passTypeIdentifier: passTypeId,
    teamIdentifier: teamId,
    serialNumber: serial,
    organizationName: "Confetti",
    description: "Confetti Black — Outing Credit",
    logoText: "Confetti",
    foregroundColor: "rgb(255, 255, 255)",
    backgroundColor: "rgb(44, 27, 105)", // Confetti purple
    labelColor: "rgb(200, 180, 255)",
    // Web service for pass updates (set your Supabase function URL)
    webServiceURL: `${Deno.env.get("SUPABASE_URL")}/functions/v1/update-wallet-pass`,
    authenticationToken: serial, // in production, use a secure token
    storeCard: {
      headerFields: [
        {
          key: "balance",
          label: "CREDIT",
          value: `$${creditBalance.toFixed(2)}`,
          changeMessage: "Your Confetti credit is now %@",
        },
      ],
      primaryFields: [
        {
          key: "member",
          label: "MEMBER",
          value: memberName,
        },
      ],
      secondaryFields: [
        {
          key: "tier",
          label: "TIER",
          value: "Black",
        },
        {
          key: "serial",
          label: "PASS #",
          value: serial,
        },
      ],
      backFields: [
        {
          key: "howto",
          label: "HOW TO USE",
          value:
            "Show this pass to your server at any restaurant or bar. They'll scan the QR code to apply your Confetti credit to your bill.",
        },
        {
          key: "support",
          label: "SUPPORT",
          value: "support@confetti.app",
        },
      ],
    },
    barcodes: [
      {
        format: "PKBarcodeFormatQR",
        message: barcode,
        messageEncoding: "iso-8859-1",
        altText: barcode,
      },
    ],
    barcode: {
      format: "PKBarcodeFormatQR",
      message: barcode,
      messageEncoding: "iso-8859-1",
      altText: barcode,
    },
  };

  const passJsonBytes = new TextEncoder().encode(JSON.stringify(passJson));

  // Minimal 1x1 transparent PNG for required images (replace with real branding)
  // This is a valid 1x1 white PNG
  const placeholderPng = base64Decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
  );

  // Build manifest.json (SHA-1 hashes of all files)
  const fileMap = new Map<string, Uint8Array>();
  fileMap.set("pass.json", passJsonBytes);
  fileMap.set("icon.png", placeholderPng);
  fileMap.set("icon@2x.png", placeholderPng);
  fileMap.set("logo.png", placeholderPng);
  fileMap.set("logo@2x.png", placeholderPng);

  const manifest: Record<string, string> = {};
  for (const [name, data] of fileMap) {
    manifest[name] = await sha1Hex(data);
  }
  const manifestBytes = new TextEncoder().encode(JSON.stringify(manifest));
  fileMap.set("manifest.json", manifestBytes);

  // TODO: PKCS#7 signature
  // In production, sign manifest.json with your Apple Pass certificate:
  //
  //   import { createPkcs7Signature } from "./signing.ts";
  //   const certP12 = base64Decode(Deno.env.get("APPLE_PASS_CERT_P12_BASE64")!);
  //   const certPassword = Deno.env.get("APPLE_PASS_CERT_PASSWORD")!;
  //   const wwdrPem = Deno.env.get("APPLE_WWDR_CERT_PEM")!;
  //   const signature = await createPkcs7Signature(manifestBytes, certP12, certPassword, wwdrPem);
  //   fileMap.set("signature", signature);
  //
  // Without signature, the pass won't install on real devices.
  // For development/testing, you can use Apple's Wallet pass validator.

  // Create .pkpass (ZIP archive)
  const pkpassBytes = createZip(fileMap);
  const pkpassBase64 = base64Encode(pkpassBytes);

  return {
    pkpassBase64,
    passUrl: `data:application/vnd.apple.pkpass;base64,${pkpassBase64}`,
  };
}

// ─── Google Wallet Pass ──────────────────────────────────

/** Create a JWT for Google Wallet API authentication */
async function getGoogleAccessToken(): Promise<string> {
  const saJson = JSON.parse(Deno.env.get("GOOGLE_WALLET_SERVICE_ACCOUNT_JSON")!);

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: saJson.client_email,
    scope: "https://www.googleapis.com/auth/wallet_object.issuer",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  // Encode header.payload
  const encHeader = base64Encode(JSON.stringify(header))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const encPayload = base64Encode(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const unsignedToken = `${encHeader}.${encPayload}`;

  // Import private key and sign
  const pemKey = saJson.private_key;
  const pemBody = pemKey
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const keyData = base64Decode(pemBody);

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const sig = base64Encode(new Uint8Array(signatureBuffer))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const jwt = `${unsignedToken}.${sig}`;

  // Exchange JWT for access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error(`Google auth failed: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}

/** Ensure the LoyaltyClass exists (run once, idempotent) */
async function ensureGoogleLoyaltyClass(accessToken: string): Promise<void> {
  const issuerId = Deno.env.get("GOOGLE_WALLET_ISSUER_ID")!;
  const classId = `${issuerId}.confetti_black`;

  // Check if class already exists
  const checkRes = await fetch(
    `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass/${classId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (checkRes.status === 200) return; // already exists

  // Create the class
  const loyaltyClass = {
    id: classId,
    issuerName: "Confetti",
    programName: "Confetti Black",
    programLogo: {
      sourceUri: {
        uri: "https://confetti.app/logo-wallet.png",
      },
      contentDescription: {
        defaultValue: { language: "en-US", value: "Confetti logo" },
      },
    },
    hexBackgroundColor: "#2C1B69",
    reviewStatus: "UNDER_REVIEW",
    countryCode: "US",
    heroImage: {
      sourceUri: {
        uri: "https://confetti.app/wallet-hero.png",
      },
      contentDescription: {
        defaultValue: { language: "en-US", value: "Confetti Black" },
      },
    },
  };

  const createRes = await fetch(
    "https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loyaltyClass),
    }
  );

  if (!createRes.ok && createRes.status !== 409) {
    const err = await createRes.text();
    throw new Error(`Failed to create LoyaltyClass: ${err}`);
  }
}

/** Create a Google Wallet LoyaltyObject and return the save URL */
async function buildGooglePass(
  serial: string,
  barcode: string,
  creditBalance: number,
  memberName: string
): Promise<{ saveUrl: string }> {
  const issuerId = Deno.env.get("GOOGLE_WALLET_ISSUER_ID")!;
  const accessToken = await getGoogleAccessToken();

  // Ensure class exists
  await ensureGoogleLoyaltyClass(accessToken);

  const objectId = `${issuerId}.confetti_black_${serial}`;
  const classId = `${issuerId}.confetti_black`;

  const loyaltyObject = {
    id: objectId,
    classId: classId,
    state: "ACTIVE",
    accountId: serial,
    accountName: memberName,
    loyaltyPoints: {
      label: "Outing Credit",
      balance: {
        money: {
          currencyCode: "USD",
          micros: String(Math.round(creditBalance * 1000000)),
        },
      },
    },
    barcode: {
      type: "QR_CODE",
      value: barcode,
      alternateText: barcode,
    },
    hexBackgroundColor: "#2C1B69",
    textModulesData: [
      {
        header: "HOW TO USE",
        body: "Show this pass to your server. They'll scan the QR code to apply your Confetti credit to your bill.",
      },
    ],
  };

  // Create the object
  const createRes = await fetch(
    "https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loyaltyObject),
    }
  );

  if (!createRes.ok && createRes.status !== 409) {
    const err = await createRes.text();
    throw new Error(`Failed to create LoyaltyObject: ${err}`);
  }

  // Build "Add to Google Wallet" JWT link
  const saJson = JSON.parse(Deno.env.get("GOOGLE_WALLET_SERVICE_ACCOUNT_JSON")!);
  const now = Math.floor(Date.now() / 1000);

  const jwtHeader = { alg: "RS256", typ: "JWT" };
  const jwtPayload = {
    iss: saJson.client_email,
    aud: "google",
    typ: "savetowallet",
    iat: now,
    origins: ["https://confetti.app"],
    payload: {
      loyaltyObjects: [{ id: objectId }],
    },
  };

  const encH = base64Encode(JSON.stringify(jwtHeader))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const encP = base64Encode(JSON.stringify(jwtPayload))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const unsigned = `${encH}.${encP}`;

  const pemKey = saJson.private_key;
  const pemBody = pemKey
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const keyData = base64Decode(pemBody);

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sigBuf = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsigned)
  );

  const sig = base64Encode(new Uint8Array(sigBuf))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const saveJwt = `${unsigned}.${sig}`;
  const saveUrl = `https://pay.google.com/gp/v/save/${saveJwt}`;

  return { saveUrl };
}

// ─── Main Handler ────────────────────────────────────────

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: PassRequest = await req.json();

    if (!body.userId || !body.platform || body.creditBalance == null || !body.memberName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: userId, platform, creditBalance, memberName" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serial = body.serialNumber || generateSerial();
    const barcode = generateBarcode();
    const response: PassResponse = {};

    // Generate Apple pass
    if (body.platform === "apple" || body.platform === "both") {
      const apple = await buildApplePass(serial, barcode, body.creditBalance, body.memberName);
      response.apple = {
        serialNumber: serial,
        barcode,
        passUrl: apple.passUrl,
      };
    }

    // Generate Google pass
    if (body.platform === "google" || body.platform === "both") {
      const google = await buildGooglePass(
        serial,
        barcode,
        body.creditBalance,
        body.memberName
      );
      response.google = {
        serialNumber: serial,
        barcode,
        saveUrl: google.saveUrl,
      };
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Wallet pass generation error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
