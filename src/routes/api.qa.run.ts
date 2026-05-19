import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { runByPriority } from "@/lib/qa/automation-suite";

export const Route = createFileRoute("/api/qa/run")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // AuthN: require Bearer token
        const authHeader = request.headers.get("authorization") ?? "";
        if (!authHeader.startsWith("Bearer ")) {
          return new Response("Unauthorized", { status: 401 });
        }
        const token = authHeader.slice("Bearer ".length).trim();
        if (!token) return new Response("Unauthorized", { status: 401 });

        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
          return new Response("Server misconfigured", { status: 500 });
        }
        const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
        const userId = claimsData?.claims?.sub;
        if (claimsErr || !userId) return new Response("Unauthorized", { status: 401 });

        // AuthZ: must be admin
        const { data: roleRow } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();
        if (!roleRow) return new Response("Forbidden", { status: 403 });

        const url = new URL(request.url);
        const tier = url.searchParams.get("tier") ?? "smoke";
        const valid = ["smoke", "booking", "personalization", "full"];
        if (!valid.includes(tier)) {
          return Response.json(
            { error: `Invalid tier. Use: ${valid.join(", ")}` },
            { status: 400 },
          );
        }
        const rows = runByPriority(tier as "smoke" | "booking" | "personalization" | "full");
        const summary = rows.reduce(
          (acc, r) => {
            acc.total++;
            acc[r.result.status]++;
            return acc;
          },
          { pass: 0, fail: 0, skip: 0, total: 0 },
        );
        return Response.json({
          summary,
          rows: rows.map((r) => ({
            id: r.result.id,
            name: r.result.name,
            status: r.result.status,
            notes: r.result.notes,
          })),
        });
      },
    },
  },
});
