/**
 * SMS Service — Twilio
 * Docs: https://www.twilio.com/docs/sms
 *
 * Handles: Booking confirmations, OTP verification, group invite links,
 * "your table is ready" alerts for users without the app installed.
 *
 * Auth: Account SID + Auth Token
 * Cost: Pay-per-message ($0.0079/SMS in US)
 *
 * Setup: Sign up at https://www.twilio.com
 *        Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER to .env
 *
 * DEV MODE: Logs SMS to console instead of sending.
 */

// ─── Types ──────────────────────────────────────────────────────────

export interface SMSRequest {
  to: string;              // E.164 format: "+12025551234"
  body: string;            // max 1600 chars (concatenated SMS)
  mediaUrl?: string;       // MMS image URL
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  status?: "queued" | "sent" | "delivered" | "failed";
  error?: string;
}

// ─── Configuration ──────────────────────────────────────────────────

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;      // Your Twilio number
}

let config: TwilioConfig | null = null;

export function configure(cfg: TwilioConfig) {
  config = cfg;
}

function isConfigured(): boolean {
  return !!(config?.accountSid && config?.authToken && config?.fromNumber);
}

// ─── Send SMS ───────────────────────────────────────────────────────

/**
 * Send a single SMS message.
 */
export async function send(req: SMSRequest): Promise<SMSResult> {
  if (!isConfigured()) {
    console.log(`[SMS Mock] → ${req.to}: ${req.body}`);
    return { success: true, messageId: `sms_mock_${Date.now()}`, status: "delivered" };
  }

  const body = new URLSearchParams({
    To: req.to,
    From: config!.fromNumber,
    Body: req.body,
  });
  if (req.mediaUrl) body.set("MediaUrl", req.mediaUrl);

  const credentials = btoa(`${config!.accountSid}:${config!.authToken}`);

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${config!.accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.message || `Twilio ${res.status}` };
    }

    const data = await res.json();
    return { success: true, messageId: data.sid, status: data.status };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ─── Convenience ────────────────────────────────────────────────────

export async function sendBookingConfirmation(phone: string, venueName: string, time: string, confirmationCode: string) {
  return send({
    to: phone,
    body: `🎉 Confetti: Your reservation at ${venueName} is confirmed for ${time}. Code: ${confirmationCode}. Have an amazing night!`,
  });
}

export async function sendGroupInvite(phone: string, inviterName: string, planName: string, link: string) {
  return send({
    to: phone,
    body: `${inviterName} invited you to "${planName}" on Confetti! Tap to join: ${link}`,
  });
}

export async function sendOTP(phone: string, code: string) {
  return send({
    to: phone,
    body: `Your Confetti verification code is: ${code}. Expires in 10 minutes.`,
  });
}

export async function sendTableReady(phone: string, venueName: string) {
  return send({
    to: phone,
    body: `🪩 Your table at ${venueName} is ready! Head on over.`,
  });
}
