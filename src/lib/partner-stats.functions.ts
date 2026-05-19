import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type PartnerStatsDTO = {
  impressions: { value: number; deltaPct: number };
  clicks: { value: number; deltaPct: number };
  ctr: { value: number; deltaPts: number }; // ctr in percent (e.g. 7.2)
  placements30d: number[]; // 30 daily counts, oldest -> newest
};

function pct(curr: number, prev: number): number {
  if (prev === 0) return curr === 0 ? 0 : 100;
  return ((curr - prev) / prev) * 100;
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export const getPartnerStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<PartnerStatsDTO> => {
    const now = new Date();
    const today = startOfUtcDay(now);
    const start30 = new Date(today.getTime() - 30 * 86400000);
    const start60 = new Date(today.getTime() - 60 * 86400000);

    try {
      // Fetch only what we need: created_at + kind for last 60 days.
      // Cap row count defensively.
      const { data, error } = await supabaseAdmin
        .from("ad_events")
        .select("created_at, kind")
        .gte("created_at", start60.toISOString())
        .in("kind", ["impression", "click"])
        .limit(50000);

      if (error) throw error;

      const rows = data ?? [];
      let impCurr = 0,
        impPrev = 0,
        clkCurr = 0,
        clkPrev = 0;
      const daily = new Array<number>(30).fill(0);

      for (const r of rows) {
        const t = new Date(r.created_at).getTime();
        const inCurr = t >= start30.getTime();
        if (r.kind === "impression") {
          if (inCurr) {
            impCurr++;
            const dayIdx = Math.floor((t - start30.getTime()) / 86400000);
            if (dayIdx >= 0 && dayIdx < 30) daily[dayIdx]++;
          } else {
            impPrev++;
          }
        } else if (r.kind === "click") {
          if (inCurr) clkCurr++;
          else clkPrev++;
        }
      }

      const ctrCurr = impCurr > 0 ? (clkCurr / impCurr) * 100 : 0;
      const ctrPrev = impPrev > 0 ? (clkPrev / impPrev) * 100 : 0;

      return {
        impressions: { value: impCurr, deltaPct: pct(impCurr, impPrev) },
        clicks: { value: clkCurr, deltaPct: pct(clkCurr, clkPrev) },
        ctr: { value: ctrCurr, deltaPts: ctrCurr - ctrPrev },
        placements30d: daily,
      };
    } catch (e) {
      console.error("getPartnerStats failed:", e);
      return {
        impressions: { value: 0, deltaPct: 0 },
        clicks: { value: 0, deltaPct: 0 },
        ctr: { value: 0, deltaPts: 0 },
        placements30d: new Array(30).fill(0),
      };
    }
  },
);
