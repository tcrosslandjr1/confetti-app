import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUpRight, Check, ChevronDown, Clock, DollarSign, Globe, Heart, Loader2, MapPin, Phone, RefreshCw, Save, Sparkles, Star, Utensils, X } from "lucide-react";
import { useWizard } from "./wizard-context";
import { useConfettiBurst } from "@/components/ConfettiBurst";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

type FavRow = { venue_name: string; vibe: string | null; tone: string | null; address: string | null; neighborhood: string | null };

type Vibe = { k: string; label: string; emoji: string; tone: string };
type Crew = { k: string; label: string; sub: string };
type When = { k: string; label: string };
type Budget = { k: string; label: string; sub: string };
type MustHave = { k: string; label: string };

const VIBES: Vibe[] = [
  { k: "rooftop",   label: "Rooftop Chill",   emoji: "🌇", tone: "bg-coral" },
  { k: "dance",     label: "Dance Floor",     emoji: "💃", tone: "bg-purple" },
  { k: "speakeasy", label: "Speakeasy",       emoji: "🥃", tone: "bg-gold" },
  { k: "live",      label: "Live Music",      emoji: "🎷", tone: "bg-pink-300" },
  { k: "bougie",    label: "Bougie Dinner",   emoji: "🥂", tone: "bg-emerald-400" },
  { k: "dive",      label: "Dive Bar",        emoji: "🍻", tone: "bg-amber-300" },
  { k: "late",      label: "Late Night Eats", emoji: "🍜", tone: "bg-sky-300" },
];

const CREW: Crew[] = [
  { k: "solo",  label: "Just me",          sub: "1" },
  { k: "date",  label: "Date night",       sub: "2" },
  { k: "small", label: "Small group",      sub: "3–5" },
  { k: "squad", label: "Squad",            sub: "6+" },
];

const WHEN: When[] = [
  { k: "tonight",  label: "Tonight" },
  { k: "weekend",  label: "This weekend" },
  { k: "pick",     label: "Pick a date" },
];

const BUDGETS: Budget[] = [
  { k: "$",    label: "$",    sub: "cheap eats" },
  { k: "$$",   label: "$$",   sub: "comfortable" },
  { k: "$$$",  label: "$$$",  sub: "treat yourself" },
  { k: "$$$$", label: "$$$$", sub: "no ceiling" },
];

const MUSTS: MustHave[] = [
  { k: "live",    label: "Live music" },
  { k: "outdoor", label: "Outdoor seating" },
  { k: "late",    label: "Late-night" },
  { k: "kids",    label: "Kid-friendly" },
  { k: "walk",    label: "Walkable" },
  { k: "ig",      label: "Instagram-worthy" },
];

const LOADING_LINES = [
  "Scanning the city…",
  "Filtering out boring spots…",
  "Cross-checking reservations…",
  "Curating your night…",
  "Plating it up…",
];

type Stop = { time: string; venue: string; vibe: string; tone: string; walk?: string; address?: string; neighborhood?: string };

const SAMPLE_STOPS: Stop[][] = [
  [
    { time: "7:00 PM", venue: "Lila's Patio",      vibe: "Small plates",     tone: "bg-coral",       walk: "12 min walk", address: "418 W 14th St",     neighborhood: "Meatpacking" },
    { time: "8:30 PM", venue: "Mason St. Records", vibe: "Vinyl + nat wine", tone: "bg-purple",      walk: "6 min walk",  address: "210 Mason St",      neighborhood: "Lower East Side" },
    { time: "10:15 PM",venue: "Aera Rooftop",      vibe: "Nightcap views",   tone: "bg-gold",                              address: "77 Pearl St, 22F",  neighborhood: "Financial District" },
  ],
  [
    { time: "6:30 PM", venue: "Kettle & Char",     vibe: "Bougie dinner",    tone: "bg-emerald-400", walk: "8 min walk",  address: "55 Hudson St",      neighborhood: "Tribeca" },
    { time: "8:45 PM", venue: "The Velvet Door",   vibe: "Speakeasy",        tone: "bg-gold",        walk: "4 min walk",  address: "12 Crosby St",      neighborhood: "SoHo" },
    { time: "10:30 PM",venue: "Saturn Lounge",     vibe: "Late dance",       tone: "bg-purple",                            address: "388 Bowery",        neighborhood: "NoHo" },
  ],
  [
    { time: "8:00 PM", venue: "Marigold Pizza",    vibe: "Slice + spritz",   tone: "bg-coral",       walk: "5 min walk",  address: "94 Orchard St",     neighborhood: "Lower East Side" },
    { time: "9:30 PM", venue: "Loose Leaf Live",   vibe: "Live jazz trio",   tone: "bg-pink-300",    walk: "7 min walk",  address: "311 Bleecker St",   neighborhood: "West Village" },
    { time: "11:15 PM",venue: "Mama's Noodle Bar", vibe: "Late night eats",  tone: "bg-amber-300",                         address: "27 St Marks Pl",    neighborhood: "East Village" },
  ],
];

