import { useEffect, useMemo, useState } from "react";
import { Car, Crosshair, Loader2, Navigation, Trash2, Pencil, Check } from "lucide-react";
import { toast } from "sonner";

/**
 * "Remember where I parked" — captures the user's current geolocation,
 * persists it to localStorage, and offers one-tap walking directions back
 * to the car via Apple/Google Maps.
 */

type ParkedSpot = {
  lat: number;
  lng: number;
  accuracy?: number;
  savedAt: string;
  note?: string;
};

const STORAGE_KEY = "confetti:parked-spot:v1";

function loadSpot(): ParkedSpot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ParkedSpot;
    if (typeof parsed.lat !== "number" || typeof parsed.lng !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveSpot(spot: ParkedSpot | null) {
  if (typeof window === "undefined") return;
  if (!spot) window.localStorage.removeItem(STORAGE_KEY);
  else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(spot));
}

function isAppleDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = Date.now() - then;
  const min = Math.round(diffMs / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const d = Math.round(hr / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

export function ParkingPin() {
  const [spot, setSpot] = useState<ParkedSpot | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [draftNote, setDraftNote] = useState("");
  const [, forceTick] = useState(0);

  // Hydrate from localStorage and re-render every minute so the relative
  // "saved 3 min ago" label stays fresh.
  useEffect(() => {
    setSpot(loadSpot());
  }, []);
  useEffect(() => {
    const t = window.setInterval(() => forceTick((x) => x + 1), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const appleFirst = useMemo(() => isAppleDevice(), []);

  const appleUrl = spot ? `https://maps.apple.com/?daddr=${spot.lat},${spot.lng}&dirflg=w` : null;
  const googleUrl = spot
    ? `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}&travelmode=walking`
    : null;

  function captureLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Location isn't available on this device");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next: ParkedSpot = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          savedAt: new Date().toISOString(),
          note: spot?.note,
        };
        setSpot(next);
        saveSpot(next);
        setBusy(false);
        toast.success("Parking spot saved");
      },
      (err) => {
        setBusy(false);
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? "Allow location access to save your spot"
            : "Couldn't read your location",
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
    );
  }

  function clearSpot() {
    setSpot(null);
    saveSpot(null);
    setEditingNote(false);
    toast.success("Parking spot cleared");
  }

  function startEditNote() {
    setDraftNote(spot?.note ?? "");
    setEditingNote(true);
  }

  function saveNote() {
    if (!spot) return;
    const next = { ...spot, note: draftNote.trim() || undefined };
    setSpot(next);
    saveSpot(next);
    setEditingNote(false);
  }

  return (
    <div className="rounded-2xl border-2 border-ink bg-cream p-4 shadow-brut">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-ink bg-coral text-cream">
          <Car className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[15px] font-extrabold leading-tight text-ink">
            Find my car
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
            {spot ? `Saved ${relativeTime(spot.savedAt)}` : "Drop a pin where you parked"}
          </div>
        </div>
        {!spot ? (
          <button
            type="button"
            onClick={captureLocation}
            disabled={busy}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 border-ink bg-ink px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-cream shadow-brut transition-pop hover:-translate-y-0.5 disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Crosshair className="h-3 w-3" />
            )}
            Save spot
          </button>
        ) : (
          <button
            type="button"
            onClick={captureLocation}
            disabled={busy}
            title="Update with current location"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 border-ink bg-cream px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink transition-pop hover:bg-gold disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Crosshair className="h-3 w-3" />
            )}
            Update
          </button>
        )}
      </div>

      {spot && (
        <div className="mt-3 space-y-2">
          <div className="rounded-xl border border-ink/15 bg-cream/70 px-3 py-2 font-mono text-[11px] tabular-nums text-ink/80">
            <span className="text-ink/55">Pin · </span>
            {spot.lat.toFixed(5)}, {spot.lng.toFixed(5)}
            {typeof spot.accuracy === "number" && (
              <span className="text-ink/50"> · ±{Math.round(spot.accuracy)}m</span>
            )}
          </div>

          {editingNote ? (
            <div className="flex items-center gap-1.5">
              <input
                value={draftNote}
                onChange={(e) => setDraftNote(e.target.value)}
                placeholder="e.g. Level 3, spot B12"
                maxLength={80}
                autoFocus
                className="flex-1 rounded-xl border-2 border-ink bg-cream px-2.5 py-1.5 text-[12px] text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-coral/40"
              />
              <button
                type="button"
                onClick={saveNote}
                className="grid h-8 w-8 place-items-center rounded-full border-2 border-ink bg-coral text-cream transition-pop hover:-translate-y-0.5"
                aria-label="Save note"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={startEditNote}
              className="flex w-full items-center gap-1.5 rounded-xl border border-dashed border-ink/30 px-3 py-1.5 text-left text-[12px] text-ink/80 hover:border-ink/60 hover:bg-cream"
            >
              <Pencil className="h-3 w-3 text-ink/50" />
              <span className="truncate">{spot.note || "Add a note (level, spot, landmark…)"}</span>
            </button>
          )}

          <div className="flex flex-col gap-1.5 sm:flex-row">
            {appleFirst ? (
              <>
                <a
                  href={appleUrl ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border-2 border-ink bg-ink px-3 py-2 text-[11px] font-bold text-cream transition-pop hover:-translate-y-0.5"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  Walk back · Apple Maps
                </a>
                <a
                  href={googleUrl ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border-2 border-ink bg-cream px-3 py-2 text-[11px] font-bold text-ink transition-pop hover:bg-gold"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  Google Maps
                </a>
              </>
            ) : (
              <>
                <a
                  href={googleUrl ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border-2 border-ink bg-ink px-3 py-2 text-[11px] font-bold text-cream transition-pop hover:-translate-y-0.5"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  Walk back · Google Maps
                </a>
                <a
                  href={appleUrl ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border-2 border-ink bg-cream px-3 py-2 text-[11px] font-bold text-ink transition-pop hover:bg-gold"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  Apple Maps
                </a>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={clearSpot}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-ink/55 hover:text-coral"
          >
            <Trash2 className="h-3 w-3" />
            Clear parking pin
          </button>
        </div>
      )}
    </div>
  );
}
