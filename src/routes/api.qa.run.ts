import { createFileRoute } from "@tanstack/react-router";
import { runByPriority } from "@/lib/qa/automation-suite";

export const Route = createFileRoute("/api/qa/run")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const tier = url.searchParams.get("tier") ?? "smoke";
        const valid = ["smoke", "booking", "personalization", "full"];
        if (!valid.includes(tier)) {
          return Response.json({ error: `Invalid tier. Use: ${valid.join(", ")}` }, { status: 400 });
        }
        const rows = runByPriority(tier as typeof valid[number]);
        const summary = rows.reduce(
          (acc, r) => {
            acc.total++;
            acc[r.result.status]++;
            return acc;
          },
          { pass: 0, fail: 0, skip: 0, total: 0 },
        );
        return Response.json({ summary, rows: rows.map((r) => ({ id: r.result.id, name: r.result.name, status: r.result.status, notes: r.result.notes })) });
      },
    },
  },
});
