import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const DEMO_ADMIN_EMAIL = "admin@demo.local";
const DEMO_CUSTOMER_EMAIL = "customer@demo.local";
const DEMO_PASSWORD = "Demo1234!";

async function ensureUser(email: string, displayName: string) {
  // Check if user already exists
  const { data: list } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  const existing = list?.users?.find((u) => u.email === email);
  if (existing) return existing.id;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });
  if (error) throw error;
  return data.user!.id;
}

export const seedDemoAccounts = createServerFn({ method: "POST" }).handler(async () => {
  const adminId = await ensureUser(DEMO_ADMIN_EMAIL, "Demo Admin");
  const customerId = await ensureUser(DEMO_CUSTOMER_EMAIL, "Demo Customer");

  // Grant admin role (customer role is auto-granted by trigger)
  const { error: roleErr } = await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: adminId, role: "admin" }, { onConflict: "user_id,role" });
  if (roleErr) throw roleErr;

  return {
    ok: true,
    accounts: [
      { role: "admin", email: DEMO_ADMIN_EMAIL, password: DEMO_PASSWORD },
      { role: "customer", email: DEMO_CUSTOMER_EMAIL, password: DEMO_PASSWORD },
    ],
  };
});
