import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Frame, TopBar, ChunkyButton, Chip, TOKENS, Ticket, Perf,
} from "@/components/new-confetti/shell";

export const Route = createFileRoute("/new/game-night")({ component: GameNightScreen });

// ── Types ──────────────────────────────────────────────────────────────
type Screen = "overview" | "itineraries" | "venue" | "map" | "share";
type Tier = "cheap" | "mid" | "high";

interface Venue {
  id: string; name: string; tag: string; price: string; distance: string;
  rating: number; color: string; tags: string[]; description: string;
}

interface ItineraryStop { time: string; venue: Venue; note?: string; }
interface Itinerary { tier: Tier; label: string; emoji: string; color: string; stops: ItineraryStop[]; addons: string[]; }

// ── Data ───────────────────────────────────────────────────────────────
const VENUES: Record<string, Venue> = {
  "slice-board": { id: "slice-board", name: "Slice & Board", tag: "Slice shop + board game café", price: "$", distance: "0.3 mi", rating: 4.5, color: TOKENS.accent2, tags: ["Board games", "BYOB", "Casual"], description: "Grab a slice and pick from 200+ board games. Loud, fun, no reservations needed." },
  "board-room": { id: "board-room", name: "The Board Room", tag: "Dedicated board game bar", price: "$$", distance: "0.6 mi", rating: 4.7, color: TOKENS.accent3, tags: ["700+ games", "Craft beer", "Groups"], description: "DC's best board game bar. Pay one cover, play all night." },
  "dessert-walk": { id: "dessert-walk", name: "Sugar Rush Creamery", tag: "Walkable dessert stop", price: "$", distance: "0.2 mi", rating: 4.6, color: TOKENS.accent1, tags: ["Ice cream", "Late night", "Walkable"], description: "Soft serve, loaded sundaes, and rice crispy treats open until midnight." },
  "barcade": { id: "barcade", name: "Barcade DC", tag: "Arcade bar", price: "$$", distance: "0.8 mi", rating: 4.8, color: TOKENS.accent1, tags: ["Retro arcade", "Cocktails", "21+"], description: "Classic arcade machines and strong drinks. Street Fighter tournaments every Thursday." },
  "late-dessert": { id: "late-dessert", name: "Pitango Gelato", tag: "Late-night gelato", price: "$", distance: "0.4 mi", rating: 4.9, color: TOKENS.accent2, tags: ["Gelato", "Late night", "Quiet"], description: "Artisan gelato made fresh daily. Best pistachio in the city." },
  "vr-suite": { id: "vr-suite", name: "Sandbox VR", tag: "Private VR gaming suite", price: "$$$$", distance: "1.2 mi", rating: 4.9, color: TOKENS.accent3, tags: ["VR", "Private suite", "Immersive"], description: "Full-body VR with haptic suits. Book the private group suite for up to 6." },
  "craft-cocktails": { id: "craft-cocktails", name: "Columbia Room", tag: "Award-winning cocktail bar", price: "$$$", distance: "0.9 mi", rating: 4.8, color: TOKENS.ink, tags: ["Craft cocktails", "Intimate", "Tasting menu"], description: "James Beard Award winner. Reservation required — book same day on Resy." },
  "rooftop": { id: "rooftop", name: "Top of the Gate", tag: "Rooftop lounge", price: "$$$", distance: "1.4 mi", rating: 4.7, color: TOKENS.accent1, tags: ["Rooftop", "Views", "Bottle service"], description: "360° DC views from the Watergate hotel. Dress code after 9pm." },
};

