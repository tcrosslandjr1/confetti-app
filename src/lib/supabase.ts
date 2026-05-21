import { createClient, type Provider, type SupabaseClient } from "@supabase/supabase-js";

type QueryResult<T = any> = Promise<{ data: T | null; error: Error | null }>;

const isDev = Boolean(import.meta.env.DEV);

const rawUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const rawKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

function hasRealConfig(): boolean {
  return Boolean(
    rawUrl &&
      rawKey &&
      !rawUrl.includes("your-project-ref") &&
      !rawKey.includes("your-supabase")
  );
}

export const isSupabaseConfigured = hasRealConfig();

// In production, a missing/placeholder config is a hard failure. Falling back
// to the demo-mode fake client in prod would silently log users into a fake
// account that persists nowhere — masking real ops issues.
if (!isDev && !isSupabaseConfigured) {
  throw new Error(
    "Supabase configuration missing: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment."
  );
}

// ─── Dev-only fallback (NEVER reached in production builds) ────────

class SupabaseQueryBuilder {
  select(..._args: any[]) { return this; }
  eq(..._args: any[]) { return this; }
  ilike(..._args: any[]) { return this; }
  order(..._args: any[]) { return this; }
  limit(..._args: any[]) { return this; }
  single(): QueryResult { return Promise.resolve({ data: null, error: null }); }
  maybeSingle(): QueryResult { return Promise.resolve({ data: null, error: null }); }
  insert(..._args: any[]): QueryResult { return Promise.resolve({ data: null, error: null }); }
  upsert(..._args: any[]): QueryResult { return Promise.resolve({ data: null, error: null }); }
  update(..._args: any[]) { return this; }
  then<TResult1 = { data: any; error: null }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return Promise.resolve({ data: null, error: null }).then(onfulfilled, onrejected);
  }
}

const demoAuthUser = {
  id: "demo-user",
  email: "demo@confetti.local",
  user_metadata: { full_name: "Demo Explorer", username: "demo_explorer" },
};

const fallbackSupabase = {
  from(..._args: any[]) { return new SupabaseQueryBuilder(); },
  rpc(..._args: any[]) { return Promise.resolve({ data: null, error: null }); },
  auth: {
    signUp() {
      return Promise.resolve({ data: { user: demoAuthUser, session: { user: demoAuthUser } }, error: null });
    },
    signInWithPassword() {
      return Promise.resolve({ data: { user: demoAuthUser, session: { user: demoAuthUser } }, error: null });
    },
    signInWithOAuth({ provider }: { provider: Provider }) {
      return Promise.resolve({ data: { provider, url: null }, error: null });
    },
    signOut() { return Promise.resolve({ error: null }); },
    getSession() { return Promise.resolve({ data: { session: null }, error: null }); },
    onAuthStateChange() {
      return { data: { subscription: { unsubscribe() {} } } };
    },
  },
};

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(rawUrl!, rawKey!, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : (fallbackSupabase as unknown as SupabaseClient);
