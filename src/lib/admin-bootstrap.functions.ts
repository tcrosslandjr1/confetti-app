import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * One-time admin bootstrap.
 *
 * Promotes the given email to the `admin` role. Self-disables: once any admin
 * row exists in `public.user_roles`, this function refuses to run again.
 * After the first successful call, all subsequent calls return
 * { ok: false, reason: "already_bootstrapped" }.
 */
export const bootstrapAdmin = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ email: z.string().email().max(255) }).parse(input))
  .handler(async ({ data }) => {
    // Guard: refuse if any admin already exists.
    const { count, error: countErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "admin");
    if (countErr) throw new Error(countErr.message);
    if ((count ?? 0) > 0) {
      return { ok: false as const, reason: "already_bootstrapped" as const };
    }

    // Find user by email (paginate through auth users; should be small at bootstrap time).
    const target = data.email.trim().toLowerCase();
    let userId: string | null = null;
    let page = 1;
    // Cap to avoid runaway loops.
    while (page <= 20 && !userId) {
      const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({
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

    if (!userId) {
      return { ok: false as const, reason: "user_not_found" as const };
    }

    const { error: insErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });
    if (insErr) throw new Error(insErr.message);

    return { ok: true as const, userId };
  });