const ITINERARIES: Itinerary[] = [
  {
    tier: "cheap", label: "Budget Night", emoji: "💸", color: TOKENS.accent4,
    stops: [
      { time: "7:00 PM", venue: VENUES["slice-board"], note: "Start with a slice, pick your game" },
      { time: "8:30 PM", venue: VENUES["board-room"], note: "Level up — more games, craft beer" },
      { time: "11:00 PM", venue: VENUES["dessert-walk"], note: "Walk it off with soft serve" },
    ],
    addons: ["Bring your own card game", "BYOB bottle of wine", "Rideshare home"],
  },
  {
    tier: "mid", label: "Classic Night", emoji: "🎯", color: TOKENS.accent2,
    stops: [
      { time: "7:30 PM", venue: VENUES["barcade"], note: "Warm up on Street Fighter" },
      { time: "9:30 PM", venue: VENUES["board-room"], note: "Switch to board games + cocktails" },
      { time: "11:30 PM", venue: VENUES["late-dessert"], note: "Gelato nightcap" },
    ],
    addons: ["Pre-game drinks at home", "Lyft group ride", "Screenshot the high scores"],
  },
  {
    tier: "high", label: "VIP Experience", emoji: "👑", color: TOKENS.accent1,
    stops: [
      { time: "7:00 PM", venue: VENUES["vr-suite"], note: "Private group VR suite (book ahead)" },
      { time: "9:30 PM", venue: VENUES["craft-cocktails"], note: "Tasting menu cocktails" },
      { time: "11:00 PM", venue: VENUES["rooftop"], note: "Rooftop nightcap with city views" },
    ],
    addons: ["Reserve VR suite 48hrs in advance", "Resy reservation for Columbia Room", "Uber Black home"],
  },
];

// ── Skeleton loading card ──────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      border: `3px solid ${TOKENS.ink}`, borderRadius: 20,
      padding: 20, background: TOKENS.paper,
      boxShadow: `5px 5px 0 ${TOKENS.ink}`,
    }}>
      {[80, 60, 40, 100, 60].map((w, i) => (
        <div key={i} style={{
          height: i === 0 ? 22 : 14, width: `${w}%`,
          background: `linear-gradient(90deg, #e8e0d0 25%, #f0e8d8 50%, #e8e0d0 75%)`,
          backgroundSize: "200% 100%",
          animation: "cf-route 1.5s infinite linear",
          borderRadius: 6, marginBottom: i === 4 ? 0 : 10,
        }} />
      ))}
    </div>
  );
}

// ── Star rating ────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ fontFamily: TOKENS.mono, fontSize: 11, fontWeight: 800, color: TOKENS.accent2 }}>
      {"★".repeat(Math.floor(rating))}{"☆".repeat(5 - Math.floor(rating))}
      <span style={{ color: TOKENS.inkMuted, marginLeft: 4 }}>{rating}</span>
    </span>
  );
}

// ── Venue Card ─────────────────────────────────────────────────────────
function VenueCard({ venue, onTap, onSwap, compact = false }: {
  venue: Venue; onTap: () => void; onSwap: () => void; compact?: boolean;
}) {
  return (
    <div style={{
      border: `2.5px solid ${TOKENS.ink}`, borderRadius: 16,
      background: TOKENS.paper, overflow: "hidden",
      boxShadow: `3px 3px 0 ${TOKENS.ink}`,
    }}>
      {/* Photo stand-in */}
      <div style={{
        height: compact ? 60 : 90, background: venue.color,
        display: "flex", alignItems: "center", justifyContent: "center",
        borderBottom: `2.5px solid ${TOKENS.ink}`,
        fontSize: compact ? 22 : 30,
      }}>
        🎮
      </div>
      <div style={{ padding: compact ? "10px 12px" : "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div>
            <p style={{ fontFamily: TOKENS.display, fontSize: compact ? 14 : 16, fontWeight: 900, margin: "0 0 2px", letterSpacing: "-0.02em" }}>{venue.name}</p>
            <p style={{ fontFamily: TOKENS.ui, fontSize: 12, color: TOKENS.inkMuted, margin: 0 }}>{venue.tag}</p>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 8 }}>
            <span style={{ fontFamily: TOKENS.mono, fontSize: 13, fontWeight: 900 }}>{venue.price}</span>
            <p style={{ fontFamily: TOKENS.ui, fontSize: 11, color: TOKENS.inkMuted, margin: "2px 0 0" }}>{venue.distance}</p>
          </div>
        </div>
        {!compact && <Stars rating={venue.rating} />}
        {!compact && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, margin: "8px 0" }}>
            {venue.tags.map(t => (
              <span key={t} style={{
                padding: "3px 9px", border: `2px solid ${TOKENS.ink}`, borderRadius: 999,
                fontFamily: TOKENS.ui, fontSize: 10, fontWeight: 800,
              }}>{t}</span>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: compact ? 8 : 0 }}>
          <button onClick={onTap} style={{
            flex: 1, appearance: "none", cursor: "pointer",
            padding: "8px 0", border: `2.5px solid ${TOKENS.ink}`, borderRadius: 10,
            background: TOKENS.ink, color: TOKENS.paper,
            fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800,
          }}>Details</button>
          <button onClick={onSwap} style={{
            flex: 1, appearance: "none", cursor: "pointer",
            padding: "8px 0", border: `2.5px solid ${TOKENS.ink}`, borderRadius: 10,
            background: TOKENS.paper, color: TOKENS.ink,
            fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800,
          }}>Swap ↔</button>
        </div>
      </div>
    </div>
  );
}

