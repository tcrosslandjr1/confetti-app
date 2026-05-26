import { createStart, createMiddleware } from "@tanstack/react-start";

import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { renderErrorPage } from "./lib/error-page";

// Security headers applied to every response. CSP is intentionally
// permissive for inline styles (Tailwind/shadcn require it) but blocks
// untrusted scripts. Update SCRIPT/CONNECT srcs when adding new origins
// (e.g. analytics, embeds).
const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // 'unsafe-inline' / 'unsafe-eval' are required by Vite SSR hydration +
    // some shadcn/Radix runtime helpers. Tighten with nonces in a future pass.
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://maps.googleapis.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://openrouter.ai https://api.resend.com https://maps.googleapis.com https://places.googleapis.com",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "form-action 'self'",
  ].join("; "),
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(self), payment=(self)",
};

const securityHeadersMiddleware = createMiddleware().server(async ({ next }) => {
  const result = await next();
  const response = result as unknown as Response;
  if (response && typeof response === "object" && "headers" in response && response.headers) {
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
      if (!response.headers.has(k)) response.headers.set(k, v);
    }
  }
  return result;
});

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: {
        "content-type": "text/html; charset=utf-8",
        ...SECURITY_HEADERS,
      },
    });
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [securityHeadersMiddleware, errorMiddleware],
  functionMiddleware: [attachSupabaseAuth],
}));
