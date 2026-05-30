import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

// user_roles and admin_audit_log are absent from generated types — use any to bypass
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function anyAdminClient(): any {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function assertAdmin(userId: string) {
  const supabase = anyAdminClient();
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Admins only");
}

export type AdminMember = {
  user_id: string;
  email: string;
  display_name: string | null;
  granted_at: string | null;
  last_sign_in_at: string | null;
};

/** List every user with the `admin` role. */
export const listAdminsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const supabase = anyAdminClient();

    const { data: rows, error } = await supabase
      .from("user_roles")
      .select("user_id, created_at")
      .eq("role", "admin");
    if (error) throw new Error(error.message);

    const ids = (rows ?? []).map((r) => r.user_id);
    if (!ids.length) return { admins: [] as AdminMember[] };

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", ids);
    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

    // Resolve auth metadata (email, last sign-in) by paging once.
    const emails = new Map<string, { email: string; last_sign_in_at: string | null }>();
    let page = 1;
    while (page <= 20) {
      const { data: list, error: lerr } = await supabase.auth.admin.listUsers({
        page,
        perPage: 200,
      });
      if (lerr) throw new Error(lerr.message);
      for (const u of list.users) {
        if (ids.includes(u.id)) {
          emails.set(u.id, {
            email: u.email ?? "",
            last_sign_in_at: u.last_sign_in_at ?? null,
          });
        }
      }
      if (list.users.length < 200 || emails.size >= ids.length) break;
      page++;
    }

    const admins: AdminMember[] = (rows ?? []).map((r) => {
      const meta = emails.get(r.user_id);
      return {
        user_id: r.user_id,
        email: meta?.email ?? "",
        display_name: profileMap.get(r.user_id) ?? null,
        granted_at: r.created_at ?? null,
        last_sign_in_at: meta?.last_sign_in_at ?? null,
      };
    });
    admins.sort((a, b) => (a.email || "").localeCompare(b.email || ""));
    return { admins };
  });

/** Grant the `admin` role to a user, looked up by email. */
export const grantAdminByEmailFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ email: z.string().email().max(255) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const supabase = anyAdminClient();
    const target = data.email.trim().toLowerCase();

    let userId: string | null = null;
    let page = 1;
    while (page <= 20 && !userId) {
      const { data: list, error } = await supabase.auth.admin.listUsers({
        page,
        perPage: 200,
      });
      if (error) throw new Error(error.message);
      const match = list.users.find((u) => (u.email ?? "").toLowerCase() === target);
      if (match) {
        userId = match.id;
        break;
      }
      if (list.users.length < 200) break;
      page++;
    }
    if (!userId) throw new Error(`No account found for ${data.email}`);

    const { error: insErr } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });
    if (insErr && !/duplicate|unique/i.test(insErr.message)) throw new Error(insErr.message);

    await supabase.from("admin_audit_log").insert({
      reviewer_id: context.userId,
      action: "role_grant",
      entity_type: "user",
      entity_id: userId,
      entity_label: "admin",
      note: `granted via roles page (${target})`,
    } as never);

    return { ok: true, userId };
  });

/** Revoke the `admin` role from a user. Self-revoke is blocked. */
export const revokeAdminFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    if (data.userId === context.userId) {
      throw new Error("You can't remove your own admin role");
    }
    const supabase = anyAdminClient();

    // Refuse to revoke the last admin.
    const { count } = await supabase
      .from("user_roles")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) <= 1) {
      throw new Error("At least one admin must remain");
    }

    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", "admin");
    if (error) throw new Error(error.message);

    await supabase.from("admin_audit_log").insert({
      reviewer_id: context.userId,
      action: "role_revoke",
      entity_type: "user",
      entity_id: data.userId,
      entity_label: "admin",
      note: "revoked via roles page",
    } as never);

    return { ok: true };
  });
