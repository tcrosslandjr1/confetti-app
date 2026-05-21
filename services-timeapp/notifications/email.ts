/**
 * Email Service — SendGrid
 * Docs: https://docs.sendgrid.com/api-reference/mail-send/mail-send
 *
 * Handles: Booking receipts, weekly itinerary digests, group summaries,
 * subscription confirmations, and transactional emails.
 *
 * Auth: API Key (Bearer token)
 * Cost: Free tier — 100 emails/day forever
 *
 * Setup: Sign up at https://sendgrid.com
 *        Add SENDGRID_API_KEY and SENDGRID_FROM_EMAIL to .env
 *
 * DEV MODE: Logs email to console instead of sending.
 */

// ─── Types ──────────────────────────────────────────────────────────

export interface EmailRequest {
  to: string | string[];       // recipient(s)
  subject: string;
  html?: string;               // HTML body
  text?: string;               // plain text fallback
  templateId?: string;         // SendGrid dynamic template
  templateData?: Record<string, unknown>;
  replyTo?: string;
  attachments?: { filename: string; content: string; type: string }[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ─── Configuration ──────────────────────────────────────────────────

interface SendGridConfig {
  apiKey: string;
  fromEmail: string;
  fromName?: string;
}

let config: SendGridConfig | null = null;

export function configure(cfg: SendGridConfig) {
  config = cfg;
}

function isConfigured(): boolean {
  return !!(config?.apiKey && config?.fromEmail);
}

// ─── Send Email ─────────────────────────────────────────────────────

/**
 * Send an email via SendGrid.
 */
export async function send(req: EmailRequest): Promise<EmailResult> {
  const recipients = Array.isArray(req.to) ? req.to : [req.to];

  if (!isConfigured()) {
    console.log(`[Email Mock] → ${recipients.join(", ")}`);
    console.log(`  Subject: ${req.subject}`);
    console.log(`  Body: ${(req.text || req.html || "").slice(0, 200)}...`);
    return { success: true, messageId: `email_mock_${Date.now()}` };
  }

  const payload: any = {
    personalizations: [{ to: recipients.map((email) => ({ email })) }],
    from: { email: config!.fromEmail, name: config!.fromName || "Confetti" },
    subject: req.subject,
  };

  if (req.templateId) {
    payload.template_id = req.templateId;
    if (req.templateData) {
      payload.personalizations[0].dynamic_template_data = req.templateData;
    }
  } else {
    payload.content = [];
    if (req.text) payload.content.push({ type: "text/plain", value: req.text });
    if (req.html) payload.content.push({ type: "text/html", value: req.html });
  }

  if (req.replyTo) payload.reply_to = { email: req.replyTo };
  if (req.attachments?.length) {
    payload.attachments = req.attachments.map((a) => ({
      filename: a.filename,
      content: a.content, // base64
      type: a.type,
    }));
  }

  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config!.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.errors?.[0]?.message || `SendGrid ${res.status}` };
    }

    // SendGrid returns 202 with no body on success
    const messageId = res.headers.get("X-Message-Id") || `sg_${Date.now()}`;
    return { success: true, messageId };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ─── Convenience ────────────────────────────────────────────────────

export async function sendBookingReceipt(
  email: string,
  data: { venueName: string; date: string; time: string; guests: number; confirmationCode: string; total?: string }
) {
  return send({
    to: email,
    subject: `Your Confetti reservation at ${data.venueName} is confirmed`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 500px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">🎉 You're all set!</h1>
        <div style="background: #f8f6f3; border-radius: 12px; padding: 24px; margin: 16px 0;">
          <h2 style="margin: 0 0 12px;">${data.venueName}</h2>
          <p><strong>Date:</strong> ${data.date}</p>
          <p><strong>Time:</strong> ${data.time}</p>
          <p><strong>Guests:</strong> ${data.guests}</p>
          <p><strong>Confirmation:</strong> ${data.confirmationCode}</p>
          ${data.total ? `<p><strong>Total:</strong> ${data.total}</p>` : ""}
        </div>
        <p style="color: #666; font-size: 14px;">Have an amazing night! — The Confetti Team</p>
      </div>
    `,
    text: `Booking confirmed: ${data.venueName} on ${data.date} at ${data.time} for ${data.guests} guests. Code: ${data.confirmationCode}`,
  });
}

export async function sendWeeklyDigest(email: string, data: { userName: string; highlights: string[]; city: string }) {
  return send({
    to: email,
    subject: `This week in ${data.city} — your Confetti picks`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 500px; margin: 0 auto;">
        <h1>Hey ${data.userName} 👋</h1>
        <p>Here's what's popping in ${data.city} this week:</p>
        <ul>${data.highlights.map((h) => `<li>${h}</li>`).join("")}</ul>
        <p>Open Confetti to explore more →</p>
      </div>
    `,
  });
}

export async function sendGroupSummary(
  email: string,
  data: { planName: string; organizer: string; date: string; stops: string[] }
) {
  return send({
    to: email,
    subject: `"${data.planName}" — your itinerary is ready`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 500px; margin: 0 auto;">
        <h1>🪩 ${data.planName}</h1>
        <p>Organized by ${data.organizer} for ${data.date}</p>
        <h3>Your stops:</h3>
        <ol>${data.stops.map((s) => `<li>${s}</li>`).join("")}</ol>
        <p>Open Confetti to see the full boarding pass →</p>
      </div>
    `,
  });
}
