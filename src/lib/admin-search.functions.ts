import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

function adminClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function assertAdmin(userId: string) {
  const supabase = adminClient();
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Admins only");
}

export type AdminSearchHit =
  | {
      type: "user";
      id: string;
      title: string;
      subtitle: string | null;
      href: string;
    }
  | {
      type: "event";
      id: string;
      title: string;
      subtitle: string | null;
      href: string;
    }
  | {
      type: "booking";
      id: string;
      title: string;
      subtitle: string | null;
      href: string;
    };

export type AdminSearchResults = {
  users: AdminSearchHit[];
  events: AdminSearchHit[];
  bookings: AdminSearchHit[];
};

const PER_TYPE = 5;

export const adminGlobalSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      q: z.string().trim().min(1).max(120),
    }).parse,
  )
  .handler(async ({ data, context }): Promise<AdminSearchResults> => {
    await assertAdmin(context.userId);
    const supabase = adminClient();
    const q = data.q.trim();
    const like = `%${q.replace(/[%_]/g, (m) => `\\${m}`)}%`;
    const looksLikeEmail = q.includes("@");

    // ---- Users (profiles + email via admin auth) ----
    const usersOut: AdminSearchHit[] = [];

    // Profiles by display_name
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, full_name")
      .ilike("full_name", like)
      .limit(PER_TYPE);

    const profIds = new Set<string>();
    for (const p of profs ?? []) {
      profIds.add(p.id);
      usersOut.push({
        type: "user",
        id: p.id,
        title: p.full_name ?? "(no name)",
        subtitle: p.id.slice(0, 8),
        href: `/admin/users?focus=${p.id}`,
      });
    }

    // Email match via auth admin (only when it looks email-ish, to avoid heavy scan)
    if (looksLikeEmail && usersOut.length < PER_TYPE) {
      try {
        const { data: list } = await supabase.auth.admin.listUsers({
          page: 1,
          perPage: 200,
        });
        const ql = q.toLowerCase();
        for (const u of list?.users ?? []) {
          if (usersOut.length >= PER_TYPE) break;
          if (profIds.has(u.id)) continue;
          if ((u.email ?? "").toLowerCase().includes(ql)) {
            usersOut.push({
              type: "user",
              id: u.id,
              title: u.email ?? "(no email)",
              subtitle: `Signed up ${
                u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"
              }`,
              href: `/admin/users?focus=${u.id}`,
            });
          }
        }
      } catch {
        /* noop */
      }
    }

    // ---- Events ----
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: evRows } = await (supabase as any)
      .from("events")
      .select("id, title, venue_name, city, starts_at")
      .or(`title.ilike.${like},venue_name.ilike.${like},city.ilike.${like}`)
      .order("starts_at", { ascending: false })
      .limit(PER_TYPE);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const events: AdminSearchHit[] = (evRows ?? []).map((e: any) => ({
      type: "event",
      id: e.id,
      title: e.title,
      subtitle: [
        e.venue_name,
        e.city,
        e.starts_at ? new Date(e.starts_at).toLocaleDateString() : null,
      ]
        .filter(Boolean)
        .join(" · "),
      href: `/admin/event-analytics?event=${e.id}`,
    }));

    // ---- Bookings (orders) ----
    let bookingQ = supabase
      .from("bookings")
      .select("id, venue_name, confirmation_code, status, starts_at, party_size")
      .order("created_at", { ascending: false })
      .limit(PER_TYPE);

    // If query looks like a UUID prefix or short code, prioritize id/conf code
    if (/^[a-f0-9-]{4,}$/i.test(q)) {
      bookingQ = bookingQ.or(
        `confirmation_code.ilike.${like},venue_name.ilike.${like},id::text.ilike.${like}`,
      );
    } else {
      bookingQ = bookingQ.or(`venue_name.ilike.${like},confirmation_code.ilike.${like}`);
    }

    const { data: bkRows } = await bookingQ;
    const bookings: AdminSearchHit[] = (bkRows ?? []).map((b) => ({
      type: "booking",
      id: b.id,
      title: b.venue_name,
      subtitle: [
        b.confirmation_code ? `#${b.confirmation_code}` : `#${b.id.slice(0, 8)}`,
        b.status,
        `party ${b.party_size}`,
        b.starts_at ? new Date(b.starts_at).toLocaleDateString() : null,
      ]
        .filter(Boolean)
        .join(" · "),
      href: `/admin/bookings?focus=${b.id}`,
    }));

    return { users: usersOut, events, bookings };
  });
