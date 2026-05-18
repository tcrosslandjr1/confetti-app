import { createFileRoute } from "@tanstack/react-router";
import { apiError, authenticate, checkRate, json } from "@/lib/partner-api";

// Tier 3 only — real-time slot availability.
// Mock generator: returns 30-min slots between 17:00 and 23:00.
function buildSlots(date: string, partySize: number) {
  const slots: Array<{ time: string; status: string; table_type?: string; remaining?: number }> =
    [];
  for (let h = 17; h < 23; h++) {
    for (const m of [0, 30]) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      const seed = (h * 60 + m + partySize * 7 + date.length) % 10;
      let status = "available";
      let extra: { remaining?: number; table_type?: string } = {
        table_type: m === 0 ? "indoor" : "patio",
      };
      if (seed === 0) status = "unavailable";
      else if (seed === 1) {
        status = "limited";
        extra = { remaining: 1 };
      }
      slots.push({ time: `${hh}:${mm}`, status, ...extra });
    }
  }
  return slots;
}

export const Route = createFileRoute("/api/public/partner/v1/availability")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = authenticate(request);
        if (auth instanceof Response) return auth;
        const limited = checkRate(auth.venue_id);
        if (limited) return limited;
        if (auth.tier !== 3)
          return apiError("INVALID_TOKEN", "Availability requires Tier 3", { tier: auth.tier });

        const url = new URL(request.url);
        const date = url.searchParams.get("date");
        const partyRaw = url.searchParams.get("party_size");
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date))
          return apiError("VALIDATION", "Invalid or missing 'date' (YYYY-MM-DD)");
        const party_size = Number(partyRaw);
        if (!Number.isInteger(party_size) || party_size < 1 || party_size > 50)
          return apiError("VALIDATION", "Invalid 'party_size'");

        return json({
          venue_id: auth.venue_id,
          date,
          party_size,
          slots: buildSlots(date, party_size),
        });
      },
    },
  },
});
