/**
 * cron-plan-reminders
 * Runs every 15 minutes via pg_cron / Supabase CRON.
 * Finds itineraries starting within the next 2 hours that haven't
 * received a reminder yet, and inserts plan_reminder notifications.
 *
 * Notification kinds inserted:
 *   - plan_reminder_2h  (first fires ~2 hours before)
 *   - plan_reminder_30m (fires ~30 minutes before)
 *
 * The existing send-notification webhook fires on INSERT to notifications,
 * dispatching push/email/sms per user preferences.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  // Only allow invocation via Supabase CRON (Authorization header) or manual POST
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const results = { reminders2h: 0, reminders30m: 0 };

    // Find itineraries with date + start_time in the future
    // that haven't been completed and haven't received reminders yet.
    const { data: upcoming } = await supabase
      .from("itineraries")
      .select("id, user_id, title, date, start_time, city")
      .not("date", "is", null)
      .not("start_time", "is", null)
      .is("completed_at", null)
      .gte("date", now.toISOString().split("T")[0]); // today or later

    if (!upcoming?.length) {
      return json({ message: "No upcoming itineraries", ...results });
    }

    for (const it of upcoming) {
      // Combine date + start_time into a proper Date
      const startAt = new Date(`${it.date}T${it.start_time}`);
      const diffMs = startAt.getTime() - now.getTime();
      const diffMin = diffMs / 60_000;

      // Skip past itineraries or those more than 2.5 hours out
      if (diffMin < 0 || diffMin > 150) continue;

      // 2-hour reminder: 90–150 min window
      if (diffMin >= 90 && diffMin <= 150) {
        await insertReminderIfNew(supabase, it, "plan_reminder_2h", startAt);
        results.reminders2h++;
      }

      // 30-minute reminder: 15–45 min window
      if (diffMin >= 15 && diffMin <= 45) {
        await insertReminderIfNew(supabase, it, "plan_reminder_30m", startAt);
        results.reminders30m++;
      }
    }

    return json({ success: true, ...results });
  } catch (e) {
    console.error("cron-plan-reminders error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});

async function insertReminderIfNew(
  supabase: ReturnType<typeof createClient>,
  itinerary: { id: string; user_id: string; title: string; city: string | null },
  kind: string,
  startAt: Date
) {
  // Check if we already sent this kind for this itinerary
  const { data: existing } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", itinerary.user_id)
    .eq("kind", kind)
    .eq("link", `/trips/${itinerary.id}`)
    .limit(1);

  if (existing?.length) return; // already sent

  const timeStr = startAt.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const title =
    kind === "plan_reminder_2h"
      ? `Your night starts in 2 hours!`
      : `30 minutes until your night begins!`;

  const body =
    kind === "plan_reminder_2h"
      ? `"${itinerary.title}" kicks off at ${timeStr}${itinerary.city ? ` in ${itinerary.city}` : ""}. Time to get ready!`
      : `"${itinerary.title}" starts at ${timeStr}. You're almost there!`;

  await supabase.from("notifications").insert({
    user_id: itinerary.user_id,
    kind,
    title,
    body,
    link: `/trips/${itinerary.id}`,
  });
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
