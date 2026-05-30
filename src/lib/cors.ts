/**
 * Shared CORS helpers.
 *
 * Replaces the wildcard `Access-Control-Allow-Origin: *` with an explicit
 * origin allowlist.  In development `localhost:*` is always permitted.
 *
 * Set `CORS_ALLOWED_ORIGINS` as a comma-separated list to extend:
 *   CORS_ALLOWED_ORIGINS="https://confetti.app,https://www.confetti.app"
 */

const DEV_PATTERN = /^https?:\/\/localhost(:\d+)?$/;

function getAllowedOrigins(): string[] {
  const raw = process.env.CORS_ALLOWED_ORIGINS ?? import.meta.env?.VITE_CORS_ALLOWED_ORIGINS ?? "";
  return raw
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean);
}

/**
 * Returns CORS headers for the given request origin.
 * If the origin is not in the allowlist the `Access-Control-Allow-Origin`
 * header is omitted entirely — the browser will block the request.
 */
export function corsHeaders(requestOrigin: string | null): Record<string, string> {
  const base: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };

  if (!requestOrigin) return base;

  const allowed = getAllowedOrigins();
  const isDev = process.env.NODE_ENV !== "production";

  if (allowed.includes(requestOrigin) || (isDev && DEV_PATTERN.test(requestOrigin))) {
    base["Access-Control-Allow-Origin"] = requestOrigin;
  }

  return base;
}

/** Shorthand pre-flight response. */
export function preflightResponse(request: Request): Response {
  const origin = request.headers.get("Origin");
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}
