import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DEMO_ADMIN_EMAIL = "admin@confetti.com";
const DEMO_CUSTOMER_EMAIL = "customer@demo.local";
// Default password used only when SEED_DEMO_PASSWORD env var is not set.
const DEFAULT_DEMO_PASSWORD = "Demo1234!";

async function ensureUser(email: string, displayName: string, password: string) {
  const { data: list } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  const existing = list?.users?.find((u) => u.email === email);
  if (existing) return existing.id;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });
  if (error) throw error;
  return data.user!.id;
}

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Admins only");
}

export const seedDemoAccounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Hard-disable in production environments — seeding a known-credential
    // admin account in prod would be a critical privilege escalation.
    if (process.env.NODE_ENV === "production") {
      throw new Error("Demo seeding is disabled in production");
    }
    await assertAdmin(context.userId);

    const password = process.env.SEED_DEMO_PASSWORD || DEFAULT_DEMO_PASSWORD;

    const adminId = await ensureUser(DEMO_ADMIN_EMAIL, "Demo Admin", password);
    const customerId = await ensureUser(DEMO_CUSTOMER_EMAIL, "Demo Customer", password);
    void customerId;

    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: adminId, role: "admin" }, { onConflict: "user_id,role" });
    if (roleErr) throw roleErr;

    return {
      ok: true,
      accounts: [
        { role: "admin", email: DEMO_ADMIN_EMAIL, password },
        { role: "customer", email: DEMO_CUSTOMER_EMAIL, password },
      ],
    };
  });
