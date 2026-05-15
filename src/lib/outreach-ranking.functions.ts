import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type OutreachVenue = {
  venue_id: string;
  name: string;
  city: string | null;
  neighborhood: string | null;
  category: string;
  staff_email: string | null;
  itinerary_appearances: number;
  bookings_count: number;
  saves_count: number;
  score: number;
  last_seen: string | null;
};

export type OutreachRankingResponse = {
  generatedAt: string;
  windowDays: number;
  venues: OutreachVenue[];
};

async function assertAdmin(context: any) {
  const { supabase, userId } = context;
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Response("Forbidden", { status: 403 });
}

async function buildRanking(days = 30, limit = 100): Promise<OutreachRankingResponse> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // Organic (unclaimed) venues only
  const { data: venues, error: vErr } = await supabaseAdmin
    .from("venues")
    .select("id, name, city, neighborhood, category, staff_email, advertiser_id")
    .is("advertiser_id", null);
  if (vErr) throw new Error(vErr.message);

  const venueByLowerName = new Map<string, typeof venues[number]>();
  for (const v of venues ?? []) venueByLowerName.set(v.name.toLowerCase().trim(), v);

  // Bookings in window (venue_id FK)
  const { data: bookings, error: bErr } = await supabaseAdmin
    .from("bookings")
    .select("venue_id, created_at")
    .gte("created_at", since)
    .not("venue_id", "is", null)
    .limit(10000);
  if (bErr) throw new Error(bErr.message);

  // Itinerary stops in window (match by name, case-insensitive)
  const { data: stops, error: sErr } = await supabaseAdmin
    .from("itinerary_stops")
    .select("name, created_at")
    .gte("created_at", since)
    .limit(20000);
  if (sErr) throw new Error(sErr.message);

  // Saves in window
  const { data: saves, error: svErr } = await supabaseAdmin
    .from("saved_venues")
    .select("venue_id, created_at")
    .gte("created_at", since)
    .limit(10000);
  if (svErr) throw new Error(svErr.message);

  type Agg = { bookings: number; stops: number; saves: number; lastSeen: string | null };
  const agg = new Map<string, Agg>();
  const get = (id: string): Agg => {
    let a = agg.get(id);
    if (!a) {
      a = { bookings: 0, stops: 0, saves: 0, lastSeen: null };
      agg.set(id, a);
    }
    return a;
  };
  const touch = (a: Agg, ts: string) => {
    if (!a.lastSeen || ts > a.lastSeen) a.lastSeen = ts;
  };

  for (const b of bookings ?? []) {
    if (!b.venue_id) continue;
    const a = get(b.venue_id);
    a.bookings++;
    touch(a, b.created_at);
  }
  for (const s of saves ?? []) {
    if (!s.venue_id) continue;
    const a = get(s.venue_id);
    a.saves++;
    touch(a, s.created_at);
  }
  for (const st of stops ?? []) {
    const v = venueByLowerName.get(st.name.toLowerCase().trim());
    if (!v) continue;
    const a = get(v.id);
    a.stops++;
    touch(a, st.created_at);
  }

  const ranked: OutreachVenue[] = [];
  for (const v of venues ?? []) {
    const a = agg.get(v.id);
    if (!a) continue;
    // Weighted: bookings 5x, stops 2x, saves 1x
    const score = a.bookings * 5 + a.stops * 2 + a.saves;
    if (score <= 0) continue;
    ranked.push({
      venue_id: v.id,
      name: v.name,
      city: v.city,
      neighborhood: v.neighborhood,
      category: v.category,
      staff_email: v.staff_email,
      itinerary_appearances: a.stops,
      bookings_count: a.bookings,
      saves_count: a.saves,
      score,
      last_seen: a.lastSeen,
    });
  }

  ranked.sort((a, b) => b.score - a.score || b.bookings_count - a.bookings_count);

  return {
    generatedAt: new Date().toISOString(),
    windowDays: days,
    venues: ranked.slice(0, limit),
  };
}

export const getOutreachRanking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const obj = (input ?? {}) as { days?: number; limit?: number };
    const days = Math.min(Math.max(Number(obj.days ?? 30), 1), 180);
    const limit = Math.min(Math.max(Number(obj.limit ?? 100), 1), 500);
    return { days, limit };
  })
  .handler(async ({ data, context }): Promise<OutreachRankingResponse> => {
    await assertAdmin(context);
    return buildRanking(data.days, data.limit);
  });

function csvEscape(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export const getOutreachCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const obj = (input ?? {}) as { days?: number; limit?: number };
    const days = Math.min(Math.max(Number(obj.days ?? 30), 1), 180);
    const limit = Math.min(Math.max(Number(obj.limit ?? 500), 1), 1000);
    return { days, limit };
  })
  .handler(async ({ data, context }): Promise<{ filename: string; csv: string }> => {
    await assertAdmin(context);
    const ranking = await buildRanking(data.days, data.limit);
    const headers = [
      "rank",
      "venue_name",
      "category",
      "city",
      "neighborhood",
      "score",
      "itinerary_appearances",
      "bookings_count",
      "saves_count",
      "last_seen",
      "staff_email",
      "venue_id",
    ];
    const lines = [headers.join(",")];
    ranking.venues.forEach((v, i) => {
      lines.push(
        [
          i + 1,
          csvEscape(v.name),
          csvEscape(v.category),
          csvEscape(v.city),
          csvEscape(v.neighborhood),
          v.score,
          v.itinerary_appearances,
          v.bookings_count,
          v.saves_count,
          csvEscape(v.last_seen),
          csvEscape(v.staff_email),
          v.venue_id,
        ].join(","),
      );
    });
    const stamp = new Date().toISOString().slice(0, 10);
    return {
      filename: `confetti-outreach-${stamp}-${data.days}d.csv`,
      csv: lines.join("\n"),
    };
  });
