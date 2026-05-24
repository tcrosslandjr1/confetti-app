/**
 * cron-rate-your-night
 * Runs daily at 9:00 AM UTC via pg_cron.
 * Finds itineraries whose date was yesterday that:
 *   - Have NOT been rated (overall_rating IS NULL)
 *   - Have NOT already received a rate_your_night notification
 * Inserts a friendly "Rate Your Night" nudge notification.
 *
 * The existing send-notification webhook fires on INSERT to notifications,
 * dispatching push/email/sms per user preferences.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (_req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    // Yesterday's date in YYYY-MM-DD
    const yesterday = new Date(now.getTime() - 86_400_000)
      .toISOString()
      .split("T")[0];

    const results = { nudgesSent: 0, checked: 0 };

    // Find itineraries from yesterday that haven't been rated
    const { data: unrated } = await supabase
      .from("itineraries")
      .select("id, user_id, title, city")
      .eq("date", yesterday)
      .is("overall_rating", null)
      .not("status", "eq", "draft"); // only active/confirmed plans

    if (!unrated?.length) {
      return json({ message: "No unrated trips from yesterday", ...results });
    }

    results.checked = unrated.length;

    for (const it of unrated) {
      // Deduplicate: skip if we already sent this nudge
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", it.user_id)
        .eq("kind", "rate_your_night")
        .eq("link", `/trips/${it.id}`)
        .limit(1);

      if (existing?.length) continue;

      const title = "How was last night?";
      const body = it.city
        ? `Rate your "${it.title}" night in ${it.city} — your feedback makes Confetti smarter!`
        : `Rate your "${it.title}" night — your feedback makes Confetti smarter!`;

      await supabase.from("notifications").insert({
        user_id: it.user_id,
        kind: "rate_your_night",
        title,
        body,
        link: `/trips/${it.id}`,
      });

      results.nudgesSent++;
    }

    return json({ success: true, ...results });
  } catch (e) {
    console.error("cron-rate-your-night error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
