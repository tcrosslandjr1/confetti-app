const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function getAllowedOrigin(request?: Request): string {
  const origin = request?.headers.get("origin") ?? "";
  // Always allow localhost and common dev/preview patterns
  if (
    origin.startsWith("http://localhost") ||
    origin.startsWith("http://127.0.0.1") ||
    origin.endsWith(".confettiplan.com") ||
    origin.endsWith(".vercel.app")
  ) {
    return origin;
  }
  if (ALLOWED_ORIGINS.length === 0) return "";
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  return "";
}

export function getCorsHeaders(request?: Request) {
  const allowedOrigin = getAllowedOrigin(request);
  return {
    "Access-Control-Allow-Origin": allowedOrigin || "null",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}

// AsyncLocalStorage-based context so serve() wrapper can thread the request
// through to corsHeaders() without changing every handler signature.
const { AsyncLocalStorage } = await import("node:async_hooks");
const requestStore = new AsyncLocalStorage<Request>();

export function withRequestContext<T>(req: Request, fn: () => T): T {
  return requestStore.run(req, fn);
}

/** Get the current request from AsyncLocalStorage (set by serve() wrapper) */
export function currentRequest(): Request | undefined {
  return requestStore.getStore();
}

// Keep backward-compatible static export for functions that don't pass the request
export const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGINS")?.split(",")[0]?.trim() || "null",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
};
