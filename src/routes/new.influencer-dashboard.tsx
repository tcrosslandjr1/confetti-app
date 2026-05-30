import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DotsBg, Frame, TOKENS } from "@/components/new-confetti/shell";

// Port of InfluencerDashboardScreen — design/new-confetti/project/new-screens-2.jsx

export const Route = createFileRoute("/new/influencer-dashboard")({
  component: InfluencerDashboardPage,
});

const POSTS = [
  { n: "natural wine LES", date: "may 22", plays: "142k", taps: "8.4k", books: 42, earn: 184, c: TOKENS.accent1 },
  { n: "sunset rooftop", date: "may 18", plays: "98k", taps: "5.1k", books: 28, earn: 122, c: TOKENS.accent2 },
  { n: "family park day", date: "may 14", plays: "54k", taps: "3.2k", books: 18, earn: 86, c: TOKENS.accent3 },
  { n: "midweek omakase", date: "may 09", plays: "32k", taps: "1.8k", books: 9, earn: 38, c: TOKENS.paper },
];

function InfluencerDashboardPage() {
  const navigate = useNavigate();
  const totalEarn = POSTS.reduce((s, p) => s + p.earn, 0);

  return (
    <Frame>
      <div
        style={{
          position: "relative",
          height: "100dvh",
          background: TOKENS.bg,
          display: "flex",
          flexDirection: "column",
          padding: "56px 0 24px",
          overflow: "hidden",
        }}
      >
        <DotsBg opacity={0.05} />

        {/* Header */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            padding: "0 22px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button onClick={() => navigate({ to: "/new/influencer-login" })} style={backBtn}>←</button>
          <h2 style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22, letterSpacing: "-0.035em", margin: 0 }}>creator</h2>
          <span style={{ padding: "4px 10px", background: TOKENS.accent3, color: TOKENS.paper, border: `2px solid ${TOKENS.ink}`, borderRadius: 999, fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".1em" }}>
            TIER 2
          </span>
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 2,
            flex: 1,
            overflowY: "auto",
            padding: "0 22px 12px",
            scrollbarWidth: "none",
          }}
        >
          {/* Earnings hero */}
          <div
            style={{
              padding: 18,
              marginBottom: 14,
              border: `3px solid ${TOKENS.ink}`,
              borderRadius: 18,
              background: TOKENS.accent3,
              color: TOKENS.paper,
              boxShadow: `6px 6px 0 ${TOKENS.ink}`,
            }}
          >
            <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".16em", opacity: 0.85 }}>UNPAID BALANCE</div>
            <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 52, letterSpacing: "-0.05em", lineHeight: 0.9, marginTop: 4 }}>
              ${totalEarn}
            </div>
            <div style={{ fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 700, opacity: 0.85, marginTop: 4 }}>
              next auto-payout fri may 30 · stripe
            </div>
            <button style={{ marginTop: 12, padding: "8px 14px", appearance: "none", cursor: "pointer", background: TOKENS.paper, color: TOKENS.ink, border: `2px solid ${TOKENS.ink}`, borderRadius: 8, fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".1em" }}>
              💸 PAYOUT NOW
            </button>
          </div>

          {/* Link */}
          <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".14em", color: TOKENS.inkHint, marginBottom: 8, textTransform: "uppercase" }}>your link</div>
          <div style={{ padding: 12, marginBottom: 14, border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12, background: TOKENS.paper, boxShadow: `3px 3px 0 ${TOKENS.ink}`, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ flex: 1, fontFamily: TOKENS.mono, fontSize: 12, fontWeight: 800, color: TOKENS.ink, letterSpacing: ".02em" }}>
              confetti.app/c/<b>maya08</b>
            </span>
            <button style={{ appearance: "none", cursor: "pointer", padding: "6px 12px", border: `2px solid ${TOKENS.ink}`, borderRadius: 999, background: TOKENS.ink, color: TOKENS.paper, fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".1em" }}>
              COPY
            </button>
          </div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 16 }}>
            {[
              { l: "total plays", v: "326k" },
              { l: "bookings", v: "97" },
              { l: "this month", v: "$" + totalEarn },
            ].map(({ l, v }) => (
              <div key={l} style={{ padding: 10, border: `2px solid ${TOKENS.ink}`, borderRadius: 10, background: TOKENS.paper, boxShadow: `2px 2px 0 ${TOKENS.ink}` }}>
                <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 18, letterSpacing: "-0.025em" }}>{v}</div>
                <div style={{ fontFamily: TOKENS.mono, fontSize: 8.5, fontWeight: 800, color: TOKENS.inkHint, marginTop: 2, letterSpacing: ".08em", textTransform: "uppercase" }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Posts */}
          <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".14em", color: TOKENS.inkHint, marginBottom: 8, textTransform: "uppercase" }}>
            your posts · {POSTS.length}
          </div>
          {POSTS.map((p, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 10,
                padding: 10,
                marginBottom: 6,
                border: `2px solid ${TOKENS.ink}`,
                borderRadius: 10,
                background: TOKENS.paper,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 56,
                  borderRadius: 6,
                  background: p.c,
                  border: `1.5px solid ${TOKENS.ink}`,
                  backgroundImage: "repeating-linear-gradient(135deg, rgba(0,0,0,0.1) 0 4px, transparent 4px 8px)",
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 13, letterSpacing: "-0.02em" }}>{p.n}</div>
                <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700, color: TOKENS.inkHint, marginTop: 1 }}>
                  {p.date} · {p.plays} plays · {p.taps} taps
                </div>
                <div style={{ fontFamily: TOKENS.mono, fontSize: 9.5, fontWeight: 800, marginTop: 2 }}>{p.books} bookings</div>
              </div>
              <span style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 16, color: TOKENS.accent4, alignSelf: "center" }}>
                +${p.earn}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
}

const backBtn: React.CSSProperties = {
  appearance: "none",
  cursor: "pointer",
  width: 36,
  height: 36,
  borderRadius: 999,
  border: `2.5px solid ${TOKENS.ink}`,
  background: TOKENS.paper,
  fontSize: 14,
  fontWeight: 900,
  boxShadow: `3px 3px 0 ${TOKENS.ink}`,
};
