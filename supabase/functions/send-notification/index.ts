/**
 * send-notification edge function
 * Dispatches notifications via Web Push, email, and/or SMS
 * based on user preferences.
 *
 * Triggered by: Database webhook on INSERT to public.notifications
 * OR called directly with a notification payload.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin":
    Deno.env.get("ALLOWED_ORIGIN") ?? "https://confettiplan.com",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface NotificationRow {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
}

interface WebhookPayload {
  type: "INSERT";
  table: string;
  record: NotificationRow;
  schema: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const payload = (await req.json()) as WebhookPayload | { notification: NotificationRow };

    // Support both webhook format and direct call
    const notification: NotificationRow =
      "record" in payload ? payload.record : (payload as any).notification;

    if (!notification?.id || !notification?.user_id) {
      return json({ error: "Invalid payload — missing notification data" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. Load user notification preferences
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", notification.user_id)
      .maybeSingle();

    const results: Record<string, boolean> = {
      push: false,
      email: false,
      sms: false,
    };

    // 2. Web Push
    if (prefs?.push_enabled !== false) {
      const pushSent = await sendWebPush(supabase, notification);
      results.push = pushSent;
    }

    // 3. Email (for confirmations, reminders, trip_status)
    const emailKinds = ["plan_reminder", "trip_status", "booking_confirmation"];
    const shouldEmail =
      prefs?.email_confirmations !== false &&
      (prefs?.email_reminders !== false || emailKinds.includes(notification.kind));

    if (shouldEmail) {
      const emailSent = await sendEmail(supabase, notification);
      results.email = emailSent;
    }

    // 4. SMS (only if enabled and phone present)
    const smsKinds = ["trip_status", "plan_reminder"];
    if (
      prefs?.sms_reminders === true &&
      prefs?.phone_number &&
      smsKinds.includes(notification.kind)
    ) {
      const smsSent = await sendSms(prefs.phone_number, notification);
      results.sms = smsSent;
    }

    // 5. Update notification row with dispatch status
    await supabase
      .from("notifications")
      .update({
        sent_push: results.push,
        sent_email: results.email,
        sent_sms: results.sms,
      })
      .eq("id", notification.id);

    return json({ success: true, dispatched: results });
  } catch (e) {
    console.error("send-notification error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});

// ─── Web Push (RFC 8291 + RFC 8292) ─────────────────────

async function sendWebPush(
  supabase: ReturnType<typeof createClient>,
  notification: NotificationRow
): Promise<boolean> {
  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:notifications@confettiplan.app";

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("VAPID keys not configured — skipping push");
    return false;
  }

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", notification.user_id);

  if (!subscriptions?.length) return false;

  const pushPayload = JSON.stringify({
    title: notification.title,
    body: notification.body ?? "",
    url: notification.link ?? "/",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-72.png",
  });

  let anySent = false;

  for (const sub of subscriptions) {
    try {
      const audience = new URL(sub.endpoint).origin;
      const vapidHeaders = await buildVapidHeaders(
        audience,
        vapidSubject,
        vapidPublicKey,
        vapidPrivateKey
      );

      const encrypted = await encryptPayload(
        pushPayload,
        sub.p256dh,
        sub.auth_key
      );

      const resp = await fetch(sub.endpoint, {
        method: "POST",
        headers: {
          Authorization: vapidHeaders.authorization,
          "Crypto-Key": vapidHeaders.cryptoKey,
          "Content-Encoding": "aes128gcm",
          "Content-Type": "application/octet-stream",
          TTL: "86400",
          Urgency: "normal",
        },
        body: encrypted,
      });

      if (resp.status === 201 || resp.status === 200) {
        console.log(`[Push] Sent to ${sub.endpoint.slice(0, 50)}…`);
        anySent = true;
      } else if (resp.status === 410 || resp.status === 404) {
        console.warn(`[Push] Subscription gone (${resp.status}), removing`);
        await supabase.from("push_subscriptions").delete().eq("id", sub.id);
      } else {
        const body = await resp.text();
        console.error(`[Push] ${resp.status} for ${sub.endpoint.slice(0, 50)}: ${body}`);
      }
    } catch (err) {
      console.error(`Push failed for sub ${sub.id}:`, err);
    }
  }

  return anySent;
}

// ─── VAPID JWT (RFC 8292) ────────────────────────────────

async function buildVapidHeaders(
  audience: string,
  subject: string,
  publicKeyB64: string,
  privateKeyB64: string
): Promise<{ authorization: string; cryptoKey: string }> {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, exp: now + 12 * 3600, sub: subject };

  const headerB64 = toBase64Url(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const unsigned = `${headerB64}.${payloadB64}`;

  // Import VAPID private key (raw PKCS8-style 32-byte scalar in URL-safe base64)
  const privateRaw = base64UrlToBytes(privateKeyB64);
  const publicRaw = base64UrlToBytes(publicKeyB64);

  // Build JWK from raw key bytes
  const jwk = {
    kty: "EC",
    crv: "P-256",
    x: toBase64Url(publicRaw.slice(1, 33)),
    y: toBase64Url(publicRaw.slice(33, 65)),
    d: toBase64Url(privateRaw),
  };

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(unsigned)
  );

  // Convert DER signature to raw r||s (64 bytes)
  const rawSig = derToRaw(new Uint8Array(sig));
  const token = `${unsigned}.${toBase64Url(rawSig)}`;

  return {
    authorization: `vapid t=${token}, k=${publicKeyB64}`,
    cryptoKey: `p256ecdsa=${publicKeyB64}`,
  };
}

// ─── Payload Encryption (RFC 8291 aes128gcm) ─────────────

async function encryptPayload(
  plaintext: string,
  clientPublicKeyB64: string,
  clientAuthB64: string
): Promise<Uint8Array> {
  const clientPublicKey = base64UrlToBytes(clientPublicKeyB64);
  const clientAuth = base64UrlToBytes(clientAuthB64);

  // Generate ephemeral ECDH key pair
  const localKeys = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  const localPublicRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", localKeys.publicKey)
  );

  // Import client public key
  const clientKey = await crypto.subtle.importKey(
    "raw",
    clientPublicKey,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // ECDH shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: clientKey },
      localKeys.privateKey,
      256
    )
  );

  // Generate 16-byte salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Derive encryption key using HKDF
  // Step 1: auth_info = "WebPush: info\0" || clientPublicKey || localPublicKey
  const authInfo = concatBytes(
    new TextEncoder().encode("WebPush: info\0"),
    clientPublicKey,
    localPublicRaw
  );

  // PRK = HKDF-Extract(clientAuth, sharedSecret)
  const prkKey = await crypto.subtle.importKey(
    "raw",
    clientAuth,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const prk = new Uint8Array(
    await crypto.subtle.sign("HMAC", prkKey, sharedSecret)
  );

  // IKM = HKDF-Expand(prk, authInfo, 32)
  const ikm = await hkdfExpand(prk, authInfo, 32);

  // Step 2: Derive content encryption key and nonce
  const cekInfo = concatBytes(
    new TextEncoder().encode("Content-Encoding: aes128gcm\0")
  );
  const nonceInfo = concatBytes(
    new TextEncoder().encode("Content-Encoding: nonce\0")
  );

  // PRK2 = HKDF-Extract(salt, ikm)
  const prk2Key = await crypto.subtle.importKey(
    "raw",
    salt,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const prk2 = new Uint8Array(
    await crypto.subtle.sign("HMAC", prk2Key, ikm)
  );

  const cek = await hkdfExpand(prk2, cekInfo, 16);
  const nonce = await hkdfExpand(prk2, nonceInfo, 12);

  // Encrypt plaintext with padding delimiter \x02
  const paddedPayload = concatBytes(
    new TextEncoder().encode(plaintext),
    new Uint8Array([2]) // padding delimiter
  );

  const aesKey = await crypto.subtle.importKey(
    "raw",
    cek,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce },
      aesKey,
      paddedPayload
    )
  );

  // Build aes128gcm header: salt(16) || rs(4) || idlen(1) || keyid(65) || ciphertext
  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096);

  return concatBytes(
    salt,
    rs,
    new Uint8Array([localPublicRaw.length]),
    localPublicRaw,
    ciphertext
  );
}

// ─── Crypto Helpers ──────────────────────────────────────

function base64UrlToBytes(b64: string): Uint8Array {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const len = arrays.reduce((s, a) => s + a.length, 0);
  const result = new Uint8Array(len);
  let offset = 0;
  for (const a of arrays) {
    result.set(a, offset);
    offset += a.length;
  }
  return result;
}

async function hkdfExpand(
  prk: Uint8Array,
  info: Uint8Array,
  length: number
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    prk,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  // Single expand step (length ≤ 32)
  const input = concatBytes(info, new Uint8Array([1]));
  const result = new Uint8Array(await crypto.subtle.sign("HMAC", key, input));
  return result.slice(0, length);
}

/** Convert potentially DER-encoded ECDSA signature to raw 64-byte r||s */
function derToRaw(sig: Uint8Array): Uint8Array {
  // If already 64 bytes, it's raw
  if (sig.length === 64) return sig;

  // DER: 0x30 <len> 0x02 <rLen> <r> 0x02 <sLen> <s>
  const raw = new Uint8Array(64);
  let offset = 2; // skip 0x30 and total length
  // r
  const rLen = sig[offset + 1];
  offset += 2;
  const rStart = rLen > 32 ? offset + (rLen - 32) : offset;
  const rDest = rLen > 32 ? 0 : 32 - rLen;
  raw.set(sig.slice(rStart, offset + rLen), rDest);
  offset += rLen;
  // s
  const sLen = sig[offset + 1];
  offset += 2;
  const sStart = sLen > 32 ? offset + (sLen - 32) : offset;
  const sDest = sLen > 32 ? 32 : 64 - sLen;
  raw.set(sig.slice(sStart, offset + sLen), sDest);
  return raw;
}

