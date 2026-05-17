import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  Clock,
  MapPin,
  Sunset,
  CalendarCheck,
  Navigation,
  Wallet,
  ArrowRight,
  Send,
  TrendingUp,
  Bookmark,
  Trophy,
  Flame,
  Share2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { getStoredLocation } from "@/lib/location";
import { buildSmartSearchUrl } from "@/lib/maps-links";

/* ---------------- Shared shell ---------------- */

export function WidgetShell({
  title,
  icon: Icon,
  tone = "cream",
  children,
  action,
}: {
  title: string;
  icon: typeof Sparkles;
  tone?: "cream" | "ink" | "coral";
  children: React.ReactNode;
  action?: { label: string; to: string };
}) {
  const styles =
    tone === "ink"
      ? "border-ink bg-ink text-cream"
      : tone === "coral"
        ? "border-ink bg-coral/30"
        : "border-ink bg-cream";
  return (
    <article className={`rounded-3xl border-2 p-5 shadow-brut ${styles}`}>
      <header className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <h3 className="font-display text-base font-extrabold uppercase tracking-wide">{title}</h3>
        </div>
        {action && (
          <Link
            to={action.to as "/"}
            className={`font-mono text-[10px] font-bold uppercase tracking-widest ${
              tone === "ink" ? "text-cream/70 hover:text-cream" : "text-ink/60 hover:text-ink"
            }`}
          >
            {action.label} →
          </Link>
        )}
      </header>
      {children}
    </article>
  );
}

/* ---------------- 1. Tonight at a glance ---------------- */

type WeatherNow = { tempF: number; code: string; sunset: string | null };

const WEATHER_LABEL: Record<string, string> = {
  clear: "Clear skies",
  cloud: "Cloudy",
  rain: "Rainy",
  snow: "Snowy",
  fog: "Foggy",
  thunder: "Thunder",
};

function codeToBucket(code: number): string {
  if ([0, 1].includes(code)) return "clear";
  if ([2, 3].includes(code)) return "cloud";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 67) return "rain";
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 80 && code <= 82) return "rain";
  if (code >= 95) return "thunder";
  return "clear";
}

type NearbyOption = {
  id: string;
  name: string;
  category: string;
  neighborhood: string | null;
  distanceKm: number | null;
};

const NEIGHBORHOOD_COORDS: Record<string, { lat: number; lng: number }> = {
  "adams morgan": { lat: 38.9215, lng: -77.0423 },
  "14th street": { lat: 38.912, lng: -77.032 },
  downtown: { lat: 38.9037, lng: -77.0365 },
  georgetown: { lat: 38.9097, lng: -77.0655 },
  "h street": { lat: 38.9005, lng: -76.9958 },
  "logan circle": { lat: 38.9096, lng: -77.0296 },
  "u street": { lat: 38.917, lng: -77.028 },
  "union market": { lat: 38.9087, lng: -76.9974 },
};

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function fmtDistance(km: number) {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  if (km < 10) return `${km.toFixed(1)}km`;
  return `${Math.round(km)}km`;
}

