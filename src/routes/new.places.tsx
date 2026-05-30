import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { DotsBg, Frame, TOKENS } from "@/components/new-confetti/shell";

export const Route = createFileRoute("/new/places")({ component: PlacesPage });

type PlaceResult = {
  id: string; n: string; tag: string; nbhd: string; dist: string; verified: boolean; yelp: string;
};

const PLACE_RESULTS: PlaceResult[] = [
  { id: "p1", n: "Skinny Pete's",       tag: "dive bar",         nbhd: "Williamsburg", dist: "0.4 mi", verified: true,  yelp: "4.4" },
  { id: "p2", n: "Skinny Dennis",        tag: "dive · live music", nbhd: "Williamsburg", dist: "0.5 mi", verified: true,  yelp: "4.3" },
  { id: "p3", n: "Skinny + the Wolves",  tag: "cafe",             nbhd: "Bed-Stuy",     dist: "1.8 mi", verified: false, yelp: "4.6" },
  { id: "p4", n: "Skinhy Dip",           tag: "cocktail",         nbhd: "LES",          dist: "3.4 mi", verified: true,  yelp: "4.5" },
  { id: "p5", n: "Skinflint",            tag: "thrift bar",       nbhd: "Bushwick",     dist: "1.2 mi", verified: false, yelp: "—"   },
];

type AddPhase = "search" | "adding" | "added";
type Draft = { name: string; tag: string; addr: string; note: string };

function PlaceField({
  label, placeholder, value, onChange, textarea,
}: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void; textarea?: boolean;
}) {
  const shared = {
    width: "100%", padding: "12px 14px",
    border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12,
    background: TOKENS.paper, color: TOKENS.ink,
    fontFamily: TOKENS.ui, fontSize: 14, fontWeight: 700,
    outline: "none", boxShadow: `3px 3px 0 ${TOKENS.ink}`,
    boxSizing: "border-box" as const,
  };
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
        letterSpacing: ".14em", color: TOKENS.ink, opacity: 0.55,
        textTransform: "uppercase" as const, marginBottom: 6,
      }}>{label}</div>
      {textarea ? (
        <textarea
          value={value} onChange={(e) => onChange(e.target.value)}
          rows={2} placeholder={placeholder}
          style={{ ...shared, resize: "none" }}
        />
      ) : (
        <input
          value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} style={shared}
        />
      )}
    </div>
  );
}

