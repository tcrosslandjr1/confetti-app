import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Music2, Loader2, Unlink, ExternalLink, AlertTriangle, RefreshCw, CheckCircle2 } from "lucide-react";
import {
  disconnectTiktok,
  getMyLinkedAccounts,
  refreshMyTiktokToken,
} from "@/lib/tiktok-oauth.functions";

/**
 * Profile card for the user's linked TikTok account.
 *
 * Renders the avatar, display name, @handle, and a Disconnect button.
 * If TikTok isn't connected, the card stays out of the way and prompts
 * the user toward the unified Connections panel above.
 */
export function TiktokProfileCard() {
  const qc = useQueryClient();
  const listFn = useServerFn(getMyLinkedAccounts);
  const disconnectFn = useServerFn(disconnectTiktok);
  const refreshFn = useServerFn(refreshMyTiktokToken);
  const [error, setError] = useState<string | null>(null);
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["linked-accounts"],
    queryFn: () => listFn({}),
  });
  const tiktok = data?.accounts.find((a) => a.provider === "tiktok") ?? null;

  const disconnectMut = useMutation({
    mutationFn: async () => {
      await disconnectFn({});
    },
    onSuccess: () => {
      setConfirming(false);
      qc.invalidateQueries({ queryKey: ["linked-accounts"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const refreshMut = useMutation({
    mutationFn: async () => {
      const r = await refreshFn({});
      return r;
    },
    onSuccess: (r) => {
      setError(null);
      setRefreshedAt(r.expires_at ?? new Date().toISOString());
      qc.invalidateQueries({ queryKey: ["linked-accounts"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking TikTok…
        </div>
      </div>
    );
  }

  if (!tiktok) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card/60 p-5 text-sm">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-foreground text-background">
            <Music2 className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="font-display text-base font-bold">TikTok</div>
            <p className="text-xs text-muted-foreground">
              Not connected yet. Use Connect TikTok in Connected accounts above
              to link your handle.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handle = tiktok.username ?? tiktok.provider_user_id;
  const profileUrl = tiktok.username
    ? `https://www.tiktok.com/@${tiktok.username}`
    : null;
  const initials = (tiktok.display_name ?? handle ?? "?")
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative shrink-0">
            {tiktok.avatar_url ? (
              <img
                src={tiktok.avatar_url}
                alt={tiktok.display_name ?? handle ?? "TikTok avatar"}
                referrerPolicy="no-referrer"
                className="h-14 w-14 rounded-2xl object-cover"
                onError={(e) => {
                  // Fall back to initials if TikTok blocks hotlinking.
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-muted text-base font-bold">
                {initials || "?"}
              </div>
            )}
            <span
              aria-hidden
              className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-foreground text-background ring-2 ring-card"
            >
              <Music2 className="h-3 w-3" />
            </span>
          </div>
          <div className="min-w-0">
            <div className="font-display text-base font-bold leading-tight">
              {tiktok.display_name ?? handle}
            </div>
            {handle && (
              <a
                href={profileUrl ?? "#"}
                target={profileUrl ? "_blank" : undefined}
                rel={profileUrl ? "noopener noreferrer" : undefined}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                @{handle}
                {profileUrl && <ExternalLink className="h-3 w-3" />}
              </a>
            )}
            <p className="mt-1 text-[11px] text-muted-foreground">
              Linked {new Date(tiktok.created_at).toLocaleDateString()}
              {tiktok.scope ? ` · ${tiktok.scope.split(",").length} scopes` : ""}
            </p>
          </div>
        </div>

        {!confirming ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => refreshMut.mutate()}
              disabled={refreshMut.isPending}
              title="Rotate the TikTok access token now"
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-60"
            >
              {refreshMut.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Refresh
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setConfirming(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <Unlink className="h-3 w-3" /> Disconnect
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <p className="text-[11px] text-muted-foreground">Disconnect TikTok?</p>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={disconnectMut.isPending}
                className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold hover:bg-accent disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => disconnectMut.mutate()}
                disabled={disconnectMut.isPending}
                className="inline-flex items-center gap-1 rounded-full bg-destructive px-2.5 py-1 text-[11px] font-semibold text-destructive-foreground disabled:opacity-50"
              >
                {disconnectMut.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Unlink className="h-3 w-3" />
                )}
                Confirm
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-destructive">
          <AlertTriangle className="h-3 w-3" /> {error}
        </p>
      )}
      {refreshedAt && !error && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
          Token refreshed · valid until {new Date(refreshedAt).toLocaleString()}
        </p>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Disconnecting removes the access token from your account. Your TikTok
        post history isn't deleted on TikTok's side — only our link to it.
      </p>
    </div>
  );
}
