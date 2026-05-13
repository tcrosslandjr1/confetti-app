import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  days: z.number().int().min(1).max(180).default(30),
});

export type PickAnalyticsBucket = {
  date: string; // YYYY-MM-DD (UTC)
  signal: string;
  impressions: number;
  clicks: number;
  up: number;
  down: number;
};

export type PickAnalyticsResponse = {
  buckets: PickAnalyticsBucket[];
  totals: Record<string, { impressions: number; clicks: number; up: number; down: number }>;
  signals: string[];
  days: number;
  rowCount: number;
};

export const getPickAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }): Promise<PickAnalyticsResponse> => {
    const { supabase } = context;
    const since = new Date(Date.now() - data.days * 24 * 60 * 60 * 1000).toISOString();

    // RLS restricts SELECT to admins. Non-admins will get an empty result.
    const { data: rows, error } = await supabase
      .from("pick_events")
      .select("name, signals, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .limit(50000);

    if (error) throw new Error(error.message);

    const tally = new Map<string, PickAnalyticsBucket>();
    const totals: PickAnalyticsResponse["totals"] = {};
    const signalSet = new Set<string>();

    for (const r of rows ?? []) {
      const day = (r.created_at as string).slice(0, 10);
      const sigs = (r.signals as string[] | null) ?? [];
      for (const sig of sigs) {
        signalSet.add(sig);
        const key = `${day}::${sig}`;
        let b = tally.get(key);
        if (!b) {
          b = { date: day, signal: sig, impressions: 0, clicks: 0, up: 0, down: 0 };
          tally.set(key, b);
        }
        const t = (totals[sig] ??= { impressions: 0, clicks: 0, up: 0, down: 0 });
        switch (r.name) {
          case "pick_impression":
            b.impressions++;
            t.impressions++;
            break;
          case "pick_click":
            b.clicks++;
            t.clicks++;
            break;
          case "pick_feedback_up":
            b.up++;
            t.up++;
            break;
          case "pick_feedback_down":
            b.down++;
            t.down++;
            break;
        }
      }
    }

    return {
      buckets: Array.from(tally.values()).sort((a, b) =>
        a.date === b.date ? a.signal.localeCompare(b.signal) : a.date.localeCompare(b.date),
      ),
      totals,
      signals: Array.from(signalSet).sort(),
      days: data.days,
      rowCount: rows?.length ?? 0,
    };
  });
