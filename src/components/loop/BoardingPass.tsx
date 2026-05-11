import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { Apple, Wallet, Loader2, X, Smartphone, Navigation, Plane, Printer } from "lucide-react";
import type { ActiveLoop, LoopStop, StopKind } from "@/lib/loop-store";
import { ConfettiMap } from "@/components/maps/ConfettiMap";
import { buildDirectionsUrl, type GeocodeResult } from "@/lib/geocode";
import { trackWalletEvent } from "@/lib/wallet-analytics";

function isAndroid() {
  if (typeof navigator === "undefined") return false;
  return /android/i.test(navigator.userAgent);
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // iPad on iPadOS 13+ reports as "MacIntel" with touch — include that case.
  return /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints! > 1);
}

/**
 * Try to open a URL in a new tab. Returns true if the browser appears to have
 * accepted the navigation (popup not blocked). On iOS Safari, window.open
 * called outside a direct user gesture (e.g. after an `await`) usually returns
 * null — that's our signal to fall back to the QR modal.
 */
function tryOpenInNewTab(url: string): boolean {
  try {
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (!win || win.closed || typeof win.closed === "undefined") return false;
    return true;
  } catch {
    return false;
  }
}

// ─── Helpers to derive rich fields from ActiveLoop ─────────────────────
function stopKind(stop: LoopStop, i: number, total: number): StopKind {
  if (stop.kind) return stop.kind;
  if (i === 0) return "departure";
  if (i === total - 1) return "destination";
  return "layover";
}

function defaultEmoji(kind: StopKind) {
  return kind === "departure" ? "🥂" : kind === "destination" ? "🌟" : "⚡";
}

function vibesOf(loop: ActiveLoop): string[] {
  if (loop.vibes?.length) return loop.vibes;
  if (loop.vibe) return [`✨ ${loop.vibe}`];
  return [];
}

// ─── Tone tokens (mapped to design system, no raw colors) ──────────────
const kindStyles: Record<StopKind, { marker: string; label: string; line: string }> = {
  departure:   { marker: "bg-coral text-cream",   label: "text-coral",          line: "border-coral/40" },
  layover:     { marker: "bg-gold text-ink",      label: "text-ink/70",         line: "border-ink/30" },
  destination: { marker: "bg-ink text-cream",     label: "text-ink",            line: "border-ink/40" },
};

const tagToneClass: Record<NonNullable<LoopStop["tags"]>[number]["variant"], string> = {
  vibe: "bg-coral/10 text-coral border-coral/30",
  ev:   "bg-gold/30 text-ink border-ink/30",
  time: "bg-ink/5 text-ink border-ink/20",
};

// ──────────────────────────────────────────────────────────────────────
export function BoardingPass({ loop }: { loop: ActiveLoop }) {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [routePoints, setRoutePoints] = useState<GeocodeResult[]>([]);
  const [bookingOpen, setBookingOpen] = useState(false);

  const directionsUrl = buildDirectionsUrl(routePoints, "walking");
  const vibes = vibesOf(loop);
  const reward = loop.confettiPoints ?? 250;

  async function addToGoogleWallet() {
    setGoogleLoading(true);
    try {
      const res = await fetch("/api/public/wallet/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loopId: loop.id,
          passenger: loop.passenger,
          from: loop.from,
          to: loop.to,
          date: loop.date,
          gate: loop.gate,
          boardingTime: loop.boardingTime,
          stops: loop.stops.map((s) => ({
            id: s.id, name: s.name, type: s.type, time: s.time, area: s.area,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 503) {
        toast("Google Wallet launching soon", {
          description: "We're finalizing our Wallet issuer setup before launch.",
        });
        return;
      }
      if (!res.ok) {
        toast.error(data.error || "Could not generate Google Wallet pass");
        return;
      }
      if (isAndroid()) {
        window.open(data.saveUrl, "_blank", "noopener,noreferrer");
        trackWalletEvent("wallet_direct_open_success", { loopId: loop.id });
      } else if (isIOS()) {
        // iOS-specific: try the new-tab handoff first; only fall back to the
        // QR modal if the popup was blocked or refused.
        const opened = tryOpenInNewTab(data.saveUrl);
        if (opened) {
          trackWalletEvent("wallet_direct_open_success", { loopId: loop.id });
        } else {
          trackWalletEvent("wallet_direct_open_blocked", { loopId: loop.id });
          setQrUrl(data.saveUrl);
          trackWalletEvent("wallet_qr_modal_open", { loopId: loop.id, meta: { reason: "ios_popup_blocked" } });
        }
      } else {
        setQrUrl(data.saveUrl);
        trackWalletEvent("wallet_qr_modal_open", { loopId: loop.id, meta: { reason: "desktop" } });
      }
    } catch {
      toast.error("Network error talking to Wallet service");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="relative rounded-3xl border-2 border-ink bg-cream shadow-brut-lg overflow-hidden">
        {/* ── Header ── */}
        <div className="bg-ink px-6 py-5 text-cream">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-display text-xl font-extrabold tracking-tight flex items-center gap-1">
                <span>CONFETTI</span>
                <span className="text-coral">.</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest opacity-80">
                <span>{loop.occasionEmoji ?? "✈"}</span>
                <span className="truncate">{loop.occasion ?? "Curated Plan"}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-mono text-[9px] uppercase tracking-widest opacity-60">
                Itinerary
              </div>
              <div className="font-mono text-[11px] font-bold tracking-widest">{loop.id}</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: "Date", value: loop.date },
              { label: "Passengers", value: String(loop.groupSize) },
              { label: "Day", value: loop.day ?? "—" },
            ].map((m) => (
              <div key={m.label}>
                <div className="font-mono text-[9px] uppercase tracking-widest opacity-60">
                  {m.label}
                </div>
                <div className="font-display text-[13px] font-extrabold tracking-tight truncate">
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Route ── */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="font-mono text-[9px] uppercase tracking-widest text-ink/50">
                Departure
              </div>
              <div className="font-display text-3xl font-extrabold leading-none tracking-tight">
                {loop.from}
              </div>
              {loop.fromName && (
                <div className="mt-1 text-[11px] text-ink/60 truncate">{loop.fromName}</div>
              )}
            </div>
            <div className="flex flex-1 items-center justify-center gap-1 px-2 pb-1">
              <div className="h-px flex-1 border-t-2 border-dashed border-ink/30" />
              <Plane className="h-5 w-5 text-coral rotate-90" />
              <div className="h-px flex-1 border-t-2 border-dashed border-ink/30" />
            </div>
            <div className="text-right min-w-0">
              <div className="font-mono text-[9px] uppercase tracking-widest text-ink/50">
                Destination
              </div>
              <div className="font-display text-3xl font-extrabold leading-none tracking-tight">
                {loop.to}
              </div>
              {loop.toName && (
                <div className="mt-1 text-[11px] text-ink/60 truncate">{loop.toName}</div>
              )}
            </div>
          </div>

          {/* Gate / Boarding / Seat */}
          <div className="mt-5 grid grid-cols-3 gap-3 rounded-2xl border-2 border-ink bg-gold/30 p-3">
            <Field label="Gate" value={loop.gate} />
            <Field label="Boarding" value={loop.boardingTime} />
            <Field label="Seat" value={`${loop.groupSize}P`} />
          </div>

          {/* Vibe pills */}
          {vibes.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {vibes.map((v) => (
                <span
                  key={v}
                  className="inline-flex items-center rounded-full border border-ink/20 bg-coral/10 px-2.5 py-1 text-[11px] font-semibold text-ink"
                >
                  {v}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Tear */}
        <TearDivider />

        {/* ── Flight Plan / Stops ── */}
        <div className="px-6 py-5">
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60 mb-3">
            Flight Plan · {loop.stops.length} stops
          </div>
          <div>
            {loop.stops.map((stop, i) => {
              const kind = stopKind(stop, i, loop.stops.length);
              return (
                <div key={stop.id}>
                  <StopCard
                    stop={stop}
                    kind={kind}
                    index={i}
                    isLast={i === loop.stops.length - 1}
                  />
                  {stop.driveAfter && (
                    <DriveTimeChip
                      minutes={stop.driveAfter.minutes}
                      destination={stop.driveAfter.destination}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Map strip */}
        <div className="relative h-[160px] w-full overflow-hidden border-t-2 border-dashed border-ink/40">
          <ConfettiMap
            stops={loop.stops.map((s) => ({ id: s.id, name: s.name, area: s.area, lat: s.lat, lng: s.lng }))}
            fallbackCity={loop.stops[0]?.area || "Washington, DC"}
            height="100%"
            interactive={false}
            onPointsReady={setRoutePoints}
          />
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-cream px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink shadow-brut transition-pop hover:-translate-y-0.5"
          >
            <Navigation className="h-3 w-3" /> Get Directions
          </a>
        </div>

        {/* Tear */}
        <TearDivider />

        {/* ── Stats ── */}
        <div className="px-6 py-4 grid grid-cols-4 gap-2">
          {[
            { value: String(loop.stops.length), label: "Stops" },
            {
              value: String(new Set(loop.stops.map((s) => s.area).filter(Boolean)).size || loop.stops.length),
              label: "Hoods",
            },
            { value: loop.boardingTime, label: "Start" },
            { value: loop.stops.some((s) => s.ev) ? "⚡" : "✓", label: "EV Ready" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-ink/15 bg-card px-2 py-2 text-center"
            >
              <div className="font-display text-base font-extrabold tracking-tight">{s.value}</div>
              <div className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-ink/60">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Confetti reward ── */}
        <div className="mx-6 mb-4 flex items-center justify-between gap-3 rounded-2xl border-2 border-ink bg-coral/10 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl">🎊</span>
            <div className="min-w-0">
              <div className="font-mono text-[9px] uppercase tracking-widest text-ink/60">
                Complete this plan to earn
              </div>
              <div className="font-display text-sm font-extrabold tracking-tight truncate">
                Confetti Reward
              </div>
            </div>
          </div>
          <div className="font-display text-xl font-extrabold tracking-tight text-coral shrink-0">
            +{reward}
          </div>
        </div>

        {/* ── Book This Plan ── */}
        <div className="px-6 pb-4">
          <button
            onClick={() => setBookingOpen(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-coral px-4 py-3 text-sm font-bold text-cream shadow-brut transition-pop hover:-translate-y-0.5"
          >
            🎯 Book this plan
          </button>
        </div>

        {/* ── Barcode ── */}
        <div className="px-6 pb-5">
          <Barcode code={`${loop.id} · CONFETTI`} />
        </div>
      </div>

      {/* Wallet buttons */}
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <button
          onClick={() => toast.success("Apple Wallet pass coming soon")}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-ink px-4 py-3 text-sm font-bold text-cream shadow-brut transition-pop hover:-translate-y-0.5"
        >
          <Apple className="h-4 w-4" /> Add to Apple Wallet
        </button>
        <button
          onClick={addToGoogleWallet}
          disabled={googleLoading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-cream px-4 py-3 text-sm font-bold text-ink shadow-brut transition-pop hover:-translate-y-0.5 disabled:opacity-60"
        >
          {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
          Add to Google Wallet
        </button>
      </div>

      {qrUrl && <WalletQrModal url={qrUrl} onClose={() => setQrUrl(null)} />}
      <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} loop={loop} reward={reward} />
    </div>
  );
}

// ─── Barcode ───────────────────────────────────────────────────────────
function Barcode({ code }: { code: string }) {
  const widths = useRef(
    Array.from({ length: 56 }, (_, i) => (i % 3 === 0 ? 3 : i % 5 === 0 ? 4 : i % 2 === 0 ? 2 : 1)),
  );
  const heights = useRef(widths.current.map(() => 28 + Math.round(Math.random() * 16)));
  return (
    <div className="rounded-xl border-2 border-ink bg-cream p-3">
      <div className="flex h-12 items-end justify-center gap-[2px]">
        {widths.current.map((w, i) => (
          <span
            key={i}
            className="bg-ink"
            style={{ width: w, height: heights.current[i] }}
          />
        ))}
      </div>
      <div className="mt-2 text-center font-mono text-[10px] tracking-[0.3em] text-ink/60">
        {code}
      </div>
    </div>
  );
}

// ─── Tear divider with notches ─────────────────────────────────────────
function TearDivider() {
  return (
    <div className="relative">
      <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background border-2 border-ink" />
      <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background border-2 border-ink" />
      <div className="border-t-2 border-dashed border-ink/40 mx-6" />
    </div>
  );
}

// ─── Stop card ─────────────────────────────────────────────────────────
function StopCard({
  stop,
  kind,
  index,
  isLast,
}: {
  stop: LoopStop;
  kind: StopKind;
  index: number;
  isLast: boolean;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 120 + index * 90);
    return () => clearTimeout(t);
  }, [index]);

  const tone = kindStyles[kind];
  const typeLabel = kind === "departure" ? "Departure" : kind === "destination" ? "Destination" : "Layover";
  const emoji = stop.emoji ?? defaultEmoji(kind);
  const address = stop.address ?? stop.area ?? "";
  const appleUrl = address
    ? `https://maps.apple.com/?daddr=${encodeURIComponent(address)}&dirflg=d`
    : null;
  const googleUrl = address
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
    : null;

  const titleNode = (
    <div className="font-display text-base font-extrabold tracking-tight leading-snug">
      {stop.name}
    </div>
  );

  return (
    <div
      className={`relative flex gap-3 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      {/* Marker column */}
      <div className="relative flex flex-col items-center">
        <span
          className={`grid h-10 w-10 place-items-center rounded-full border-2 border-ink shadow-brut text-base ${tone.marker}`}
        >
          {emoji}
        </span>
        {!isLast && (
          <span className={`mt-1 flex-1 w-px border-l-2 border-dashed ${tone.line}`} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-5 min-w-0">
        <div className={`font-mono text-[10px] font-bold uppercase tracking-widest ${tone.label}`}>
          {typeLabel} — {stop.time}
        </div>
        {stop.venueId ? (
          <Link to="/venue/$id" params={{ id: stop.venueId }} className="mt-0.5 block hover:underline underline-offset-4 decoration-coral">
            {titleNode}
          </Link>
        ) : (
          <div className="mt-0.5">{titleNode}</div>
        )}
        <div className="mt-0.5 text-xs text-ink/70">
          {stop.detail ?? `${stop.type}${stop.area ? ` · ${stop.area}` : ""}`}
        </div>

        {/* EV */}
        {stop.ev && (
          <div className="mt-2 rounded-xl border border-ink/20 bg-gold/20 p-2.5">
            <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
              <span>{stop.ev.brand}</span>
              <span className="text-ink/70">{stop.ev.spec}</span>
              <span className="text-coral">{stop.ev.chargeTime}</span>
            </div>
            {stop.ev.sub && (
              <div className="mt-1 text-[10px] text-ink/60">{stop.ev.sub}</div>
            )}
          </div>
        )}

        {/* Parking */}
        {stop.parking && (
          <div className="mt-2 flex gap-2 text-[11px]">
            <span aria-hidden>🅿</span>
            <div className="min-w-0">
              <div className="font-semibold text-ink">{stop.parking.primary}</div>
              {stop.parking.secondary && (
                <div className="text-ink/60">{stop.parking.secondary}</div>
              )}
            </div>
          </div>
        )}

        {/* Sunday parking */}
        {stop.sundayParking && (
          <div className="mt-1.5 flex items-start gap-2 text-[11px]">
            <span className="rounded-md bg-ink px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-widest text-cream">
              SUN
            </span>
            <span className="text-ink/70">{stop.sundayParking}</span>
          </div>
        )}

        {/* Nav buttons */}
        {(appleUrl || googleUrl) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {appleUrl && (
              <a
                href={appleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-ink/30 bg-cream px-2.5 py-1 text-[10px] font-bold text-ink hover:bg-ink hover:text-cream transition-colors"
              >
                🍎 Apple Maps
              </a>
            )}
            {googleUrl && (
              <a
                href={googleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-ink/30 bg-cream px-2.5 py-1 text-[10px] font-bold text-ink hover:bg-ink hover:text-cream transition-colors"
              >
                📍 Google Maps
              </a>
            )}
          </div>
        )}

        {/* Tags */}
        {stop.tags && stop.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {stop.tags.map((tag, i) => (
              <span
                key={i}
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${tagToneClass[tag.variant]}`}
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Drive time chip ───────────────────────────────────────────────────
function DriveTimeChip({ minutes, destination }: { minutes: number; destination: string }) {
  return (
    <div className="ml-12 mb-3 -mt-2 inline-flex items-center gap-1.5 rounded-full border border-dashed border-ink/30 bg-cream px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/70">
      🚗 ~{minutes} min drive → {destination}
    </div>
  );
}

// ─── Field ─────────────────────────────────────────────────────────────
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink/60">
        {label}
      </div>
      <div className="mt-0.5 font-display text-base font-extrabold tracking-tight">{value}</div>
    </div>
  );
}

// ─── Booking modal ─────────────────────────────────────────────────────
function BookingModal({
  open,
  onClose,
  loop,
  reward,
}: {
  open: boolean;
  onClose: () => void;
  loop: ActiveLoop;
  reward: number;
}) {
  type Status = "idle" | "booking" | "booked";
  const [status, setStatus] = useState<Record<string, Status>>({});

  // Treat all stops as bookable; bookingType inferred from stop.bookingType or "reservation"
  const bookable = loop.stops.filter((s) => s.bookable !== false);
  const allBooked = bookable.length > 0 && bookable.every((s) => status[s.id] === "booked");

  function bookOne(id: string) {
    setStatus((p) => ({ ...p, [id]: "booking" }));
    setTimeout(() => setStatus((p) => ({ ...p, [id]: "booked" })), 1200);
  }

  function bookAll() {
    bookable.forEach((s, i) => setTimeout(() => bookOne(s.id), i * 600));
  }

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Book this plan"
      className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-ink/60 p-0 sm:p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border-2 border-ink bg-cream shadow-brut-lg animate-scale-in max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-ink px-5 py-4 text-cream rounded-t-3xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-display text-lg font-extrabold tracking-tight">
                Book this plan
              </div>
              <div className="mt-0.5 text-[11px] opacity-75">
                Reserve everything in one tap
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="grid h-8 w-8 place-items-center rounded-full border border-cream/30 hover:bg-cream/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { label: "Date", value: loop.date },
              { label: "Guests", value: String(loop.groupSize) },
              { label: "Conf.", value: loop.id },
            ].map((m) => (
              <div key={m.label}>
                <div className="font-mono text-[9px] uppercase tracking-widest opacity-60">
                  {m.label}
                </div>
                <div className="font-display text-[12px] font-extrabold truncate">{m.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stops list */}
        <div className="p-4 space-y-2">
          {bookable.map((stop, i) => {
            const kind = stopKind(stop, i, bookable.length);
            const s = status[stop.id] ?? "idle";
            const typeLabel =
              stop.bookingType === "parking"
                ? "Garage pre-pay"
                : stop.bookingType === "both"
                ? "Reservation + Parking"
                : "Table reservation";
            return (
              <div
                key={stop.id}
                className="flex items-center gap-3 rounded-2xl border-2 border-ink bg-card p-3"
              >
                <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-cream text-base shrink-0">
                  {stop.emoji ?? defaultEmoji(kind)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-sm font-extrabold tracking-tight truncate">
                    {stop.name}
                  </div>
                  <div className="text-[11px] text-ink/60 truncate">
                    {stop.time} · {typeLabel}
                  </div>
                </div>
                <button
                  onClick={() => bookOne(stop.id)}
                  disabled={s !== "idle"}
                  className={`shrink-0 rounded-lg px-3 py-1.5 font-mono text-[10px] font-bold tracking-widest transition-all ${
                    s === "booked"
                      ? "bg-ink text-cream"
                      : s === "booking"
                      ? "bg-coral/20 text-coral animate-pulse"
                      : "bg-coral text-cream hover:-translate-y-0.5"
                  }`}
                >
                  {s === "booked" ? "✓ BOOKED" : s === "booking" ? "BOOKING…" : "BOOK"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 pb-5">
          {allBooked ? (
            <div className="rounded-2xl border-2 border-ink bg-coral/10 p-4 text-center">
              <div className="text-2xl">🎊</div>
              <div className="mt-1 font-display text-base font-extrabold tracking-tight">
                Plan fully booked!
              </div>
              <div className="mt-0.5 text-[11px] text-ink/70">
                +{reward} Confetti earned on completion
              </div>
            </div>
          ) : (
            <button
              onClick={bookAll}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-coral px-4 py-3 text-sm font-bold text-cream shadow-brut transition-pop hover:-translate-y-0.5"
            >
              🎯 Book entire plan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Wallet QR modal (preserved) ───────────────────────────────────────
function WalletQrModal({ url, onClose }: { url: string; onClose: () => void }) {
  const qrWrapRef = useRef<HTMLDivElement | null>(null);

  function handlePrint() {
    const svgEl = qrWrapRef.current?.querySelector("svg");
    if (!svgEl) {
      toast.error("Could not prepare print view");
      return;
    }
    trackWalletEvent("wallet_print_qr");
    // Inline the SVG at large size for crisp scanning from across the room.
    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("width", "560");
    clone.setAttribute("height", "560");
    const svgMarkup = clone.outerHTML;

    const win = window.open("", "_blank", "noopener,noreferrer,width=720,height=900");
    if (!win) {
      toast.error("Pop-up blocked — allow pop-ups to print");
      return;
    }
    win.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Confetti — Google Wallet pass</title>
<style>
  @page { margin: 16mm; }
  html, body { margin: 0; padding: 0; background: #FFF7EC; color: #1B1B1B;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  .wrap { max-width: 640px; margin: 24px auto; padding: 24px;
    border: 3px solid #1B1B1B; border-radius: 24px; text-align: center; }
  h1 { margin: 0 0 4px; font-size: 28px; font-weight: 900; letter-spacing: -0.02em; }
  .eyebrow { font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    text-transform: uppercase; letter-spacing: 0.18em; font-size: 11px;
    font-weight: 700; color: rgba(27,27,27,0.6); }
  p { font-size: 14px; line-height: 1.45; margin: 12px 0; }
  .qr { margin: 20px auto; padding: 16px; display: inline-block;
    border: 2px solid #1B1B1B; border-radius: 16px; background: #FFF7EC; }
  .url { font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px; word-break: break-all; padding: 12px;
    border: 2px dashed #1B1B1B; border-radius: 12px; background: #fff; }
  .btn { display: inline-block; margin-top: 16px; padding: 10px 18px;
    border: 2px solid #1B1B1B; border-radius: 999px; background: #1B1B1B;
    color: #FFF7EC; font-weight: 800; font-size: 13px; cursor: pointer; }
  @media print { .btn { display: none; } .wrap { border-width: 2px; } }
</style>
</head>
<body>
  <div class="wrap">
    <div class="eyebrow">/ confetti · google wallet</div>
    <h1>Scan from another device</h1>
    <p>Open your Android phone's camera and aim at the QR code. The pass will open in Google Wallet.</p>
    <div class="qr">${svgMarkup}</div>
    <div class="url">${url.replace(/[<&>]/g, (c) => ({"<":"&lt;","&":"&amp;",">":"&gt;"}[c]!))}</div>
    <button class="btn" onclick="window.print()">Print this page</button>
  </div>
  <script>setTimeout(function(){ try { window.focus(); window.print(); } catch(e){} }, 300);</script>
</body>
</html>`);
    win.document.close();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add to Google Wallet"
      className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl border-2 border-ink bg-cream p-6 shadow-brut-lg animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border-2 border-ink bg-cream text-ink hover:bg-coral hover:text-cream"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-coral" />
          <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">
            Scan to add to Google Wallet
          </h2>
        </div>
        <p className="mt-1 text-xs text-ink/70">
          Open your Android phone's camera and point it at this QR code. The pass will open in
          Google Wallet for you to save.
        </p>
        <div ref={qrWrapRef} className="mt-4 grid place-items-center rounded-2xl border-2 border-ink bg-cream p-4">
          <QRCodeSVG value={url} size={208} bgColor="#FFF7EC" fgColor="#1B1B1B" level="M" includeMargin={false} />
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-coral px-4 py-3 text-sm font-bold text-cream shadow-brut transition-pop hover:-translate-y-0.5"
        >
          <Wallet className="h-4 w-4" /> Open save link in new tab
        </a>
        <button
          type="button"
          onClick={handlePrint}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-cream px-4 py-3 text-sm font-bold text-ink shadow-brut transition-pop hover:-translate-y-0.5 hover:bg-gold"
        >
          <Printer className="h-4 w-4" /> Print large QR
        </button>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(url);
            toast.success("Save link copied");
          }}
          className="mt-2 w-full text-center font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60 hover:text-ink"
        >
          Copy link instead
        </button>
      </div>
    </div>
  );
}
