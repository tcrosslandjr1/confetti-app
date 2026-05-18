// Lightweight bearer-token check for raw server routes (not server fns).
// Returns the authenticated user id, or null when the token is missing/invalid.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function getAuthedUserId(request: Request): Promise<string | null> {
  const header = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  const token = match?.[1];
  if (!token) return null;
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

export function unauthorizedResponse(corsHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
