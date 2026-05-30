// Confetti server-side Supabase client — hardcoded URL fallback prevents stale .env overwrites
// Uses service role key (bypasses RLS). For admin operations in server functions only.
// For user-authenticated queries (with RLS), use the auth middleware instead.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const CONFETTI_SUPABASE_URL = "https://zfeckvxkulreyapadanf.supabase.co";

function createSupabaseAdminClient() {
  let SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Guard: if env URL points to wrong project, force Confetti
  if (SUPABASE_URL && !SUPABASE_URL.includes("zfeckvxkulreyapadanf")) {
    console.warn(
      `[Supabase Admin] WARNING: SUPABASE_URL points to "${SUPABASE_URL}" instead of Confetti. Using hardcoded fallback.`,
    );
    SUPABASE_URL = CONFETTI_SUPABASE_URL;
  }

  // Fall back to hardcoded URL if env is empty
  SUPABASE_URL = SUPABASE_URL || CONFETTI_SUPABASE_URL;

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    const message = `Missing SUPABASE_SERVICE_ROLE_KEY. Set it in your Vercel environment variables.`;
    console.error(`[Supabase Admin] ${message}`);
    throw new Error(message);
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

let _supabaseAdmin: ReturnType<typeof createSupabaseAdminClient> | undefined;

// Server-side Supabase client with service role - bypasses RLS
// SECURITY: Only use this for trusted server-side operations, never expose to client code
// Import like: import { supabaseAdmin } from "@/integrations/supabase/client.server";
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createSupabaseAdminClient>, {
  get(_, prop, receiver) {
    if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
    return Reflect.get(_supabaseAdmin, prop, receiver);
  },
});
