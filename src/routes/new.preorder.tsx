import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DotsBg, Frame, TOKENS } from "@/components/new-confetti/shell";

// Port of PreOrderMenuScreen — design/new-confetti/project/new-screens-1.jsx

export const Route = createFileRoute("/new/preorder")({
  component: PreOrderPage,
});

interface MenuItem {
  id: string;
  n: string;
  p: number;
  sub: string;
  hot?: boolean;
}

const REGULAR: MenuItem[] = [
  { id: "cac", n: "cacio e pepe", p: 22, sub: "house-pulled pasta · the must-order", hot: true },
  { id: "car", n: "carbonara", p: 24, sub: "guanciale · pecorino · 3-yolk" },
  { id: "bur", n: "burrata + tomato", p: 18, sub: "jersey heirloom · basil oil" },
  { id: "osso", n: "osso buco", p: 38, sub: "sunday-style · saffron risotto" },
  { id: "tira", n: "tiramisu", p: 14, sub: "savoiardi soaked in espresso" },
];

const KIDS: MenuItem[] = [
  { id: "kspag", n: "spaghetti + butter", p: 9, sub: "just butter & parm · zero spice" },
  { id: "kchx", n: "crispy chicken", p: 11, sub: "milanese · 2-piece + fries" },
  { id: "kpiz", n: "cheese pizza slice", p: 8, sub: "one slice · margherita" },
  { id: "kgel", n: "gelato cup", p: 6, sub: "vanilla · chocolate · strawberry" },
  { id: "kjuc", n: "apple juice box", p: 3, sub: "organic · no sugar" },
];

function PreOrderPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"regular" | "kids">("regular");
  const [cart, setCart] = useState<Record<string, number>>({});

  const items = tab === "regular" ? REGULAR : KIDS;
  const allItems = [...REGULAR, ...KIDS];
  const total = Object.entries(cart).reduce((sum, [id, q]) => {
    const it = allItems.find((x) => x.id === id);
    return sum + (it ? it.p * q : 0);
  }, 0);
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const add = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const sub = (id: string) =>
    setCart((c) => {
      const next = { ...c };
      if (next[id] > 1) next[id]--;
      else delete next[id];
      return next;
    });

  return (
    <Frame>
      <div
        style={{
          position: "relative",
          height: "100dvh",
          background: TOKENS.bg,
          display: "flex",
          flexDirection: "column",
          padding: "56px 0 0",
          overflow: "hidden",
        }}
      >
        <DotsBg opacity={0.05} />

        {/* Header */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            padding: "0 22px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button onClick={() => navigate({ to: "/new/pass" })} style={backBtn}>
            ←
          </button>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".14em", color: TOKENS.inkHint }}>
              PRE-ORDER MENU
            </div>
            <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 18, letterSpacing: "-0.025em" }}>
              Lupa Notte
            </div>
          </div>
          <span style={{ width: 36 }} />
        </div>

        {/* Verified-business banner */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            margin: "0 22px 12px",
            padding: "8px 12px",
            background: "rgba(43,182,115,0.18)",
            border: `1.5px dashed ${TOKENS.ink}`,
            borderRadius: 10,
            fontFamily: TOKENS.mono,
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: ".06em",
            color: TOKENS.ink,
            lineHeight: 1.4,
          }}
        >
          ✓ <b>Confetti-verified</b> · live menu · table-ready when you arrive
        </div>

        {/* Tabs */}
        <div style={{ position: "relative", zIndex: 2, padding: "0 22px 8px", display: "flex", gap: 6 }}>
          {([["regular", "regular menu"], ["kids", "🍴 kids menu"]] as const).map(([id, l]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                appearance: "none",
                cursor: "pointer",
                flex: 1,
                padding: "10px 12px",
                border: `2.5px solid ${TOKENS.ink}`,
                borderRadius: 12,
                background: tab === id ? TOKENS.accent1 : TOKENS.paper,
                color: TOKENS.ink,
                fontFamily: TOKENS.ui,
                fontSize: 13,
                fontWeight: 800,
                boxShadow: tab === id ? "none" : `3px 3px 0 ${TOKENS.ink}`,
              }}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Menu list */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            flex: 1,
            overflowY: "auto",
            padding: "8px 22px 12px",
            scrollbarWidth: "none",
          }}
        >
          {items.map((it) => {
            const q = cart[it.id] || 0;
            return (
              <div
                key={it.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: 12,
                  marginBottom: 8,
                  border: `2px solid ${TOKENS.ink}`,
                  borderRadius: 12,
                  background: it.hot ? TOKENS.accent2 : TOKENS.paper,
                  boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 6,
                      fontFamily: TOKENS.display,
                      fontWeight: 900,
                      fontSize: 15,
                      letterSpacing: "-0.02em",
                      color: TOKENS.ink,
                    }}
                  >
                    {it.hot && <span style={{ fontSize: 13 }}>🔥</span>}
                    {it.n}
                  </div>
                  <div style={{ fontFamily: TOKENS.ui, fontSize: 11, fontWeight: 600, color: TOKENS.inkMuted, marginTop: 2, lineHeight: 1.3 }}>
                    {it.sub}
                  </div>
                  <div style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, marginTop: 4, letterSpacing: ".06em" }}>
                    ${it.p}
                  </div>
                </div>
                {q === 0 ? (
                  <button
                    onClick={() => add(it.id)}
                    style={{
                      appearance: "none",
                      cursor: "pointer",
                      padding: "8px 14px",
                      border: `2px solid ${TOKENS.ink}`,
                      borderRadius: 999,
                      background: TOKENS.ink,
                      color: TOKENS.paper,
                      fontFamily: TOKENS.display,
                      fontSize: 14,
                      fontWeight: 900,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    add
                  </button>
                ) : (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "4px 6px",
                      border: `2px solid ${TOKENS.ink}`,
                      borderRadius: 999,
                      background: TOKENS.paper,
                    }}
                  >
                    <button
                      onClick={() => sub(it.id)}
                      style={{
                        appearance: "none",
                        cursor: "pointer",
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        border: "none",
                        background: TOKENS.ink,
                        color: TOKENS.paper,
                        fontFamily: TOKENS.display,
                        fontSize: 14,
                        fontWeight: 900,
                      }}
                    >
                      −
                    </button>
                    <span style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 14, minWidth: 12, textAlign: "center" }}>
                      {q}
                    </span>
                    <button
                      onClick={() => add(it.id)}
                      style={{
                        appearance: "none",
                        cursor: "pointer",
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        border: "none",
                        background: TOKENS.ink,
                        color: TOKENS.paper,
                        fontFamily: TOKENS.display,
                        fontSize: 14,
                        fontWeight: 900,
                      }}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sticky checkout footer */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            padding: "12px 22px 22px",
            background: TOKENS.paper,
            borderTop: `3px solid ${TOKENS.ink}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".12em", color: TOKENS.inkHint }}>
              {cartCount} ITEMS · CHARGE ON ARRIVAL
            </div>
            <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22, letterSpacing: "-0.025em", marginTop: 1 }}>
              ${total}
            </div>
          </div>
          <button
            disabled={cartCount === 0}
            style={{
              appearance: "none",
              cursor: cartCount === 0 ? "not-allowed" : "pointer",
              padding: "14px 18px",
              border: `3px solid ${TOKENS.ink}`,
              borderRadius: 14,
              background: cartCount > 0 ? TOKENS.accent1 : "rgba(19,11,13,0.1)",
              color: TOKENS.ink,
              opacity: cartCount > 0 ? 1 : 0.5,
              fontFamily: TOKENS.display,
              fontWeight: 900,
              fontSize: 15,
              letterSpacing: "-0.02em",
              boxShadow: `4px 4px 0 ${TOKENS.ink}`,
            }}
          >
            pre-order →
          </button>
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
