// ============================================================
// hangout-collab — token-keyed collaborative hangout sharing.
// Mirrors the boarding_pass_crew pattern: no auth required for
// guests to view a shared hangout or claim a supply / dish /
// drink item. Writes happen here via service-role so RLS stays
// strict on the table.
//
// Actions:
//   create_shared { hangout, hostName? }      -> { token, url }
//   get_by_token  { token }                    -> { hangout, claims }
//   claim         { token, item_category, item_key, item_label?, claimed_by_name, claimed_by_token, note? }
//   unclaim       { token, item_category, item_key, claimed_by_token }
// ============================================================

import { serve } from "../_shared/server.ts";
import { jsonResponse, errorResponse, supabaseAdmin } from "../_shared/supabase-client.ts";
import { consumeRateLimit, callerIdentity } from "../_shared/ratelimit.ts";

interface HangoutPayload {
  occasion?: string | null;
  occasionKey?: string | null;
  city?: string | null;
  startTime?: string | null;
  date?: string | null;
  mode?: string | null;
  plan: Record<string, unknown>;
  generatedAt?: string | null;
}

interface Body {
  action: string;
  hangout?: HangoutPayload;
  hostName?: string;
  token?: string;
  item_category?: "menu" | "drinks" | "supplies" | "grocery" | "games";
  item_key?: string;
  item_label?: string;
  claimed_by_name?: string;
  claimed_by_token?: string;
  note?: string;
}

function randomToken(len = 16): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, len);
}

serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") return jsonResponse({ ok: true });
    if (req.method !== "POST") return errorResponse("Method not allowed", 405);

    const allowed = await consumeRateLimit({
      scope: "hangout-collab",
      identity: callerIdentity(req),
      burst: 30,
      refillPerSec: 30 / 60,
    });
    if (!allowed) return errorResponse("Rate limit exceeded", 429);

    let body: Body;
    try {
      body = (await req.json()) as Body;
    } catch {
      return errorResponse("Invalid JSON body");
    }

    switch (body.action) {
      case "create_shared": {
        if (!body.hangout?.plan) return errorResponse("hangout.plan required");
        const token = randomToken(16);
        const { data, error } = await supabaseAdmin
          .from("hangout_crew")
          .insert({
            token,
            occasion: body.hangout.occasion ?? null,
            occasion_key: body.hangout.occasionKey ?? null,
            city: body.hangout.city ?? null,
            start_time: body.hangout.startTime ?? null,
            date: body.hangout.date ?? null,
            mode: body.hangout.mode ?? null,
            plan: body.hangout.plan,
            host_name: body.hostName ?? null,
            generated_at: body.hangout.generatedAt ?? new Date().toISOString(),
          })
          .select("id,token")
          .single();
        if (error || !data) throw new Error(error?.message ?? "Insert failed");
        return jsonResponse({
          token: (data as { token: string }).token,
          id: (data as { id: string }).id,
        });
      }

      case "get_by_token": {
        if (!body.token) return errorResponse("token required");
        const { data: hangout, error } = await supabaseAdmin
          .from("hangout_crew")
          .select("id,token,occasion,occasion_key,city,start_time,date,mode,plan,host_name,generated_at,created_at,expires_at")
          .eq("token", body.token)
          .maybeSingle();
        if (error) throw new Error(error.message);
        if (!hangout) return errorResponse("Hangout not found", 404);
        if ((hangout as { expires_at?: string }).expires_at) {
          const exp = new Date((hangout as { expires_at: string }).expires_at);
          if (exp.getTime() < Date.now()) return errorResponse("Hangout link expired", 410);
        }
        const { data: claims } = await supabaseAdmin
          .from("hangout_claims")
          .select("item_category,item_key,item_label,claimed_by_name,claimed_by_token,note,claimed_at")
          .eq("hangout_id", (hangout as { id: string }).id)
          .order("claimed_at", { ascending: true });
        return jsonResponse({ hangout, claims: claims ?? [] });
      }

      case "claim": {
        if (!body.token || !body.item_category || !body.item_key || !body.claimed_by_name || !body.claimed_by_token) {
          return errorResponse("token, item_category, item_key, claimed_by_name, claimed_by_token required");
        }
        const { data: row, error: rowErr } = await supabaseAdmin
          .from("hangout_crew")
          .select("id")
          .eq("token", body.token)
          .maybeSingle();
        if (rowErr || !row) return errorResponse("Hangout not found", 404);
        const { error } = await supabaseAdmin
          .from("hangout_claims")
          .upsert(
            {
              hangout_id: (row as { id: string }).id,
              item_category: body.item_category,
              item_key: body.item_key,
              item_label: body.item_label ?? null,
              claimed_by_name: body.claimed_by_name.slice(0, 40),
              claimed_by_token: body.claimed_by_token,
              note: body.note?.slice(0, 200) ?? null,
            },
            { onConflict: "hangout_id,item_category,item_key" },
          );
        if (error) throw new Error(error.message);
        return jsonResponse({ ok: true });
      }

      case "unclaim": {
        if (!body.token || !body.item_category || !body.item_key || !body.claimed_by_token) {
          return errorResponse("token, item_category, item_key, claimed_by_token required");
        }
        const { data: row } = await supabaseAdmin
          .from("hangout_crew")
          .select("id")
          .eq("token", body.token)
          .maybeSingle();
        if (!row) return errorResponse("Hangout not found", 404);
        const { error } = await supabaseAdmin
          .from("hangout_claims")
          .delete()
          .eq("hangout_id", (row as { id: string }).id)
          .eq("item_category", body.item_category)
          .eq("item_key", body.item_key)
          .eq("claimed_by_token", body.claimed_by_token);
        if (error) throw new Error(error.message);
        return jsonResponse({ ok: true });
      }

      default:
        return errorResponse("Unknown action", 400);
    }
  } catch (err) {
    console.error("[hangout-collab] uncaught:", (err as Error).stack ?? err);
    return errorResponse(`Unhandled: ${(err as Error).message ?? String(err)}`, 500);
  }
});
