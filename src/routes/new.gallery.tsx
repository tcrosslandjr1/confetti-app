import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Frame, TOKENS } from "@/components/new-confetti/shell";

// Port of GalleryScreen — design/new-confetti/project/new-screens-3.jsx

export const Route = createFileRoute("/new/gallery")({
  component: GalleryPage,
});

interface Photo {
  id: number;
  night: string;
  venue: string;
  date: string;
  c: string;
}

const PHOTOS: Photo[] = [
  { id: 1, night: "date night LES", venue: "Lupa Notte", date: "may 23", c: TOKENS.accent1 },
  { id: 2, night: "date night LES", venue: "Westlight", date: "may 23", c: TOKENS.accent2 },
  { id: 3, night: "bushwick crawl", venue: "Skinny Dennis", date: "may 16", c: TOKENS.accent3 },
  { id: 4, night: "bushwick crawl", venue: "House of Yes", date: "may 16", c: TOKENS.paper },
  { id: 5, night: "family park day", venue: "Prospect Park", date: "may 10", c: TOKENS.accent2 },
  { id: 6, night: "family park day", venue: "Bluestone", date: "may 10", c: TOKENS.accent1 },
  { id: 7, night: "solo culture", venue: "BAM", date: "may 03", c: TOKENS.accent3 },
  { id: 8, night: "date night LES", venue: "Quartz Room", date: "may 23", c: TOKENS.accent2 },
  { id: 9, night: "weird brunch", venue: "Olmsted", date: "apr 25", c: TOKENS.accent1 },
];

const NIGHTS = ["all", ...Array.from(new Set(PHOTOS.map((p) => p.night)))];

function GalleryPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState<Photo | null>(null);

  const visible = filter === "all" ? PHOTOS : PHOTOS.filter((p) => p.night === filter);

  return (
    <Frame>
      <div
        style={{
          position: "relative",
          height: "100dvh",
          background: TOKENS.ink,
          color: TOKENS.paper,
          display: "flex",
          flexDirection: "column",
          padding: "56px 0 24px",
          overflow: "hidden",
        }}
      >
        {/* Dot pattern */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.1, backgroundImage: `radial-gradient(${TOKENS.paper} 1px, transparent 1px)`, backgroundSize: "28px 28px" }} />

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
          <button onClick={() => navigate({ to: "/new/profile" })} style={{ appearance: "none", cursor: "pointer", width: 36, height: 36, borderRadius: 999, border: `2.5px solid ${TOKENS.paper}`, background: "transparent", color: TOKENS.paper, fontSize: 14, fontWeight: 900 }}>
            ←
          </button>
          <h2 style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22, letterSpacing: "-0.035em", margin: 0 }}>memories</h2>
          <button style={{ appearance: "none", cursor: "pointer", padding: "6px 10px", border: `2px solid ${TOKENS.paper}`, borderRadius: 999, background: "transparent", color: TOKENS.paper, fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".1em" }}>
            📤 EXPORT
          </button>
        </div>

        {/* Filter chips */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            padding: "0 22px 10px",
            display: "flex",
            gap: 6,
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          {NIGHTS.map((n) => (
            <button
              key={n}
              onClick={() => setFilter(n)}
              style={{
                appearance: "none",
                cursor: "pointer",
                flexShrink: 0,
                padding: "6px 12px",
                border: `2px solid ${TOKENS.paper}`,
                borderRadius: 999,
                background: filter === n ? TOKENS.accent1 : "transparent",
                color: filter === n ? TOKENS.ink : TOKENS.paper,
                fontFamily: TOKENS.ui,
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            padding: "0 22px 12px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
          }}
        >
          {[
            [PHOTOS.length, "photos"],
            [new Set(PHOTOS.map((p) => p.night)).size, "nights"],
            [new Set(PHOTOS.map((p) => p.venue)).size, "venues"],
          ].map(([n, l]) => (
            <div key={String(l)} style={{ padding: "6px 10px", background: "rgba(255,250,240,0.08)", border: "1.5px solid rgba(255,250,240,0.3)", borderRadius: 8 }}>
              <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 18, letterSpacing: "-0.03em", lineHeight: 1 }}>{n}</div>
              <div style={{ fontFamily: TOKENS.mono, fontSize: 8.5, fontWeight: 800, letterSpacing: ".1em", opacity: 0.6, marginTop: 2, textTransform: "uppercase" }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Photo grid */}
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
            {visible.map((p) => (
              <button
                key={p.id}
                onClick={() => setOpen(p)}
                style={{
                  appearance: "none",
                  cursor: "pointer",
                  aspectRatio: "1/1",
                  padding: 0,
                  position: "relative",
                  border: `1.5px solid ${TOKENS.paper}`,
                  borderRadius: 6,
                  background: p.c,
                  backgroundImage: "repeating-linear-gradient(135deg, rgba(0,0,0,0.12) 0 6px, transparent 6px 12px)",
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    bottom: 2,
                    left: 2,
                    right: 2,
                    padding: "2px 4px",
                    background: "rgba(0,0,0,0.55)",
                    color: TOKENS.paper,
                    fontFamily: TOKENS.mono,
                    fontSize: 7,
                    fontWeight: 800,
                    letterSpacing: ".04em",
                    textAlign: "left",
                    borderRadius: 3,
                  }}
                >
                  {p.venue}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Lightbox */}
        {open && (
          <div
            onClick={() => setOpen(null)}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 100,
              background: "rgba(0,0,0,0.85)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: 320,
                background: open.c,
                backgroundImage: "repeating-linear-gradient(135deg, rgba(0,0,0,0.12) 0 8px, transparent 8px 16px)",
                border: `2.5px solid ${TOKENS.paper}`,
                borderRadius: 12,
                aspectRatio: "4/5",
                position: "relative",
                boxShadow: `6px 6px 0 ${TOKENS.accent1}`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 12,
                  right: 12,
                  bottom: 12,
                  padding: "8px 10px",
                  background: "rgba(0,0,0,0.7)",
                  border: `1.5px solid ${TOKENS.paper}`,
                  borderRadius: 6,
                  fontFamily: TOKENS.mono,
                  fontSize: 11,
                  fontWeight: 800,
                  color: TOKENS.paper,
                  letterSpacing: ".04em",
                }}
              >
                <div style={{ fontFamily: TOKENS.display, fontSize: 14, letterSpacing: "-0.02em" }}>{open.venue}</div>
                <div style={{ opacity: 0.7, marginTop: 2 }}>{open.night} · {open.date}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Frame>
  );
}