// Deterministic mock detail generator — keeps results stable per venue name.
function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
const KNOWN_FOR = [
  "tasting menu", "natural wine list", "house cocktails", "wood-fired pies",
  "raw bar", "live jazz nights", "rooftop sunsets", "vinyl listening room",
  "small plates", "late-night ramen", "espresso martinis", "garden patio",
];
const REVIEWS = [
  "“Hands down our new go-to. Vibe is unreal.”",
  "“The bartender remembered our drink from last time.”",
  "“Came for one round, stayed three hours.”",
  "“Worth the wait. Bring a date.”",
  "“Loud, packed, exactly what we wanted.”",
  "“Tucked away — felt like a secret.”",
];
function getDetails(venue: string, vibe: string) {
  const h = hashStr(venue);
  const rating = (4.2 + ((h % 8) / 10)).toFixed(1); // 4.2 - 4.9
  const reviewCount = 180 + (h % 1820);
  const priceLevel = (h % 4) + 1; // 1..4
  const knownFor = KNOWN_FOR[h % KNOWN_FOR.length];
  const review = REVIEWS[(h >> 3) % REVIEWS.length];
  const phone = `(${200 + (h % 700)}) ${100 + ((h >> 4) % 900)}-${1000 + ((h >> 8) % 9000)}`;
  const hours = `Open until ${10 + (h % 3)}:${["00", "30"][h % 2]} PM`;
  const blurbs = [
    `${venue} pulls a regular crowd for its ${knownFor}. Cozy without trying, the kind of place you end up texting friends about.`,
    `Locals swear by ${venue} for its ${knownFor} and unhurried pace — built for the kind of night that bleeds into the next.`,
    `${venue} nails the ${vibe.toLowerCase()} brief. Tight menu, sharp drinks, and lighting that makes everyone look good.`,
  ];
  // Dietary + allergen flags — deterministic per venue
  const ALL_DIETARY = ["Gluten-free menu", "Vegan options", "Vegetarian", "Pescatarian", "Dairy-free", "Nut-free kitchen"] as const;
  const ALL_ALLERGENS = ["peanuts", "tree nuts", "shellfish", "dairy", "eggs", "soy", "sesame", "wheat/gluten"] as const;
  const dietary = ALL_DIETARY.filter((_, i) => ((h >> (i + 1)) & 1) === 1);
  // Always surface the big three so guests can plan
  if (!dietary.includes("Gluten-free menu")) dietary.push("Gluten-free menu");
  if (!dietary.includes("Vegan options")) dietary.push("Vegan options");
  if (!dietary.includes("Vegetarian")) dietary.push("Vegetarian");
  if (!dietary.includes("Pescatarian")) dietary.push("Pescatarian");
  const glutenFree = dietary.includes("Gluten-free menu");
  const vegan = dietary.includes("Vegan options");
  const vegetarian = dietary.includes("Vegetarian");
  const pescatarian = dietary.includes("Pescatarian");
  // Allergens the kitchen can accommodate (request ahead)
  const allergens = ALL_ALLERGENS.filter((_, i) => ((h >> (i + 2)) & 1) === 1).slice(0, 4);
  return {
    rating,
    reviewCount,
    priceLevel,
    knownFor,
    review,
    phone,
    hours,
    blurb: blurbs[h % blurbs.length],
    dietary,
    glutenFree,
    vegan,
    vegetarian,
    pescatarian,
    allergens,
  };
}