// ─── Email ────────────────────────────────────────────────

async function sendEmail(
  supabase: ReturnType<typeof createClient>,
  notification: NotificationRow
): Promise<boolean> {
  // Get user email
  const { data: userData } = await supabase.auth.admin.getUserById(
    notification.user_id
  );
  const email = userData?.user?.email;
  if (!email) return false;

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    console.warn("RESEND_API_KEY not configured — skipping email");
    return false;
  }

  const appUrl = Deno.env.get("APP_URL") ?? "https://confettiplan.com";

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "Confetti <notifications@confettiplan.app>",
        to: [email],
        subject: notification.title,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #1a1a2e; margin-bottom: 8px;">${escapeHtml(notification.title)}</h2>
            ${notification.body ? `<p style="color: #444; line-height: 1.5;">${escapeHtml(notification.body)}</p>` : ""}
            ${notification.link ? `<a href="${appUrl}${notification.link}" style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #FF6B6B; color: white; text-decoration: none; border-radius: 6px;">View in Confetti</a>` : ""}
            <p style="color: #999; font-size: 12px; margin-top: 32px;">You're receiving this because you have email notifications enabled in Confetti.</p>
          </div>
        `,
      }),
    });

    return resp.ok;
  } catch (err) {
    console.error("Email send failed:", err);
    return false;
  }
}

// ─── SMS ──────────────────────────────────────────────────

async function sendSms(
  phone: string,
  notification: NotificationRow
): Promise<boolean> {
  const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const twilioFrom = Deno.env.get("TWILIO_PHONE_NUMBER");

  if (!twilioSid || !twilioToken || !twilioFrom) {
    console.warn("Twilio not configured — skipping SMS");
    return false;
  }

  const message = `${notification.title}${notification.body ? ": " + notification.body : ""}`;

  try {
    const resp = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " + btoa(`${twilioSid}:${twilioToken}`),
        },
        body: new URLSearchParams({
          To: phone,
          From: twilioFrom,
          Body: message.slice(0, 160),
        }),
      }
    );

    return resp.ok;
  } catch (err) {
    console.error("SMS send failed:", err);
    return false;
  }
}

// ─── Helpers ──────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
