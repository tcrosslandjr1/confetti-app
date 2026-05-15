import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  buildOutreachRanking,
  rankingToCsv,
  type OutreachRanking,
  type OutreachVenue,
} from "./outreach-ranking.server";

export type { OutreachVenue, OutreachRanking };
export type OutreachRankingResponse = OutreachRanking;

async function assertAdmin(context: any) {
  const { supabase, userId } = context;
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Response("Forbidden", { status: 403 });
}

export const getOutreachRanking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const obj = (input ?? {}) as { days?: number; limit?: number };
    return {
      days: Math.min(Math.max(Number(obj.days ?? 30), 1), 180),
      limit: Math.min(Math.max(Number(obj.limit ?? 100), 1), 500),
    };
  })
  .handler(async ({ data, context }): Promise<OutreachRanking> => {
    await assertAdmin(context);
    return buildOutreachRanking(data.days, data.limit);
  });

export const getOutreachCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const obj = (input ?? {}) as { days?: number; limit?: number };
    return {
      days: Math.min(Math.max(Number(obj.days ?? 30), 1), 180),
      limit: Math.min(Math.max(Number(obj.limit ?? 500), 1), 1000),
    };
  })
  .handler(async ({ data, context }): Promise<{ filename: string; csv: string }> => {
    await assertAdmin(context);
    const ranking = await buildOutreachRanking(data.days, data.limit);
    const stamp = new Date().toISOString().slice(0, 10);
    return {
      filename: `confetti-outreach-${stamp}-${data.days}d.csv`,
      csv: rankingToCsv(ranking),
    };
  });

export type LatestOutreachSnapshot = {
  id: string;
  generated_at: string;
  window_days: number;
  venue_count: number;
  source: string;
  csv: string;
} | null;

export const getLatestOutreachSnapshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LatestOutreachSnapshot> => {
    await assertAdmin(context);
    const { data, error } = await supabaseAdmin
      .from("outreach_snapshots")
      .select("id, generated_at, window_days, venue_count, source, csv")
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });
