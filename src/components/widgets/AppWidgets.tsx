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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { getStoredLocation } from "@/lib/location";

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

export function TonightAtAGlance() {
  const [loc, setLoc] = useState<ReturnType<typeof getStoredLocation>>(null);
  const [w, setW] = useState<WeatherNow | null>(null);
  const [now, setNow] = useState(new Date());

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
      action={{ label: "Plan", to: "/concierge/chat" }}
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

  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 60_000);
    return () => window.clearInterval(t);
  }, []);

  if (!b) {
    return (
      <WidgetShell
        title="Next up"
        icon={CalendarCheck}
        action={{ label: "Plan", to: "/concierge/chat" }}
      >
        <p className="text-sm text-ink/60">No upcoming bookings yet.</p>
        <Link
          to="/concierge/chat"
          className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full border-2 border-ink bg-ink px-4 font-mono text-[10px] font-bold uppercase tracking-widest text-cream shadow-brut transition-pop hover:-translate-y-0.5 hover:shadow-brut-lg"
        >
          Plan a night <ArrowRight className="h-3 w-3" />
        </Link>
      </WidgetShell>
    );
  }

  const t = timeUntil(b.starts_at);
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
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <CountdownCell label="Days" value={t.d} />
        <CountdownCell label="Hours" value={t.h} />
        <CountdownCell label="Min" value={t.m} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.venue_name)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border-2 border-cream/30 px-3 font-mono text-[10px] font-bold uppercase tracking-widest text-cream hover:bg-cream/10"
        >
          <Navigation className="h-3 w-3" /> Directions
        </a>
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
