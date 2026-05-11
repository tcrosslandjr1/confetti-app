import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Plane,
  MapPin,
  Clock,
  Users,
  Pencil,
  RotateCcw,
  Save,
  X,
  CalendarDays,
  Check,
  Wine,
  Utensils,
  Camera,
  Sparkles,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { cloneItinerary, updateItinerary, type Itinerary, type Stop } from "@/lib/itineraries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Theme = {
  key: string;
  label: string;
  bg: string; // background gradient class
  ink: string; // primary text color class
  muted: string; // muted text color class
  accent: string; // accent badge bg class
  stub: string; // tear-off stub gradient class
  icon: typeof Plane;
};

const THEMES: Record<string, Theme> = {
  nightlife: {
    key: "nightlife",
    label: "Nightlife",
    bg: "from-indigo-950 via-purple-900 to-fuchsia-900",
    ink: "text-cream",
    muted: "text-cream/70",
    accent: "bg-fuchsia-400 text-fuchsia-950",
    stub: "from-fuchsia-500 to-violet-600",
    icon: Wine,
  },
  food: {
    key: "food",
    label: "Foodie",
    bg: "from-amber-700 via-orange-600 to-red-700",
    ink: "text-cream",
    muted: "text-cream/80",
    accent: "bg-amber-200 text-amber-950",
    stub: "from-amber-400 to-orange-500",
    icon: Utensils,
  },
  outdoors: {
    key: "outdoors",
    label: "Outdoors",
    bg: "from-emerald-900 via-teal-800 to-sky-900",
    ink: "text-cream",
    muted: "text-cream/75",
    accent: "bg-emerald-300 text-emerald-950",
    stub: "from-emerald-400 to-teal-500",
    icon: Camera,
  },
  romantic: {
    key: "romantic",
    label: "Date night",
    bg: "from-rose-900 via-rose-700 to-pink-700",
    ink: "text-cream",
    muted: "text-cream/80",
    accent: "bg-rose-200 text-rose-950",
    stub: "from-rose-400 to-pink-500",
    icon: Sparkles,
  },
  active: {
    key: "active",
    label: "Active",
    bg: "from-sky-900 via-blue-800 to-indigo-900",
    ink: "text-cream",
    muted: "text-cream/80",
    accent: "bg-sky-200 text-sky-950",
    stub: "from-sky-400 to-blue-500",
    icon: Activity,
  },
  classic: {
    key: "classic",
    label: "Classic",
    bg: "from-stone-900 via-stone-800 to-zinc-900",
    ink: "text-cream",
    muted: "text-cream/75",
    accent: "bg-amber-300 text-stone-950",
    stub: "from-amber-400 to-yellow-500",
    icon: Plane,
  },
};

function pickTheme(it: Itinerary, stops: Stop[]): Theme {
  const haystack = [it.occasion_slug, it.vibe, it.title, it.summary]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (/(night|club|bar|cocktail|dance|drink)/.test(haystack)) return THEMES.nightlife;
  if (/(date|romantic|anniversary|valentine)/.test(haystack)) return THEMES.romantic;
  if (/(hike|outdoor|park|scenic|nature|trail|garden)/.test(haystack)) return THEMES.outdoors;
  if (/(workout|run|sport|gym|active|cycle|bike)/.test(haystack)) return THEMES.active;
  if (/(food|brunch|dinner|lunch|tasting|chef|restaurant|foodie)/.test(haystack))
    return THEMES.food;

  // Fall back to dominant stop category.
  const cats = stops.map((s) => s.category?.toLowerCase());
  if (cats.filter((c) => c === "drinks").length >= 2) return THEMES.nightlife;
  if (cats.filter((c) => c === "scenic").length >= 2) return THEMES.outdoors;
  if (cats.filter((c) => c === "meal").length >= 2) return THEMES.food;
  return THEMES.classic;
}

function flightCode(it: Itinerary) {
  const seed = `${it.id}${it.title}`;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return `CF${(h % 9000) + 1000}`;
}

function gateCode(it: Itinerary, stops: Stop[]) {
  const letter = String.fromCharCode(65 + (it.id.charCodeAt(0) % 6));
  return `${letter}${(stops.length || 1).toString().padStart(2, "0")}`;
}

function shortCity(s?: string | null) {
  if (!s) return "TBD";
  return (
    s
      .replace(/[^A-Za-z]/g, "")
      .slice(0, 3)
      .toUpperCase() || "TBD"
  );
}

function fmtDate(d?: string | null) {
  if (!d) return "TBD";
  try {
    return new Date(d).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return d;
  }
}

function fmtTime(t?: string | null) {
  if (!t) return "—";
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return t;
  let h = parseInt(m[1], 10);
  const mer = h >= 12 ? "PM" : "AM";
  h = ((h + 11) % 12) + 1;
  return `${h}:${m[2]} ${mer}`;
}

