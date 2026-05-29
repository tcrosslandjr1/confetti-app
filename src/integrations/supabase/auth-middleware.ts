// Confetti auth middleware — hardcoded fallbacks prevent stale .env overwrites
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const CONFETTI_SUPABASE_URL = "https://zfeckvxkulreyapadanf.supabase.co";
const CONFETTI_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmZWNrdnhrdWxyZXlhcGFkYW5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NzU1MDgsImV4cCI6MjA5NDA1MTUwOH0.KPYif0ntCEVwqOIUWX8r3ZYGI2xGmYIU3oKgnI8aYM0";

export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    let SUPABASE_URL = process.env.SUPABASE_URL || CONFETTI_SUPABASE_URL;
    let SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || CONFETTI_ANON_KEY;

    // Guard: if env URL points to wrong project, force Confetti
    if (!SUPABASE_URL.includes("zfeckvxkulreyapadanf")) {
      console.warn(`[Auth Middleware] SUPABASE_URL points to wrong project. Using Confetti fallback.`);
      SUPABASE_URL = CONFETTI_SUPABASE_URL;
      SUPABASE_PUBLISHABLE_KEY = CONFETTI_ANON_KEY;
    }

    const request = getRequest();

    if (!request?.headers) {
      throw new Response("Unauthorized: No request headers available", { status: 401 });
    }

    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      throw new Response("Unauthorized: No authorization header provided", { status: 401 });
    }

    if (!authHeader.startsWith("Bearer ")) {
      throw new Response("Unauthorized: Only Bearer tokens are supported", { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      throw new Response("Unauthorized: No token provided", { status: 401 });
    }

    const supabase = createClient<Database>(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      throw new Response("Unauthorized: Invalid token", { status: 401 });
    }

    return next({
      context: {
        supabase,
        userId: user.id,
        claims: user,
      },
    });
  },
);
