/**
 * BoardingPassV3 — Confetti boarding pass, wired to an ActiveLoop.
 *
 * Sections, in order:
 *   1. Header chip (logo + LIVE pulse)
 *   2. Route strip — origin/destination codes, mood tags, kickoff/stops/crew
 *   3. Progress rail — Home → stops → Done (derived from stop.done)
 *   4. Itinerary cards (flip front/back) per stop, with travel-time connectors
 *   5. Night Intel — budget, weather, dress
 *   6. Crew manifest (derived from groupSize)
 *   7. On My Way control (idle → live → arrived)
 *   8. Quick actions
 *   9. Pre-order drawer (per-stop mock menu)
 *
 * Designed to be dropped into /boarding-pass — sticky wallet footer is owned
 * by the parent route.
 */

import { type CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { awardXP } from "@/lib/gamification";
import {
  Camera,
  Car,
  Check,
  Clock,
  DollarSign,
  Heart,
  Info,
  Loader2,
  MapPin,
  Menu as MenuIcon,
  MessageCircle,
  Minus,
  Music,
  Phone,
  Plus,
  Shirt,
  Sparkles as SparklesIcon,
  Users,
  Wifi,
  X,
} from "lucide-react";
import { type MenuItem } from "@/lib/stop-menu.functions";
import type { ActiveLoop, LoopStop } from "@/lib/loop-store";
import { trackFeature, trackEngagement, trackConversion } from "@/lib/analytics";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const code3 = (s: string | undefined, fallback: string) => {
  if (!s) return fallback;
  const letters = s.replace(/[^A-Za-z]/g, "");
  return (letters.slice(0, 3) || fallback).toUpperCase();
};

const CREW_AVATARS = ["👑", "💃", "🎯", "🎶", "🕺", "🪩", "🌟", "🎨"];

/* -------------------------------------------------------------------------- */
/*  Client-side replacements for server functions (SPA mode)                   */
/* -------------------------------------------------------------------------- */

const FALLBACK_MENUS: Record<string, MenuItem[]> = {
  drinks: [
    { id: "old-fashioned", emoji: "🥃", name: "Old Fashioned", desc: "Bourbon, demerara, angostura, orange", price: 16 },
    { id: "spritz", emoji: "🥂", name: "Aperol Spritz", desc: "Aperol, prosecco, soda, orange", price: 14 },
    { id: "negroni", emoji: "🍹", name: "Negroni", desc: "Gin, Campari, sweet vermouth", price: 15 },
    { id: "house-lager", emoji: "🍺", name: "House Lager", desc: "Local craft, 16oz draft", price: 8 },
  ],
  meal: [
    { id: "burger", emoji: "🍔", name: "Smash Burger", desc: "Double patty, american, pickles, special sauce", price: 18 },
    { id: "caesar", emoji: "🥗", name: "Little Gem Caesar", desc: "Anchovy, parmesan, sourdough crumbs", price: 14 },
    { id: "pasta", emoji: "🍝", name: "Cacio e Pepe", desc: "Tonnarelli, pecorino, black pepper", price: 22 },
    { id: "tiramisu", emoji: "🍰", name: "Tiramisu", desc: "Espresso-soaked savoiardi, mascarpone", price: 12 },
  ],
  activity: [
    { id: "entry", emoji: "🎟️", name: "General Entry", desc: "One adult ticket, valid today", price: 25 },
    { id: "guide", emoji: "📖", name: "Guided Add-on", desc: "45-min expert walkthrough", price: 15 },
  ],
  scenic: [
    { id: "skip", emoji: "⚡", name: "Skip-the-Line", desc: "Priority entry, valid today", price: 20 },
    { id: "audio", emoji: "🎧", name: "Audio Guide", desc: "Self-paced narrated tour", price: 8 },
  ],
};

async function clientFetchMenu(args: {
  stopId: string;
  stopName: string;
  category?: string;
}): Promise<{ items: MenuItem[]; cached: boolean }> {
  const { stopId, category } = args;
  // Check cache
  // @ts-expect-error — stop_menus table not in generated types
  const { data: cached } = await supabase
    .from("stop_menus")
    .select("items, generated_at")
    .eq("stop_id", stopId)
    .maybeSingle();
  if (cached?.items && Array.isArray(cached.items) && (cached.items as unknown[]).length) {
    return { items: cached.items as MenuItem[], cached: true };
  }
  const key = (category ?? "drinks").toLowerCase();
  return { items: FALLBACK_MENUS[key] ?? FALLBACK_MENUS.drinks, cached: false };
}

async function clientPlaceOrder(args: {
  itineraryId: string;
  stopId: string;
  items: { id: string; name: string; qty: number; price: number }[];
  note?: string;
}): Promise<{ id: string; totalCents: number; createdAt: string }> {
  // Verify the venue is a Confetti-verified business
  // @ts-expect-error — itinerary_stops may not be in generated types
  const { data: stopRow } = await supabase
    .from("itinerary_stops")
    .select("name")
    .eq("id", args.stopId)
    .maybeSingle();
  if (!stopRow?.name) throw new Error("Stop not found");
  // @ts-expect-error — venues table may not be in generated types
  const { data: verifiedMatch } = await supabase
    .from("venues")
    .select("id")
    .eq("verified", true)
    .ilike("name", stopRow.name)
    .limit(1)
    .maybeSingle();
  if (!verifiedMatch) {
    throw new Error("This venue isn't verified with Confetti — pre-orders unavailable.");
  }
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not signed in");
  const totalCents = Math.round(args.items.reduce((acc, it) => acc + it.price * it.qty, 0) * 100);
  // @ts-expect-error — stop_orders table may not be in generated types
  const { data: inserted, error } = await supabase
    .from("stop_orders")
    .insert({
      user_id: user.user.id,
      itinerary_id: args.itineraryId,
      stop_id: args.stopId,
      items: args.items as unknown as never,
      total_cents: totalCents,
      note: args.note ?? null,
      status: "placed",
    })
    .select("id, total_cents, created_at")
    .single();
  if (error) throw new Error(error.message);
  return { id: inserted.id, totalCents: inserted.total_cents, createdAt: inserted.created_at };
}

async function clientListOrders(stopId: string): Promise<{ orders: unknown[] }> {
  // @ts-expect-error — stop_orders table may not be in generated types
  const { data: rows, error } = await supabase
    .from("stop_orders")
    .select("id, items, total_cents, status, note, created_at")
    .eq("stop_id", stopId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return { orders: rows ?? [] };
}

async function clientCheckVerifiedNames(names: string[]): Promise<{ verified: string[] }> {
  const uniq = Array.from(new Set(names.map((n) => n.trim()).filter(Boolean)));
  if (!uniq.length) return { verified: [] };
  // @ts-expect-error — venues table may not be in generated types
  const { data: rows, error } = await supabase
    .from("venues")
    .select("name")
    .eq("verified", true);
  if (error || !rows) return { verified: [] };
  const set = new Set((rows as { name: string }[]).map((r) => (r.name ?? "").toLowerCase()));
  return { verified: uniq.filter((n) => set.has(n.toLowerCase())) };
}

type CrewMember = {
  name: string;
  role: string;
  status: "ready" | "pending";
  transport: string;
  phone: string;
  avatar: string;
};

function deriveCrew(
  loop: ActiveLoop,
  groupMembers?: GroupMemberRow[],
): CrewMember[] {
  const captain = loop.passenger?.split("@")[0] || "You";

  // If we have real group members from the DB, use them
  if (groupMembers && groupMembers.length > 0) {
    return groupMembers.map((m, i) => ({
      name: m.display_name || m.email?.split("@")[0] || `Guest ${i + 1}`,
      role: m.role === "host" ? "Captain" : m.role === "co-host" ? "Co-host" : "Crew",
      status: (m.status === "accepted" ? "ready" : "pending") as "ready" | "pending",
      transport: "",
      avatar: CREW_AVATARS[i % CREW_AVATARS.length],
      phone: m.phone || "",
    }));
  }

  // Fallback: just show the captain with group size indicator
  const size = Math.max(1, loop.groupSize ?? 1);
  const crew: CrewMember[] = [
    {
      name: captain,
      role: "Captain",
      status: "ready",
      transport: "",
      avatar: CREW_AVATARS[0],
      phone: "",
    },
  ];
  // Show placeholder slots for remaining group members
  for (let i = 1; i < Math.min(size, 8); i++) {
    crew.push({
      name: `Guest ${i}`,
      role: "Invite to join",
      status: "pending",
      transport: "",
      avatar: CREW_AVATARS[i % CREW_AVATARS.length],
      phone: "",
    });
  }
  return crew;
}

type GroupMemberRow = {
  display_name?: string | null;
  email?: string | null;
  role: string;
  status: string;
  phone?: string | null;
};

const STOP_EMOJI_DEFAULT = "📍";

const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

/* -------------------------------------------------------------------------- */
/*  Section: Header                                                            */
/* -------------------------------------------------------------------------- */

function PassHeader() {
  return (
    <div className="flex items-center justify-between py-5">
      <div className="font-display text-[22px] font-extrabold tracking-tight text-ink">
        confetti<span className="text-coral">.</span>
      </div>
      <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-ink/60">
        <span className="block h-1.5 w-1.5 animate-pulse rounded-full bg-coral" /> Live
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section: Route strip                                                       */
/* -------------------------------------------------------------------------- */

function RouteStrip({ loop }: { loop: ActiveLoop }) {
  const firstStop = loop.stops[0];
  const lastStop = loop.stops[loop.stops.length - 1];
  const originCode = code3(loop.fromName ?? loop.from ?? firstStop?.area, "ORG");
  const destCode = code3(loop.toName ?? loop.to ?? lastStop?.area, "DST");
  const kickoff = firstStop?.time || loop.boardingTime || "—";
  const vibes = loop.vibes && loop.vibes.length ? loop.vibes : loop.vibe ? [loop.vibe] : [];

  return (
    <div className="mb-3 rounded-3xl border-2 border-ink bg-white p-5">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          <div>
            <div className="font-display text-[32px] font-extrabold leading-none tracking-tight">
              {originCode}
            </div>
            <div className="mt-1 font-mono text-[9px] tracking-widest text-ink/55">
              {(loop.fromName ?? firstStop?.area ?? "Home").toUpperCase()}
            </div>
          </div>
          <div className="flex flex-1 items-center px-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-coral" />
            <span className="h-[2px] flex-1 bg-gradient-to-r from-coral to-amber-400 opacity-60" />
            <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />
          </div>
          <div className="text-right">
            <div className="font-display text-[32px] font-extrabold leading-none tracking-tight">
              {destCode}
            </div>
            <div className="mt-1 font-mono text-[9px] tracking-widest text-ink/55">
              {(loop.toName ?? lastStop?.area ?? "Out").toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {vibes.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {vibes.map((v) => (
            <span
              key={v}
              className="rounded-full border-2 border-ink bg-ink px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-cream"
            >
              {v}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 divide-x-2 divide-ink/10">
        <Stat label="Kickoff" value={kickoff} />
        <Stat label="Stops" value={String(loop.stops.length)} />
        <Stat label="Crew" value={String(loop.groupSize ?? 1)} />
      </div>
      {loop.date && (
        <div className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50">
          {loop.day ? `${loop.day} · ` : ""}
          {loop.date}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2 text-center">
      <div className="mb-1 font-mono text-[8px] font-semibold uppercase tracking-[0.2em] text-ink/40">
        {label}
      </div>
      <div className="font-display text-base font-bold">{value}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section: Progress rail                                                     */
/* -------------------------------------------------------------------------- */

function ProgressRail({ loop }: { loop: ActiveLoop }) {
  const nodes = [
    { label: "Home", done: true, current: false },
    ...loop.stops.map((s, i) => {
      const done = !!s.done;
      const current = !done && (i === 0 ? true : !!loop.stops[i - 1]?.done);
      return { label: s.area || s.name || `Stop ${i + 1}`, done, current };
    }),
    { label: "Done", done: loop.stops.every((s) => s.done), current: false },
  ];

  return (
    <div className="mb-3 rounded-2xl border-2 border-ink bg-white px-5 py-4">
      <div className="mb-2.5 flex items-center">
        {nodes.map((n, i) => (
          <RailNode
            key={i}
            node={n}
            isLast={i === nodes.length - 1}
            prevDone={i > 0 && nodes[i - 1].done}
          />
        ))}
      </div>
      <div className="flex justify-between">
        {nodes.map((n, i) => (
          <span
            key={i}
            className={`font-mono text-[8px] font-semibold uppercase tracking-[0.15em] ${
              n.current ? "text-coral font-bold" : n.done ? "text-emerald-600" : "text-ink/40"
            }`}
          >
            {n.label.length > 8 ? n.label.slice(0, 6) + "…" : n.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function RailNode({
  node,
  isLast,
  prevDone,
}: {
  node: { done: boolean; current: boolean };
  isLast: boolean;
  prevDone: boolean;
}) {
  return (
    <>
      <span
        className={`h-3.5 w-3.5 shrink-0 rounded-full border-2 transition ${
          node.current
            ? "border-coral bg-coral animate-pulse shadow-[0_0_0_4px_rgba(255,80,50,0.2)]"
            : node.done
              ? "border-emerald-500 bg-emerald-500"
              : "border-ink/20 bg-white"
        }`}
      />
      {!isLast && (
        <span
          className={`h-[3px] flex-1 rounded-full ${prevDone ? "bg-emerald-500" : "bg-ink/10"}`}
        />
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section: Stop cards (flip)                                                 */
/* -------------------------------------------------------------------------- */

function StopCard({
  stop,
  index,
  isCurrent,
  onPreorder,
  verified,
}: {
  stop: LoopStop;
  index: number;
  isCurrent: boolean;
  onPreorder: (stop: LoopStop) => void;
  verified: boolean;
}) {
  const [flipped, setFlipped] = useState(false);
  const navUrl = stop.address
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(stop.address)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.name)}`;
  const vibeLine = stop.tags?.map((t) => t.label).join(" · ") || stop.type || "";

  const flipStyle: CSSProperties = {
    transformStyle: "preserve-3d",
    transition: "transform 600ms cubic-bezier(0.16,1,0.3,1)",
    transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
  };
  const faceStyle: CSSProperties = {
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
  };

  return (
    <div style={{ perspective: "1000px" }}>
      <div className="relative" style={flipStyle}>
        {/* Front */}
        <div
          className={`overflow-hidden rounded-3xl border-2 border-ink bg-white p-5 transition-opacity ${stop.done ? "opacity-70" : ""}`}
          style={faceStyle}
        >
          <div className="mb-3 flex items-start justify-between">
            <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-ink/40">
              Stop {String(index + 1).padStart(2, "0")}
              {stop.done ? (
                <span className="ml-2 inline-flex items-center gap-1 text-emerald-600">
                  <Check className="h-3 w-3" /> Done
                </span>
              ) : isCurrent ? (
                <span className="ml-2 text-coral">· Now</span>
              ) : null}
            </div>
            <div className="font-mono text-[13px] font-semibold">{stop.time || "—"}</div>
          </div>
          <h3
            className={`font-display text-[22px] font-extrabold leading-tight tracking-tight ${stop.done ? "line-through decoration-ink/30" : ""}`}
          >
            {stop.name}
          </h3>
          {stop.area && (
            <div className="mt-1 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-ink/55">
              {stop.area}
            </div>
          )}
          {vibeLine && (
            <div className="mt-3 font-display italic text-[13px] text-purple-700/80">
              "{vibeLine}"
            </div>
          )}
          {(stop.priceLevel || stop.dressCode || stop.waitTime || stop.bookable) && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {stop.priceLevel && (
                <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-cream px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-ink">
                  <DollarSign className="h-2.5 w-2.5" /> {stop.priceLevel}
                </span>
              )}
              {stop.dressCode && (
                <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-white px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-ink/80">
                  <Shirt className="h-2.5 w-2.5" /> {stop.dressCode}
                </span>
              )}
              {stop.waitTime && (
                <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink/30 bg-white px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-ink/70">
                  <Clock className="h-2.5 w-2.5" /> {stop.waitTime}
                </span>
              )}
              {stop.bookable && (
                <span className="inline-flex items-center gap-1 rounded-full border-2 border-coral bg-coral/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-coral">
                  ✓ Reserve
                </span>
              )}
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <a
              href={navUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-gradient-to-br from-coral to-pink-500 px-3.5 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-white"
            >
              <MapPin className="h-3 w-3" /> Navigate
            </a>
            {verified && (
              <button
                type="button"
                onClick={() => onPreorder(stop)}
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-3.5 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-ink transition hover:bg-cream"
              >
                <MenuIcon className="h-3 w-3" /> Menu
                <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[7px] text-emerald-700">
                  ✓ Verified
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={() => { setFlipped(true); trackEngagement("stop_detail_view", { stopName: stop.name }); }}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border-2 border-ink/20 bg-transparent px-3.5 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-ink/60 transition hover:border-ink"
            >
              <Info className="h-3 w-3" /> Details
            </button>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 overflow-hidden rounded-3xl border-2 border-ink bg-white p-5"
          style={{ ...faceStyle, transform: "rotateY(180deg)" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-coral">
              {stop.name} · Details
            </div>
            <button
              type="button"
              onClick={() => setFlipped(false)}
              className="grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-white"
              aria-label="Close details"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <BackCell icon={<Car className="h-4 w-4" />} label="Parking">
              {stop.parking?.primary || "Street parking nearby"}
              {stop.parking?.secondary && (
                <div className="mt-1 text-ink/60">{stop.parking.secondary}</div>
              )}
              {stop.ev && (
                <div className="mt-2 inline-flex items-center gap-1 rounded-full border-2 border-emerald-600 bg-emerald-50 px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest text-emerald-700">
                  ⚡ {stop.ev.brand}
                </div>
              )}
            </BackCell>
            <BackCell icon={<Wifi className="h-4 w-4" />} label="Transit">
              {stop.area ? `Near ${stop.area}` : "Check local transit"}
            </BackCell>
            <BackCell icon={<SparklesIcon className="h-4 w-4" />} label="Signature">
              {stop.signature || stop.type || "Ask the bartender"}
            </BackCell>
            <BackCell icon={<DollarSign className="h-4 w-4" />} label="Spend">
              {stop.priceLevel ? `${stop.priceLevel} per person` : "Mid-range"}
            </BackCell>
            <BackCell icon={<Shirt className="h-4 w-4" />} label="Dress Code">
              {stop.dressCode || "Anything goes"}
            </BackCell>
            <BackCell icon={<Users className="h-4 w-4" />} label="Crowd">
              {stop.crowd || "Mixed locals"}
            </BackCell>
            <BackCell icon={<Heart className="h-4 w-4" />} label="Best For">
              {stop.bestFor || (stop.bookable ? "Plans you don't want to wing" : "Spontaneous nights")}
            </BackCell>
            <BackCell icon={<Clock className="h-4 w-4" />} label="Wait">
              {stop.waitTime || (stop.bookable ? "None — you're booked" : "Usually walk-in friendly")}
            </BackCell>
            {stop.phone && (
              <BackCell icon={<Phone className="h-4 w-4" />} label="Call Ahead">
                <a href={`tel:${stop.phone.replace(/[^0-9+]/g, "")}`} className="underline">
                  {stop.phone}
                </a>
              </BackCell>
            )}
            <BackCell icon={<Info className="h-4 w-4" />} label="Notes">
              {stop.rationale || (stop.bookable ? "Reservation recommended" : "Walk-ins welcome")}
            </BackCell>
          </div>
        </div>
      </div>
    </div>
  );
}

function BackCell({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border-2 border-ink/10 bg-cream p-3.5">
      <div className="mb-1.5 text-ink/70">{icon}</div>
      <div className="mb-1.5 font-mono text-[8px] font-semibold uppercase tracking-[0.2em] text-ink/40">
        {label}
      </div>
      <div className="text-[12px] leading-snug text-ink/75">{children}</div>
    </div>
  );
}

function TravelConnector({ minutes, to }: { minutes: number; to?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-2.5">
      <span className="h-6 w-[2px] bg-gradient-to-b from-ink to-ink/10" />
      <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-3 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-ink/70">
        <Car className="h-3 w-3" /> {minutes} min{to ? ` · ${to}` : ""}
      </span>
      <span className="h-6 w-[2px] bg-gradient-to-b from-ink/10 to-ink" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section: Night Intel                                                       */
/* -------------------------------------------------------------------------- */

function NightIntel({ loop }: { loop: ActiveLoop }) {
  const budget = loop.estimatedSpend || `~$${60 * (loop.groupSize ?? 1)}`;

  // Derive dress code from the most common dress code across stops
  const dressCode = useMemo(() => {
    const codes = loop.stops.map((s) => s.dressCode).filter(Boolean) as string[];
    if (codes.length === 0) return "Casual";
    const freq: Record<string, number> = {};
    for (const c of codes) {
      const key = c.toLowerCase().trim();
      freq[key] = (freq[key] || 0) + 1;
    }
    const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
    // Capitalize first letter
    return top.charAt(0).toUpperCase() + top.slice(1);
  }, [loop.stops]);

  // Show city name for weather context when no live weather is available
  const weatherLabel = loop.city ? `${loop.city}` : "Check app";

  return (
    <div className="mb-3 grid grid-cols-3 gap-2">
      <IntelCard icon="💰" label="Budget" value={budget} />
      <IntelCard icon="📍" label="City" value={weatherLabel} />
      <IntelCard icon="👔" label="Dress" value={dressCode} />
    </div>
  );
}

function IntelCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-2xl border-2 border-ink bg-white p-3.5 text-center">
      <div className="mb-1.5 text-xl">{icon}</div>
      <div className="mb-1 font-mono text-[7px] font-semibold uppercase tracking-[0.2em] text-ink/40">
        {label}
      </div>
      <div className="font-display text-[15px] font-bold">{value}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section: Crew manifest                                                     */
/* -------------------------------------------------------------------------- */

function CrewManifest({ crew }: { crew: CrewMember[] }) {
  return (
    <div className="mb-3 rounded-3xl border-2 border-ink bg-white p-5">
      <div className="space-y-3">
        {crew.map((m, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-cream text-lg">
              {m.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold leading-tight">{m.name}</div>
              <div className="font-mono text-[9px] text-ink/55 tracking-wide">
                <span className={m.status === "ready" ? "text-emerald-600" : "text-amber-600"}>
                  ●{" "}
                </span>
                {m.role}
              </div>
              <div className="font-mono text-[8px] text-ink/40 tracking-wide mt-0.5">
                {m.transport}
              </div>
            </div>
            {m.phone ? (
              <a
                href={`tel:${m.phone.replace(/\D/g, "")}`}
                className="grid h-8 w-8 place-items-center rounded-full border-2 border-ink bg-white text-ink/70"
                aria-label={`Call ${m.name}`}
              >
                <Phone className="h-3.5 w-3.5" />
              </a>
            ) : (
              <div className="h-8 w-8" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section: On My Way                                                         */
/* -------------------------------------------------------------------------- */

type OmwState = "idle" | "live" | "arrived";

function OnMyWay({ targetName }: { targetName: string }) {
  const [state, setState] = useState<OmwState>("idle");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (state !== "live") return;
    setProgress(0);
    let p = 0;
    const t = window.setInterval(() => {
      p = Math.min(100, p + 4);
      setProgress(p);
      if (p >= 100) {
        window.clearInterval(t);
        setState("arrived");
      }
    }, 250);
    return () => window.clearInterval(t);
  }, [state]);

  if (state === "arrived") {
    return (
      <div className="mb-3 rounded-3xl border-2 border-ink bg-white p-6 text-center">
        <div className="mb-3 text-5xl">🎉</div>
        <div className="font-display text-[22px] font-extrabold">You're here!</div>
        <div className="mt-1.5 text-[12px] text-ink/60">
          Your order is ready at the bar. Enjoy the night.
        </div>
        <div className="mt-3 inline-flex items-center rounded-full border-2 border-ink bg-gradient-to-r from-amber-100 to-coral/20 px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-amber-800">
          +25 Confetti earned
        </div>
        <button
          type="button"
          onClick={() => setState("idle")}
          className="mt-4 block w-full rounded-2xl border-2 border-ink bg-cream px-3 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-ink/70"
        >
          Reset
        </button>
      </div>
    );
  }

  if (state === "live") {
    const minutes = Math.max(1, Math.round(((100 - progress) / 100) * 12));
    return (
      <div className="mb-3 rounded-3xl border-2 border-ink bg-white p-5">
        <div className="mb-4 inline-flex items-center gap-2 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-coral">
          <span className="h-2 w-2 animate-pulse rounded-full bg-coral" />
          Live — On My Way to {targetName}
        </div>
        <div className="mb-3 flex items-baseline gap-2">
          <span className="font-display text-5xl font-extrabold leading-none">{minutes}</span>
          <span className="font-mono text-sm font-semibold text-ink/55">min</span>
          <span className="ml-auto font-mono text-[10px] text-ink/40">
            {(minutes * 0.2).toFixed(1)} mi
          </span>
        </div>
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-ink/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-coral to-amber-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mb-4 flex flex-wrap gap-1.5">
          <Pill kind="done">✓ Crew notified</Pill>
          <Pill kind="done">✓ Venue alerted</Pill>
          <Pill kind="pending">🍸 Pre-order pending</Pill>
        </div>
        <button
          type="button"
          onClick={() => setState("arrived")}
          className="w-full rounded-2xl border-2 border-ink bg-ink px-3 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-cream"
        >
          🎉 I've arrived
        </button>
      </div>
    );
  }

  return (
    <div className="mb-3 rounded-3xl border-2 border-ink bg-white p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="text-2xl">🎯</div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[15px] font-bold">Heading to {targetName}?</div>
          <div className="mt-0.5 text-[11px] leading-snug text-ink/60">
            Alert your crew and the venue. Drinks can be ready when you arrive.
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => { setState("live"); trackFeature("on_my_way", { target: targetName }); }}
        className="relative w-full overflow-hidden rounded-2xl border-2 border-ink bg-gradient-to-br from-coral to-pink-500 px-3 py-4 font-mono text-[12px] font-bold uppercase tracking-[0.2em] text-white"
      >
        🚗 On My Way
      </button>
    </div>
  );
}

function Pill({ kind, children }: { kind: "done" | "pending"; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border-2 px-2.5 py-1 font-mono text-[8px] font-bold uppercase tracking-widest ${
        kind === "done"
          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
          : "border-amber-600 bg-amber-50 text-amber-700"
      }`}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section: Quick actions                                                     */
/* -------------------------------------------------------------------------- */

function QuickActions({ loop }: { loop: ActiveLoop }) {
  const handlePlaylist = useCallback(() => {
    // Deep-link to Spotify/Apple Music search for the vibe
    const query = encodeURIComponent(
      `${loop.vibe ?? "night out"} ${loop.city ?? ""} playlist`.trim(),
    );
    window.open(`https://open.spotify.com/search/${query}`, "_blank");
  }, [loop.vibe, loop.city]);

  const handleGroup = useCallback(() => {
    // Share invite link for this trip
    const url = `${window.location.origin}/boarding-pass?trip=${loop.id}`;
    if (navigator.share) {
      navigator.share({ title: "Join my Confetti night!", url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        toast.success("Invite link copied!");
      });
    }
  }, [loop.id]);

  const handlePhotos = useCallback(() => {
    toast("Photo album coming soon!", { description: "Share night pics with your crew." });
  }, []);

  const handleRide = useCallback(() => {
    // Deep-link to ride-hailing with first upcoming stop as destination
    const nextStop = loop.stops.find((s) => !s.done);
    const addr = nextStop?.address;
    if (addr) {
      const q = encodeURIComponent(addr);
      // Uber universal link works on mobile and web
      window.open(`https://m.uber.com/ul/?action=setPickup&dropoff[formatted_address]=${q}`, "_blank");
    } else {
      window.open("https://m.uber.com", "_blank");
    }
  }, [loop.stops]);

  const items = [
    { icon: <Music className="h-5 w-5" />, label: "Playlist", onClick: handlePlaylist },
    { icon: <MessageCircle className="h-5 w-5" />, label: "Group", onClick: handleGroup },
    { icon: <Camera className="h-5 w-5" />, label: "Photos", onClick: handlePhotos },
    { icon: <Car className="h-5 w-5" />, label: "Ride", onClick: handleRide },
  ];
  return (
    <div className="mb-3 grid grid-cols-4 gap-2">
      {items.map((it) => (
        <button
          key={it.label}
          type="button"
          onClick={() => { trackEngagement("quick_action", { action: it.label }); it.onClick(); }}
          className="rounded-2xl border-2 border-ink bg-white px-2 py-4 text-center transition hover:-translate-y-0.5 hover:bg-cream"
        >
          <div className="mb-1.5 grid place-items-center text-ink">{it.icon}</div>
          <div className="font-mono text-[7px] font-bold uppercase tracking-[0.15em] text-ink/55">
            {it.label}
          </div>
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section: Pre-order drawer                                                  */
/* -------------------------------------------------------------------------- */

function PreorderDrawer({
  stop,
  loop,
  onClose,
}: {
  stop: LoopStop | null;
  loop: ActiveLoop;
  onClose: () => void;
}) {
  const [qty, setQty] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const open = !!stop;
  const persistable = !!stop && isUuid(stop.id) && isUuid(loop.id);

  const queryClient = useQueryClient();

  const category = useMemo(() => {
    if (!stop) return "drinks";
    const c = (stop.category ?? stop.type ?? "").toLowerCase();
    if (
      c.includes("meal") ||
      c.includes("dinner") ||
      c.includes("food") ||
      c.includes("restaurant")
    )
      return "meal";
    if (c.includes("scenic") || c.includes("view")) return "scenic";
    if (c.includes("activity") || c.includes("show") || c.includes("event")) return "activity";
    return "drinks";
  }, [stop]);

  const menuQuery = useQuery({
    queryKey: ["stop-menu", stop?.id ?? "none"],
    queryFn: () =>
      clientFetchMenu({
        stopId: stop!.id,
        stopName: stop!.name,
        category,
      }),
    enabled: open,
    staleTime: 1000 * 60 * 60,
  });
  const menu: MenuItem[] = menuQuery.data?.items ?? [];

  const ordersQuery = useQuery({
    queryKey: ["stop-orders", stop?.id ?? "none"],
    queryFn: () => clientListOrders(stop!.id),
    enabled: open && persistable,
  });
  const existingOrders = ordersQuery.data?.orders ?? [];

  useEffect(() => {
    if (!stop) {
      setQty({});
      setNote("");
    } else {
      trackFeature("preorder_opened", { stopName: stop.name });
    }
  }, [stop]);

  const total = menu.reduce((acc, m) => acc + (qty[m.id] || 0) * m.price, 0);
  const count = Object.values(qty).reduce((a, b) => a + b, 0);

  const placeMutation = useMutation({
    mutationFn: async () => {
      if (!stop) throw new Error("No stop");
      if (!persistable) {
        throw new Error("Save your trip first to place a pre-order.");
      }
      const items = menu
        .filter((m) => (qty[m.id] || 0) > 0)
        .map((m) => ({ id: m.id, name: m.name, qty: qty[m.id]!, price: m.price }));
      return clientPlaceOrder({
        itineraryId: loop.id,
        stopId: stop.id,
        items,
        note: note.trim() || undefined,
      });
    },
    onSuccess: async () => {
      trackConversion("preorder_placed", { stopName: stop?.name, total, itemCount: count });
      // Award XP for pre-order
      const { data: u } = await supabase.auth.getUser();
      if (u.user) awardXP(u.user.id, "preorder_placed");
      toast.success(`Pre-order sent — $${total.toFixed(2)}`, {
        description: stop ? `Ready for you at ${stop.name}` : undefined,
        position: "bottom-center",
      });
      queryClient.invalidateQueries({ queryKey: ["stop-orders", stop?.id] });
      onClose();
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Couldn't place order";
      toast.error(msg, { position: "bottom-center" });
    },
  });

  return (
    <div
      className={`fixed inset-0 z-[500] flex items-end justify-center bg-ink/40 backdrop-blur-sm transition-opacity ${
        open ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px] max-h-[85vh] overflow-y-auto rounded-t-3xl border-t-2 border-x-2 border-ink bg-cream transition-transform duration-300"
        style={{ transform: open ? "translateY(0)" : "translateY(100%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-3 h-1 w-9 rounded-full bg-ink/15" />
        <div className="flex items-start justify-between px-5 pb-3 pt-4">
          <div>
            <div className="font-display text-[18px] font-extrabold">
              🍸 Pre-order for {stop?.name}
            </div>
            <div className="mt-0.5 text-[11px] text-ink/55">Ready when you arrive</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-white"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {existingOrders.length > 0 && (
          <div className="mx-5 mb-3 rounded-2xl border-2 border-emerald-600/40 bg-emerald-50 px-3 py-2">
            <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-emerald-700">
              ✓ Order placed
            </div>
            <div className="mt-0.5 text-[11px] text-emerald-900">
              {existingOrders.length} order{existingOrders.length === 1 ? "" : "s"} on file — total{" "}
              ${(existingOrders.reduce((a, o) => a + (o.total_cents ?? 0), 0) / 100).toFixed(2)}
            </div>
          </div>
        )}

        {menuQuery.isLoading && (
          <div className="flex items-center justify-center gap-2 py-12 text-ink/50">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="font-mono text-[10px] uppercase tracking-widest">Building menu…</span>
          </div>
        )}

        {!menuQuery.isLoading && menu.length === 0 && (
          <div className="px-5 py-12 text-center text-[12px] text-ink/55">
            Menu unavailable.{" "}
            <button type="button" onClick={() => menuQuery.refetch()} className="underline">
              Retry
            </button>
          </div>
        )}

        {!menuQuery.isLoading && menu.length > 0 && (
          <div className="grid grid-cols-2 gap-2 p-5 pt-0">
            {menu.map((m) => {
              const q = qty[m.id] || 0;
              return (
                <div
                  key={m.id}
                  className={`rounded-2xl border-2 bg-white p-4 transition ${
                    q > 0 ? "border-coral" : "border-ink"
                  }`}
                >
                  <div className="mb-1.5 text-2xl">{m.emoji}</div>
                  <div className="text-[13px] font-bold leading-tight">{m.name}</div>
                  <div className="mt-1 line-clamp-2 text-[10px] text-ink/55">{m.desc}</div>
                  <div className="mt-2 font-mono text-[12px] font-bold text-coral">${m.price}</div>
                  {q === 0 ? (
                    <button
                      type="button"
                      onClick={() => setQty((p) => ({ ...p, [m.id]: 1 }))}
                      className="mt-2 inline-flex items-center gap-1 rounded-full border-2 border-ink bg-white px-2.5 py-1 font-mono text-[8px] font-bold uppercase tracking-widest text-ink/70"
                    >
                      <Plus className="h-3 w-3" /> Add
                    </button>
                  ) : (
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setQty((p) => ({ ...p, [m.id]: Math.max(0, (p[m.id] || 0) - 1) }))
                        }
                        className="grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-white"
                        aria-label="Decrease"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-mono text-sm font-bold">{q}</span>
                      <button
                        type="button"
                        onClick={() => setQty((p) => ({ ...p, [m.id]: (p[m.id] || 0) + 1 }))}
                        className="grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-white"
                        aria-label="Increase"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {menu.length > 0 && (
          <div className="px-5 pb-3">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={280}
              placeholder="Allergies or notes (optional)"
              className="w-full rounded-xl border-2 border-ink bg-white px-3 py-2 font-mono text-[11px] placeholder:text-ink/35"
            />
          </div>
        )}

        <div className="sticky bottom-0 border-t-2 border-ink bg-cream px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-ink/55">
              {count} item{count === 1 ? "" : "s"}
            </span>
            <span className="font-display text-[20px] font-extrabold">${total.toFixed(2)}</span>
          </div>
          {!persistable && count > 0 && (
            <div className="mb-2 text-center font-mono text-[9px] uppercase tracking-widest text-ink/45">
              Save this trip to send the order
            </div>
          )}
          <button
            type="button"
            disabled={count === 0 || placeMutation.isPending || !persistable}
            onClick={() => placeMutation.mutate()}
            className={`w-full rounded-2xl border-2 px-3 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.15em] transition ${
              count > 0 && persistable
                ? "border-ink bg-gradient-to-br from-coral to-pink-500 text-white"
                : "cursor-not-allowed border-ink/15 bg-ink/5 text-ink/40"
            }`}
          >
            {placeMutation.isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…
              </span>
            ) : count > 0 ? (
              `Send order · $${total.toFixed(2)}`
            ) : (
              "Add items to pre-order"
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 w-full py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/55"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section label                                                              */
/* -------------------------------------------------------------------------- */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 mt-5 flex items-center gap-2 font-mono text-[9px] font-semibold uppercase tracking-[0.3em] text-coral">
      {children}
      <span className="h-px flex-1 bg-gradient-to-r from-ink/40 to-transparent" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main                                                                       */
/* -------------------------------------------------------------------------- */

export function BoardingPassV3({
  loop,
  containerRef,
}: {
  loop: ActiveLoop;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const [preorderStop, setPreorderStop] = useState<LoopStop | null>(null);

  // Track boarding pass view once on mount
  useEffect(() => { trackFeature("boarding_pass_view", { loopId: loop.id, title: loop.experienceName ?? loop.occasion }); }, [loop.id, loop.experienceName, loop.occasion]);

  // Query real group members if the itinerary has an associated group
  const { data: groupMembers } = useQuery({
    queryKey: ["boarding-pass-crew", loop.id],
    queryFn: async () => {
      // Check if this itinerary has a linked group
      // @ts-expect-error — groups table exists in DB but not in generated types
      const { data: group } = await supabase
        .from("groups")
        .select("id")
        .eq("itinerary_id", loop.id)
        .maybeSingle();
      if (!group) return null;
      // @ts-expect-error — group_members table exists in DB but not in generated types
      const { data: members } = await supabase
        .from("group_members")
        .select("display_name,email,role,status,phone")
        .eq("group_id", group.id)
        .order("role");
      return (members ?? []) as GroupMemberRow[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const crew = useMemo(
    () => deriveCrew(loop, groupMembers ?? undefined),
    [loop, groupMembers],
  );
  const currentIdx = loop.stops.findIndex((s) => !s.done);
  const targetStop = loop.stops[currentIdx >= 0 ? currentIdx : 0];

  // Which stop names are at Confetti-verified business venues?
  const stopNames = useMemo(
    () => Array.from(new Set(loop.stops.map((s) => s.name).filter(Boolean))).slice(0, 30),
    [loop.stops],
  );
  const verifiedQuery = useQuery({
    queryKey: ["verified-stops", stopNames.join("|")],
    queryFn: () => clientCheckVerifiedNames(stopNames),
    enabled: stopNames.length > 0,
    staleTime: 1000 * 60 * 10,
  });
  const verifiedSet = useMemo(
    () => new Set((verifiedQuery.data?.verified ?? []).map((n) => n.toLowerCase())),
    [verifiedQuery.data],
  );

  return (
    <div ref={containerRef} className="relative mx-auto max-w-[400px] px-4">
      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-[8%] -right-[10%] h-72 w-72 rounded-full bg-coral/12 blur-[100px]" />
        <div className="absolute bottom-[10%] -left-[8%] h-64 w-64 rounded-full bg-purple-500/10 blur-[100px]" />
        <div className="absolute top-1/2 left-[40%] h-52 w-52 rounded-full bg-amber-400/10 blur-[100px]" />
      </div>

      <PassHeader />
      <RouteStrip loop={loop} />
      <ProgressRail loop={loop} />

      <SectionLabel>Itinerary</SectionLabel>
      {loop.stops.map((stop, i) => {
        const isCurrent = i === currentIdx;
        const next = loop.stops[i + 1];
        const drive = stop.driveAfter;
        const isVerified = verifiedSet.has((stop.name || "").toLowerCase());
        return (
          <div key={stop.id}>
            <StopCard
              stop={stop}
              index={i}
              isCurrent={isCurrent}
              onPreorder={setPreorderStop}
              verified={isVerified}
            />
            {next && drive && <TravelConnector minutes={drive.minutes} to={drive.destination} />}
            {next && !drive && <div className="h-3" />}
          </div>
        );
      })}

      <SectionLabel>Night Intel</SectionLabel>
      <NightIntel loop={loop} />

      <SectionLabel>Crew</SectionLabel>
      <CrewManifest crew={crew} />

      <SectionLabel>On My Way</SectionLabel>
      <OnMyWay targetName={targetStop?.name || "your first stop"} />

      <SectionLabel>Quick Actions</SectionLabel>
      <QuickActions loop={loop} />

      <PreorderDrawer stop={preorderStop} loop={loop} onClose={() => setPreorderStop(null)} />
    </div>
  );
}

export default BoardingPassV3;
