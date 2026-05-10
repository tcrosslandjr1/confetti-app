import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Music2,
  Instagram,
  Apple,
  Link2,
  Unlink,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  startTiktokLink,
  disconnectTiktok,
  getMyLinkedAccounts,
} from "@/lib/tiktok-oauth.functions";
import {
  startInstagramLink,
  disconnectInstagram,
} from "@/lib/instagram-oauth.functions";
import { getOAuthProvidersStatus } from "@/lib/oauth-providers.functions";
import { ProviderSetupDialog } from "@/components/ProviderSetupDialog";

/**
 * Unified account-linking panel.
 *
 * Shows the four providers we support, in two tiers:
 *
 *  - Google / Apple: native Supabase auth identities, linked via
 *    supabase.auth.linkIdentity / unlinkIdentity. These live in auth.users.
 *  - TikTok / Instagram: custom OAuth flows we own; persisted in the
 *    public.linked_social_accounts table.
 *
 * The panel reads both sources and renders a single, consistent list so users
 * have one place to manage every connection.
 */

type ProviderKey = "google" | "apple" | "tiktok" | "instagram";

type ProviderRow = {
  key: ProviderKey;
  label: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
  iconWrapClass: string;
  buttonClass: string;
  source: "native" | "linked_social_accounts";
};

const PROVIDERS: ProviderRow[] = [
  {
    key: "google",
    label: "Google",
    description: "Sign-in identity",
    Icon: GoogleGlyph,
    iconWrapClass: "bg-white border border-border",
    buttonClass: "bg-foreground text-background",
    source: "native",
  },
  {
    key: "apple",
    label: "Apple",
    description: "Sign-in identity",
    Icon: Apple,
    iconWrapClass: "bg-foreground text-background",
    buttonClass: "bg-foreground text-background",
    source: "native",
  },
  {
    key: "tiktok",
    label: "TikTok",
    description: "Learns from your favorites",
    Icon: Music2,
    iconWrapClass: "bg-foreground text-background",
    buttonClass: "bg-foreground text-background",
    source: "linked_social_accounts",
  },
  {
    key: "instagram",
    label: "Instagram",
    description: "Learns from your aesthetic",
    Icon: Instagram,
    iconWrapClass:
      "bg-gradient-to-br from-fuchsia-500 via-rose-500 to-amber-400 text-white",
    buttonClass:
      "bg-gradient-to-r from-fuchsia-500 via-rose-500 to-amber-400 text-white",
    source: "linked_social_accounts",
  },
];

