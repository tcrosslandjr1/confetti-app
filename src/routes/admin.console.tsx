import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import {
  getAdminPlatformStats,
  getAdminRecentBookings,
  getAdminAllVenues,
} from "@/lib/business-portal.functions";
import {
  Shield,
  MapPin,
  Users,
  CalendarCheck,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Store,
  Clock,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/admin/console")({
  component: AdminConsole,
});

/* ─────────────── PIN Gate ─────────────── */

const ADMIN_PIN = "236166";
const PIN_KEY = "confetti.admin.pinOk";

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [show, setShow] = useState(false);

  const submit = () => {
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem(PIN_KEY, "1");
      onUnlock();
    } else {
      setError(true);
      setPin("");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border-2 border-cream/20 bg-ink p-8 text-center shadow-brut">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-coral bg-coral/10">
          <Lock className="h-7 w-7 text-coral" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-black tracking-tight text-cream">
            Admin Console
          </h1>
          <p className="mt-1 font-mono text-xs uppercase tracking-widest text-cream/50">
            Enter your PIN to continue
          </p>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => {
                setError(false);
                setPin(e.target.value.replace(/\D/g, ""));
              }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="••••••"
              className={`w-full rounded-xl border-2 bg-cream/5 px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] text-cream placeholder:text-cream/20 focus:outline-none ${
                error
                  ? "border-red-500 shake"
                  : "border-cream/20 focus:border-coral"
              }`}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/40 hover:text-cream/70"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && (
            <p className="flex items-center justify-center gap-1 text-xs text-red-400">
              <AlertCircle className="h-3 w-3" /> Wrong PIN — try again
            </p>
          )}

          <button
            onClick={submit}
            disabled={pin.length < 4}
            className="w-full rounded-xl border-2 border-coral bg-coral px-4 py-3 font-mono text-sm font-bold uppercase tracking-widest text-cream transition-all hover:-translate-y-0.5 hover:shadow-brut disabled:opacity-40 disabled:hover:translate-y-0"
          >
            Unlock
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Dashboard ─────────────── */

type Stats = {
  totalVenues: number;
  totalUsers: number;
  totalBookings: number;
  pendingClaims: number;
};

type Booking = {
  id: string;
  starts_at: string | null;
  party_size: number | null;
  status: string | null;
  confirmation_code: string | null;
  venue: { name: string; city: string } | null;
};

type Venue = {
  id: string;
  name: string;
  city: string | null;
  neighborhood: string | null;
  claim_status: string | null;
  promotion_approved: boolean | null;
  hero_image_url: string | null;
};