// ── Map Preview ────────────────────────────────────────────────────────
function MapPreview({ stops, onExpand }: { stops: ItineraryStop[]; onExpand: () => void }) {
  return (
    <button onClick={onExpand} style={{
      width: "100%", appearance: "none", cursor: "pointer",
      border: `2.5px solid ${TOKENS.ink}`, borderRadius: 16,
      background: "#dce8d4", overflow: "hidden",
      boxShadow: `3px 3px 0 ${TOKENS.ink}`, padding: 0,
    }}>
      <div style={{ position: "relative", height: 120 }}>
        {/* Grid map stand-in */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }} />
        {stops.map((s, i) => (
          <div key={i} style={{
            position: "absolute",
            top: `${25 + i * 22}%`, left: `${20 + i * 20}%`,
            width: 28, height: 28, borderRadius: 999,
            border: `3px solid ${TOKENS.ink}`,
            background: s.venue.color,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: TOKENS.mono, fontSize: 11, fontWeight: 900,
            boxShadow: `2px 2px 0 ${TOKENS.ink}`,
          }}>{i + 1}</div>
        ))}
        <div style={{
          position: "absolute", bottom: 10, right: 10,
          padding: "5px 10px", background: TOKENS.ink, color: TOKENS.paper,
          borderRadius: 8, fontFamily: TOKENS.ui, fontSize: 11, fontWeight: 800,
        }}>View full map →</div>
      </div>
    </button>
  );
}

