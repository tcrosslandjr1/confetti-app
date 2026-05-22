import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CalendarPlus, Loader2, Sparkles, MapPin } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/lib/auth-context";
import { logAccessDenial } from "@/lib/access-denials";
import { OCCASIONS } from "@/lib/occasions";
import { createSkeletonItinerary, populateItinerary } from "@/lib/itineraries";

/* ── Rotating progress messages ─────────────────────────────── */
const PROGRESS_MSGS = [
  "Scouting the best spots in town...",
  "Checking real reviews & ratings...",
  "Mapping out your perfect route...",
  "Verifying hours & availability...",
  "Picking hidden gems just for you...",
  "Syncing with your taste profile...",
  "Calculating timing between stops...",
  "Almost there — polishing your day...",
];

function useRotatingMessage(active: boolean, intervalMs = 2800) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!active) { setIdx(0); return; }
    const id = setInterval(() => setIdx((i) => (i + 1) % PROGRESS_MSGS.length), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);
  return PROGRESS_MSGS[idx];
}

export const Route = createLazyFileRoute("/plan")({
  component: PlanPage,
});

function PlanPage() {
    const { user, loading, viewAs } = useAuth();
    const nav = useNavigate();
    const [occasionSlugs, setOccasionSlugs] = useState<string[]>([OCCASIONS[0].slug]);
    const [customVibe, setCustomVibe] = useState("");
    const isCustom = occasionSlugs.includes("__custom__");
    const toggleOccasion = (slug: string) => setOccasionSlugs((prev) => prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]);
    const [city, setCity] = useState("");
    const [neighborhood, setNeighborhood] = useState("");
    const [date, setDate] = useState("");
    const [startTime, setStartTime] = useState("11:00");
    const [durationHours, setDurationHours] = useState(4);
    const [durationTouched, setDurationTouched] = useState(false);
    const [budget, setBudget] = useState("$$");
    const [notes, setNotes] = useState("");
    const [transportMode, setTransportMode] = useState<"auto" | "car" | "transit" | "lyft" | "uber" | "walk">("auto");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [locating, setLocating] = useState(false);
    const [locErr, setLocErr] = useState<string | null>(null);
    const progressMsg = useRotatingMessage(busy);

    /* ── Pre-load heavy modules on mount so submit is faster ── */
    const preloaded = useRef(false);
    useEffect(() => {
        if (preloaded.current) return;
        preloaded.current = true;
        // Fire-and-forget — warm the dynamic import cache
        import("@/lib/taste").catch(() => {});
        import("@/lib/cities").catch(() => {});
    }, []);

    const detectLocation = () => {
        setLocErr(null);
        if (typeof navigator === "undefined" || !navigator.geolocation) {
            setLocErr("Geolocation isn't available in this browser.");
            return;
        }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const { latitude, longitude } = pos.coords;
                const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                if (!res.ok)
                    throw new Error("Lookup failed");
                const data = await res.json();
                const detectedCity = data.city || data.locality || data.principalSubdivision || "";
                const detectedHood = data.localityInfo?.administrative?.find((a: {
                    adminLevel: number;
                    name: string;
                }) => a.adminLevel >= 8)?.name ||
                    data.localityInfo?.informative?.[0]?.name ||
                    "";
                if (detectedCity)
                    setCity(detectedCity);
                if (detectedHood && detectedHood !== detectedCity)
                    setNeighborhood(detectedHood);
                if (!detectedCity)
                    setLocErr("Couldn't resolve a city from your location.");
            }
            catch {
                setLocErr("Couldn't look up your location. Type it in instead.");
            }
            finally {
                setLocating(false);
            }
        }, (geoErr) => {
            setLocating(false);
            setLocErr(geoErr.code === geoErr.PERMISSION_DENIED
                ? "Location permission denied. Type your city instead."
                : "Couldn't get your location. Type it in instead.");
        }, { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 });
    };
    // Auto-size the day length based on how many vibes are picked (~2hr each)
    useEffect(() => {
        if (durationTouched)
            return;
        const count = occasionSlugs.filter((s) => s !== "__custom__").length + (isCustom ? 1 : 0);
        const suggested = Math.min(14, Math.max(3, count * 2));
        setDurationHours(suggested);
    }, [occasionSlugs, isCustom, durationTouched]);
    useEffect(() => {
        if (loading)
            return;
        if (!user) {
            logAccessDenial({
                source: "route-guard",
                feature: "planning",
                attemptedPath: "/plan",
                fromPath: "/plan",
                viewerRole: "anonymous",
                userId: null,
                note: "Unauthenticated user blocked from /plan",
            });
            nav({ to: "/auth" });
            return;
        }
        // Planning + booking is a customer surface. Admin/business/visitor views
        // get redirected to their own home so admin accounts don't accidentally
        // create real bookings while testing.
        if (viewAs === "admin")
            nav({ to: "/admin" });
        else if (viewAs === "business")
            nav({ to: "/advertise/portal" });
        else if (viewAs === "visitor")
            nav({ to: "/" });
    }, [user, loading, viewAs, nav]);
    async function submit(e: React.FormEvent) {
        e.preventDefault();
        console.log("[plan] submit clicked", { occasionSlugs, isCustom, user: !!user });
        setErr(null);
        setBusy(true);
        try {
            if (!user) {
                throw new Error("Sign in required — please log in and try again.");
            }
            const selected = OCCASIONS.filter((o) => occasionSlugs.includes(o.slug));
            const customText = customVibe.trim();
            if (isCustom && !customText) {
                throw new Error("Tell us your vibe — type a few words to describe your day.");
            }
            if (selected.length === 0 && !isCustom) {
                throw new Error("Pick at least one vibe to plan your day.");
            }
            const titles = selected.map((o) => o.title);
            const taglines = selected.map((o) => o.tagline);
            if (isCustom && customText) {
                titles.push(customText);
                taglines.push(customText);
            }
            const buildPayload = {
                occasion: titles.join(" + "),
                vibe: taglines.join(" · "),
                occasionSlug: selected[0]?.slug ?? "spontaneous",
                city: city || undefined,
                neighborhood: neighborhood || undefined,
                date: date || undefined,
                startTime,
                durationHours,
                budget,
                notes: notes || undefined,
                transportMode,
            };

            // Phase 1: create skeleton row instantly → navigate
            console.log("[plan] creating skeleton itinerary…");
            const { id } = await createSkeletonItinerary(buildPayload);
            console.log("[plan] skeleton created", id, "— navigating now");
            nav({ to: "/trips/$id", params: { id } });

            // Phase 2: populate in background (non-blocking)
            populateItinerary(id, buildPayload).catch((err) => {
              console.error("[plan] background populate failed", err);
              toast.error((err as Error).message ?? "Failed to build your day — try again.");
            });
        }
        catch (err) {
            console.error("[plan] submit failed", err);
            setErr((err as Error).message ?? "Something went wrong building your day.");
        }
        finally {
            setBusy(false);
        }
    }
    return (<div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary"/> AI day planner
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Plan the <span className="text-gradient">whole day.</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            Tell us the vibe — we'll build a 3-6 stop itinerary with timing, costs, and booking
            links.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-5 rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
          <Field label="Pick your vibe">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {OCCASIONS.map((o) => {
            const active = occasionSlugs.includes(o.slug);
            return (<button key={o.slug} type="button" onClick={() => toggleOccasion(o.slug)} className={`group relative overflow-hidden rounded-2xl border p-3 text-left transition-all ${active
                    ? "border-primary bg-primary/5 shadow-pop scale-[1.02]"
                    : "border-border bg-background hover:border-primary/40 hover:scale-[1.01]"}`}>
                    <div className={`mb-1.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${o.gradient} text-lg`}>
                      {o.emoji}
                    </div>
                    <div className="text-sm font-semibold leading-tight">{o.title}</div>
                    <div className="mt-0.5 text-[11px] leading-tight text-muted-foreground line-clamp-2">
                      {o.tagline}
                    </div>
                  </button>);
        })}
              <button type="button" onClick={() => toggleOccasion("__custom__")} className={`group relative overflow-hidden rounded-2xl border-2 border-dashed p-3 text-left transition-all ${isCustom
            ? "border-primary bg-primary/5 shadow-pop scale-[1.02]"
            : "border-border bg-background hover:border-primary/40 hover:scale-[1.01]"}`}>
                <div className="mb-1.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-lg">
                  ✏️
                </div>
                <div className="text-sm font-semibold leading-tight">Something else</div>
                <div className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
                  Type your own vibe
                </div>
              </button>
            </div>
            {isCustom && (<input autoFocus value={customVibe} onChange={(e) => setCustomVibe(e.target.value)} placeholder="e.g. Rainy-day bookstore crawl, late-night ramen..." className="mt-3 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"/>)}
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="City">
              <div className="flex gap-2">
                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Austin" className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"/>
                <button type="button" onClick={detectLocation} disabled={locating} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-semibold text-foreground transition hover:bg-muted disabled:opacity-60" title="Use my current location">
                  {locating ? (<Loader2 className="h-3.5 w-3.5 animate-spin"/>) : (<MapPin className="h-3.5 w-3.5"/>)}
                  {locating ? "Locating…" : "Use my location"}
                </button>
              </div>
              {locErr && <p className="mt-1.5 text-xs text-destructive">{locErr}</p>}
            </Field>
            <Field label="Neighborhood (optional)">
              <input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="e.g. East Side" className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"/>
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Date">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"/>
            </Field>
            <Field label="Start time">
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"/>
            </Field>
            <Field label="Length (hrs)">
              <input type="number" min={2} max={14} value={durationHours} onChange={(e) => {
            setDurationTouched(true);
            setDurationHours(Number(e.target.value));
        }} className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"/>
              {!durationTouched && (<p className="mt-1 text-[11px] text-muted-foreground">
                  Auto-sized from your vibes — edit to override.
                </p>)}
            </Field>
          </div>

          <Field label="Budget">
            <div className="flex gap-2">
              {["$", "$$", "$$$", "$$$$"].map((b) => (<button key={b} type="button" onClick={() => setBudget(b)} className={`flex-1 rounded-full border px-3 py-2 text-sm font-semibold transition-colors ${budget === b
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:text-foreground"}`}>
                  {b}
                </button>))}
            </div>
          </Field>

          <Field label="How are you getting around?">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {([
            { k: "auto", label: "Auto", emoji: "✨" },
            { k: "car", label: "Car", emoji: "🚗" },
            { k: "transit", label: "Transit", emoji: "🚇" },
            { k: "lyft", label: "Lyft", emoji: "🩷" },
            { k: "uber", label: "Uber", emoji: "🖤" },
            { k: "walk", label: "Walk", emoji: "🚶" },
        ] as const).map((m) => (<button key={m.k} type="button" onClick={() => setTransportMode(m.k)} className={`rounded-xl border px-2 py-2 text-xs font-semibold transition-colors ${transportMode === m.k
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:text-foreground"}`}>
                  <span className="mr-1">{m.emoji}</span>
                  {m.label}
                </button>))}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Auto = AI picks the best mode for each leg (walk short hops, rideshare when drinking,
              transit downtown).
            </p>
          </Field>

          <Field label="Anything special? (optional)">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Allergies, can't drink, want it walkable, kids in tow..." className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"/>
          </Field>

          {err && (<p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">{err}</p>)}

          <button type="submit" disabled={busy} className="relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-pop transition-pop hover:scale-[1.02] disabled:opacity-60">
            {busy ? (<>
                <Loader2 className="h-4 w-4 animate-spin"/>
                <span key={progressMsg} className="animate-fade-in">{progressMsg}</span>
              </>) : (<>
                <CalendarPlus className="h-4 w-4"/> Build my day
              </>)}
            {busy && (
              <span className="absolute bottom-0 left-0 h-0.5 w-full">
                <span className="block h-full animate-progress-bar rounded-full bg-primary-foreground/40" />
              </span>
            )}
          </button>
        </form>
      </div>
    </div>);
}

function Field({ label, children }: {
    label: string;
    children: React.ReactNode;
}) {
    return (<label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>);
}