export function TonightAtAGlance() {
  const [loc, setLoc] = useState<ReturnType<typeof getStoredLocation>>(null);
  const [w, setW] = useState<WeatherNow | null>(null);
  const [now, setNow] = useState(new Date());
  const [nearby, setNearby] = useState<NearbyOption[]>([]);

  useEffect(() => {
    setLoc(getStoredLocation());
    const t = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!loc) return;
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lng}&current=temperature_2m,weather_code&daily=sunset&temperature_unit=fahrenheit&timezone=auto`;
        const res = await fetch(url);
        const data = (await res.json()) as {
          current?: { temperature_2m?: number; weather_code?: number };
          daily?: { sunset?: string[] };
        };
        if (cancelled) return;
        const c = data.current ?? {};
        const code = typeof c.weather_code === "number" ? codeToBucket(c.weather_code) : "clear";
        setW({
          tempF: typeof c.temperature_2m === "number" ? Math.round(c.temperature_2m) : 0,
          code,
          sunset: data.daily?.sunset?.[0] ?? null,
        });
      } catch {
        /* ignore */
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [loc]);

  useEffect(() => {
    let cancelled = false;
    void supabase
      .from("venues")
      .select("id,name,category,neighborhood,city")
      .order("created_at", { ascending: false })
      .limit(40)
      .then(({ data }) => {
        if (cancelled || !data) return;
        const ranked: NearbyOption[] = (data as Array<{
          id: string;
          name: string;
          category: string;
          neighborhood: string | null;
          city: string | null;
        }>).map((v) => {
          const key = v.neighborhood?.trim().toLowerCase();
          const coords = key ? NEIGHBORHOOD_COORDS[key] : undefined;
          const distanceKm = loc && coords ? haversineKm(loc, coords) : null;
          return {
            id: v.id,
            name: v.name,
            category: v.category,
            neighborhood: v.neighborhood,
            distanceKm,
          };
        });
        ranked.sort((a, b) => {
          if (a.distanceKm == null && b.distanceKm == null) return 0;
          if (a.distanceKm == null) return 1;
          if (b.distanceKm == null) return -1;
          return a.distanceKm - b.distanceKm;
        });
        setNearby(ranked.slice(0, 3));
      });
    return () => {
      cancelled = true;
    };
  }, [loc]);

  const hour = now.getHours();
  const phase =
    hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : hour < 21 ? "Evening" : "Late night";
  const tip =
    hour < 12
      ? "Brunch reservations move fast on weekends."
      : hour < 17
        ? "Happy hour windows usually open at 4-6pm."
        : hour < 21
          ? "Prime dinner slots — book within the next 30 min."
          : "Late-night spots: cocktails, dessert, or live music.";

  return (
    <WidgetShell
      title="Tonight at a glance"
      icon={Sparkles}
      action={{ label: "Plan", to: "/create" }}
    >
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-ink/5 p-3">
          <div className="font-mono text-[9px] uppercase tracking-widest text-ink/60">Now</div>
          <div className="mt-0.5 font-display text-xl font-extrabold leading-none">
            {now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </div>
          <div className="mt-1 text-[11px] text-ink/60">{phase}</div>
        </div>
        <div className="rounded-xl bg-ink/5 p-3">
          <div className="font-mono text-[9px] uppercase tracking-widest text-ink/60">Weather</div>
          <div className="mt-0.5 font-display text-xl font-extrabold leading-none">
            {w ? `${w.tempF}°` : "—"}
          </div>
          <div className="mt-1 truncate text-[11px] text-ink/60">
            {w ? (WEATHER_LABEL[w.code] ?? "—") : loc ? "Loading…" : "Set location"}
          </div>
        </div>
        <div className="rounded-xl bg-ink/5 p-3">
          <div className="font-mono text-[9px] uppercase tracking-widest text-ink/60">
            <Sunset className="inline h-3 w-3" /> Sunset
          </div>
          <div className="mt-0.5 font-display text-xl font-extrabold leading-none">
            {w?.sunset
              ? new Date(w.sunset).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
              : "—"}
          </div>
          <div className="mt-1 text-[11px] text-ink/60">Local</div>
        </div>
      </div>

      {nearby.length > 0 && (
        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between">
            <div className="font-mono text-[9px] uppercase tracking-widest text-ink/60">
              <MapPin className="inline h-3 w-3" /> Nearby options
            </div>
            {!loc && (
              <span className="font-mono text-[9px] uppercase tracking-widest text-ink/40">
                Set location for distances
              </span>
            )}
          </div>
          <ul className="space-y-1">
            {nearby.map((n) => (
              <li key={n.id} className="flex items-center justify-between gap-2">
                <Link
                  to="/venue/$id"
                  params={{ id: n.id }}
                  className="min-w-0 flex-1 truncate font-display text-sm font-bold hover:underline"
                >
                  {n.name}
                </Link>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-ink/60">
                  {n.distanceKm != null
                    ? fmtDistance(n.distanceKm)
                    : (n.neighborhood ?? n.category)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-3 rounded-xl border border-dashed border-ink/20 px-3 py-2 text-xs text-ink/70">
        💡 {tip}
      </p>
      {!loc && (
        <Link
          to="/portal/profile"
          className="mt-3 inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-widest text-coral hover:underline"
        >
          <MapPin className="h-3 w-3" /> Enable location for richer data
        </Link>
      )}
    </WidgetShell>
  );
}

/* ---------------- 2. Next booking countdown ---------------- */

type NextBooking = {
  id: string;
  venue_name: string;
  starts_at: string;
  party_size: number;
  status: string;
};

function timeUntil(iso: string): { d: number; h: number; m: number; past: boolean } {
  const diff = new Date(iso).getTime() - Date.now();
  const past = diff <= 0;
  const abs = Math.abs(diff);
  return {
    d: Math.floor(abs / 86_400_000),
    h: Math.floor((abs % 86_400_000) / 3_600_000),
    m: Math.floor((abs % 3_600_000) / 60_000),
    past,
  };
}

export function NextBookingCountdown() {
  const { user } = useAuth();
  const [b, setB] = useState<NextBooking | null>(null);
  const [, setTick] = useState(0);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void supabase
      .from("bookings")
      .select("id,venue_name,starts_at,party_size,status")
      .eq("user_id", user.id)
      .gte("starts_at", new Date().toISOString())
      .neq("status", "cancelled")
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setB(data as NextBooking);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Live countdown — tick every second so the minutes update without lag
  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 1_000);
    return () => window.clearInterval(t);
  }, []);

  const handleShare = async () => {
    if (!b) return;
    const when = new Date(b.starts_at).toLocaleString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    const text = `${b.venue_name} on ${when} · party of ${b.party_size}`;
    const url = typeof window !== "undefined" ? window.location.origin + "/portal/bookings" : "";
    try {
      const nav = typeof navigator !== "undefined" ? (navigator as Navigator) : null;
      if (nav && typeof nav.share === "function") {
        await nav.share({ title: "My next booking", text, url });
        return;
      }
      if (nav && nav.clipboard) {
        await nav.clipboard.writeText(`${text}\n${url}`);
        toast.success("Booking copied to clipboard");
      }
    } catch {
      /* user cancelled or unsupported */
    }
  };

  const handleCancel = async () => {
    if (!b) return;
    if (typeof window !== "undefined" && !window.confirm(`Cancel your booking at ${b.venue_name}?`)) {
      return;
    }
    setCancelling(true);
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", b.id);
    setCancelling(false);
    if (error) {
      toast.error("Could not cancel — please try again.");
      return;
    }
    toast.success("Booking cancelled");
    setB(null);
  };

  if (!b) {
    return (
      <WidgetShell
        title="Next up"
        icon={CalendarCheck}
        action={{ label: "Plan", to: "/create" }}
      >
        <p className="text-sm text-ink/60">No upcoming bookings yet.</p>
        <Link
          to="/create"
          className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full border-2 border-ink bg-ink px-4 font-mono text-[10px] font-bold uppercase tracking-widest text-cream shadow-brut transition-pop hover:-translate-y-0.5 hover:shadow-brut-lg"
        >
          Plan a night <ArrowRight className="h-3 w-3" />
        </Link>
      </WidgetShell>
    );
  }

  const t = timeUntil(b.starts_at);
  const sec = Math.max(0, Math.floor(((new Date(b.starts_at).getTime() - Date.now()) % 60_000) / 1000));
  return (
    <WidgetShell
      title="Next up"
      icon={CalendarCheck}
      tone="ink"
      action={{ label: "All", to: "/portal/bookings" }}
    >
      <div className="font-display text-2xl font-extrabold leading-tight">{b.venue_name}</div>
      <div className="mt-0.5 text-xs text-cream/70">
        {new Date(b.starts_at).toLocaleString([], {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}{" "}
        · party of {b.party_size}
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        <CountdownCell label="Days" value={t.d} />
        <CountdownCell label="Hours" value={t.h} />
        <CountdownCell label="Min" value={t.m} />
        <CountdownCell label="Sec" value={sec} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={buildSmartSearchUrl({ name: b.venue_name })}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border-2 border-cream/30 px-3 font-mono text-[10px] font-bold uppercase tracking-widest text-cream hover:bg-cream/10"
        >
          <Navigation className="h-3 w-3" /> Directions
        </a>
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border-2 border-cream/30 px-3 font-mono text-[10px] font-bold uppercase tracking-widest text-cream hover:bg-cream/10"
        >
          <Share2 className="h-3 w-3" /> Share
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={cancelling}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border-2 border-coral/60 bg-coral/20 px-3 font-mono text-[10px] font-bold uppercase tracking-widest text-cream hover:bg-coral/30 disabled:opacity-60"
        >
          <X className="h-3 w-3" /> {cancelling ? "Cancelling…" : "Cancel"}
        </button>
        <Link
          to="/portal/bookings"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border-2 border-cream bg-cream px-3 font-mono text-[10px] font-bold uppercase tracking-widest text-ink hover:bg-cream/90"
        >
          Manage
        </Link>
      </div>
    </WidgetShell>
  );
}

function CountdownCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-cream/20 bg-cream/5 py-2">
      <div className="font-display text-2xl font-extrabold leading-none">
        {value.toString().padStart(2, "0")}
      </div>
      <div className="mt-1 font-mono text-[9px] uppercase tracking-widest text-cream/60">
        {label}
      </div>
    </div>
  );
}

/* ---------------- 3. Concierge quick-ask ---------------- */

const QUICK_PROMPTS = [
  "Date night under $80",
  "Last-minute table tonight",
  "Quiet spot to work",
  "Best rooftop right now",
] as const;

export function ConciergeQuickAsk() {
  const [input, setInput] = useState("");

  const handoff = (prompt: string) => {
    const q = prompt.trim();
    if (!q) return;
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("concierge:next-prompt", q);
    }
    window.location.href = `/concierge/chat?q=${encodeURIComponent(q)}`;
  };

  return (
    <WidgetShell
      title="Ask the Concierge"
      icon={Sparkles}
      tone="coral"
      action={{ label: "Open", to: "/concierge/chat" }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handoff(input);
        }}
        className="flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What's the move tonight?"
          className="h-10 flex-1 rounded-full border-2 border-ink bg-cream px-4 font-mono text-xs placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-ink/20"
        />
        <button
          type="submit"
          aria-label="Ask"
          className="grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-ink text-cream shadow-brut transition-pop hover:-translate-y-0.5 hover:shadow-brut-lg"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => handoff(p)}
            className="rounded-full border-2 border-ink/30 bg-cream px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-ink/80 transition-pop hover:border-ink hover:bg-ink hover:text-cream"
          >
            {p}
          </button>
        ))}
      </div>
    </WidgetShell>
  );
}

/* ---------------- 4. Spend / budget tracker ---------------- */

const BUDGET_KEY = "loop:monthly-budget-cents";
const DEFAULT_BUDGET_CENTS = 30_000; // $300

export function SpendBudgetTracker() {
  const { user } = useAuth();
  const [spent, setSpent] = useState(0);
  const [budget, setBudget] = useState<number>(DEFAULT_BUDGET_CENTS);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(BUDGET_KEY);
    const n = raw ? parseInt(raw, 10) : NaN;
    if (Number.isFinite(n) && n > 0) setBudget(n);
  }, []);

  useEffect(() => {
    if (!user) return;
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    let cancelled = false;
    void supabase
      .from("bookings")
      .select("total_cents,status,starts_at")
      .eq("user_id", user.id)
      .gte("starts_at", start.toISOString())
      .then(({ data }) => {
        if (cancelled) return;
        const total = (data ?? [])
          .filter((r) => r.status !== "cancelled")
          .reduce((s, r) => s + (r.total_cents ?? 0), 0);
        setSpent(total);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
  const monthLabel = useMemo(() => new Date().toLocaleDateString([], { month: "long" }), []);
  const remaining = Math.max(0, budget - spent);
  const tone =
    pct < 70
      ? "from-emerald-500 to-emerald-400"
      : pct < 100
        ? "from-amber-500 to-amber-400"
        : "from-coral to-coral";

  const saveBudget = () => {
    const dollars = parseInt(draft, 10);
    if (Number.isFinite(dollars) && dollars > 0) {
      const cents = dollars * 100;
      setBudget(cents);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(BUDGET_KEY, String(cents));
      }
    }
    setEditing(false);
  };

  return (
    <WidgetShell
      title={`${monthLabel} spend`}
      icon={Wallet}
      action={{ label: "Bookings", to: "/portal/bookings" }}
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="font-display text-3xl font-extrabold leading-none">
            ${(spent / 100).toLocaleString()}
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink/60">
            of ${(budget / 100).toLocaleString()} budget
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-ink/5 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-ink/70">
          <TrendingUp className="h-3 w-3" /> {pct}%
        </div>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-ink/10">
        <div
          className={`h-full bg-gradient-to-r ${tone} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-ink/60">
        <span>{remaining > 0 ? `$${(remaining / 100).toLocaleString()} left` : "Over budget"}</span>
        {editing ? (
          <span className="inline-flex items-center gap-1">
            $
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
              onBlur={saveBudget}
              onKeyDown={(e) => e.key === "Enter" && saveBudget()}
              className="h-6 w-16 rounded border border-ink/30 bg-cream px-1 font-mono"
              inputMode="numeric"
            />
            <Clock className="h-3 w-3" />
          </span>
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(String(Math.round(budget / 100)));
              setEditing(true);
            }}
            className="font-mono text-[10px] font-bold uppercase tracking-widest text-coral hover:underline"
          >
            Edit budget
          </button>
        )}
      </div>
    </WidgetShell>
  );
}

