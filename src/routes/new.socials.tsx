import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  BrandMark,
  ChunkyButton,
  DotsBg,
  Frame,
  TopBar,
  TOKENS,
} from "@/components/new-confetti/shell";
import {
  connectPlatform,
  disconnectPlatform,
  getLinkedAccounts,
  triggerSocialSync,
  type LinkedAccount,
  type SocialPlatform,
} from "@/services/SocialConnectService";

// ─── Route ────────────────────────────────────────────────────────────────
export const Route = createFileRoute("/new/socials")({
  validateSearch: (s: Record<string, unknown>) => ({
    tiktok: s.tiktok as string | undefined,
    instagram: s.instagram as string | undefined,
    facebook: s.facebook as string | undefined,
  }),
  component: SocialsPage,
});

// ─── Platform meta ────────────────────────────────────────────────────────
interface PlatformMeta {
  id: SocialPlatform;
  label: string;
  icon: string;
  color: string;
  what: string;
}

const PLATFORMS: PlatformMeta[] = [
  {
    id: "tiktok",
    label: "TikTok",
    icon: "🎵",
    color: TOKENS.ink,
    what: "saved videos · liked content · algorithm signals",
  },
  {
    id: "instagram",
    label: "Instagram",
    icon: "📸",
    color: TOKENS.accent3,
    what: "saved posts · liked places · reels you love",
  },
  {
    id: "facebook",
    label: "Facebook",
    icon: "👍",
    color: TOKENS.accent2,
    what: "check-ins · liked pages · event history",
  },
];