export function BoardingPass({
  itinerary,
  stops,
  onChange,
}: {
  itinerary: Itinerary;
  stops: Stop[];
  onChange: (patch: Partial<Itinerary>) => void;
}) {
  const nav = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rebooking, setRebooking] = useState(false);
  const [rebookOpen, setRebookOpen] = useState(false);
  const [rebookDate, setRebookDate] = useState("");
  const [rebookTime, setRebookTime] = useState(itinerary.start_time?.slice(0, 5) ?? "");

  const [draft, setDraft] = useState({
    title: itinerary.title,
    city: itinerary.city ?? "",
    date: itinerary.date ?? "",
    start_time: itinerary.start_time?.slice(0, 5) ?? "",
  });

  const theme = pickTheme(itinerary, stops);
  const ThemeIcon = theme.icon;
  const code = flightCode(itinerary);
  const gate = gateCode(itinerary, stops);
  const fromCode = "YOU";
  const toCode = shortCity(itinerary.city);
  const confirmed = stops.filter((s) => s.booking_status === "confirmed").length;

  const save = async () => {
    setSaving(true);
    try {
      const patch: Partial<Itinerary> = {
        title: draft.title.trim() || itinerary.title,
        city: draft.city || null,
        date: draft.date || null,
        start_time: draft.start_time ? `${draft.start_time}:00` : null,
      };
      await updateItinerary(itinerary.id, patch);
      onChange(patch);
      setEditing(false);
      toast.success("Itinerary updated");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const rebook = async () => {
    if (!rebookDate) {
      toast.error("Pick a date to rebook on");
      return;
    }
    setRebooking(true);
    try {
      const { id } = await cloneItinerary(itinerary.id, {
        date: rebookDate,
        start_time: rebookTime ? `${rebookTime}:00` : null,
        title: itinerary.title,
      });
      toast.success("Rebooked! Opening your new copy…");
      setRebookOpen(false);
      nav({ to: "/trips/$id", params: { id } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRebooking(false);
    }
  };

  return (
    <article
      className={`relative overflow-hidden rounded-3xl border-2 border-ink/20 bg-gradient-to-br ${theme.bg} ${theme.ink} shadow-pop`}
      aria-label="Itinerary boarding pass"
    >
      {/* perforated edge */}
      <div className="pointer-events-none absolute left-0 right-0 top-1/2 hidden h-px -translate-y-1/2 border-t-2 border-dashed border-cream/30 sm:block" />
      <div className="pointer-events-none absolute -left-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 rounded-full bg-background sm:block" />
      <div className="pointer-events-none absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 rounded-full bg-background sm:block" />

      <div className="grid gap-0 sm:grid-cols-[minmax(0,1fr)_220px]">
        {/* Main panel */}
        <div className="min-w-0 p-5 sm:p-8">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-widest ${theme.accent}`}
              >
                <ThemeIcon className="h-3 w-3" /> {theme.label}
              </span>
              <span className={`font-mono text-[10px] uppercase tracking-widest ${theme.muted}`}>
                Boarding pass · {code}
              </span>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1">
              {!editing ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1 border-cream/40 bg-transparent text-cream hover:bg-cream/10 hover:text-cream"
                    onClick={() => setEditing(true)}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1 border-cream/40 bg-transparent text-cream hover:bg-cream/10 hover:text-cream"
                    onClick={() => {
                      setRebookDate("");
                      setRebookOpen((o) => !o);
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Rebook
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    className="h-8 gap-1 bg-cream text-ink hover:bg-cream/90"
                    onClick={save}
                    disabled={saving}
                  >
                    <Save className="h-3.5 w-3.5" /> Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1 border-cream/40 bg-transparent text-cream hover:bg-cream/10 hover:text-cream"
                    onClick={() => setEditing(false)}
                  >
                    <X className="h-3.5 w-3.5" /> Cancel
                  </Button>
                </>
              )}
            </div>
          </header>

          {!editing ? (
            <h2 className="mt-4 break-words font-display text-2xl font-extrabold leading-tight sm:text-4xl">
              {itinerary.title}
            </h2>
          ) : (
            <Input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              className="mt-4 border-cream/30 bg-cream/10 text-2xl font-display font-bold text-cream placeholder:text-cream/50"
            />
          )}

          {/* Route */}
          <div className="mt-6 flex items-end gap-3">
            <div className="min-w-0">
              <div className={`font-mono text-[10px] uppercase tracking-widest ${theme.muted}`}>
                From
              </div>
              <div className="truncate font-display text-2xl font-black leading-none sm:text-3xl">{fromCode}</div>
              <div className={`mt-1 text-xs ${theme.muted}`}>Right now</div>
            </div>
            <div className="flex-1 px-2">
              <div className="relative h-px bg-cream/40">
                <Plane
                  className={`absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 ${theme.ink}`}
                />
              </div>
            </div>
            <div className="min-w-0 text-right">
              <div className={`font-mono text-[10px] uppercase tracking-widest ${theme.muted}`}>
                To
              </div>
              <div className="truncate font-display text-2xl font-black leading-none sm:text-3xl">{toCode}</div>
              <div className={`mt-1 truncate text-xs ${theme.muted}`}>{itinerary.city ?? "TBD"}</div>
            </div>
          </div>

          {/* Detail grid */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Detail label="Date" icon={CalendarDays} muted={theme.muted}>
              {!editing ? (
                fmtDate(itinerary.date)
              ) : (
                <input
                  type="date"
                  value={draft.date}
                  onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
                  className="w-full rounded border border-cream/30 bg-cream/10 px-1 py-0.5 text-sm text-cream"
                />
              )}
            </Detail>
            <Detail label="Boarding" icon={Clock} muted={theme.muted}>
              {!editing ? (
                fmtTime(itinerary.start_time)
              ) : (
                <input
                  type="time"
                  value={draft.start_time}
                  onChange={(e) => setDraft((d) => ({ ...d, start_time: e.target.value }))}
                  className="w-full rounded border border-cream/30 bg-cream/10 px-1 py-0.5 text-sm text-cream"
                />
              )}
            </Detail>
            <Detail label="City" icon={MapPin} muted={theme.muted}>
              {!editing ? (
                (itinerary.city ?? "—")
              ) : (
                <input
                  value={draft.city}
                  onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
                  className="w-full rounded border border-cream/30 bg-cream/10 px-1 py-0.5 text-sm text-cream"
                />
              )}
            </Detail>
            <Detail label="Stops" icon={Users} muted={theme.muted}>
              {stops.length}
            </Detail>
          </div>

          {/* Confirmed + cost row */}
          <div
            className={`mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs ${theme.muted}`}
          >
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" /> {confirmed}/{stops.length} confirmed
            </span>
            {itinerary.est_total_cost && <span>💵 {itinerary.est_total_cost}</span>}
          </div>

          {rebookOpen && !editing && (
            <div className="mt-5 rounded-2xl border border-cream/30 bg-cream/10 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <RotateCcw className="h-4 w-4" /> Rebook this day
              </div>
              <p className={`mt-1 text-xs ${theme.muted}`}>
                Clones every stop into a new itinerary so you can run it back on a fresh date.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <div>
                  <Label className="text-[10px] font-mono uppercase tracking-widest text-cream/80">
                    New date
                  </Label>
                  <input
                    type="date"
                    value={rebookDate}
                    onChange={(e) => setRebookDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                    className="mt-1 w-full rounded-md border border-cream/30 bg-cream/10 px-2 py-1.5 text-sm text-cream"
                  />
                </div>
                <div>
                  <Label className="text-[10px] font-mono uppercase tracking-widest text-cream/80">
                    Start time
                  </Label>
                  <input
                    type="time"
                    value={rebookTime}
                    onChange={(e) => setRebookTime(e.target.value)}
                    className="mt-1 w-full rounded-md border border-cream/30 bg-cream/10 px-2 py-1.5 text-sm text-cream"
                  />
                </div>
                <Button
                  onClick={rebook}
                  disabled={rebooking}
                  className="h-10 bg-cream text-ink hover:bg-cream/90"
                >
                  {rebooking ? "Cloning…" : "Rebook"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Tear-off stub */}
        <div
          className={`relative flex flex-col justify-between border-t-2 border-dashed border-cream/30 bg-gradient-to-br ${theme.stub} p-6 text-ink sm:border-l-2 sm:border-t-0`}
        >
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest opacity-80">Gate</div>
            <div className="font-display text-5xl font-black leading-none">{gate}</div>
          </div>
          <div className="mt-6">
            <div className="font-mono text-[10px] uppercase tracking-widest opacity-80">Flight</div>
            <div className="font-display text-2xl font-black">{code}</div>
          </div>
          <div className="mt-6">
            <div className="font-mono text-[10px] uppercase tracking-widest opacity-80">Seat</div>
            <div className="font-display text-2xl font-black">{stops.length || 1}A</div>
          </div>

          {/* faux barcode */}
          <div className="mt-6 flex h-10 items-end gap-[2px]" aria-hidden>
            {Array.from({ length: 32 }).map((_, i) => (
              <span
                key={i}
                className="block w-[3px] bg-ink/80"
                style={{ height: `${30 + ((i * 53) % 70)}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function Detail({
  label,
  icon: Icon,
  muted,
  children,
}: {
  label: string;
  icon: typeof Plane;
  muted: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        className={`flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest ${muted}`}
      >
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="mt-1 font-display text-base font-bold">{children}</div>
    </div>
  );
}
