import { createClient, type Provider, type SupabaseClient } from "@supabase/supabase-js";

type QueryResult<T = any> = Promise<{ data: T | null; error: Error | null }>;

// Supabase project constants — the anon key is public by design (protected by RLS)
const CONFETTI_SUPABASE_URL = "https://zfeckvxkulreyapadanf.supabase.co";
const CONFETTI_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmZWNrdnhrdWxyZXlhcGFkYW5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NzU1MDgsImV4cCI6MjA5NDA1MTUwOH0.KPYif0ntCEVwqOIUWX8r3ZYGI2xGmYIU3oKgnI8aYM0";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL?.trim()) || CONFETTI_SUPABASE_URL;
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()) ||
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()) ||
  CONFETTI_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes("your-project-ref") &&
    !supabaseAnonKey.includes("your-supabase")
);

class SupabaseQueryBuilder {
  select(..._args: any[]) {
    return this;
  }

  eq(..._args: any[]) {
    return this;
  }

  ilike(..._args: any[]) {
    return this;
  }

  order(..._args: any[]) {
    return this;
  }

  limit(..._args: any[]) {
    return this;
  }

  single(): QueryResult {
    return Promise.resolve({ data: null, error: null });
  }

  maybeSingle(): QueryResult {
    return Promise.resolve({ data: null, error: null });
  }

  insert(..._args: any[]): QueryResult {
    return Promise.resolve({ data: null, error: null });
  }

  upsert(..._args: any[]): QueryResult {
    return Promise.resolve({ data: null, error: null });
  }

  update(..._args: any[]) {
    return this;
  }

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
  user_metadata: {
    full_name: "Demo Explorer",
    username: "demo_explorer"
  }
};

const fallbackSupabase = {
  from(..._args: any[]) {
    return new SupabaseQueryBuilder();
  },
  rpc(..._args: any[]) {
    return Promise.resolve({ data: null, error: null });
  },
  auth: {
    signUp() {
      return Promise.resolve({ data: { user: demoAuthUser, session: { user: demoAuthUser } }, error: null });
    },
    signInWithPassword() {
      return Promise.resolve({ data: { user: demoAuthUser, session: { user: demoAuthUser } }, error: null });
    },
    signInWithOAuth({ provider }: { provider: Provider }) {
      return Promise.resolve({
        data: { provider, url: null },
        error: null
      });
    },
    signOut() {
      return Promise.resolve({ error: null });
    },
    getSession() {
      return Promise.resolve({ data: { session: null }, error: null });
    },
    onAuthStateChange() {
      return {
        data: {
          subscription: {
            unsubscribe() {}
          }
        }
      };
    }
  }
};

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true
      }
    })
  : (fallbackSupabase as unknown as SupabaseClient);
