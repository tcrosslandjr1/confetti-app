import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  BrandMark,
  ChunkyButton,
  DotsBg,
  FloatingTickets,
  Frame,
  Icons,
  Stamp,
  TOKENS,
} from "@/components/new-confetti/shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/new/invite")({
  component: InvitePage,
});

function deriveCode(email: string): string {
  const prefix = email
    .split("@")[0]
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6)
    .padEnd(3, "X");
  // Use char codes for a stable 4-digit suffix, not random — same every visit
  const sum = email.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return `${prefix}-${1000 + (sum % 9000)}`;
}

function InvitePage() {
  const navigate = useNavigate();
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareErr, setShareErr] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const email = session?.user?.email;
      setCode(email ? deriveCode(email) : deriveCode(`guest-${Date.now()}`));
    });
  }, []);

  const referralUrl = code
    ? `${typeof window !== "undefined" ? window.location.origin : "https://confetti.app"}/new/referral?ref=${code}`
    : "";

  const handleShare = async () => {
    setShareErr(false);
    if (navigator.share && code) {
      try {
        await navigator.share({
          title: "Join me on Confetti",
          text: `Use my code ${code} — your first pass is free + 500 bonus points.`,
          url: referralUrl,
        });
        return;
      } catch {
        // User cancelled native share — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setShareErr(true);
    }
  };

  return (
    <Frame>
      <div
        style={{
          position: "relative",
          height: "100%",
          background: TOKENS.bg,
          display: "flex",
          flexDirection: "column",
          padding: "60px 24px 28px",
          overflow: "hidden",
        }}
      >
        <DotsBg opacity={0.06} />
        <FloatingTickets density={5} />

        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <BrandMark size={17} />
          <button
            onClick={() => navigate({ to: "/new/hub" })}
            style={{
              appearance: "none",
              cursor: "pointer",
              background: "transparent",
              border: "none",
              padding: 6,
              fontFamily: TOKENS.ui,
              fontSize: 13,
              fontWeight: 800,
              color: TOKENS.ink,
              opacity: 0.5,
            }}
          >
            skip →
          </button>
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 2,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 16,
            paddingTop: 14,
          }}
        >
          <Stamp color={TOKENS.accent1} rotate={-3} style={{ alignSelf: "flex-start" }}>
            invite friends
          </Stamp>

          <h1
            style={{
              fontFamily: TOKENS.display,
              fontWeight: 900,
              fontSize: 42,
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
              color: TOKENS.ink,
              margin: 0,
            }}
          >
            Give a pass.
            <br />
            <span style={{ color: TOKENS.accent1 }}>Earn one back.</span>
          </h1>

          <p
            style={{
              fontFamily: TOKENS.ui,
              fontSize: 14,
              fontWeight: 600,
              opacity: 0.7,
              margin: 0,
              lineHeight: 1.45,
              maxWidth: 300,
            }}
          >
            Each friend who joins with your code gets their first pass free. You get 500 points and
            a free pass when they subscribe.
          </p>

          {/* Reward chips */}
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { label: "1 free pass", color: TOKENS.accent2, fg: TOKENS.ink },
              { label: "+500 pts", color: TOKENS.accent1, fg: TOKENS.ink },
              { label: "All-Access trial", color: TOKENS.accent3, fg: TOKENS.paper },
            ].map((c) => (
              <span
                key={c.label}
                style={{
                  flex: 1,
                  padding: "10px 6px",
                  textAlign: "center",
                  border: `2.5px solid ${TOKENS.ink}`,
                  borderRadius: 12,
                  background: c.color,
                  color: c.fg,
                  fontFamily: TOKENS.ui,
                  fontSize: 11,
                  fontWeight: 900,
                  boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                }}
              >
                {c.label}
              </span>
            ))}
          </div>

          {/* Code card */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              border: `2.5px solid ${TOKENS.ink}`,
              borderRadius: 14,
              background: TOKENS.paper,
              boxShadow: `4px 4px 0 ${TOKENS.ink}`,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                border: `2px solid ${TOKENS.ink}`,
                background: TOKENS.accent2,
                display: "grid",
                placeItems: "center",
                fontFamily: TOKENS.display,
                fontWeight: 900,
                fontSize: 20,
                flexShrink: 0,
              }}
            >
              ✣
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: TOKENS.mono,
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: ".12em",
                  color: TOKENS.inkHint,
                  textTransform: "uppercase",
                }}
              >
                your code
              </div>
              <div
                style={{
                  fontFamily: TOKENS.display,
                  fontWeight: 900,
                  fontSize: 20,
                  letterSpacing: "-0.025em",
                  color: TOKENS.ink,
                }}
              >
                {code ?? "loading..."}
              </div>
            </div>
          </div>

          {shareErr && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: "#fee2e2",
                border: "2px solid #ef4444",
                fontFamily: TOKENS.ui,
                fontSize: 12,
                fontWeight: 600,
                color: "#991b1b",
              }}
            >
              Could not copy — paste your code manually.
            </div>
          )}
        </div>

        <div
          style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", gap: 10 }}
        >
          <ChunkyButton
            variant="accent"
            icon={copied ? undefined : Icons.arrow}
            onClick={handleShare}
            disabled={!code}
          >
            {copied ? "✓ link copied!" : "share my invite link"}
          </ChunkyButton>

          <button
            onClick={() => navigate({ to: "/new/hub" })}
            style={{
              appearance: "none",
              cursor: "pointer",
              width: "100%",
              padding: "12px 14px",
              border: `2px solid ${TOKENS.ink}`,
              borderRadius: 14,
              background: "transparent",
              fontFamily: TOKENS.ui,
              fontSize: 13,
              fontWeight: 800,
              color: TOKENS.ink,
              opacity: 0.6,
            }}
          >
            skip for now → explore Confetti
          </button>
        </div>
      </div>
    </Frame>
  );
}