export function ConnectionsPanel({ consent }: { consent: boolean }) {
  const qc = useQueryClient();
  const startTiktokFn = useServerFn(startTiktokLink);
  const disconnectTiktokFn = useServerFn(disconnectTiktok);
  const startIgFn = useServerFn(startInstagramLink);
  const disconnectIgFn = useServerFn(disconnectInstagram);
  const listFn = useServerFn(getMyLinkedAccounts);
  const statusFn = useServerFn(getOAuthProvidersStatus);

  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<ProviderKey | null>(null);
  const [setupProvider, setSetupProvider] = useState<
    "tiktok" | "instagram" | null
  >(null);

  // ----- Linked accounts (TikTok / Instagram) -----
  const { data: linkedData, isLoading: linkedLoading } = useQuery({
    queryKey: ["linked-accounts"],
    queryFn: () => listFn({}),
  });
  const linkedByProvider = useMemo(() => {
    const m: Record<string, NonNullable<typeof linkedData>["accounts"][number]> =
      {};
    for (const a of linkedData?.accounts ?? []) m[a.provider] = a;
    return m;
  }, [linkedData]);

  // ----- Provider configuration status (TikTok / Instagram credentials) -----
  const { data: configStatus } = useQuery({
    queryKey: ["oauth-providers-status"],
    queryFn: () => statusFn({}),
    staleTime: 60_000,
  });
  const configByProvider = useMemo(() => {
    const m: Record<string, { configured: boolean; missing: string[] }> = {};
    for (const s of configStatus?.providers ?? []) m[s.id] = s;
    return m;
  }, [configStatus]);

  // ----- Native identities (Google / Apple) -----
  const { data: identityData, isLoading: identitiesLoading } = useQuery({
    queryKey: ["auth-identities"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUserIdentities();
      if (error) throw error;
      return data?.identities ?? [];
    },
  });
  const identityByProvider = useMemo(() => {
    const m: Record<string, NonNullable<typeof identityData>[number]> = {};
    for (const id of identityData ?? []) m[id.provider] = id;
    return m;
  }, [identityData]);

  // ----- Flash messages from OAuth callbacks -----
  // Custom (TikTok/Instagram) callbacks set ?tiktok=connected etc.
  // Native Supabase identity links return through OAuth with #error params
  // in the URL hash on failure; on success they just land back on /me, in
  // which case we re-fetch identities so the new row appears immediately.
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    let touched = false;
    for (const provider of ["tiktok", "instagram"] as const) {
      const v = sp.get(provider);
      if (!v) continue;
      touched = true;
      const label = provider === "tiktok" ? "TikTok" : "Instagram";
      if (v === "connected") {
        setFlash({ ok: true, text: `${label} connected.` });
      } else {
        setFlash({
          ok: false,
          text: `${label} connection failed (${sp.get("reason") ?? v}).`,
        });
      }
      sp.delete(provider);
    }
    if (touched) {
      sp.delete("reason");
      const qs = sp.toString();
      window.history.replaceState(
        {},
        "",
        window.location.pathname + (qs ? `?${qs}` : ""),
      );
    }

    // Native identity link feedback (Google / Apple).
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : "";
    if (hash) {
      const hp = new URLSearchParams(hash);
      const err = hp.get("error_description") ?? hp.get("error");
      if (err) {
        setFlash({ ok: false, text: decodeURIComponent(err.replace(/\+/g, " ")) });
        window.history.replaceState({}, "", window.location.pathname + window.location.search);
      } else if (hp.get("access_token")) {
        // Came back from a successful OAuth link — refresh identities.
        qc.invalidateQueries({ queryKey: ["auth-identities"] });
      }
    }
  }, [qc]);

  function isConnected(p: ProviderRow) {
    return p.source === "native"
      ? Boolean(identityByProvider[p.key])
      : Boolean(linkedByProvider[p.key]);
  }

  function connectionLabel(p: ProviderRow): string {
    if (p.source === "native") {
      const id = identityByProvider[p.key];
      if (!id) return "Not connected";
      const meta = (id.identity_data ?? {}) as Record<string, unknown>;
      const handle =
        (meta.email as string | undefined) ??
        (meta.preferred_username as string | undefined) ??
        (meta.name as string | undefined);
      return handle ? `Connected as ${handle}` : "Connected";
    }
    const linked = linkedByProvider[p.key];
    if (!linked) return "Not connected";
    const handle =
      linked.username ?? linked.display_name ?? linked.provider_user_id;
    return `Connected as @${handle}`;
  }

  const connectMut = useMutation({
    mutationFn: async (p: ProviderRow) => {
      if (p.source === "native") {
        const { data, error } = await supabase.auth.linkIdentity({
          provider: p.key as "google" | "apple",
          options: { redirectTo: `${window.location.origin}/me` },
        });
        if (error) {
          // Common: "Manual linking is disabled" — surface actionable help.
          if (/manual linking/i.test(error.message)) {
            throw new Error(
              "Manual identity linking is disabled. Enable it in Lovable Cloud → Auth settings, then try again.",
            );
          }
          throw error;
        }
        if (data?.url) window.location.href = data.url;
        return;
      }
      const fn = p.key === "tiktok" ? startTiktokFn : startIgFn;
      const { url } = await fn({ data: { redirectTo: "/me" } });
      window.location.href = url;
    },
    onMutate: (p) => setBusyKey(p.key),
    onError: (e: Error) => {
      setBusyKey(null);
      setError(e.message);
    },
  });

  const disconnectMut = useMutation({
    mutationFn: async (p: ProviderRow) => {
      if (p.source === "native") {
        const id = identityByProvider[p.key];
        if (!id) return;
        // Supabase requires at least one remaining identity (incl. email) to unlink.
        const total = (identityData ?? []).length;
        if (total <= 1) {
          throw new Error(
            "You can't unlink your only sign-in method. Add another one first.",
          );
        }
        const { error } = await supabase.auth.unlinkIdentity(id);
        if (error) throw error;
        return;
      }
      const fn = p.key === "tiktok" ? disconnectTiktokFn : disconnectIgFn;
      await fn({});
    },
    onMutate: (p) => setBusyKey(p.key),
    onSettled: () => setBusyKey(null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["linked-accounts"] });
      qc.invalidateQueries({ queryKey: ["auth-identities"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const loading = linkedLoading || identitiesLoading;

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">Connected accounts</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage every identity linked to this Confettiplan account in one place.
          </p>
        </div>
        <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
      </div>

      <ul className="mt-4 space-y-2">
        {PROVIDERS.map((p) => {
          const connected = isConnected(p);
          const busy = busyKey === p.key;
          // Custom OAuth providers (TikTok/IG) need credentials configured.
          // Native providers (Google/Apple) are managed by Lovable Cloud.
          const cfg = configByProvider[p.key];
          const notConfigured =
            p.source === "linked_social_accounts" && cfg && !cfg.configured;
          const blockedByConsent =
            !connected && !consent && p.source === "linked_social_accounts";
          const connectDisabled = busy || blockedByConsent || Boolean(notConfigured);
          const connectTitle = notConfigured
            ? `Missing credentials: ${cfg!.missing.join(", ")}`
            : blockedByConsent
              ? "Accept the data sharing terms first"
              : undefined;

          return (
            <li
              key={p.key}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className={`grid h-8 w-8 place-items-center rounded-lg ${p.iconWrapClass}`}
                >
                  <p.Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-semibold">
                    {p.label}
                    {connected && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    )}
                    {notConfigured && !connected && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                        Not configured
                      </span>
                    )}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {loading
                      ? "Checking…"
                      : notConfigured && !connected
                        ? `Add ${cfg!.missing.join(" + ")} in Lovable Cloud secrets`
                        : connectionLabel(p)}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                {p.source === "linked_social_accounts" && !connected && (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSetupProvider(p.key as "tiktok" | "instagram");
                    }}
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    {notConfigured ? "Set up" : "Settings"}
                  </button>
                )}
                {connected ? (
                  <button
                    onClick={() => {
                      setError(null);
                      disconnectMut.mutate(p);
                    }}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    {busy ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Unlink className="h-3 w-3" />
                    )}
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setError(null);
                      connectMut.mutate(p);
                    }}
                    disabled={connectDisabled}
                    title={connectTitle}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${p.buttonClass}`}
                  >
                    {busy ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Link2 className="h-3 w-3" />
                    )}
                    Connect
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {flash && (
        <p
          className={`mt-3 inline-flex items-center gap-1.5 text-[11px] ${flash.ok ? "text-emerald-600" : "text-destructive"}`}
        >
          {flash.ok ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <AlertTriangle className="h-3 w-3" />
          )}
          {flash.text}
        </p>
      )}
      {error && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-destructive">
          <AlertTriangle className="h-3 w-3" /> {error}
        </p>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Tokens for TikTok and Instagram are stored server-side in
        linked_social_accounts and never exposed to the browser. Your AI agent
        reads from this table to personalize plans.
      </p>

      <ProviderSetupDialog
        provider={setupProvider}
        open={setupProvider !== null}
        onOpenChange={(o) => {
          if (!o) setSetupProvider(null);
        }}
      />
    </div>
  );
}

function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.5 12 2.5 6.8 2.5 2.5 6.8 2.5 12S6.8 21.5 12 21.5c6.9 0 9.5-4.8 9.5-7.4 0-.5 0-.9-.1-1.3H12z"
      />
    </svg>
  );
}