// ── Share Sheet ────────────────────────────────────────────────────────
function ShareSheet({ label, onClose }: { label: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const link = `https://confettiplan.com/vibe/game-night`;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(19,11,13,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "flex-end",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", background: TOKENS.paper,
        border: `3px solid ${TOKENS.ink}`,
        borderRadius: "24px 24px 0 0",
        boxShadow: `0 -5px 0 ${TOKENS.ink}`,
        padding: "24px 20px 40px",
      }}>
        <div style={{ width: 40, height: 5, background: TOKENS.ink, borderRadius: 99, margin: "0 auto 20px", opacity: 0.3 }} />
        <p style={{ fontFamily: TOKENS.display, fontSize: 18, fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.02em" }}>Share this night</p>
        <p style={{ fontFamily: TOKENS.ui, fontSize: 13, color: TOKENS.inkMuted, margin: "0 0 20px" }}>{label}</p>

        <div style={{
          border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12, padding: "12px 14px",
          background: TOKENS.bg, marginBottom: 16,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontFamily: TOKENS.mono, fontSize: 12, color: TOKENS.inkMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{link}</span>
          <button onClick={() => { navigator.clipboard?.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{
            appearance: "none", cursor: "pointer", flexShrink: 0, marginLeft: 12,
            padding: "6px 12px", border: `2px solid ${TOKENS.ink}`, borderRadius: 8,
            background: copied ? TOKENS.accent4 : TOKENS.ink,
            color: TOKENS.paper, fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800,
            transition: "background .2s",
          }}>{copied ? "✓ Copied" : "Copy"}</button>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          {[
            { label: "Messages", emoji: "💬", bg: TOKENS.accent4 },
            { label: "Instagram", emoji: "📸", bg: TOKENS.accent3 },
            { label: "More", emoji: "···", bg: TOKENS.paper },
          ].map(s => (
            <button key={s.label} style={{
              flex: 1, appearance: "none", cursor: "pointer",
              padding: "14px 0", border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14,
              background: s.bg, color: s.bg === TOKENS.paper ? TOKENS.ink : TOKENS.paper,
              fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800, textAlign: "center",
              boxShadow: `3px 3px 0 ${TOKENS.ink}`,
            }}>
              <div style={{ fontSize: 22 }}>{s.emoji}</div>
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Venue Detail overlay ───────────────────────────────────────────────
function VenueDetail({ venue, onClose, onSave }: { venue: Venue; onClose: () => void; onSave: () => void }) {
  const [saved, setSaved] = useState(false);
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 90, background: "rgba(19,11,13,0.55)",
      backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", maxHeight: "85dvh", overflowY: "auto",
        background: TOKENS.paper, border: `3px solid ${TOKENS.ink}`,
        borderRadius: "24px 24px 0 0", boxShadow: `0 -5px 0 ${TOKENS.ink}`,
        padding: "20px 20px 44px",
      }}>
        <div style={{ width: 40, height: 5, background: TOKENS.ink, borderRadius: 99, margin: "0 auto 16px", opacity: 0.3 }} />
        <div style={{
          height: 140, background: venue.color,
          border: `3px solid ${TOKENS.ink}`, borderRadius: 16,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 52, marginBottom: 16,
        }}>🎮</div>
        <h2 style={{ fontFamily: TOKENS.display, fontSize: 22, fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.02em" }}>{venue.name}</h2>
        <Stars rating={venue.rating} />
        <p style={{ fontFamily: TOKENS.ui, fontSize: 14, color: TOKENS.inkMuted, margin: "8px 0 12px", lineHeight: 1.55 }}>{venue.description}</p>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <span style={{ padding: "6px 12px", border: `2px solid ${TOKENS.ink}`, borderRadius: 999, fontFamily: TOKENS.mono, fontSize: 12, fontWeight: 800 }}>{venue.price}</span>
          <span style={{ padding: "6px 12px", border: `2px solid ${TOKENS.ink}`, borderRadius: 999, fontFamily: TOKENS.mono, fontSize: 12, fontWeight: 800 }}>{venue.distance}</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <ChunkyButton onClick={() => { setSaved(true); onSave(); }} variant={saved ? "accent" : "primary"} full={false}>
            {saved ? "✓ Saved" : "Save to Favorites"}
          </ChunkyButton>
          <ChunkyButton onClick={onClose} variant="ghost" full={false}>Close</ChunkyButton>
        </div>
      </div>
    </div>
  );
}

// ── Full Map Screen ────────────────────────────────────────────────────
function FullMapScreen({ stops, onBack }: { stops: ItineraryStop[]; onBack: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 80, background: "#dce8d4" }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)`,
        backgroundSize: "32px 32px",
      }} />
      {stops.map((s, i) => (
        <div key={i} style={{
          position: "absolute",
          top: `${20 + i * 22}%`, left: `${15 + i * 18}%`,
          width: 44, height: 44, borderRadius: 999,
          border: `3px solid ${TOKENS.ink}`, background: s.venue.color,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: TOKENS.mono, fontSize: 16, fontWeight: 900,
          boxShadow: `3px 3px 0 ${TOKENS.ink}`,
        }}>{i + 1}</div>
      ))}
      <div style={{ position: "absolute", top: 20, left: 20, right: 20 }}>
        <div style={{
          background: TOKENS.paper, border: `3px solid ${TOKENS.ink}`,
          borderRadius: 16, padding: "12px 16px", boxShadow: `4px 4px 0 ${TOKENS.ink}`,
        }}>
          <button onClick={onBack} style={{
            appearance: "none", cursor: "pointer", background: "none", border: "none",
            fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 800, color: TOKENS.accent1, padding: 0,
          }}>← Back to itinerary</button>
          <p style={{ fontFamily: TOKENS.display, fontSize: 16, fontWeight: 900, margin: "6px 0 4px" }}>Game Night Route</p>
          <p style={{ fontFamily: TOKENS.ui, fontSize: 12, color: TOKENS.inkMuted, margin: 0 }}>{stops.length} stops · tap a pin for details</p>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 32, left: 20, right: 20, display: "flex", flexDirection: "column", gap: 8 }}>
        {stops.map((s, i) => (
          <div key={i} style={{
            background: TOKENS.paper, border: `2.5px solid ${TOKENS.ink}`,
            borderRadius: 12, padding: "10px 14px",
            display: "flex", alignItems: "center", gap: 12,
            boxShadow: `2px 2px 0 ${TOKENS.ink}`,
          }}>
            <div style={{ width: 28, height: 28, borderRadius: 999, background: s.venue.color, border: `2px solid ${TOKENS.ink}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 12, flexShrink: 0 }}>{i + 1}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 800, margin: 0 }}>{s.venue.name}</p>
              <p style={{ fontFamily: TOKENS.ui, fontSize: 11, color: TOKENS.inkMuted, margin: 0 }}>{s.time} · {s.venue.distance}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Itinerary Card ─────────────────────────────────────────────────────
function ItineraryCard({ plan, onVenueTap, onVenueSwap, onMapOpen, onShare, onSave }: {
  plan: Itinerary;
  onVenueTap: (v: Venue) => void;
  onVenueSwap: (v: Venue) => void;
  onMapOpen: (stops: ItineraryStop[]) => void;
  onShare: () => void;
  onSave: () => void;
}) {
  const [saved, setSaved] = useState(false);

  return (
    <Ticket color={plan.color} style={{ marginBottom: 20 }}>
      <div style={{ padding: "20px 20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <span style={{ fontSize: 24 }}>{plan.emoji}</span>
            <h3 style={{ fontFamily: TOKENS.display, fontSize: 18, fontWeight: 900, margin: "4px 0 2px", letterSpacing: "-0.02em" }}>{plan.label}</h3>
            <p style={{ fontFamily: TOKENS.ui, fontSize: 12, color: TOKENS.inkMuted, margin: 0 }}>{plan.stops.length} stops</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setSaved(true); onSave(); }} style={{
              appearance: "none", cursor: "pointer", width: 36, height: 36,
              border: `2.5px solid ${TOKENS.ink}`, borderRadius: 999,
              background: saved ? TOKENS.accent1 : TOKENS.paper,
              color: saved ? TOKENS.paper : TOKENS.ink,
              fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `2px 2px 0 ${TOKENS.ink}`,
            }}>{saved ? "✓" : "♡"}</button>
            <button onClick={onShare} style={{
              appearance: "none", cursor: "pointer", width: 36, height: 36,
              border: `2.5px solid ${TOKENS.ink}`, borderRadius: 999,
              background: TOKENS.paper, color: TOKENS.ink,
              fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `2px 2px 0 ${TOKENS.ink}`,
            }}>↗</button>
          </div>
        </div>

        <Perf />

        {/* Timeline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          {plan.stops.map((stop, i) => (
            <div key={i} style={{ display: "flex", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: 2 }}>
                <span style={{ fontFamily: TOKENS.mono, fontSize: 11, fontWeight: 800, color: TOKENS.inkMuted, whiteSpace: "nowrap" }}>{stop.time}</span>
                {i < plan.stops.length - 1 && <div style={{ width: 2, flex: 1, background: TOKENS.ink, opacity: 0.15, margin: "4px 0" }} />}
              </div>
              <div style={{ flex: 1 }}>
                <VenueCard
                  venue={stop.venue}
                  compact
                  onTap={() => onVenueTap(stop.venue)}
                  onSwap={() => onVenueSwap(stop.venue)}
                />
                {stop.note && (
                  <p style={{ fontFamily: TOKENS.ui, fontSize: 11, color: TOKENS.inkHint, margin: "6px 0 0", fontStyle: "italic" }}>{stop.note}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Map preview */}
        <MapPreview stops={plan.stops} onExpand={() => onMapOpen(plan.stops)} />

        {/* Add-ons */}
        {plan.addons.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontFamily: TOKENS.ui, fontSize: 11, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: TOKENS.inkMuted, margin: "0 0 8px" }}>Add-ons</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {plan.addons.map(a => (
                <span key={a} style={{
                  padding: "5px 10px", border: `2px solid ${TOKENS.ink}`, borderRadius: 999,
                  fontFamily: TOKENS.ui, fontSize: 11, fontWeight: 700,
                  background: "rgba(0,0,0,0.04)",
                }}>+ {a}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Ticket>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────
function GameNightScreen() {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeVenue, setActiveVenue] = useState<Venue | null>(null);
  const [mapStops, setMapStops] = useState<ItineraryStop[] | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [shareLabel, setShareLabel] = useState("");

  function handleGenerate() {
    setError(null);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setScreen("itineraries");
    }, 1800);
  }

  function handleSwapVenue(v: Venue) {
    const alts = Object.values(VENUES).filter(x => x.id !== v.id);
    setActiveVenue(alts[Math.floor(Math.random() * alts.length)]);
  }

  if (mapStops) return <FullMapScreen stops={mapStops} onBack={() => setMapStops(null)} />;

  return (
    <Frame>
      {activeVenue && (
        <VenueDetail
          venue={activeVenue}
          onClose={() => setActiveVenue(null)}
          onSave={() => { setTimeout(() => setActiveVenue(null), 600); }}
        />
      )}
      {showShare && <ShareSheet label={shareLabel} onClose={() => setShowShare(false)} />}

      <div className="cf-screen" style={{ minHeight: "100dvh", padding: "16px 20px 48px" }}>
        <TopBar onBack={() => screen === "itineraries" ? setScreen("overview") : navigate({ to: "/new/vibe-mode" })} />

        {/* ── Overview ── */}
        {screen === "overview" && (
          <div>
            {/* Hero */}
            <div style={{
              background: `linear-gradient(135deg, ${TOKENS.accent3} 0%, #3d2fa8 100%)`,
              border: `3px solid ${TOKENS.ink}`, borderRadius: 24,
              height: 200, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 72, marginBottom: 20,
              boxShadow: `5px 5px 0 ${TOKENS.ink}`,
              position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)`, backgroundSize: "20px 20px" }} />
              <span style={{ position: "relative", zIndex: 1 }}>🎮</span>
            </div>

            <p style={{ fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: TOKENS.accent3, margin: "0 0 6px" }}>vibe mode</p>
            <h1 style={{ fontFamily: TOKENS.display, fontSize: 30, fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 8px", lineHeight: 1.1 }}>Game Night</h1>
            <p style={{ fontFamily: TOKENS.ui, fontSize: 15, color: TOKENS.inkMuted, margin: "0 0 16px", lineHeight: 1.6 }}>
              Board games, barcades, and VR — three ways to play, all in one night. Pick your budget and we'll plan the whole thing.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
              {["Interactive", "Group-friendly", "Cozy indoor", "🎲 Board games", "🕹 Arcade"].map(t => (
                <Chip key={t} dense>{t}</Chip>
              ))}
            </div>

            {error && (
              <div style={{
                border: `2.5px solid ${TOKENS.accent1}`, borderRadius: 12, padding: "12px 16px",
                background: "rgba(255,91,61,0.08)", marginBottom: 16,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 700, color: TOKENS.accent1 }}>{error}</span>
                <button onClick={handleGenerate} style={{ appearance: "none", cursor: "pointer", border: "none", background: "none", fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800, color: TOKENS.accent1, textDecoration: "underline" }}>Try again</button>
              </div>
            )}

            <ChunkyButton onClick={handleGenerate} disabled={loading} variant="accent">
              {loading ? "Building your night…" : "Generate My Game Night 🎮"}
            </ChunkyButton>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && screen === "overview" && (
          <div style={{ marginTop: 20 }}>
            <p style={{ fontFamily: TOKENS.ui, fontSize: 13, color: TOKENS.inkMuted, marginBottom: 16, textAlign: "center" }}>Finding the best spots…</p>
            {[0, 1, 2].map(i => <div key={i} style={{ marginBottom: 16 }}><SkeletonCard /></div>)}
          </div>
        )}

        {/* ── Itineraries ── */}
        {screen === "itineraries" && !loading && (
          <div>
            <p style={{ fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: TOKENS.accent3, margin: "0 0 6px" }}>game night</p>
            <h2 style={{ fontFamily: TOKENS.display, fontSize: 24, fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 4px" }}>Pick your budget</h2>
            <p style={{ fontFamily: TOKENS.ui, fontSize: 13, color: TOKENS.inkMuted, margin: "0 0 20px" }}>3 fully-planned nights. Tap to explore.</p>

            {ITINERARIES.map(plan => (
              <ItineraryCard
                key={plan.tier}
                plan={plan}
                onVenueTap={setActiveVenue}
                onVenueSwap={handleSwapVenue}
                onMapOpen={setMapStops}
                onShare={() => { setShareLabel(plan.label); setShowShare(true); }}
                onSave={() => {}}
              />
            ))}

            <ChunkyButton onClick={() => setScreen("overview")} variant="ghost">
              ← Back to overview
            </ChunkyButton>
          </div>
        )}
      </div>
    </Frame>
  );
}
