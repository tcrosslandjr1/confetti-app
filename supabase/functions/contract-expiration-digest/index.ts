/**
 * Contract Expiration Digest — Supabase Edge Function
 *
 * Scans for contracts expiring within 90 days, creates admin_alerts for
 * any that haven't been flagged yet, and sends a consolidated email
 * digest to the ops inbox.
 *
 * Invoke via:
 *   - Supabase cron (pg_cron):  SELECT cron.schedule('contract-expiry-check', '0 8 * * *', ...)
 *   - Manual trigger from admin UI: fetch('/functions/v1/contract-expiration-digest')
 *   - Supabase Dashboard → Edge Functions → Invoke
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin":
    Deno.env.get("ALLOWED_ORIGIN") ?? "https://confettiplan.lovable.app",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Types ────────────────────────────────────────────────
interface ExpiringContract {
  contract_id: string;
  title: string;
  business_id: string | null;
  partner_id: string | null;
  end_date: string;
  days_until_expiry: number;
  alert_level: "critical" | "warning" | "notice";
}

// ─── Supabase admin client ───────────────────────────────
function adminClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ─── Alert creation ──────────────────────────────────────
async function createExpirationAlerts(
  sb: ReturnType<typeof adminClient>
): Promise<{ newAlerts: number; expiring: ExpiringContract[] }> {
  // Call the get_expiring_contracts SQL function
  const { data: expiring, error } = await sb.rpc("get_expiring_contracts", {
    days_ahead: 90,
  });

  if (error) {
    console.error("get_expiring_contracts error:", error.message);
    return { newAlerts: 0, expiring: [] };
  }

  const contracts = (expiring ?? []) as ExpiringContract[];
  let newAlerts = 0;

  for (const c of contracts) {
    // Determine alert tier
    let alertKey: "30d" | "60d" | "90d" | null = null;
    if (c.days_until_expiry <= 30 && c.alert_level === "critical") alertKey = "30d";
    else if (c.days_until_expiry <= 60 && c.alert_level === "warning") alertKey = "60d";
    else if (c.days_until_expiry <= 90 && c.alert_level === "notice") alertKey = "90d";
    if (!alertKey) continue;

    // Check if this alert tier was already sent
    const flagField =
      alertKey === "30d"
        ? "alert_30d_sent"
        : alertKey === "60d"
          ? "alert_60d_sent"
          : "alert_90d_sent";

    const { data: contract } = await sb
      .from("contracts")
      .select(flagField)
      .eq("id", c.contract_id)
      .single();

    if (!contract || contract[flagField]) continue;

    // Insert admin_alert
    await sb.from("admin_alerts").insert({
      category: "contract_expiration",
      source: "contract_expiration_digest",
      priority:
        c.alert_level === "critical"
          ? "critical"
          : c.alert_level === "warning"
            ? "high"
            : "medium",
      title: `Contract expiring in ${c.days_until_expiry} days: ${c.title}`,
      description: `Contract "${c.title}" expires on ${c.end_date}. ${c.days_until_expiry} days remaining.`,
      action_required: true,
      action_url: "/admin/contracts",
      bundle_key: `contract_expiry_${c.contract_id}`,
      deadline_at: c.end_date,
      metadata: {
        contract_id: c.contract_id,
        business_id: c.business_id,
        partner_id: c.partner_id,
        end_date: c.end_date,
        alert_level: c.alert_level,
      },
    });

    // Mark alert as sent
    await sb
      .from("contracts")
      .update({ [flagField]: true, updated_at: new Date().toISOString() })
      .eq("id", c.contract_id);

    newAlerts++;
  }

  return { newAlerts, expiring: contracts };
}

// ─── Email digest ────────────────────────────────────────
function buildDigestHtml(expiring: ExpiringContract[]): string {
  if (expiring.length === 0) return "";

  const critical = expiring.filter((c) => c.alert_level === "critical");
  const warning = expiring.filter((c) => c.alert_level === "warning");
  const notice = expiring.filter((c) => c.alert_level === "notice");

  const row = (c: ExpiringContract) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${c.title}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${c.end_date}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;color:${
        c.alert_level === "critical"
          ? "#dc2626"
          : c.alert_level === "warning"
            ? "#d97706"
            : "#2563eb"
      };">${c.days_until_expiry} days</td>
    </tr>`;

  const section = (title: string, color: string, items: ExpiringContract[]) =>
    items.length === 0
      ? ""
      : `
    <h3 style="color:${color};margin:24px 0 8px;">${title} (${items.length})</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="background:#f9fafb;">
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Contract</th>
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Expires</th>
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Remaining</th>
        </tr>
      </thead>
      <tbody>${items.map(row).join("")}</tbody>
    </table>`;

  const appUrl =
    Deno.env.get("APP_URL") ?? "https://confettiplan.lovable.app";

  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#1f2937;">
    <div style="text-align:center;margin-bottom:24px;">
      <h1 style="font-size:22px;margin:0;">🎊 Confetti — Contract Expiration Digest</h1>
      <p style="color:#6b7280;margin:4px 0 0;">Generated ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
    </div>

    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin-bottom:16px;">
      <strong>${expiring.length} contract${expiring.length === 1 ? "" : "s"}</strong> expiring within the next 90 days.
      ${critical.length > 0 ? `<span style="color:#dc2626;font-weight:700;"> ${critical.length} critical (≤30 days).</span>` : ""}
    </div>

    ${section("🔴 Critical — Within 30 Days", "#dc2626", critical)}
    ${section("🟡 Warning — Within 60 Days", "#d97706", warning)}
    ${section("🔵 Notice — Within 90 Days", "#2563eb", notice)}

    <div style="margin-top:32px;text-align:center;">
      <a href="${appUrl}/admin/contracts" style="display:inline-block;background:linear-gradient(135deg,#ec4899,#a855f7);color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">
        View Contracts Dashboard →
      </a>
    </div>

    <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:32px;">
      Sent by the Confetti Contracts Library Agent.<br>
      To adjust alert thresholds, visit Admin → Settings.
    </p>
  </body>
  </html>`;
}

async function sendDigestEmail(
  sb: ReturnType<typeof adminClient>,
  expiring: ExpiringContract[]
): Promise<{ sent: boolean; error?: string }> {
  if (expiring.length === 0) return { sent: false };

  const html = buildDigestHtml(expiring);
  const opsEmail =
    Deno.env.get("OPS_NOTIFICATION_EMAIL") ?? "ops@confettiplan.com";

  const critical = expiring.filter((c) => c.alert_level === "critical").length;
  const subject = critical > 0
    ? `🔴 ${critical} contract${critical === 1 ? "" : "s"} expiring within 30 days`
    : `📋 ${expiring.length} contract${expiring.length === 1 ? "" : "s"} expiring soon`;

  // Use Resend via Supabase's built-in email or a direct API call
  const resendKey = Deno.env.get("RESEND_API_KEY");

  if (resendKey) {
    // Direct Resend API
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("EMAIL_FROM") ?? "Confetti Alerts <alerts@confettiplan.com>",
        to: [opsEmail],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend API error:", err);
      return { sent: false, error: err };
    }
  } else {
    // Fallback: log the digest and store in admin_alert_digests
    console.log("No RESEND_API_KEY — storing digest only (no email sent)");
  }

  // Always record the digest
  const criticalCount = expiring.filter((c) => c.alert_level === "critical").length;
  const highCount = expiring.filter((c) => c.alert_level === "warning").length;
  const mediumCount = expiring.filter((c) => c.alert_level === "notice").length;

  await sb.from("admin_alert_digests").insert({
    period: "daily",
    summary: `Contract expiration digest: ${expiring.length} contracts expiring within 90 days.`,
    critical_count: criticalCount,
    high_count: highCount,
    medium_count: mediumCount,
    low_count: 0,
    info_count: 0,
    top_items: expiring.slice(0, 10).map((c) => ({
      contract_id: c.contract_id,
      title: c.title,
      end_date: c.end_date,
      days_until_expiry: c.days_until_expiry,
      alert_level: c.alert_level,
    })),
    overdue_items: expiring
      .filter((c) => c.days_until_expiry <= 0)
      .map((c) => ({
        contract_id: c.contract_id,
        title: c.title,
        end_date: c.end_date,
      })),
  });

  return { sent: !!resendKey };
}

// ─── Handler ─────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const sb = adminClient();

    // 1. Scan + create alerts
    const { newAlerts, expiring } = await createExpirationAlerts(sb);

    // 2. Send digest email (only if there are expiring contracts)
    const emailResult = await sendDigestEmail(sb, expiring);

    const result = {
      ok: true,
      timestamp: new Date().toISOString(),
      expiringContracts: expiring.length,
      newAlertsCreated: newAlerts,
      emailSent: emailResult.sent,
      emailError: emailResult.error ?? null,
    };

    console.log("Contract expiration digest result:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("contract-expiration-digest error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