export function BuildMyNightWizard() {
  const { open, preset, closeWizard } = useWizard();
  const [step, setStep] = useState(0); // 0..4 questions, 5 loading, 6 result
  const [vibe, setVibe] = useState<string[]>([]);
  const [crew, setCrew] = useState<string | null>(null);
  const [when, setWhen] = useState<string | null>(null);
  const [pickedDate, setPickedDate] = useState<string>("");
  const [budget, setBudget] = useState<string | null>(null);
  const [musts, setMusts] = useState<string[]>([]);
  const [loadingIdx, setLoadingIdx] = useState(0);
  const [variant, setVariant] = useState(0);
  const [openStop, setOpenStop] = useState<number | null>(0);
  const [sortBy, setSortBy] = useState<"order" | "rating" | "price" | "distance" | "availability">("order");
  type PlaceInfo = { rating?: number; userRatingCount?: number; priceLevel?: number; openNow?: boolean; businessStatus?: string; found: boolean };
  const [placesData, setPlacesData] = useState<Record<string, PlaceInfo>>({});
  const [placesLoading, setPlacesLoading] = useState(false);
  const [favorites, setFavorites] = useState<Record<string, FavRow>>({});
  const [showFavorites, setShowFavorites] = useState(false);
  const { user } = useAuth();
  const { burst, layer } = useConfettiBurst();

  const fallbackTones = ["bg-coral", "bg-purple", "bg-gold", "bg-emerald-400", "bg-pink-300", "bg-amber-300"];
  const presetStops = useMemo(
    () => preset?.stops.map((s, i) => ({
      time: s.time,
      venue: s.venue,
      vibe: s.vibe ?? "Curated pick",
      tone: s.tone ?? fallbackTones[i % fallbackTones.length],
      walk: s.walk,
      address: s.address,
      neighborhood: s.neighborhood,
    })),
    [preset]
  );
  const stops = presetStops ?? SAMPLE_STOPS[variant % SAMPLE_STOPS.length];
  const sortedStops = useMemo(() => {
    const parseWalk = (w?: string) => {
      const m = w?.match(/(\d+)/); return m ? parseInt(m[1], 10) : Number.POSITIVE_INFINITY;
    };
    const parseTime = (t: string) => {
      const m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!m) return Number.POSITIVE_INFINITY;
      let h = parseInt(m[1], 10) % 12; if (/PM/i.test(m[3])) h += 12;
      return h * 60 + parseInt(m[2], 10);
    };
    // Prefer live Google Places data when loaded; fall back to deterministic mock.
    const ratingOf = (venue: string, vibe: string) => {
      const live = placesData[venue]?.rating;
      return typeof live === "number" ? live : parseFloat(getDetails(venue, vibe).rating);
    };
    const priceOf = (venue: string, vibe: string) => {
      const live = placesData[venue]?.priceLevel;
      return typeof live === "number" ? live : getDetails(venue, vibe).priceLevel;
    };
    // Availability: open venues first, then by start time. Closed/unknown sort last.
    const availabilityScore = (venue: string, time: string) => {
      const info = placesData[venue];
      const baseTime = parseTime(time);
      if (info?.businessStatus && info.businessStatus !== "OPERATIONAL") return 1e9;
      if (info?.openNow === true) return baseTime;
      if (info?.openNow === false) return 1e8 + baseTime;
      return baseTime; // unknown — use start time
    };
    const arr = stops.map((s, i) => ({ s, i }));
    if (sortBy === "rating") {
      arr.sort((a, b) => ratingOf(b.s.venue, b.s.vibe) - ratingOf(a.s.venue, a.s.vibe));
    } else if (sortBy === "price") {
      arr.sort((a, b) => priceOf(a.s.venue, a.s.vibe) - priceOf(b.s.venue, b.s.vibe));
    } else if (sortBy === "distance") {
      arr.sort((a, b) => parseWalk(a.s.walk) - parseWalk(b.s.walk));
    } else if (sortBy === "availability") {
      arr.sort((a, b) => availabilityScore(a.s.venue, a.s.time) - availabilityScore(b.s.venue, b.s.time));
    }
    return arr;
  }, [stops, sortBy, placesData]);
  const totalSteps = 5;

  // If preset supplied, jump straight to result and seed vibe multi-select
  useEffect(() => {
    if (open && preset) {
      setVibe(preset.vibeKeys ?? []);
      setStep(6);
    }
  }, [open, preset]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Reset on close
  useEffect(() => {
    if (open) return;
    const t = setTimeout(() => {
      setStep(0); setVibe([]); setCrew(null); setWhen(null); setPickedDate("");
      setBudget(null); setMusts([]); setLoadingIdx(0); setVariant(0);
    }, 220);
    return () => clearTimeout(t);
  }, [open]);

  // Loading text rotation
  useEffect(() => {
    if (step !== 5) return;
    setLoadingIdx(0);
    const interval = setInterval(() => setLoadingIdx((i) => i + 1), 700);
    const done = setTimeout(() => setStep(6), 3600);
    return () => { clearInterval(interval); clearTimeout(done); };
  }, [step]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") closeWizard(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeWizard]);

  // Load favorites when wizard opens (or user changes)
  useEffect(() => {
    if (!open || !user) { setFavorites({}); return; }
    let cancelled = false;
    supabase
      .from("favorite_stops")
      .select("venue_name,vibe,tone,address,neighborhood")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        const map: Record<string, FavRow> = {};
        (data ?? []).forEach((r) => { map[r.venue_name] = r as FavRow; });
        setFavorites(map);
      });
    return () => { cancelled = true; };
  }, [open, user]);

  const toggleFavorite = useCallback(async (s: Stop) => {
    if (!user) {
      toast.error("Sign in to save favorites");
      return;
    }
    const key = s.venue;
    const isFav = !!favorites[key];
    // Optimistic update
    setFavorites((prev) => {
      const next = { ...prev };
      if (isFav) delete next[key];
      else next[key] = { venue_name: s.venue, vibe: s.vibe ?? null, tone: s.tone ?? null, address: s.address ?? null, neighborhood: s.neighborhood ?? null };
      return next;
    });
    if (isFav) {
      const { error } = await supabase.from("favorite_stops").delete().eq("user_id", user.id).eq("venue_name", key);
      if (error) { toast.error("Couldn't remove favorite"); }
      else toast.success(`Removed ${s.venue}`);
    } else {
      const { error } = await supabase.from("favorite_stops").insert({
        user_id: user.id,
        venue_name: s.venue,
        vibe: s.vibe ?? null,
        tone: s.tone ?? null,
        address: s.address ?? null,
        neighborhood: s.neighborhood ?? null,
      });
      if (error && !error.message.includes("duplicate")) { toast.error("Couldn't save favorite"); }
      else toast.success(`Saved ${s.venue} ★`);
    }
  }, [user, favorites]);

  if (!open) return null;

  const canAdvance =
    (step === 0 && vibe.length > 0) ||
    (step === 1 && !!crew) ||
    (step === 2 && !!when && (when !== "pick" || !!pickedDate)) ||
    (step === 3 && !!budget) ||
    (step === 4); // musts optional

  function next() { setStep((s) => Math.min(s + 1, 5)); }
  function back() { setStep((s) => Math.max(s - 1, 0)); }
  function toggleMust(k: string) {
    setMusts((m) => m.includes(k) ? m.filter((x) => x !== k) : [...m, k]);
  }
  function build(e: React.MouseEvent) {
    burst(e.clientX, e.clientY);
    next();
  }
  function regenerate(e: React.MouseEvent) {
    burst(e.clientX, e.clientY);
    setVariant((v) => v + 1);
    setStep(5);
  }
  function savePlan(e: React.MouseEvent) {
    burst(e.clientX, e.clientY);
    toast.success("Plan saved", { description: "Find it under My trips." });
    setTimeout(closeWizard, 350);
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-3 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/70 backdrop-blur-md"
        style={{ animation: "reveal-up 0.25s ease-out forwards" }}
        onClick={closeWizard}
        aria-hidden
      />
      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Build my night"
        className="relative w-full max-w-3xl overflow-hidden rounded-3xl border-2 border-ink bg-cream text-ink shadow-brut-lg"
        style={{ animation: "reveal-scale 0.35s cubic-bezier(0.22,1,0.36,1) forwards" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-ink bg-cream/80 px-5 py-3 backdrop-blur">
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5 text-coral" />
            {step <= 4 ? `Step ${step + 1} / ${totalSteps}` : step === 5 ? "Building your night" : "Your night, ready"}
          </div>
          <button
            onClick={closeWizard}
            className="grid h-9 w-9 place-items-center rounded-full border-2 border-ink bg-cream transition-pop hover:-translate-y-0.5 hover:bg-coral hover:text-cream"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress bar */}
        {step <= 4 && (
          <div className="h-1.5 w-full bg-ink/10">
            <div
              className="h-full bg-gradient-to-r from-coral via-gold to-purple transition-[width] duration-500 ease-out"
              style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            />
          </div>
        )}

        {/* Body */}
        <div className="max-h-[72vh] overflow-y-auto px-5 py-7 sm:px-8 sm:py-9">
          {step === 0 && (
            <StepShell title="What's the vibe?" sub="Pick the energy. We'll do the rest.">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {VIBES.map((v) => {
                  const active = vibe.includes(v.k);
                  return (
                    <button
                      key={v.k}
                      onClick={() => setVibe((prev) => prev.includes(v.k) ? prev.filter((x) => x !== v.k) : [...prev, v.k])}
                      className={`group relative overflow-hidden rounded-2xl border-2 border-ink p-4 text-left shadow-brut transition-pop ${v.tone} ${active ? "-translate-x-1 -translate-y-1 shadow-brut-lg ring-4 ring-ink/15" : "hover:-translate-x-0.5 hover:-translate-y-0.5"}`}
                    >
                      <div className="text-3xl">{v.emoji}</div>
                      <div className="mt-2 font-display text-lg font-extrabold leading-tight">{v.label}</div>
                      {active && (
                        <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-cream">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </StepShell>
          )}

          {step === 1 && (
            <StepShell title="Who's coming?" sub="Group size shapes the spots.">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {CREW.map((c) => {
                  const active = crew === c.k;
                  return (
                    <button
                      key={c.k}
                      onClick={() => setCrew(c.k)}
                      className={`rounded-2xl border-2 border-ink bg-cream p-5 text-left shadow-brut transition-pop hover:-translate-y-0.5 ${active ? "-translate-y-1 bg-gold shadow-brut-lg" : ""}`}
                    >
                      <div className="font-display text-3xl font-extrabold">{c.sub}</div>
                      <div className="mt-1 font-mono text-[11px] uppercase tracking-widest">{c.label}</div>
                    </button>
                  );
                })}
              </div>
            </StepShell>
          )}

          {step === 2 && (
            <StepShell title="When?" sub="We'll lock the schedule around it.">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {WHEN.map((w) => {
                  const active = when === w.k;
                  return (
                    <button
                      key={w.k}
                      onClick={() => setWhen(w.k)}
                      className={`rounded-2xl border-2 border-ink bg-cream p-5 text-left shadow-brut transition-pop hover:-translate-y-0.5 ${active ? "-translate-y-1 bg-coral text-cream shadow-brut-lg" : ""}`}
                    >
                      <div className="font-display text-2xl font-extrabold">{w.label}</div>
                    </button>
                  );
                })}
              </div>
              {when === "pick" && (
                <div className="mt-5">
                  <label className="mb-2 block font-mono text-[11px] font-bold uppercase tracking-widest">Pick a date</label>
                  <input
                    type="date"
                    value={pickedDate}
                    onChange={(e) => setPickedDate(e.target.value)}
                    className="w-full rounded-xl border-2 border-ink bg-cream px-4 py-3 font-display text-lg font-bold shadow-brut outline-none focus:-translate-y-0.5 focus:shadow-brut-lg"
                  />
                </div>
              )}
            </StepShell>
          )}

          {step === 3 && (
            <StepShell title="Budget?" sub="No judgement either way.">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {BUDGETS.map((b) => {
                  const active = budget === b.k;
                  return (
                    <button
                      key={b.k}
                      onClick={() => setBudget(b.k)}
                      className={`rounded-2xl border-2 border-ink bg-cream p-5 text-center shadow-brut transition-pop hover:-translate-y-0.5 ${active ? "-translate-y-1 bg-purple text-cream shadow-brut-lg" : ""}`}
                    >
                      <div className="font-display text-3xl font-extrabold">{b.label}</div>
                      <div className="mt-1 font-mono text-[10px] uppercase tracking-widest opacity-80">{b.sub}</div>
                    </button>
                  );
                })}
              </div>
            </StepShell>
          )}

          {step === 4 && (
            <StepShell title="Must-haves?" sub="Tap any that matter. Skip if you're easy.">
              <div className="flex flex-wrap gap-2">
                {MUSTS.map((m) => {
                  const active = musts.includes(m.k);
                  return (
                    <button
                      key={m.k}
                      onClick={() => toggleMust(m.k)}
                      className={`rounded-full border-2 border-ink px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest shadow-brut transition-pop hover:-translate-y-0.5 ${active ? "-translate-y-0.5 bg-ink text-cream shadow-brut-lg" : "bg-cream"}`}
                    >
                      {active && <Check className="-mt-0.5 mr-1 inline h-3.5 w-3.5" />}
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </StepShell>
          )}

          {step === 5 && (
            <div className="flex min-h-[260px] flex-col items-center justify-center gap-5 py-8">
              <Loader2 className="h-12 w-12 animate-spin text-coral" />
              <div key={loadingIdx} className="font-display text-2xl font-extrabold" style={{ animation: "reveal-up 0.4s ease-out forwards" }}>
                {LOADING_LINES[Math.min(loadingIdx, LOADING_LINES.length - 1)]}
              </div>
              <div className="flex gap-1.5">
                {LOADING_LINES.map((_, i) => (
                  <span key={i} className={`h-1.5 w-6 rounded-full ${i <= loadingIdx ? "bg-ink" : "bg-ink/20"}`} />
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div>
              <h2 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">
                {preset ? preset.title : "Your night's "}
                {!preset && <span className="font-serif italic font-normal text-coral">locked in.</span>}
              </h2>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-ink/60">
                {preset
                  ? [preset.vibeLabel, preset.crewLabel, preset.budgetLabel].filter(Boolean).join(" · ") || "Curated pick · ready to roll"
                  : `${vibe.map((k) => VIBES.find((v) => v.k === k)?.label).filter(Boolean).join(" + ")} · ${CREW.find((c) => c.k === crew)?.label} · ${budget}`}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink/60">Sort by</span>
                {([
                  { k: "order", label: "Night order" },
                  { k: "rating", label: "★ Highest rated" },
                  { k: "distance", label: "📍 Closest" },
                  { k: "availability", label: "⏱ Earliest" },
                ] as const).map((opt) => {
                  const active = sortBy === opt.k;
                  return (
                    <button
                      key={opt.k}
                      type="button"
                      onClick={() => setSortBy(opt.k)}
                      className={`rounded-full border-2 border-ink px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-widest transition-colors ${active ? "bg-ink text-cream" : "bg-cream text-ink hover:bg-ink/5"}`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setShowFavorites((v) => !v)}
                  className={`ml-auto inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-widest transition-colors ${showFavorites ? "bg-coral text-cream" : "bg-cream text-ink hover:bg-ink/5"}`}
                  aria-expanded={showFavorites}
                >
                  <Heart className={`h-3 w-3 ${Object.keys(favorites).length > 0 ? "fill-coral text-coral" : ""} ${showFavorites ? "fill-cream text-cream" : ""}`} />
                  Favorites ({Object.keys(favorites).length})
                </button>
              </div>

              {showFavorites && (
                <div className="mt-3 rounded-2xl border-2 border-ink bg-cream/80 p-3" style={{ animation: "reveal-up 0.3s ease-out forwards" }}>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-ink/60">Your saved spots</p>
                  {Object.keys(favorites).length === 0 ? (
                    <p className="mt-2 text-sm text-ink/70">Tap the ♥ on any stop to save it here for later.</p>
                  ) : (
                    <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                      {Object.values(favorites).map((f) => (
                        <li key={f.venue_name} className="flex items-start justify-between gap-2 rounded-xl border border-ink/20 bg-cream p-2">
                          <div className="min-w-0">
                            <div className="truncate font-display text-sm font-extrabold">{f.venue_name}</div>
                            <div className="truncate font-mono text-[10px] uppercase tracking-widest text-ink/60">
                              {[f.vibe, f.neighborhood].filter(Boolean).join(" · ") || "Saved"}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleFavorite({ time: "", venue: f.venue_name, vibe: f.vibe ?? "", tone: f.tone ?? "", address: f.address ?? undefined, neighborhood: f.neighborhood ?? undefined })}
                            className="shrink-0 rounded-full border border-ink/20 p-1 text-coral transition-colors hover:bg-coral/10"
                            aria-label={`Remove ${f.venue_name} from favorites`}
                          >
                            <Heart className="h-3.5 w-3.5 fill-coral" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <ol className="mt-4 space-y-3">
                {sortedStops.map(({ s, i: origIdx }, displayIdx) => {
                  const i = origIdx;
                  const isOpen = openStop === i;
                  const d = getDetails(s.venue, s.vibe);
                  const isFav = !!favorites[s.venue];
                  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.venue}${s.address ? `, ${s.address}` : ""}${s.neighborhood ? `, ${s.neighborhood}` : ""}`)}`;
                  return (
                    <li
                      key={`${variant}-${i}`}
                      className="overflow-hidden rounded-2xl border-2 border-ink bg-cream shadow-brut"
                      style={{ animation: `reveal-up 0.5s ${i * 110}ms cubic-bezier(0.22,1,0.36,1) backwards` }}
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setOpenStop(isOpen ? null : i)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpenStop(isOpen ? null : i); } }}
                        aria-expanded={isOpen}
                        className="flex w-full items-stretch gap-3 p-3 text-left transition-colors hover:bg-ink/[0.03] cursor-pointer"
                      >
                        <div className={`grid w-20 shrink-0 place-items-center rounded-xl border-2 border-ink ${s.tone} font-display text-sm font-extrabold leading-tight text-ink`}>
                          {s.time}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-display text-lg font-extrabold leading-tight">{s.venue}</div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 font-mono text-[10px] font-bold">
                              <Star className="h-2.5 w-2.5 fill-current" /> {d.rating}
                            </span>
                          </div>
                          {(s.address || s.neighborhood) && (
                            <div className="mt-0.5 inline-flex items-center gap-1 font-mono text-[11px] text-ink/70">
                              <MapPin className="h-3 w-3" />
                              {s.address ? s.address : ""}{s.address && s.neighborhood ? " · " : ""}{s.neighborhood ?? ""}
                            </div>
                          )}
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                            <span className="rounded-full border border-ink bg-cream px-2 py-0.5 font-mono uppercase tracking-widest">{s.vibe}</span>
                            <span className="font-mono text-[11px] text-ink/60">{"$".repeat(d.priceLevel)}</span>
                            {s.walk && <span className="font-mono text-[11px] text-ink/60">↳ {s.walk}</span>}
                          </div>
                        </div>
                        <div className="flex flex-col items-center justify-between self-stretch gap-1">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(s); }}
                            aria-pressed={isFav}
                            aria-label={isFav ? `Remove ${s.venue} from favorites` : `Save ${s.venue} to favorites`}
                            title={isFav ? "Remove from favorites" : "Save to favorites"}
                            className={`grid h-7 w-7 place-items-center rounded-full border-2 border-ink transition-pop hover:-translate-y-0.5 ${isFav ? "bg-coral text-cream" : "bg-cream text-ink hover:bg-coral/10"}`}
                          >
                            <Heart className={`h-3.5 w-3.5 ${isFav ? "fill-cream" : ""}`} />
                          </button>
                          <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-gold font-mono text-[11px] font-bold">{displayIdx + 1}</span>
                          <ChevronDown className={`h-4 w-4 text-ink/60 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </div>
                      </div>

                      {isOpen && (
                        <div
                          className="border-t-2 border-dashed border-ink/30 bg-cream/60 p-4"
                          style={{ animation: "reveal-up 0.3s ease-out forwards" }}
                        >
                          <p className="text-sm leading-relaxed text-ink/85">{d.blurb}</p>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full border border-ink bg-cream px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest">
                              <Star className="h-3 w-3 fill-gold text-gold" /> {d.rating} <span className="text-ink/50">({d.reviewCount.toLocaleString()})</span>
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-ink bg-cream px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest">
                              <DollarSign className="h-3 w-3" /> {"$".repeat(d.priceLevel)}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-ink bg-cream px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest">
                              <Clock className="h-3 w-3" /> {d.hours}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-ink bg-cream px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest">
                              <Utensils className="h-3 w-3" /> Known for {d.knownFor}
                            </span>
                            {d.glutenFree && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-ink bg-mint px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink">
                                GF available
                              </span>
                            )}
                            {d.vegan && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-ink bg-mint px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink">
                                🌱 Vegan
                              </span>
                            )}
                            {d.vegetarian && !d.vegan && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-ink bg-mint/70 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink">
                                Vegetarian
                              </span>
                            )}
                            {d.pescatarian && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-ink bg-mint/70 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink">
                                🐟 Pescatarian
                              </span>
                            )}
                          </div>

                          <div className="mt-3 rounded-xl border-2 border-ink/15 bg-cream/60 p-3">
                            <p className="font-mono text-[10px] uppercase tracking-widest text-ink/60">Dietary options</p>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {d.dietary.map((opt) => (
                                <span key={opt} className="inline-flex items-center gap-1 rounded-full border border-ink/30 bg-cream px-2 py-0.5 text-[11px] text-ink/85">
                                  ✓ {opt}
                                </span>
                              ))}
                            </div>
                            <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-ink/60">Allergens — notify ahead</p>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {d.allergens.length > 0 ? (
                                d.allergens.map((a) => (
                                  <span key={a} className="inline-flex items-center gap-1 rounded-full border border-coral/50 bg-coral/10 px-2 py-0.5 text-[11px] text-ink/85">
                                    ⚠ {a}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[11px] text-ink/60">Kitchen accommodates most allergens — call ahead.</span>
                              )}
                            </div>
                          </div>


                          <blockquote className="mt-3 rounded-xl border-2 border-ink/15 bg-cream px-3 py-2 font-serif text-sm italic text-ink/80">
                            {d.review}
                          </blockquote>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <a
                              href={mapsHref}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-coral px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-cream shadow-brut transition-pop hover:-translate-y-0.5"
                            >
                              <MapPin className="h-3.5 w-3.5" /> Directions
                            </a>
                            <a
                              href={`tel:${d.phone.replace(/[^\d]/g, "")}`}
                              className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-cream px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest shadow-brut transition-pop hover:-translate-y-0.5"
                            >
                              <Phone className="h-3.5 w-3.5" /> {d.phone}
                            </a>
                            <a
                              href={`https://www.google.com/search?q=${encodeURIComponent(s.venue + " " + (s.neighborhood ?? ""))}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-cream px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest shadow-brut transition-pop hover:-translate-y-0.5"
                            >
                              <Globe className="h-3.5 w-3.5" /> Website
                            </a>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>

              <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t-2 border-dashed border-ink pt-5">
                <button
                  onClick={regenerate}
                  className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-ink bg-cream px-5 font-mono text-xs font-bold uppercase tracking-widest shadow-brut transition-pop hover:-translate-y-0.5"
                >
                  <RefreshCw className="h-4 w-4" /> Regenerate
                </button>
                <button
                  onClick={savePlan}
                  className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-ink bg-ink px-6 font-mono text-xs font-bold uppercase tracking-widest text-cream shadow-brut transition-pop hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brut-lg"
                >
                  <Save className="h-4 w-4" /> Save plan
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer nav */}
        {step <= 4 && (
          <div className="flex items-center justify-between gap-3 border-t-2 border-ink bg-cream/80 px-5 py-4 backdrop-blur">
            <button
              onClick={back}
              disabled={step === 0}
              className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-ink bg-cream px-4 font-mono text-xs font-bold uppercase tracking-widest shadow-brut transition-pop hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            {step < 4 ? (
              <button
                onClick={next}
                disabled={!canAdvance}
                className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-ink bg-ink px-5 font-mono text-xs font-bold uppercase tracking-widest text-cream shadow-brut transition-pop hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brut-lg disabled:opacity-40 disabled:hover:translate-x-0 disabled:hover:translate-y-0"
              >
                Continue <ArrowUpRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={build}
                className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-ink bg-coral px-5 font-mono text-xs font-bold uppercase tracking-widest text-cream shadow-brut transition-pop hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brut-lg"
              >
                Build it <Sparkles className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
      {layer}
    </div>
  );
}

function StepShell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div style={{ animation: "reveal-up 0.4s ease-out forwards" }}>
      <h2 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">{title}</h2>
      <p className="mt-1 text-sm text-ink/70">{sub}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}
