import { ArrowUpRight, Clock, Heart, MapPin, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Reveal } from "@/components/Reveal";
import { WizardButton } from "@/components/wizard/WizardButton";
import { CitySelector } from "@/components/CitySelector";
import { DEFAULT_CITY, getSelectedCity, subscribeSelectedCity, type City } from "@/lib/cities";
import { useCardSignals, recordCardSave } from "@/lib/use-card-signals";
import { toast } from "sonner";

type Pick = {
  title: string;
  vibe: string;
  vibeKeys: string[];
  vibeTone: string;
  bg: string;
  duration: string;
  cost: string;
  stops: { time: string; venue: string; address?: string; neighborhood?: string }[];
};

const PICKS: Pick[] = [
  {
    title: "The Rooftop Crawl",
    vibe: "Skyline · golden hour",
    vibeKeys: ["rooftop"],
    vibeTone: "bg-coral text-cream",
    bg: "bg-cream",
    duration: "4h",
    cost: "$80–$120 pp",
    stops: [
      {
        time: "6:30p",
        venue: "Hank's Cocktail Bar",
        address: "1110 Vermont Ave NW",
        neighborhood: "Logan Circle",
      },
      {
        time: "8:15p",
        venue: "12 Stories",
        address: "1221 Van St SE",
        neighborhood: "Navy Yard",
      },
      {
        time: "10:00p",
        venue: "Top of the Gate",
        address: "2650 Virginia Ave NW",
        neighborhood: "Foggy Bottom",
      },
    ],
  },
  {
    title: "Speakeasy Date Night",
    vibe: "Low-lit · slow burn",
    vibeKeys: ["speakeasy"],
    vibeTone: "bg-purple text-cream",
    bg: "bg-gold/70",
    duration: "3.5h",
    cost: "$95–$140 pp",
    stops: [
      {
        time: "7:00p",
        venue: "Le Diplomate",
        address: "1601 14th St NW",
        neighborhood: "14th Street",
      },
      {
        time: "8:45p",
        venue: "Columbia Room",
        address: "124 Blagden Alley NW",
        neighborhood: "Shaw",
      },
      {
        time: "10:15p",
        venue: "Allegory",
        address: "1015 H St NW",
        neighborhood: "Mt Vernon Triangle",
      },
    ],
  },
  {
    title: "Bougie Birthday Dinner",
    vibe: "Tasting menu · champagne",
    vibeKeys: ["bougie"],
    vibeTone: "bg-gold text-cream",
    bg: "bg-cream",
    duration: "4.5h",
    cost: "$160–$240 pp",
    stops: [
      {
        time: "6:00p",
        venue: "minibar by José Andrés",
        address: "855 E St NW",
        neighborhood: "Penn Quarter",
      },
      {
        time: "8:30p",
        venue: "Imperfecto",
        address: "1124 23rd St NW",
        neighborhood: "West End",
      },
      {
        time: "10:30p",
        venue: "Silver Lyan",
        address: "900 F St NW",
        neighborhood: "Penn Quarter",
      },
    ],
  },
  {
    title: "Dance Floor Saturday",
    vibe: "Hi-energy · late night",
    vibeKeys: ["dance", "late"],
    vibeTone: "bg-pink-400 text-cream",
    bg: "bg-purple/15",
    duration: "5h",
    cost: "$60–$110 pp",
    stops: [
      {
        time: "9:00p",
        venue: "All-Purpose Pizzeria",
        address: "1250 9th St NW",
        neighborhood: "Shaw",
      },
      {
        time: "10:45p",
        venue: "Flash",
        address: "645 Florida Ave NW",
        neighborhood: "Shaw",
      },
      {
        time: "12:30a",
        venue: "Echostage",
        address: "2135 Queens Chapel Rd NE",
        neighborhood: "Brentwood",
      },
    ],
  },
  {
    title: "Sunday Slow",
    vibe: "Lazy brunch · garden walk",
    vibeKeys: ["bougie"],
    vibeTone: "bg-emerald-400 text-cream",
    bg: "bg-cream",
    duration: "5h",
    cost: "$45–$75 pp",
    stops: [
      {
        time: "11:00a",
        venue: "Tatte Bakery & Cafe",
        address: "1310 Wisconsin Ave NW",
        neighborhood: "Georgetown",
      },
      {
        time: "1:30p",
        venue: "Dumbarton Oaks",
        address: "1703 32nd St NW",
        neighborhood: "Georgetown",
      },
      {
        time: "3:15p",
        venue: "Georgetown Waterfront Park",
        address: "3303 Water St NW",
        neighborhood: "Georgetown",
      },
    ],
  },
  {
    title: "Live Music Wander",
    vibe: "Jazz, soul, vinyl",
    vibeKeys: ["live"],
    vibeTone: "bg-amber-400 text-cream",
    bg: "bg-coral/20",
    duration: "4h",
    cost: "$55–$95 pp",
    stops: [
      {
        time: "7:30p",
        venue: "Blues Alley",
        address: "1073 Wisconsin Ave NW",
        neighborhood: "Georgetown",
      },
      {
        time: "9:15p",
        venue: "The Hamilton Live",
        address: "600 14th St NW",
        neighborhood: "Penn Quarter",
      },
      {
        time: "10:45p",
        venue: "JoJo Restaurant & Bar",
        address: "1518 U St NW",
        neighborhood: "U Street",
      },
    ],
  },
];

