import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Weights (tunable)
const W_VIEW = 1;
const W_LIKE = 4;
const W_SHARE = 8;
const W_SAVE = 6;
const W_CLICK = 3;
const W_VISIT = 10;
const HALF_LIFE_DAYS = 7; // exponential decay
const LOOKBACK_DAYS = 30;

function decayFactor(ageDays: number) {
  return Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
}

export const Route = createFileRoute("/api/public/hooks/refresh-trending-venues")({
  server: {
    handlers: {
      POST: async () => {
        const startedAt = Date.now();
        const since = new Date(Date.now() - LOOKBACK_DAYS * 86400_000).toISOString();

        // 1. Pull reel engagement joined to reel.venue_id
        const { data: reelsRows, error: reelsErr } = await supabaseAdmin
          .from("reels")
          .select("id, venue_id, reel_engagements(kind, created_at)")
          .not("venue_id", "is", null)
          .gte("reel_engagements.created_at", since);

        if (reelsErr) {
          console.error("reels fetch error", reelsErr);
          return Response.json({ ok: false, error: reelsErr.message }, { status: 500 });
        }

        // 2. Pull recent visits (check-ins)
        const { data: visits, error: visitsErr } = await supabaseAdmin
          .from("visits")
          .select("venue_id, visited_at")
          .not("venue_id", "is", null)
          .gte("visited_at", since);

        if (visitsErr) {
          console.error("visits fetch error", visitsErr);
          return Response.json({ ok: false, error: visitsErr.message }, { status: 500 });
        }

        const scores = new Map<string, number>();
        const now = Date.now();

        for (const row of reelsRows ?? []) {
          const venueId = (row as any).venue_id as string | null;
          if (!venueId) continue;
          const engagements = ((row as any).reel_engagements ?? []) as Array<{
            kind: string;
            created_at: string;
          }>;
          for (const e of engagements) {
            const ageDays = (now - new Date(e.created_at).getTime()) / 86400_000;
            const weight =
              e.kind === "like"
                ? W_LIKE
                : e.kind === "share"
                  ? W_SHARE
                  : e.kind === "save"
                    ? W_SAVE
                    : e.kind === "click"
                      ? W_CLICK
                      : W_VIEW;
            scores.set(venueId, (scores.get(venueId) ?? 0) + weight * decayFactor(ageDays));
          }
        }

        for (const v of visits ?? []) {
          const venueId = v.venue_id as string;
          const ageDays = (now - new Date(v.visited_at as string).getTime()) / 86400_000;
          scores.set(venueId, (scores.get(venueId) ?? 0) + W_VISIT * decayFactor(ageDays));
        }

        // 3. Reset every venue to 0, then upsert computed scores
        const refreshedAt = new Date().toISOString();
        const { error: resetErr } = await supabaseAdmin
          .from("venues")
          .update({ trending_score: 0, trending_refreshed_at: refreshedAt })
          .gt("trending_score", 0);
        if (resetErr) console.error("reset error", resetErr);

        let updated = 0;
        for (const [venueId, score] of scores) {
          const rounded = Math.round(score * 100) / 100;
          const { error: upErr } = await supabaseAdmin
            .from("venues")
            .update({ trending_score: rounded, trending_refreshed_at: refreshedAt })
            .eq("id", venueId);
          if (upErr) {
            console.error("venue update failed", venueId, upErr.message);
            continue;
          }
          updated++;
        }

        return Response.json({
          ok: true,
          venues_scored: scores.size,
          venues_updated: updated,
          lookback_days: LOOKBACK_DAYS,
          duration_ms: Date.now() - startedAt,
          refreshed_at: refreshedAt,
        });
      },
    },
  },
});
