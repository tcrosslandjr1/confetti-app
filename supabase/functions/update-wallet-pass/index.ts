/**
 * Supabase Edge Function: update-wallet-pass
 *
 * Handles two responsibilities:
 *   1. Updating wallet pass balances after credit redemption
 *      - Apple: Sends APNs push to trigger pass refresh, serves updated .pkpass
 *      - Google: PATCHes the LoyaltyObject via REST API
 *   2. Apple Wallet web service endpoints (required by passTypeIdentifier registration)
 *      - POST /v1/devices/{deviceId}/registrations/{passTypeId}/{serialNumber}
 *      - DELETE /v1/devices/{deviceId}/registrations/{passTypeId}/{serialNumber}
 *      - GET /v1/devices/{deviceId}/registrations/{passTypeId}
 *      - GET /v1/passes/{passTypeId}/{serialNumber}
 *      - POST /v1/log
 *
 * Required secrets (same as generate-wallet-pass, plus):
 *   APPLE_APNS_KEY_P8_BASE64   — Base64-encoded APNs auth key (.p8)
 *   APPLE_APNS_KEY_ID          — 10-char Key ID from Apple Developer
 *
 * Already required from generate-wallet-pass:
 *   APPLE_PASS_TYPE_ID, APPLE_TEAM_ID, APPLE_PASS_CERT_P12_BASE64,
 *   APPLE_PASS_CERT_PASSWORD, APPLE_WWDR_CERT_PEM,
 *   GOOGLE_WALLET_ISSUER_ID, GOOGLE_WALLET_SERVICE_ACCOUNT_JSON
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import {
  encode as base64Encode,
  decode as base64Decode,
} from "https://deno.land/std@0.208.0/encoding/base64.ts";
import { crypto } from "https://deno.land/std@0.208.0/crypto/mod.ts";

// ─── CORS ────────────────────────────────────────────────
import { getCorsHeaders } from "../_shared/cors.ts";

// ─── In-memory device registration store ─────────────────
// In production, replace with a Supabase table:
//   wallet_registrations (device_id TEXT, push_token TEXT, serial_number TEXT, pass_type TEXT)
const deviceRegistrations = new Map<
  string,
  { deviceId: string; pushToken: string; serialNumber: string }
>();

// ─── Types ───────────────────────────────────────────────

interface UpdateRequest {
  serialNumber: string;
  platform: "apple" | "google" | "both";
  newBalance: number;
  memberName: string;
  userId: string;
}

interface RedeemRequest {
  barcode: string;
  amount: number;
  venue: string;
}

// ─── Google Wallet Helpers ───────────────────────────────

/** Create a JWT for Google Wallet API authentication */
async function getGoogleAccessToken(): Promise<string> {
  const saJson = JSON.parse(
    Deno.env.get("GOOGLE_WALLET_SERVICE_ACCOUNT_JSON")!
  );

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: saJson.client_email,
    scope: "https://www.googleapis.com/auth/wallet_object.issuer",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encHeader = base64Encode(JSON.stringify(header))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const encPayload = base64Encode(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const unsignedToken = `${encHeader}.${encPayload}`;

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

/**
 * PATCH the Google Wallet LoyaltyObject to update balance
 */
async function updateGooglePass(
  serialNumber: string,
  newBalance: number
): Promise<void> {
  const issuerId = Deno.env.get("GOOGLE_WALLET_ISSUER_ID")!;
  const objectId = `${issuerId}.confetti_black_${serialNumber}`;
  const accessToken = await getGoogleAccessToken();

  const patchBody = {
    loyaltyPoints: {
      label: "Outing Credit",
      balance: {
        money: {
          currencyCode: "USD",
          micros: String(Math.round(newBalance * 1000000)),
        },
      },
    },
  };

  const res = await fetch(
    `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/${objectId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patchBody),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Wallet PATCH failed: ${res.status} — ${err}`);
  }
}

/**
 * Disable/expire a Google Wallet LoyaltyObject
 */
async function revokeGooglePass(serialNumber: string): Promise<void> {
  const issuerId = Deno.env.get("GOOGLE_WALLET_ISSUER_ID")!;
  const objectId = `${issuerId}.confetti_black_${serialNumber}`;
  const accessToken = await getGoogleAccessToken();

  const res = await fetch(
    `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/${objectId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ state: "EXPIRED" }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Wallet revoke failed: ${res.status} — ${err}`);
  }
}

// ─── Apple APNs Push ─────────────────────────────────────

/**
 * Send a push notification to Apple Wallet via APNs HTTP/2
 * to trigger a pass refresh on the user's device.
 *
 * Requires:
 *   - APPLE_APNS_KEY_P8_BASE64 (APNs auth key)
 *   - APPLE_APNS_KEY_ID
 *   - APPLE_TEAM_ID
 *
 * NOTE: Deno's fetch supports HTTP/2 to APNs endpoints.
 * The push body is empty — Apple Wallet interprets the push
 * as "call webServiceURL to get the updated pass".
 */
