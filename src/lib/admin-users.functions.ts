import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

// user_roles/admin_audit_log absent from types — use any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adminClient(): any {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const ROLES = ["admin", "business_owner", "customer"] as const;
export type AppRole = (typeof ROLES)[number];

export type AdminUserRow = {
  id: string;
  email: string;
  display_name: string | null;
  roles: AppRole[];
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  banned_until: string | null;
  confetti_pts: number;
};

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

/* ------------------------- LIST USERS ------------------------- */

export const listAdminUsersFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      q: z.string().max(160).optional(),
      page: z.number().int().min(1).max(500).default(1),
      perPage: z.number().int().min(10).max(200).default(50),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const supabase = adminClient();

    const { data: list, error } = await supabase.auth.admin.listUsers({
      page: data.page,
      perPage: data.perPage,
    });
    if (error) throw new Error(error.message);

    const ids = list.users.map((u) => u.id);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      ids.length
        ? supabase.from("profiles").select("id, full_name").in("id", ids)
        : Promise.resolve({
            data: [] as { id: string; full_name: string | null }[],
          }),
      ids.length
        ? supabase.from("user_roles").select("user_id, role").in("user_id", ids)
        : Promise.resolve({ data: [] as { user_id: string; role: AppRole }[] }),
    ]);

    const pMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    const rMap = new Map<string, AppRole[]>();
    for (const r of roles ?? []) {
      const arr = rMap.get(r.user_id) ?? [];
      arr.push(r.role as AppRole);
      rMap.set(r.user_id, arr);
    }

    const q = data.q?.trim().toLowerCase();
    const rows: AdminUserRow[] = list.users
      .map((u) => {
        const p = pMap.get(u.id);
        return {
          id: u.id,
          email: u.email ?? "",
          display_name: p?.full_name ?? null,
          roles: rMap.get(u.id) ?? [],
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at ?? null,
          email_confirmed_at: u.email_confirmed_at ?? null,
          banned_until: (u as { banned_until?: string | null }).banned_until ?? null,
          confetti_pts: 0,
        };
      })
      .filter((u) => {
        if (!q) return true;
        return (
          u.email.toLowerCase().includes(q) ||
          (u.display_name ?? "").toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q)
        );
      });

    return { users: rows, total: (list as { total?: number }).total ?? rows.length };
  });

/* ------------------------- SET ROLE ------------------------- */

export const setUserRoleFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      userId: z.string().uuid(),
      role: z.enum(ROLES),
      grant: z.boolean(),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const supabase = adminClient();

    if (data.grant) {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: data.userId, role: data.role });
      if (error && !/duplicate|unique/i.test(error.message)) throw new Error(error.message);
    } else {
      if (data.role === "admin" && data.userId === context.userId) {
        throw new Error("You can't remove your own admin role");
      }
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }

    await supabase.from("admin_audit_log").insert({
      reviewer_id: context.userId,
      action: data.grant ? "role_grant" : "role_revoke",
      entity_type: "user",
      entity_id: data.userId,
      entity_label: data.role,
      note: null,
    } as never);

    return { ok: true };
  });

/* ------------------------- SUSPEND / REACTIVATE ------------------------- */

export const setUserSuspendedFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      userId: z.string().uuid(),
      suspend: z.boolean(),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    if (data.suspend && data.userId === context.userId) {
      throw new Error("You can't suspend your own account");
    }
    const supabase = adminClient();
    const { error } = await supabase.auth.admin.updateUserById(data.userId, {
      ban_duration: data.suspend ? "876000h" : "none",
    } as never);
    if (error) throw new Error(error.message);

    await supabase.from("admin_audit_log").insert({
      reviewer_id: context.userId,
      action: data.suspend ? "user_suspend" : "user_reactivate",
      entity_type: "user",
      entity_id: data.userId,
      entity_label: null,
      note: null,
    } as never);

    return { ok: true };
  });

/* ------------------------- SEND PASSWORD RESET ------------------------- */

export const sendPasswordResetFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ email: z.string().email() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const supabase = adminClient();
    const { error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: data.email,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------- DELETE USER ------------------------- */

export const deleteUserFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ userId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    if (data.userId === context.userId) {
      throw new Error("You can't delete your own account");
    }
    const supabase = adminClient();
    const { error } = await supabase.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);

    await supabase.from("admin_audit_log").insert({
      reviewer_id: context.userId,
      action: "user_delete",
      entity_type: "user",
      entity_id: data.userId,
      entity_label: null,
      note: null,
    } as never);

    return { ok: true };
  });