/* ---------------- 5. Saved spots preview ---------------- */

type SavedRow = {
  venue_id: string;
  venues: { id: string; name: string; neighborhood: string | null; image_url: string | null } | null;
};

export function SavedSpotsWidget() {
  const { user } = useAuth();
  const [items, setItems] = useState<SavedRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    void supabase
      .from("saved_venues")
      .select("venue_id,venues(id,name,neighborhood,image_url)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (cancelled) return;
        setItems((data as unknown as SavedRow[]) ?? []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <WidgetShell
      title="Saved spots"
      icon={Bookmark}
      action={{ label: "All", to: "/portal/saved" }}
    >
      {loading ? (
        <p className="text-xs text-ink/50">Loading…</p>
      ) : items.length === 0 ? (
        <div className="text-sm text-ink/60">
          Nothing saved yet.
          <Link
            to="/portal"
            className="ml-1 font-mono text-[10px] font-bold uppercase tracking-widest text-coral hover:underline"
          >
            Browse venues →
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((s) =>
            s.venues ? (
              <li key={s.venue_id} className="flex items-center gap-3">
                <div
                  className="h-10 w-10 shrink-0 rounded-lg border border-ink/20 bg-cover bg-center"
                  style={{
                    backgroundImage: s.venues.image_url
                      ? `url(${s.venues.image_url})`
                      : "linear-gradient(135deg,#f5e9d7,#e3c39a)",
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-sm font-bold">{s.venues.name}</div>
                  <div className="truncate text-[11px] text-ink/60">
                    {s.venues.neighborhood ?? "—"}
                  </div>
                </div>
                <Link
                  to="/venue/$id"
                  params={{ id: s.venues.id }}
                  className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60 hover:text-ink"
                >
                  View →
                </Link>
              </li>
            ) : null,
          )}
        </ul>
      )}
    </WidgetShell>
  );
}

/* ---------------- 6. XP & level progress ---------------- */

type XpProfile = { xp: number; level: number; display_name: string | null };

const XP_PER_LEVEL = 500;

export function XpProgressWidget() {
  const { user } = useAuth();
  const [p, setP] = useState<XpProfile | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void supabase
      .from("profiles")
      .select("xp,level,display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setP(data as XpProfile);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const xp = p?.xp ?? 0;
  const level = p?.level ?? 1;
  const intoLevel = xp % XP_PER_LEVEL;
  const pct = Math.min(100, Math.round((intoLevel / XP_PER_LEVEL) * 100));
  const remaining = XP_PER_LEVEL - intoLevel;

  return (
    <WidgetShell
      title="Your level"
      icon={Trophy}
      tone="ink"
      action={{ label: "Badges", to: "/portal/achievements" }}
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-cream/60">Level</div>
          <div className="font-display text-3xl font-extrabold leading-none">{level}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] uppercase tracking-widest text-cream/60">XP</div>
          <div className="font-display text-xl font-extrabold leading-none">
            {xp.toLocaleString()}
          </div>
        </div>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-cream/15">
        <div
          className="h-full bg-gradient-to-r from-coral to-amber-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-cream/70">
        <span className="inline-flex items-center gap-1">
          <Flame className="h-3 w-3" /> {pct}% to L{level + 1}
        </span>
        <span>{remaining} XP to go</span>
      </div>
    </WidgetShell>
  );
}

/* ---------------- 7. Trending near you ---------------- */

type TrendingVenue = {
  id: string;
  name: string;
  category: string;
  neighborhood: string | null;
  price_level: number;
};

export function TrendingNearYouWidget() {
  const [items, setItems] = useState<TrendingVenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void supabase
      .from("venues")
      .select("id,name,category,neighborhood,price_level")
      .order("created_at", { ascending: false })
      .limit(4)
      .then(({ data }) => {
        if (cancelled) return;
        setItems((data as TrendingVenue[]) ?? []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <WidgetShell
      title="Trending near you"
      icon={TrendingUp}
      tone="coral"
      action={{ label: "More", to: "/portal" }}
    >
      {loading ? (
        <p className="text-xs text-ink/60">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-ink/60">No venues yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((v) => (
            <li key={v.id} className="flex items-center justify-between gap-2">
              <Link
                to="/venue/$id"
                params={{ id: v.id }}
                className="min-w-0 flex-1 truncate font-display text-sm font-bold hover:underline"
              >
                {v.name}
              </Link>
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-ink/60">
                {v.neighborhood ?? v.category}
                {" · "}
                {"$".repeat(Math.max(1, v.price_level || 1))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </WidgetShell>
  );
}