function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [tab, setTab] = useState<"overview" | "venues" | "bookings">("overview");
  const [loading, setLoading] = useState(true);
  const [venueSearch, setVenueSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [s, b, v] = await Promise.all([
        getAdminPlatformStats(),
        getAdminRecentBookings(),
        getAdminAllVenues(),
      ]);
      setStats(s);
      setBookings(b.bookings as Booking[]);
      setVenues(v.venues as Venue[]);
    } catch (e) {
      console.error("Admin load failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredVenues = venues.filter(
    (v) =>
      v.name.toLowerCase().includes(venueSearch.toLowerCase()) ||
      (v.city ?? "").toLowerCase().includes(venueSearch.toLowerCase()) ||
      (v.neighborhood ?? "").toLowerCase().includes(venueSearch.toLowerCase()),
  );

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-ink text-cream">
      {/* Header */}
      <header className="border-b-2 border-cream/10 bg-ink">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-coral bg-coral/10">
              <Shield className="h-5 w-5 text-coral" />
            </div>
            <div>
              <h1 className="font-display text-lg font-black tracking-tight">
                Admin Console
              </h1>
              <p className="font-mono text-[10px] uppercase tracking-widest text-cream/40">
                {user?.email ?? "admin"}
              </p>
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-cream/20 px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-cream/60 transition hover:border-cream/40 hover:text-cream disabled:opacity-40"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* Stat Cards */}
        {stats && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={Store} label="Venues" value={stats.totalVenues} />
            <StatCard icon={Users} label="Users" value={stats.totalUsers} />
            <StatCard icon={CalendarCheck} label="Bookings" value={stats.totalBookings} />
            <StatCard
              icon={AlertCircle}
              label="Pending Claims"
              value={stats.pendingClaims}
              highlight={stats.pendingClaims > 0}
            />
          </div>
        )}

        {/* Tabs */}
        <div className="mb-4 flex gap-1 rounded-xl border-2 border-cream/10 bg-cream/5 p-1">
          {(["overview", "venues", "bookings"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg px-3 py-2 font-mono text-xs font-bold uppercase tracking-widest transition ${
                tab === t
                  ? "bg-coral text-cream shadow"
                  : "text-cream/50 hover:text-cream/80"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading && !stats ? (
          <div className="py-20 text-center">
            <RefreshCw className="mx-auto h-6 w-6 animate-spin text-cream/30" />
            <p className="mt-3 font-mono text-xs text-cream/40">Loading platform data…</p>
          </div>
        ) : tab === "overview" ? (
          <OverviewTab bookings={bookings} venues={venues} formatDate={formatDate} />
        ) : tab === "venues" ? (
          <VenuesTab
            venues={filteredVenues}
            search={venueSearch}
            onSearch={setVenueSearch}
          />
        ) : (
          <BookingsTab bookings={bookings} formatDate={formatDate} />
        )}
      </div>
    </div>
  );
}

/* ─────────────── Stat Card ─────────────── */

function StatCard({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: typeof Shield;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border-2 p-4 ${
        highlight
          ? "border-coral bg-coral/10"
          : "border-cream/10 bg-cream/5"
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${highlight ? "text-coral" : "text-cream/40"}`} />
        <span className="font-mono text-[10px] uppercase tracking-widest text-cream/50">
          {label}
        </span>
      </div>
      <p className="mt-2 font-display text-3xl font-black tracking-tight">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

/* ─────────────── Overview Tab ─────────────── */

function OverviewTab({
  bookings,
  venues,
  formatDate,
}: {
  bookings: Booking[];
  venues: Venue[];
  formatDate: (d: string | null) => string;
}) {
  const claimed = venues.filter((v) => v.claim_status === "approved").length;
  const unclaimed = venues.length - claimed;

  return (
    <div className="space-y-6">
      {/* Quick stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MiniStat label="Claimed venues" value={claimed} />
        <MiniStat label="Unclaimed venues" value={unclaimed} />
        <MiniStat label="Recent bookings" value={bookings.length} />
      </div>

      {/* Recent bookings preview */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-cream/60">
          <Clock className="h-3.5 w-3.5" /> Latest Bookings
        </h3>
        {bookings.length === 0 ? (
          <p className="rounded-xl border-2 border-cream/10 bg-cream/5 px-4 py-8 text-center font-mono text-xs text-cream/40">
            No bookings yet
          </p>
        ) : (
          <div className="space-y-2">
            {bookings.slice(0, 5).map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-xl border-2 border-cream/10 bg-cream/5 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {(b.venue as any)?.name ?? "Unknown venue"}
                  </p>
                  <p className="font-mono text-[10px] text-cream/40">
                    {formatDate(b.starts_at)} · Party of {b.party_size ?? "?"}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                    b.status === "confirmed"
                      ? "bg-green-500/20 text-green-400"
                      : b.status === "cancelled"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-cream/10 text-cream/50"
                  }`}
                >
                  {b.status ?? "pending"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border-2 border-cream/10 bg-cream/5 px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-cream/50">{label}</p>
      <p className="mt-1 font-display text-xl font-black">{value}</p>
    </div>
  );
}

/* ─────────────── Venues Tab ─────────────── */

function VenuesTab({
  venues,
  search,
  onSearch,
}: {
  venues: Venue[];
  search: string;
  onSearch: (s: string) => void;
}) {
  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search venues by name, city, or neighborhood…"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        className="w-full rounded-xl border-2 border-cream/20 bg-cream/5 px-4 py-2.5 text-sm text-cream placeholder:text-cream/30 focus:border-coral focus:outline-none"
      />
      {venues.length === 0 ? (
        <p className="py-8 text-center font-mono text-xs text-cream/40">
          {search ? "No venues match your search" : "No venues in the system"}
        </p>
      ) : (
        <div className="space-y-2">
          {venues.map((v) => (
            <div
              key={v.id}
              className="flex items-center gap-3 rounded-xl border-2 border-cream/10 bg-cream/5 px-4 py-3 transition hover:border-cream/20"
            >
              {v.hero_image_url ? (
                <img
                  src={v.hero_image_url}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-lg border border-cream/10 object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cream/10 bg-cream/10">
                  <MapPin className="h-4 w-4 text-cream/30" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{v.name}</p>
                <p className="font-mono text-[10px] text-cream/40">
                  {[v.neighborhood, v.city].filter(Boolean).join(", ") || "No location"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase ${
                    v.claim_status === "approved"
                      ? "bg-green-500/20 text-green-400"
                      : v.claim_status === "pending"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-cream/10 text-cream/40"
                  }`}
                >
                  {v.claim_status ?? "unclaimed"}
                </span>
                <ChevronRight className="h-4 w-4 text-cream/20" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────── Bookings Tab ─────────────── */

function BookingsTab({
  bookings,
  formatDate,
}: {
  bookings: Booking[];
  formatDate: (d: string | null) => string;
}) {
  return (
    <div>
      {bookings.length === 0 ? (
        <p className="py-12 text-center font-mono text-xs text-cream/40">
          No bookings yet
        </p>
      ) : (
        <div className="space-y-2">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="rounded-xl border-2 border-cream/10 bg-cream/5 px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {(b.venue as any)?.name ?? "Unknown venue"}
                  </p>
                  <p className="font-mono text-[10px] text-cream/40">
                    {(b.venue as any)?.city ?? ""}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                    b.status === "confirmed"
                      ? "bg-green-500/20 text-green-400"
                      : b.status === "cancelled"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-cream/10 text-cream/50"
                  }`}
                >
                  {b.status ?? "pending"}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-4 font-mono text-[10px] text-cream/50">
                <span>{formatDate(b.starts_at)}</span>
                <span>Party of {b.party_size ?? "?"}</span>
                {b.confirmation_code && <span>#{b.confirmation_code}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────── Main Wrapper ─────────────── */

function AdminConsole() {
  const { isAdmin, loading } = useAuth();
  const [pinOk, setPinOk] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPinOk(sessionStorage.getItem(PIN_KEY) === "1");
    }
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <RefreshCw className="h-6 w-6 animate-spin text-cream/30" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-4 text-center">
        <Shield className="mx-auto h-12 w-12 text-cream/20" />
        <h1 className="mt-4 font-display text-xl font-black text-cream">
          Access Denied
        </h1>
        <p className="mt-2 font-mono text-xs text-cream/40">
          You need admin privileges to access this page.
        </p>
      </div>
    );
  }

  if (!pinOk) {
    return <PinGate onUnlock={() => setPinOk(true)} />;
  }

  return <AdminDashboard />;
}
