// Confetti Supabase client — hardcoded fallbacks prevent accidental .env overwrites
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Canonical Confetti project constants (anon key is public, protected by RLS)
const CONFETTI_SUPABASE_URL = "https://zfeckvxkulreyapadanf.supabase.co";
const CONFETTI_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmZWNrdnhrdWxyZXlhcGFkYW5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NzU1MDgsImV4cCI6MjA5NDA1MTUwOH0.KPYif0ntCEVwqOIUWX8r3ZYGI2xGmYIU3oKgnI8aYM0";

function createSupabaseClient() {
  // Env vars take priority, but fall back to hardcoded Confetti values
  // so an accidental .env overwrite can never break the connection.
  const SUPABASE_URL =
    import.meta.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    CONFETTI_SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    CONFETTI_ANON_KEY;

  // Warn if env vars pointed somewhere unexpected (the old project)
  if (SUPABASE_URL && !SUPABASE_URL.includes("zfeckvxkulreyapadanf")) {
    console.warn(
      `[Supabase] WARNING: SUPABASE_URL points to "${SUPABASE_URL}" instead of Confetti. Using hardcoded fallback.`
    );
    return createClient<Database>(CONFETTI_SUPABASE_URL, CONFETTI_ANON_KEY, {
      auth: {
        storage: typeof window !== "undefined" ? localStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof window !== "undefined" ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
