import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { trackFunnel } from "@/lib/funnel";
import { useState, useEffect, useRef, type ReactNode } from "react";
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

function sanitizeRedirect(raw: unknown): string {
  if (typeof raw !== "string" || !raw) return "/";
  // Reject protocol-relative and absolute external URLs
  if (/^\/\//.test(raw) || /^https?:\/\//i.test(raw)) return "/";
  // Must start with / to be a same-origin path
  if (!raw.startsWith("/")) return "/";
  return raw;
}

export const Route = createFileRoute("/new/signin")({
  component: SignInPage,
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: sanitizeRedirect(s.redirect),
    mode: s.mode === "signin" || s.mode === "signup" ? s.mode : undefined,
  }),
});

type OAuthProvider = "apple" | "google" | "discord" | "spotify";

const RESEND_DELAY = 60;

function SignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [comingSoon, setComingSoon] = useState<string | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!comingSoon) return;
    const t = setTimeout(() => setComingSoon(null), 3500);
    return () => clearTimeout(t);
  }, [comingSoon]);

  useEffect(() => {
    if (!sent) return;
    setResendCountdown(RESEND_DELAY);
    countdownRef.current = setInterval(() => {
      setResendCountdown((n) => {
        if (n <= 1) {
          clearInterval(countdownRef.current!);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(countdownRef.current!);
  }, [sent]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate({ to: "/new/hub" });
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate({ to: "/new/hub" });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const sendOtp = async (address: string) => {
    trackFunnel("signup_requested");
    return supabase.auth.signInWithOtp({
      email: address,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleMagicLink = async () => {
    if (!email.trim()) {
      setError("Enter your email");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: authError } = await sendOtp(email.trim());
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    setSent(true);
  };

  const handleResend = async () => {
    setResending(true);
    const { error: authError } = await sendOtp(email.trim());
    setResending(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    // Restart countdown
    clearInterval(countdownRef.current!);
    setResendCountdown(RESEND_DELAY);
    countdownRef.current = setInterval(() => {
      setResendCountdown((n) => {
        if (n <= 1) { clearInterval(countdownRef.current!); return 0; }
        return n - 1;
      });
    }, 1000);
  };

  const handleOAuth = async (provider: OAuthProvider) => {
    setError(null);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (authError) setError(authError.message);
  };

  const onSignUp = () => navigate({ to: "/new/signup" });

  return (
    <Frame>
      <div
        style={{
          position: "relative",
          height: "100%",
          background: TOKENS.bg,
          display: "flex",
          flexDirection: "column",
          padding: "70px 28px 36px",
          overflow: "hidden",
        }}
      >
        <DotsBg opacity={0.06} />
        <FloatingTickets density={4} />

        <div style={{ position: "relative", zIndex: 2 }}>
          <BrandMark size={20} spin />
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 2,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 18,
          }}
        >
          <Stamp color={TOKENS.accent2} rotate={-3} style={{ alignSelf: "flex-start" }}>
            welcome back
          </Stamp>
          <h1
            style={{
              fontFamily: TOKENS.display,
              fontWeight: 900,
              fontSize: 44,
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
              color: TOKENS.ink,
              margin: 0,
            }}
          >
            Pick up
            <br />
            where you left.
          </h1>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: "#fee2e2",
                border: "2px solid #ef4444",
                fontFamily: TOKENS.ui,
                fontSize: 13,
                fontWeight: 600,
                color: "#991b1b",
              }}
            >
              {error}
            </div>
          )}

          {!sent ? (
            <>
              <div>
                <div
                  style={{
                    fontFamily: TOKENS.mono,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: ".14em",
                    color: TOKENS.inkHint,
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  email · we'll send a magic link
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "14px 16px",
                    border: `2.5px solid ${TOKENS.ink}`,
                    borderRadius: 14,
                    background: TOKENS.paper,
                    boxShadow: `4px 4px 0 ${TOKENS.ink}`,
                  }}
                >
                  <span style={{ color: TOKENS.accent1 }}>✉</span>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleMagicLink()}
                    placeholder="you@email.com"
                    type="email"
                    autoComplete="email"
                    style={{
                      appearance: "none",
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      flex: 1,
                      fontFamily: TOKENS.ui,
                      fontSize: 16,
                      fontWeight: 700,
                      color: TOKENS.ink,
                    }}
                  />
                </div>
              </div>
              <ChunkyButton
                variant="accent"
                onClick={handleMagicLink}
                icon={Icons.arrow}
                disabled={loading}
              >
                {loading ? "sending..." : "send magic link"}
              </ChunkyButton>

              {comingSoon && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: TOKENS.accent2,
                    border: `2px solid ${TOKENS.ink}`,
                    fontFamily: TOKENS.ui,
                    fontSize: 13,
                    fontWeight: 700,
                    color: TOKENS.ink,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span>{comingSoon}</span>
                  <button
                    onClick={() => setComingSoon(null)}
                    style={{
                      appearance: "none",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 900,
                      fontSize: 16,
                      color: TOKENS.ink,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontFamily: TOKENS.mono,
                  fontSize: 10,
                  fontWeight: 700,
                  opacity: 0.5,
                  letterSpacing: ".12em",
                  margin: "4px 0",
                }}
              >
                <div style={{ flex: 1, height: 2, background: TOKENS.ink, opacity: 0.15 }} />
                OR ONE-TAP
                <div style={{ flex: 1, height: 2, background: TOKENS.ink, opacity: 0.15 }} />
              </div>

              {/* Live providers */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <SSOTile label="Apple" glyph="" bg={TOKENS.ink} fg={TOKENS.paper} onClick={() => handleOAuth("apple")} />
                <SSOTile label="Google" glyph="G" bg={TOKENS.paper} fg={TOKENS.ink} onClick={() => handleOAuth("google")} />
                <SSOTile label="Discord" glyph="D" bg="#5865F2" fg="#ffffff" onClick={() => handleOAuth("discord")} />
                <SSOTile label="Spotify" glyph="♫" bg="#1DB954" fg={TOKENS.ink} onClick={() => handleOAuth("spotify")} />
              </div>

              {/* Coming-soon providers */}
              <div
                style={{
                  fontFamily: TOKENS.mono,
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: ".14em",
                  opacity: 0.35,
                  textTransform: "uppercase",
                  marginTop: 4,
                  marginBottom: 2,
                }}
              >
                coming soon
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <SSOTile label="TikTok" glyph="♪" bg={TOKENS.ink} fg={TOKENS.paper} onClick={() => setComingSoon("TikTok login coming soon — use email or Google for now.")} />
                <SSOTile label="Instagram" glyph="◍" bg={TOKENS.accent3} fg={TOKENS.paper} onClick={() => setComingSoon("Instagram login coming soon — use email or Google for now.")} />
                <SSOTile label="X" glyph="✕" bg={TOKENS.ink} fg={TOKENS.paper} onClick={() => setComingSoon("X login coming soon — use email or Google for now.")} />
              </div>
              <button
                onClick={() => setComingSoon("Phone login coming soon — use email for now.")}
                style={{
                  appearance: "none",
                  cursor: "pointer",
                  width: "100%",
                  padding: "12px 14px",
                  border: `2px dashed ${TOKENS.ink}`,
                  borderRadius: 12,
                  background: "transparent",
                  fontFamily: TOKENS.ui,
                  fontSize: 12,
                  fontWeight: 800,
                  color: TOKENS.ink,
                  marginTop: 4,
                }}
              >
                📱 continue with phone
              </button>
            </>
          ) : (
            <div
              style={{
                padding: 20,
                border: `3px solid ${TOKENS.ink}`,
                borderRadius: 18,
                background: TOKENS.accent2,
                boxShadow: `5px 5px 0 ${TOKENS.ink}`,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: TOKENS.mono,
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: ".14em",
                    textTransform: "uppercase",
                    opacity: 0.7,
                  }}
                >
                  CHECK YOUR INBOX
                </div>
                <div
                  style={{
                    fontFamily: TOKENS.display,
                    fontWeight: 900,
                    fontSize: 22,
                    letterSpacing: "-0.025em",
                    marginTop: 6,
                    lineHeight: 1.1,
                  }}
                >
                  Link sent to
                  <br />
                  {email}.
                </div>
              </div>

              {/* Email app shortcuts */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <a
                  href="https://mail.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "10px 8px",
                    border: `2px solid ${TOKENS.ink}`,
                    borderRadius: 10,
                    background: TOKENS.paper,
                    fontFamily: TOKENS.ui,
                    fontSize: 12,
                    fontWeight: 800,
                    color: TOKENS.ink,
                    textDecoration: "none",
                    boxShadow: `2px 2px 0 ${TOKENS.ink}`,
                  }}
                >
                  <span>M</span> Open Gmail →
                </a>
                <a
                  href="https://outlook.live.com/mail/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "10px 8px",
                    border: `2px solid ${TOKENS.ink}`,
                    borderRadius: 10,
                    background: TOKENS.paper,
                    fontFamily: TOKENS.ui,
                    fontSize: 12,
                    fontWeight: 800,
                    color: TOKENS.ink,
                    textDecoration: "none",
                    boxShadow: `2px 2px 0 ${TOKENS.ink}`,
                  }}
                >
                  <span>✉</span> Open Outlook →
                </a>
              </div>

              {/* Resend + change email row */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleResend}
                  disabled={resendCountdown > 0 || resending}
                  style={{
                    appearance: "none",
                    cursor: resendCountdown > 0 ? "default" : "pointer",
                    flex: 1,
                    padding: "10px 12px",
                    border: `2px solid ${TOKENS.ink}`,
                    borderRadius: 999,
                    background: resendCountdown > 0 ? "rgba(0,0,0,0.06)" : TOKENS.ink,
                    color: resendCountdown > 0 ? TOKENS.inkHint : TOKENS.paper,
                    fontFamily: TOKENS.ui,
                    fontSize: 12,
                    fontWeight: 800,
                    transition: "all .2s",
                  }}
                >
                  {resending ? "sending..." : resendCountdown > 0 ? `resend in ${resendCountdown}s` : "resend link"}
                </button>
                <button
                  onClick={() => { setSent(false); setEmail(""); }}
                  style={{
                    appearance: "none",
                    cursor: "pointer",
                    padding: "10px 14px",
                    border: `2px solid ${TOKENS.ink}`,
                    borderRadius: 999,
                    background: "transparent",
                    fontFamily: TOKENS.ui,
                    fontSize: 12,
                    fontWeight: 800,
                    color: TOKENS.ink,
                  }}
                >
                  change →
                </button>
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 2,
            textAlign: "center",
            fontFamily: TOKENS.ui,
            fontSize: 13,
            fontWeight: 600,
            color: TOKENS.ink,
            opacity: 0.7,
          }}
        >
          New here?{" "}
          <button
            onClick={onSignUp}
            style={{
              appearance: "none",
              cursor: "pointer",
              background: "transparent",
              border: "none",
              padding: 0,
              fontFamily: "inherit",
              fontSize: "inherit",
              fontWeight: 900,
              color: TOKENS.accent1,
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            Create your account →
          </button>
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 2,
            textAlign: "center",
            marginTop: 18,
          }}
        >
          <button
            onClick={() => navigate({ to: "/admin/login" })}
            style={{
              appearance: "none",
              cursor: "pointer",
              background: "transparent",
              border: "none",
              padding: "4px 8px",
              fontFamily: TOKENS.ui,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              color: TOKENS.ink,
              opacity: 0.35,
              textDecoration: "none",
            }}
          >
            Admin sign-in
          </button>
        </div>
      </div>
    </Frame>
  );
}

function SSOTile({
  label,
  glyph,
  bg,
  fg,
  onClick,
}: {
  label: string;
  glyph: ReactNode;
  bg: string;
  fg: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        appearance: "none",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "12px 10px",
        border: `2.5px solid ${TOKENS.ink}`,
        borderRadius: 12,
        background: bg,
        color: fg,
        fontFamily: TOKENS.ui,
        fontSize: 13,
        fontWeight: 900,
        boxShadow: `3px 3px 0 ${TOKENS.ink}`,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 18,
          height: 18,
          fontFamily: TOKENS.display,
          fontWeight: 900,
          fontSize: 14,
        }}
      >
        {glyph}
      </span>
      {label}
    </button>
  );
}