export function QuickPicks() {
  // Start from DEFAULT_CITY on both server and first client render to avoid
  // hydration mismatches; sync to localStorage-backed selection after mount.
  const [city, setCity] = useState<City>(DEFAULT_CITY);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setCity(getSelectedCity() ?? DEFAULT_CITY);
    setHydrated(true);
    return subscribeSelectedCity(() => setCity(getSelectedCity() ?? DEFAULT_CITY));
  }, []);
  // Curated venue lists exist for a handful of flagship cities. For any other
  // city we let the wizard generate live picks from Google Places using the
  // selected city's coords.
  const CURATED_CITIES = new Set(["dmv"]);
  const isCurated = !hydrated || CURATED_CITIES.has(city.slug);

  return (
    <section className="border-b-2 border-ink bg-cream">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-cream/60">
                / steal a night
              </span>
              <h2 className="mt-2 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">
                Steal a <span className="font-serif italic font-normal text-coral">night.</span>
              </h2>
              <p className="mt-3 max-w-md text-lg">
                Grab a ready-made plan and go. Tap, tweak, show up.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-cream/60">
                  Picks for
                </span>
                <CitySelector compact />
                {!isCurated && (
                  <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-gold/40 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-cream">
                    <Sparkles className="h-3 w-3" /> Live picks
                  </span>
                )}
              </div>
            </div>
            <span className="hidden font-mono text-[11px] uppercase tracking-widest text-cream/60 sm:inline">
              ← drag to scroll →
            </span>
          </div>
        </Reveal>

        <div className="mt-12 -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-6 sm:-mx-6 sm:px-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {PICKS.map((p, i) => (
            <Reveal key={p.title} delay={i * 70} variant="scale" className="snap-start">
              <PickCard pick={p} isCurated={isCurated} city={city} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function PickCard({ pick: p, isCurated, city }: { pick: Pick; isCurated: boolean; city: City }) {
  const value = (p.vibeKeys?.[0] || p.title).toLowerCase();
  const { ref } = useCardSignals({
    value,
    context: { surface: "quick-picks", title: p.title, city: city.slug },
  });
  const [saved, setSaved] = useState(false);

  function onSave(e: React.MouseEvent) {
    e.stopPropagation();
    if (saved) return;
    setSaved(true);
    recordCardSave(value, { surface: "quick-picks", title: p.title, city: city.slug });
    toast.success("Saved — we'll learn from this");
  }

  return (
    <article
      ref={ref as React.RefObject<HTMLElement>}
      className={`group relative flex w-[300px] shrink-0 flex-col rounded-3xl border-2 border-ink ${p.bg} p-5 shadow-brut transition-pop hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brut-lg sm:w-[340px]`}
    >
      <div className="flex items-start gap-2">
        <span
          className={`inline-flex w-fit items-center rounded-full border-2 border-ink ${p.vibeTone} px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest`}
        >
          {p.vibe}
        </span>
        <button
          type="button"
          onClick={onSave}
          aria-label={saved ? "Saved" : "Save this pick"}
          aria-pressed={saved}
          className={`ml-auto grid h-8 w-8 place-items-center rounded-full border-2 border-ink transition-colors ${
            saved ? "bg-coral text-cream" : "bg-cream text-cream hover:bg-coral/10"
          }`}
        >
          <Heart className={`h-3.5 w-3.5 ${saved ? "fill-current" : ""}`} />
        </button>
      </div>
      <h3 className="mt-4 font-display text-3xl font-extrabold leading-[0.95]">{p.title}</h3>

      {isCurated ? (
        <ol className="mt-5 space-y-2 border-t-2 border-dashed border-ink/30 pt-4">
          {p.stops.map((s, idx) => (
            <li key={s.time} className="flex items-center gap-3">
              <span className="grid h-7 w-12 shrink-0 place-items-center rounded-md border-2 border-ink bg-cream/90 font-mono text-[10px] font-bold">
                {s.time}
              </span>
              <span className="min-w-0 flex-1 truncate font-display text-base font-bold">
                {s.venue}
              </span>
              <span className="font-mono text-[10px] font-bold text-cream/40">0{idx + 1}</span>
            </li>
          ))}
        </ol>
      ) : (
        <div className="mt-5 flex flex-1 flex-col justify-between gap-3 border-t-2 border-dashed border-ink/30 pt-4">
          <p className="font-mono text-[11px] leading-relaxed text-cream/70">
            We'll pull 3 real venues in <span className="font-bold text-cream">{city.name}</span> that
            match this vibe — based on live ratings &amp; hours.
          </p>
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-cream/60">
            <MapPin className="h-3 w-3 text-coral" /> {city.region}
          </div>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between border-t-2 border-dashed border-ink/30 pt-3 font-mono text-[11px] uppercase tracking-widest text-cream/70">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> {p.duration}
        </span>
        <span>{p.cost}</span>
      </div>

      <WizardButton
        ariaLabel={`Steal ${p.title}`}
        preset={{
          title: p.title,
          vibeKeys: p.vibeKeys,
          vibeLabel: p.vibe,
          budgetLabel: p.cost,
          crewLabel: p.duration,
          stops: isCurated ? p.stops : undefined,
        }}
        className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border-2 border-ink bg-ink font-mono text-xs font-bold uppercase tracking-widest text-cream shadow-brut transition-pop hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brut-lg"
      >
        {isCurated ? "Use this plan" : `Build for ${city.name}`}{" "}
        <ArrowUpRight className="h-4 w-4" />
      </WizardButton>
    </article>
  );
}