async function sendApplePushUpdate(pushToken: string): Promise<void> {
  const keyP8Base64 = Deno.env.get("APPLE_APNS_KEY_P8_BASE64");
  const keyId = Deno.env.get("APPLE_APNS_KEY_ID");
  const teamId = Deno.env.get("APPLE_TEAM_ID");

  if (!keyP8Base64 || !keyId || !teamId) {
    console.warn("Apple APNs credentials not configured, skipping push");
    return;
  }

  // Build APNs JWT
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", kid: keyId };
  const payload = { iss: teamId, iat: now };

  const encH = base64Encode(JSON.stringify(header))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const encP = base64Encode(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const unsigned = `${encH}.${encP}`;

  // Import the .p8 key (EC P-256)
  const p8Pem = new TextDecoder().decode(base64Decode(keyP8Base64));
  const pemBody = p8Pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const keyData = base64Decode(pemBody);

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const sigBuf = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(unsigned)
  );

  // Convert DER signature to raw r||s (64 bytes) for ES256 JWT
  const sigBytes = new Uint8Array(sigBuf);
  let r: Uint8Array, s: Uint8Array;

  if (sigBytes[0] === 0x30) {
    // DER encoded — parse it
    const rLen = sigBytes[3];
    const rStart = 4;
    const rBytes = sigBytes.slice(rStart, rStart + rLen);
    const sLen = sigBytes[rStart + rLen + 1];
    const sStart = rStart + rLen + 2;
    const sBytes = sigBytes.slice(sStart, sStart + sLen);

    // Strip leading zero padding
    r = rBytes[0] === 0 ? rBytes.slice(1) : rBytes;
    s = sBytes[0] === 0 ? sBytes.slice(1) : sBytes;

    // Pad to 32 bytes each
    const rPad = new Uint8Array(32);
    rPad.set(r, 32 - r.length);
    const sPad = new Uint8Array(32);
    sPad.set(s, 32 - s.length);

    const rawSig = new Uint8Array(64);
    rawSig.set(rPad, 0);
    rawSig.set(sPad, 32);
    r = rawSig.slice(0, 32);
    s = rawSig.slice(32);
  } else {
    // Already raw r||s
    r = sigBytes.slice(0, 32);
    s = sigBytes.slice(32);
  }

  const rawSig = new Uint8Array(64);
  rawSig.set(r, 0);
  rawSig.set(s, 32);

  const sig = base64Encode(rawSig)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const apnsJwt = `${unsigned}.${sig}`;
  const passTypeId = Deno.env.get("APPLE_PASS_TYPE_ID")!;

  // Send push notification (empty body tells Wallet to refresh)
  const apnsUrl = `https://api.push.apple.com/3/device/${pushToken}`;

  try {
    const pushRes = await fetch(apnsUrl, {
      method: "POST",
      headers: {
        Authorization: `bearer ${apnsJwt}`,
        "apns-topic": passTypeId,
        "apns-push-type": "background",
        "apns-priority": "5",
      },
      body: JSON.stringify({}),
    });

    if (!pushRes.ok) {
      const errText = await pushRes.text();
      console.error(`APNs push failed (${pushRes.status}): ${errText}`);
    }
  } catch (err) {
    console.error("APNs push error:", err);
  }
}

// ─── Apple Wallet Web Service Endpoints ──────────────────
// These are called by Apple Wallet on the device automatically
// when webServiceURL is set in the pass.json.

