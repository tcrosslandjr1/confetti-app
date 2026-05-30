import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DotsBg, Frame, TOKENS } from "@/components/new-confetti/shell";

// Port of SearchScreen — design/new-confetti/project/new-screens-4.jsx

export const Route = createFileRoute("/new/search")({
  component: SearchPage,
});

type Tab = "all" | "venues" | "events" | "crews" | "vibes";

const RESULTS = {
  venues: [
    { n: "Westlight rooftop", t: "rooftop bar · $$$", c: TOKENS.accent1, tag: "21+" },
    { n: "Lupa Notte", t: "italian · $$", c: TOKENS.accent2, tag: "kid menu" },
    { n: "Pizza Moto", t: "pizza · $", c: TOKENS.accent3, tag: "kid menu" },
  ],
  events: [
    { n: "Pearl Charles live", t: "tue · 8pm · Baby's All Right", c: TOKENS.accent2, tag: "8 tix left" },
    { n: "Smorgasburg pop-up", t: "sat · 11am · Williamsburg", c: TOKENS.paper, tag: "free" },
  ],
  crews: [
    { n: "@maya.brk", t: "mutual: devon, sam · 12 nights", c: TOKENS.accent1 },
    { n: "@dev_strolls", t: "mutual: maya · 4 nights", c: TOKENS.accent3 },
  ],
  vibes: [
    { n: "natural wine LES", t: "plan a tasting flight", c: TOKENS.accent2 },
    { n: "rooftop + sunset", t: "pull from your taste", c: TOKENS.accent1 },
  ],
};

const RECENT = ["rooftop · sunset", "kid-welcome italian", "@maya", "pearl charles tickets"];
const TRENDING = ["#westlightbk", "#smorgasburg", "wing wednesday", "pre-order dinner"];
const TABS: Tab[] = ["all", "venues", "events", "crews", "vibes"];

function SearchPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("all");

  const filtered = <T extends { n: string; t: string }>(arr: T[]): T[] =>
    q ? arr.filter((r) => r.n.toLowerCase().includes(q.toLowerCase()) || r.t.toLowerCase().includes(q.toLowerCase())) : arr;

  const showAll = !q && tab === "all";

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

        {/* Search bar */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            padding: "0 22px 10px",
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <button onClick={() => navigate({ to: "/new/hub" })} style={backBtn}>←</button>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "11px 14px",
              border: `2.5px solid ${TOKENS.ink}`,
              borderRadius: 999,
              background: TOKENS.paper,
              boxShadow: `3px 3px 0 ${TOKENS.ink}`,
            }}
          >
            <span style={{ fontSize: 14 }}>🔍</span>
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="venues, vibes, friends…"
              style={{ flex: 1, appearance: "none", border: "none", outline: "none", background: "transparent", fontFamily: TOKENS.ui, fontSize: 14, fontWeight: 700, color: TOKENS.ink }}
            />
            {q && <button onClick={() => setQ("")} style={{ appearance: "none", cursor: "pointer", background: "transparent", border: "none", fontSize: 14, fontWeight: 900, color: TOKENS.inkHint }}>✕</button>}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ position: "relative", zIndex: 2, padding: "0 22px 8px", display: "flex", gap: 5, overflowX: "auto", scrollbarWidth: "none" }}>
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ appearance: "none", cursor: "pointer", flexShrink: 0, padding: "6px 12px", border: `2px solid ${TOKENS.ink}`, borderRadius: 999, background: tab === t ? TOKENS.ink : TOKENS.paper, color: tab === t ? TOKENS.paper : TOKENS.ink, fontFamily: TOKENS.ui, fontSize: 11, fontWeight: 800, boxShadow: tab === t ? "none" : `2px 2px 0 ${TOKENS.ink}` }}>
              {t}
            </button>
          ))}
        </div>

        <div style={{ position: "relative", zIndex: 2, flex: 1, overflowY: "auto", padding: "0 22px 12px", scrollbarWidth: "none" }}>
          {showAll ? (
            <>
              {/* Recent */}
              <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".14em", color: TOKENS.inkHint, marginBottom: 6, textTransform: "uppercase" }}>recent</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                {RECENT.map((r) => (
                  <button key={r} onClick={() => setQ(r)} style={{ appearance: "none", cursor: "pointer", padding: "7px 13px", border: `2px solid ${TOKENS.ink}`, borderRadius: 999, background: TOKENS.paper, color: TOKENS.ink, fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800, boxShadow: `2px 2px 0 ${TOKENS.ink}` }}>{r}</button>
                ))}
              </div>
              {/* Trending */}
              <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".14em", color: TOKENS.inkHint, marginBottom: 6, textTransform: "uppercase" }}>trending</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {TRENDING.map((r) => (
                  <button key={r} onClick={() => setQ(r)} style={{ appearance: "none", cursor: "pointer", padding: "7px 13px", border: `2px solid ${TOKENS.ink}`, borderRadius: 999, background: TOKENS.accent2, color: TOKENS.ink, fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800, boxShadow: `2px 2px 0 ${TOKENS.ink}` }}>{r}</button>
                ))}
              </div>
            </>
          ) : (
            <>
              {(tab === "all" || tab === "venues") && filtered(RESULTS.venues).length > 0 && (
                <Section title="venues">
                  {filtered(RESULTS.venues).map((r, i) => (
                    <ResultRow key={i} n={r.n} t={r.t} c={r.c} tag={r.tag} onClick={() => navigate({ to: "/new/venue" })} />
                  ))}
                </Section>
              )}
              {(tab === "all" || tab === "events") && filtered(RESULTS.events).length > 0 && (
                <Section title="events">
                  {filtered(RESULTS.events).map((r, i) => (
                    <ResultRow key={i} n={r.n} t={r.t} c={r.c} tag={r.tag} onClick={() => navigate({ to: "/new/event-detail" })} />
                  ))}
                </Section>
              )}
              {(tab === "all" || tab === "crews") && filtered(RESULTS.crews).length > 0 && (
                <Section title="crews">
                  {filtered(RESULTS.crews).map((r, i) => (
                    <ResultRow key={i} n={r.n} t={r.t} c={r.c} onClick={() => navigate({ to: "/new/crews" })} />
                  ))}
                </Section>
              )}
              {(tab === "all" || tab === "vibes") && filtered(RESULTS.vibes).length > 0 && (
                <Section title="vibes">
                  {filtered(RESULTS.vibes).map((r, i) => (
                    <ResultRow key={i} n={r.n} t={r.t} c={r.c} onClick={() => navigate({ to: "/new/plan" })} />
                  ))}
                </Section>
              )}
              {q && filtered(RESULTS.venues).length === 0 && filtered(RESULTS.events).length === 0 && (
                <div style={{ padding: "40px 16px", textAlign: "center", fontFamily: TOKENS.mono, fontSize: 11, fontWeight: 700, color: TOKENS.inkHint, letterSpacing: ".06em" }}>
                  no results for "{q}" · try a vibe or venue name
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Frame>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".14em", color: TOKENS.inkHint, marginBottom: 6, textTransform: "uppercase" }}>{title}</div>
      {children}
    </div>
  );
}

function ResultRow({ n, t, c, tag, onClick }: { n: string; t: string; c: string; tag?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        appearance: "none",
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        marginBottom: 6,
        border: `2px solid ${TOKENS.ink}`,
        borderRadius: 12,
        background: c,
        boxShadow: `2px 2px 0 ${TOKENS.ink}`,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 14, letterSpacing: "-0.02em", color: TOKENS.ink }}>{n}</div>
        <div style={{ fontFamily: TOKENS.ui, fontSize: 11, fontWeight: 700, color: TOKENS.inkMuted, marginTop: 1 }}>{t}</div>
      </div>
      {tag && (
        <span style={{ flexShrink: 0, padding: "3px 8px", border: `1.5px solid ${TOKENS.ink}`, borderRadius: 999, background: TOKENS.paper, fontFamily: TOKENS.mono, fontSize: 8.5, fontWeight: 800, letterSpacing: ".06em", color: TOKENS.ink }}>
          {tag}
        </span>
      )}
      <span style={{ opacity: 0.4, fontSize: 16, fontWeight: 900, color: TOKENS.ink }}>›</span>
    </button>
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
  flexShrink: 0,
};