// ─── Main component ────────────────────────────────────────────────────────
function SocialsPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/new/socials" });

  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<SocialPlatform | null>(null);
  const [disconnecting, setDisconnecting] = useState<SocialPlatform | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [justConnected, setJustConnected] = useState<SocialPlatform | null>(null);

  // ── Load linked accounts ──────────────────────────────────────────────
  const reload = useCallback(async () => {
    setLoading(true);
    const accs = await getLinkedAccounts();
    setAccounts(accs);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // ── Handle OAuth return params ────────────────────────────────────────
  useEffect(() => {
    const platforms: SocialPlatform[] = ["tiktok", "instagram", "facebook"];
    for (const p of platforms) {
      const val = search[p as keyof typeof search];
      if (val === "connected") {
        setJustConnected(p);
        showToast(`${p} connected! 🎉`, true);
        reload();
      } else if (val === "error") {
        showToast(`Couldn't connect ${p} — try again.`, false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────
  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const isLinked = (id: SocialPlatform) => accounts.some((a) => a.provider === id);

  const accountFor = (id: SocialPlatform) => accounts.find((a) => a.provider === id) ?? null;

  const handleConnect = async (id: SocialPlatform) => {
    setConnecting(id);
    try {
      await connectPlatform(id, "/new/socials");
      // window.location redirects — no further code runs here
    } catch (e) {
      showToast(`Error: ${(e as Error).message}`, false);
      setConnecting(null);
    }
  };

  const handleDisconnect = async (id: SocialPlatform) => {
    setDisconnecting(id);
    try {
      await disconnectPlatform(id);
      await reload();
      showToast(`${id} disconnected.`, true);
    } catch (e) {
      showToast(`Error: ${(e as Error).message}`, false);
    } finally {
      setDisconnecting(null);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    const res = await triggerSocialSync();
    showToast(res.message, res.ok);
    setSyncing(false);
  };

  const connectedCount = accounts.length;

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <Frame>
      <div
        style={{
          position: "relative",
          height: "100%",
          background: TOKENS.bg,
          display: "flex",
          flexDirection: "column",
          padding: "56px 20px 32px",
          overflow: "hidden",
        }}
      >
        <DotsBg opacity={0.05} />

        {/* Header */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <BackBtn onClick={() => navigate({ to: "/new/settings" })} />
          <BrandMark size={17} />
          <span style={{ width: 36 }} />
        </div>

        {/* Title block */}
        <div style={{ position: "relative", zIndex: 2, marginBottom: 28 }}>
          <div
            style={{
              fontFamily: TOKENS.display,
              fontWeight: 900,
              fontSize: 26,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              color: TOKENS.ink,
              marginBottom: 6,
            }}
          >
            connect your
            <br />
            <span style={{ color: TOKENS.accent1 }}>socials</span>.
          </div>
          <div
            style={{
              fontFamily: TOKENS.ui,
              fontSize: 13,
              color: TOKENS.ink,
              opacity: 0.6,
              lineHeight: 1.5,
            }}
          >
            confetti reads your saves, likes &amp; check-ins
            <br />
            to build a taste profile that&apos;s actually yours.
          </div>
        </div>

        {/* Platform cards */}
        <div
          style={{ position: "relative", zIndex: 2, flex: 1, overflowY: "auto", paddingBottom: 8 }}
        >
          {PLATFORMS.map((p) => {
            const linked = isLinked(p.id);
            const acc = accountFor(p.id);
            const isConnecting = connecting === p.id;
            const isDisconnecting = disconnecting === p.id;
            const fresh = justConnected === p.id;

            return (
              <PlatformCard
                key={p.id}
                meta={p}
                linked={linked}
                account={acc}
                isConnecting={isConnecting}
                isDisconnecting={isDisconnecting}
                isFresh={fresh}
                onConnect={() => handleConnect(p.id)}
                onDisconnect={() => handleDisconnect(p.id)}
              />
            );
          })}
        </div>

        {/* Sync CTA — only shown when ≥1 platform connected */}
        {connectedCount > 0 && !loading && (
          <div style={{ position: "relative", zIndex: 2, marginTop: 20 }}>
            <ChunkyButton onClick={handleSync} disabled={syncing} variant="primary" full>
              {syncing ? "syncing…" : `✨ sync now (${connectedCount} connected)`}
            </ChunkyButton>
            <div
              style={{
                fontFamily: TOKENS.ui,
                fontSize: 11,
                textAlign: "center",
                color: TOKENS.ink,
                opacity: 0.4,
                marginTop: 6,
              }}
            >
              confetti learns from your activity · no posting on your behalf
            </div>
          </div>
        )}

        {/* Empty state nudge */}
        {connectedCount === 0 && !loading && (
          <div
            style={{
              position: "relative",
              zIndex: 2,
              marginTop: 20,
              textAlign: "center",
              fontFamily: TOKENS.ui,
              fontSize: 13,
              color: TOKENS.ink,
              opacity: 0.5,
            }}
          >
            connect one platform to unlock smarter picks
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div
            style={{
              position: "fixed",
              bottom: 40,
              left: "50%",
              transform: "translateX(-50%)",
              background: toast.ok ? TOKENS.accent4 : TOKENS.accent1,
              color: TOKENS.paper,
              fontFamily: TOKENS.ui,
              fontWeight: 700,
              fontSize: 14,
              padding: "12px 22px",
              borderRadius: 14,
              border: `2.5px solid ${TOKENS.ink}`,
              boxShadow: `4px 4px 0 ${TOKENS.ink}`,
              zIndex: 100,
              whiteSpace: "nowrap",
            }}
          >
            {toast.msg}
          </div>
        )}
      </div>
    </Frame>
  );
}

// ─── Platform card ─────────────────────────────────────────────────────────
function PlatformCard({
  meta,
  linked,
  account,
  isConnecting,
  isDisconnecting,
  isFresh,
  onConnect,
  onDisconnect,
}: {
  meta: PlatformMeta;
  linked: boolean;
  account: LinkedAccount | null;
  isConnecting: boolean;
  isDisconnecting: boolean;
  isFresh: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const busy = isConnecting || isDisconnecting;

  return (
    <div
      style={{
        background: TOKENS.paper,
        border: `2.5px solid ${TOKENS.ink}`,
        borderRadius: 16,
        padding: "16px 18px",
        marginBottom: 12,
        boxShadow: linked
          ? `5px 5px 0 ${meta.color === TOKENS.ink ? TOKENS.accent1 : meta.color}`
          : `3px 3px 0 ${TOKENS.ink}`,
        transition: "box-shadow 0.15s",
        outline: isFresh ? `3px solid ${TOKENS.accent4}` : "none",
      }}
    >
      {/* Top row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: linked ? 10 : 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>{meta.icon}</span>
          <div>
            <div
              style={{
                fontFamily: TOKENS.display,
                fontWeight: 900,
                fontSize: 15,
                color: TOKENS.ink,
                letterSpacing: "-0.02em",
              }}
            >
              {meta.label}
              {linked && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    background: TOKENS.accent4,
                    color: TOKENS.paper,
                    padding: "2px 7px",
                    borderRadius: 20,
                    border: `1.5px solid ${TOKENS.ink}`,
                    verticalAlign: "middle",
                  }}
                >
                  connected
                </span>
              )}
            </div>
            <div
              style={{
                fontFamily: TOKENS.ui,
                fontSize: 11,
                color: TOKENS.ink,
                opacity: 0.5,
                marginTop: 1,
              }}
            >
              {meta.what}
            </div>
          </div>
        </div>
      </div>

      {/* Account info when linked */}
      {linked && account && (
        <div
          style={{
            fontFamily: TOKENS.mono,
            fontSize: 12,
            color: TOKENS.ink,
            opacity: 0.6,
            marginBottom: 12,
            background: TOKENS.bg,
            borderRadius: 8,
            padding: "6px 10px",
            border: `1.5px solid ${TOKENS.ink}`,
          }}
        >
          {account.username ? `@${account.username}` : (account.display_name ?? "account linked")}
          {account.updated_at && (
            <span style={{ opacity: 0.5, marginLeft: 8 }}>
              · synced {timeSince(account.updated_at)}
            </span>
          )}
        </div>
      )}

      {/* Action button */}
      <div style={{ display: "flex", gap: 8 }}>
        {linked ? (
          <button
            onClick={onDisconnect}
            disabled={busy}
            style={{
              flex: 1,
              fontFamily: TOKENS.ui,
              fontWeight: 700,
              fontSize: 13,
              padding: "9px 0",
              borderRadius: 10,
              border: `2px solid ${TOKENS.ink}`,
              background: TOKENS.paper,
              color: TOKENS.ink,
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.5 : 1,
              boxShadow: `2px 2px 0 ${TOKENS.ink}`,
            }}
          >
            {isDisconnecting ? "disconnecting…" : "disconnect"}
          </button>
        ) : (
          <button
            onClick={onConnect}
            disabled={busy}
            style={{
              flex: 1,
              fontFamily: TOKENS.ui,
              fontWeight: 900,
              fontSize: 14,
              padding: "10px 0",
              borderRadius: 10,
              border: `2.5px solid ${TOKENS.ink}`,
              background: meta.color === TOKENS.ink ? TOKENS.ink : TOKENS.paper,
              color: meta.color === TOKENS.ink ? TOKENS.paper : TOKENS.ink,
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.6 : 1,
              boxShadow: `3px 3px 0 ${TOKENS.ink}`,
            }}
          >
            {isConnecting ? "opening…" : `connect ${meta.label}`}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: TOKENS.ui,
        fontWeight: 700,
        fontSize: 22,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: TOKENS.ink,
        lineHeight: 1,
        padding: 4,
        width: 36,
      }}
    >
      ←
    </button>
  );
}

function timeSince(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
