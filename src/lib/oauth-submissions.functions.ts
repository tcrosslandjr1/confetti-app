import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { OAUTH_PROVIDERS, type CustomOAuthProvider } from "./oauth-providers";

/**
 * OAuth credential submissions.
 *
 * Lets a signed-in user submit the client_id / client_secret for their
 * own TikTok or Instagram developer app. Submissions land in
 * oauth_credential_submissions with status='pending' for an admin to
 * review and promote into Lovable Cloud secrets.
 *
 * RLS guarantees the user can only read their own rows, so we just rely
 * on the user-scoped supabase client from the middleware.
 */

const ProviderSchema = z.enum(["tiktok", "instagram"]);

const SubmitSchema = z.object({
  provider: ProviderSchema,
  clientId: z.string().trim().min(1, "Client ID is required").max(512),
  clientSecret: z.string().trim().min(1, "Client secret is required").max(512),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const submitProviderCredentials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SubmitSchema.parse(input))
  .handler(async ({ data, context }) => {
    const provider = data.provider as CustomOAuthProvider;
    const spec = OAUTH_PROVIDERS[provider];
    // Build the canonical callback URL based on the request origin so
    // reviewers know exactly what to whitelist in the developer portal.
    const origin = process.env.SITE_URL ?? "https://confettiplan.lovable.app";
    const callbackUrl = `${origin.replace(/\/$/, "")}${spec.callbackPath}`;

    const { error } = await context.supabase.from("oauth_credential_submissions").insert({
      user_id: context.userId,
      provider,
      client_id: data.clientId,
      client_secret: data.clientSecret,
      callback_url: callbackUrl,
      notes: data.notes || null,
    });

    if (error) {
      // Unique partial index → friendly message for "already pending".
      if (error.code === "23505") {
        throw new Error(
          `You already have a pending ${spec.label} submission. Wait for review or contact support to update it.`,
        );
      }
      throw new Error(error.message);
    }
    return { ok: true };
  });

export const getMyProviderSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("oauth_credential_submissions")
      .select(
        "id, provider, status, client_id, callback_url, notes, review_notes, created_at, reviewed_at",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { submissions: data ?? [] };
  });