function AddPlaceSheet({
  open, onClose, onPick,
}: {
  open: boolean; onClose: () => void; onPick?: (p: PlaceResult) => void;
}) {
  const [q, setQ] = useState("");
  const [phase, setPhase] = useState<AddPhase>("search");
  const [draft, setDraft] = useState<Draft>({ name: "", tag: "", addr: "", note: "" });

  useEffect(() => {
    if (open) { setQ(""); setPhase("search"); setDraft({ name: "", tag: "", addr: "", note: "" }); }
  }, [open]);

  if (!open) return null;

  const results = q
    ? PLACE_RESULTS.filter((p) => p.n.toLowerCase().includes(q.toLowerCase()))
    : PLACE_RESULTS.slice(0, 4);

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 65, display: "flex", alignItems: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />
      <div style={{
        position: "relative", width: "100%",
        background: TOKENS.bg, color: TOKENS.ink,
        borderRadius: "26px 26px 0 0", borderTop: `3px solid ${TOKENS.ink}`,
        boxShadow: `0 -10px 0 ${TOKENS.ink}`,
        padding: "12px 20px 24px", maxHeight: "92%", overflowY: "auto", scrollbarWidth: "none",
      }}>
        <div style={{ width: 44, height: 5, borderRadius: 999, background: TOKENS.ink, opacity: 0.25, margin: "0 auto 12px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".16em", color: TOKENS.ink, opacity: 0.55, textTransform: "uppercase" as const }}>
              {phase === "added" ? "ADDED TO YOUR LIST" : "ADD A PLACE"}
            </div>
            <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22, letterSpacing: "-0.025em", color: TOKENS.ink, marginTop: 2 }}>
              {phase === "adding" ? "New place details" : phase === "added" ? draft.name || "Saved." : "Search or add a spot."}
            </div>
          </div>
          <button onClick={onClose} style={{
            appearance: "none", cursor: "pointer", width: 34, height: 34, borderRadius: 999,
            border: `2.5px solid ${TOKENS.ink}`, background: TOKENS.paper,
            fontSize: 14, fontWeight: 900, color: TOKENS.ink,
          }}>✕</button>
        </div>

        {phase === "search" && (
          <>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "12px 14px", border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14,
              background: TOKENS.paper, boxShadow: `4px 4px 0 ${TOKENS.ink}`, marginBottom: 14,
            }}>
              <span style={{ fontSize: 16, opacity: 0.6, color: TOKENS.ink }}>⌕</span>
              <input
                autoFocus value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="venue name · neighborhood · cuisine"
                style={{
                  flex: 1, appearance: "none" as const, border: "none", outline: "none",
                  background: "transparent", fontFamily: TOKENS.ui, fontSize: 14, fontWeight: 700, color: TOKENS.ink,
                }}
              />
              {q && (
                <button onClick={() => setQ("")} style={{
                  appearance: "none", cursor: "pointer", width: 20, height: 20, borderRadius: 999,
                  border: `1.5px solid ${TOKENS.ink}`, background: TOKENS.bg, fontSize: 10, fontWeight: 900, color: TOKENS.ink,
                }}>✕</button>
              )}
            </div>
            <div style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".14em", color: TOKENS.ink, opacity: 0.55, textTransform: "uppercase" as const, marginBottom: 8 }}>
              {results.length} RESULTS {q ? `· "${q}"` : ""}
            </div>
            {results.map((p) => (
              <button key={p.id} onClick={() => { onPick?.(p); onClose(); }} style={{
                appearance: "none", cursor: "pointer", width: "100%", textAlign: "left" as const,
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 14px", marginBottom: 8,
                border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12,
                background: TOKENS.paper, boxShadow: `3px 3px 0 ${TOKENS.ink}`,
              }}>
                <span style={{
                  width: 38, height: 38, borderRadius: 8,
                  border: `2px solid ${TOKENS.ink}`,
                  background: p.verified ? TOKENS.accent1 : TOKENS.accent2,
                  display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                }}>📍</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: TOKENS.display, fontWeight: 900, fontSize: 15, letterSpacing: "-0.02em", color: TOKENS.ink }}>
                    {p.n}
                    {p.verified && (
                      <span style={{
                        padding: "1px 6px", background: TOKENS.accent4, color: TOKENS.paper,
                        border: `1px solid ${TOKENS.ink}`, borderRadius: 4,
                        fontFamily: TOKENS.mono, fontSize: 8, fontWeight: 800, letterSpacing: ".08em",
                      }}>VERIFIED</span>
                    )}
                  </div>
                  <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700, color: TOKENS.ink, opacity: 0.6, marginTop: 2, letterSpacing: ".08em", textTransform: "uppercase" as const }}>
                    {p.tag} · {p.nbhd} · {p.dist}
                  </div>
                </div>
                <span style={{ padding: "2px 6px", background: "#d32323", color: "#fff", border: `1.5px solid ${TOKENS.ink}`, borderRadius: 4, fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800 }}>★ {p.yelp}</span>
              </button>
            ))}
            <button onClick={() => { setPhase("adding"); setDraft({ ...draft, name: q }); }} style={{
              appearance: "none", cursor: "pointer", width: "100%",
              display: "flex", alignItems: "center", gap: 12,
              padding: "14px 14px", marginTop: 6,
              border: `2.5px dashed ${TOKENS.ink}`, borderRadius: 14,
              background: "transparent", fontFamily: TOKENS.ui, fontSize: 14, fontWeight: 800, color: TOKENS.ink, textAlign: "left" as const,
            }}>
              <span style={{ width: 36, height: 36, borderRadius: 8, border: `2px dashed ${TOKENS.ink}`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: TOKENS.ink }}>＋</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: TOKENS.ink }}>Can't find {q ? `"${q}"` : "it"}?</div>
                <div style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 700, color: TOKENS.ink, opacity: 0.6, marginTop: 2, letterSpacing: ".06em" }}>ADD IT TO YOUR LIST · WE'LL FIND THE REST</div>
              </div>
            </button>
          </>
        )}

        {phase === "adding" && (
          <>
            <PlaceField label="name" placeholder="e.g. Aunt Vivian's diner" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
            <PlaceField label="type" placeholder="diner · gallery · backyard" value={draft.tag} onChange={(v) => setDraft({ ...draft, tag: v })} />
            <PlaceField label="address or area" placeholder="148 Plymouth St · Dumbo" value={draft.addr} onChange={(v) => setDraft({ ...draft, addr: v })} />
            <PlaceField label="why you like it" textarea placeholder="vibe · what to order · best time" value={draft.note} onChange={(v) => setDraft({ ...draft, note: v })} />
            <div style={{ padding: "10px 12px", marginBottom: 14, background: TOKENS.paper, border: `2px dashed ${TOKENS.ink}`, borderRadius: 10, fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 700, color: TOKENS.ink, opacity: 0.7, lineHeight: 1.5 }}>
              ✣ Claude will auto-pull hours, photos, and the menu when you save.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setPhase("search")} style={{ appearance: "none", cursor: "pointer", flex: 1, padding: "12px 14px", border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12, background: TOKENS.paper, color: TOKENS.ink, fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 800 }}>← back</button>
              <button onClick={() => { setPhase("added"); setTimeout(onClose, 1400); }} disabled={!draft.name} style={{
                appearance: "none", cursor: !draft.name ? "not-allowed" : "pointer",
                flex: 1.4, padding: "12px 14px", border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12,
                background: TOKENS.accent1, color: TOKENS.ink,
                fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 900, boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                opacity: !draft.name ? 0.5 : 1,
              }}>save place →</button>
            </div>
          </>
        )}

        {phase === "added" && (
          <div style={{ textAlign: "center" as const, padding: "20px 0 12px" }}>
            <div style={{ width: 80, height: 80, borderRadius: 999, border: `4px solid ${TOKENS.ink}`, background: TOKENS.accent1, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: TOKENS.display, fontWeight: 900, fontSize: 40, boxShadow: `5px 5px 0 ${TOKENS.ink}` }}>✓</div>
            <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22, letterSpacing: "-0.025em", color: TOKENS.ink, marginTop: 14 }}>{draft.name} added.</div>
            <div style={{ fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 700, color: TOKENS.ink, opacity: 0.65, marginTop: 4 }}>Confetti is pulling hours + photos now.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function PlacesPage() {
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(true);
  const [added, setAdded] = useState<PlaceResult[]>([]);

  return (
    <Frame>
      <div className="cf-screen" style={{
        position: "relative", height: "100dvh", background: TOKENS.bg,
        display: "flex", flexDirection: "column", padding: "56px 22px 24px", overflow: "hidden",
      }}>
        <DotsBg opacity={0.05} />
        <div style={{
          position: "relative", zIndex: 2,
          display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14,
        }}>
          <button onClick={() => navigate({ to: "/new/explore" })} style={{
            appearance: "none", cursor: "pointer", width: 36, height: 36, borderRadius: 999,
            border: `2.5px solid ${TOKENS.ink}`, background: TOKENS.paper,
            fontSize: 14, fontWeight: 900, color: TOKENS.ink, boxShadow: `3px 3px 0 ${TOKENS.ink}`,
          }}>←</button>
          <h2 style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22, letterSpacing: "-0.035em", margin: 0, color: TOKENS.ink }}>add a place</h2>
          <span style={{ width: 36 }} />
        </div>
        <div style={{ position: "relative", zIndex: 2, flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
          {added.length === 0 && (
            <div style={{ textAlign: "center" as const, padding: "60px 0", opacity: 0.6 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📍</div>
              <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 20, color: TOKENS.ink }}>No saved places yet.</div>
              <div style={{ fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 600, color: TOKENS.ink, marginTop: 6 }}>Search for a spot or add one Confetti doesn't know about.</div>
            </div>
          )}
          {added.map((p) => (
            <div key={p.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: 14, marginBottom: 8,
              border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14,
              background: TOKENS.paper, boxShadow: `4px 4px 0 ${TOKENS.ink}`,
            }}>
              <span style={{ width: 38, height: 38, borderRadius: 8, border: `2px solid ${TOKENS.ink}`, background: p.verified ? TOKENS.accent1 : TOKENS.accent2, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📍</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 15, letterSpacing: "-0.02em", color: TOKENS.ink }}>{p.n}</div>
                <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700, color: TOKENS.ink, opacity: 0.6, marginTop: 2, letterSpacing: ".08em", textTransform: "uppercase" as const }}>{p.tag} · {p.nbhd}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ position: "relative", zIndex: 2, paddingTop: 12 }}>
          <button onClick={() => setSheetOpen(true)} style={{
            appearance: "none", cursor: "pointer", width: "100%",
            padding: "14px 16px", border: `3px solid ${TOKENS.ink}`, borderRadius: 14,
            background: TOKENS.accent1, color: TOKENS.ink,
            fontFamily: TOKENS.ui, fontSize: 15, fontWeight: 900, boxShadow: `5px 5px 0 ${TOKENS.ink}`,
          }}>＋ search or add a place</button>
        </div>
        <AddPlaceSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onPick={(p) => { setAdded([...added, p]); }} />
      </div>
    </Frame>
  );
}