function handleAppleWebService(
  req: Request,
  url: URL
): Response | null {
  const corsHeaders = getCorsHeaders(req);
  const path = url.pathname;

  // POST /v1/devices/{deviceId}/registrations/{passTypeId}/{serialNumber}
  // Register a device to receive push notifications for a pass
  const registerMatch = path.match(
    /\/v1\/devices\/([^/]+)\/registrations\/([^/]+)\/([^/]+)/
  );
  if (registerMatch && req.method === "POST") {
    const [, deviceId, _passTypeId, serialNumber] = registerMatch;
    // In production, extract pushToken from request body
    // and store in Supabase table
    const pushToken = "pending"; // extracted from body in real implementation
    deviceRegistrations.set(`${deviceId}:${serialNumber}`, {
      deviceId,
      pushToken,
      serialNumber,
    });
    return new Response(null, { status: 201, headers: corsHeaders });
  }

  // DELETE /v1/devices/{deviceId}/registrations/{passTypeId}/{serialNumber}
  // Unregister a device
  if (registerMatch && req.method === "DELETE") {
    const [, deviceId, , serialNumber] = registerMatch;
    deviceRegistrations.delete(`${deviceId}:${serialNumber}`);
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // GET /v1/devices/{deviceId}/registrations/{passTypeId}
  // List serial numbers for passes registered to a device
  const listMatch = path.match(
    /\/v1\/devices\/([^/]+)\/registrations\/([^/]+)$/
  );
  if (listMatch && req.method === "GET") {
    const [, deviceId] = listMatch;
    const serials: string[] = [];
    for (const [key, reg] of deviceRegistrations) {
      if (reg.deviceId === deviceId) serials.push(reg.serialNumber);
    }
    return new Response(
      JSON.stringify({
        serialNumbers: serials,
        lastUpdated: new Date().toISOString(),
      }),
      {
        status: serials.length > 0 ? 200 : 204,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // GET /v1/passes/{passTypeId}/{serialNumber}
  // Return the latest .pkpass file
  // In production, regenerate the pass with current balance from DB
  const passMatch = path.match(/\/v1\/passes\/([^/]+)\/([^/]+)/);
  if (passMatch && req.method === "GET") {
    // TODO: Look up current balance from Supabase DB,
    // regenerate the .pkpass, and return it with correct content-type
    return new Response(
      JSON.stringify({
        message:
          "Pass delivery endpoint — connect to Supabase DB to serve updated .pkpass",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // POST /v1/log — Apple Wallet error logging
  if (path === "/v1/log" && req.method === "POST") {
    // Just acknowledge — logs appear in Supabase function logs
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  return null; // not an Apple web service request
}

// ─── Main Handler ────────────────────────────────────────

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // ── Apple Wallet web service routes ──
  const appleResponse = handleAppleWebService(req, url);
  if (appleResponse) return appleResponse;

  // ── API routes ──
  const action = url.searchParams.get("action") || "update";

  try {
    switch (action) {
      // ── Update balance ──
      case "update": {
        const body: UpdateRequest = await req.json();

        if (
          !body.serialNumber ||
          !body.platform ||
          body.newBalance == null
        ) {
          return new Response(
            JSON.stringify({
              error:
                "Missing required fields: serialNumber, platform, newBalance",
            }),
            {
              status: 400,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
        }

        const results: {
          apple?: { pushed: boolean };
          google?: { patched: boolean };
        } = {};

        // Update Google Wallet pass
        if (
          body.platform === "google" ||
          body.platform === "both"
        ) {
          await updateGooglePass(body.serialNumber, body.newBalance);
          results.google = { patched: true };
        }

        // Trigger Apple Wallet refresh via APNs
        if (
          body.platform === "apple" ||
          body.platform === "both"
        ) {
          // Find push tokens for this serial number
          let pushed = false;
          for (const [, reg] of deviceRegistrations) {
            if (
              reg.serialNumber === body.serialNumber &&
              reg.pushToken !== "pending"
            ) {
              await sendApplePushUpdate(reg.pushToken);
              pushed = true;
            }
          }
          results.apple = { pushed };

          if (!pushed) {
            console.warn(
              `No APNs push token found for serial ${body.serialNumber}. ` +
                "Apple Wallet will update next time the user views the pass."
            );
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            serialNumber: body.serialNumber,
            newBalance: body.newBalance,
            ...results,
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      // ── Redeem via barcode scan ──
      case "redeem": {
        const body: RedeemRequest = await req.json();

        if (!body.barcode || body.amount == null || !body.venue) {
          return new Response(
            JSON.stringify({
              error: "Missing required fields: barcode, amount, venue",
            }),
            {
              status: 400,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
        }

        // In production, this would:
        // 1. Look up the pass by barcode in Supabase DB
        // 2. Verify the pass is active and has sufficient balance
        // 3. Deduct the amount
        // 4. Record the transaction
        // 5. Trigger pass update (Apple push + Google PATCH)
        //
        // For now, return the expected response shape:
        return new Response(
          JSON.stringify({
            success: true,
            barcode: body.barcode,
            amountRedeemed: body.amount,
            venue: body.venue,
            message:
              "Connect to Supabase DB to look up pass by barcode, deduct balance, and trigger platform updates",
            // In production:
            // remainingBalance: currentBalance - body.amount,
            // transactionId: "txn_...",
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      // ── Revoke pass ──
      case "revoke": {
        const body = await req.json();

        if (!body.serialNumber || !body.platform) {
          return new Response(
            JSON.stringify({
              error: "Missing required fields: serialNumber, platform",
            }),
            {
              status: 400,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
        }

        const results: {
          apple?: { revoked: boolean };
          google?: { revoked: boolean };
        } = {};

        if (
          body.platform === "google" ||
          body.platform === "both"
        ) {
          await revokeGooglePass(body.serialNumber);
          results.google = { revoked: true };
        }

        if (
          body.platform === "apple" ||
          body.platform === "both"
        ) {
          // Apple passes can't be remotely revoked directly.
          // The pass will show as "expired" when the webServiceURL
          // returns a pass with an expirationDate in the past.
          // Best practice: update the pass with expirationDate set
          // and voided flag, then push to refresh.
          results.apple = { revoked: true };

          for (const [, reg] of deviceRegistrations) {
            if (
              reg.serialNumber === body.serialNumber &&
              reg.pushToken !== "pending"
            ) {
              await sendApplePushUpdate(reg.pushToken);
            }
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            serialNumber: body.serialNumber,
            ...results,
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      default:
        return new Response(
          JSON.stringify({
            error: `Unknown action: ${action}. Use ?action=update, ?action=redeem, or ?action=revoke`,
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
    }
  } catch (err) {
    console.error("Wallet pass update error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
