import { ArrowUpRight, Clock } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { WizardButton } from "@/components/wizard/WizardButton";

type Pick = {
  title: string;
  vibe: string;
  vibeKeys: string[];
  vibeTone: string;
  bg: string;
  duration: string;
  cost: string;
  stops: { time: string; venue: string }[];
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
      { time: "6:30p", venue: "Aera Terrace" },
      { time: "8:15p", venue: "Twelve Story" },
      { time: "10:00p", venue: "Halo Skybar" },
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
      { time: "7:00p", venue: "Lila's Patio" },
      { time: "8:45p", venue: "The Velvet Door" },
      { time: "10:15p", venue: "Mason St. Records" },
    ],
  },
  {
    title: "Bougie Birthday Dinner",
    vibe: "Tasting menu · champagne",
    vibeKeys: ["bougie"],
    vibeTone: "bg-gold text-ink",
    bg: "bg-cream",
    duration: "4.5h",
    cost: "$160–$240 pp",
    stops: [
      { time: "6:00p", venue: "Kettle & Char" },
      { time: "8:30p", venue: "Suite 9 Lounge" },
      { time: "10:30p", venue: "Aera Rooftop" },
    ],
  },
  {
    title: "Dance Floor Saturday",
    vibe: "Hi-energy · late night",
    vibeKeys: ["dance", "late"],
    vibeTone: "bg-pink-400 text-ink",
    bg: "bg-purple/15",
    duration: "5h",
    cost: "$60–$110 pp",
    stops: [
      { time: "9:00p", venue: "Marigold Pizza" },
      { time: "10:45p", venue: "Saturn Lounge" },
      { time: "12:30a", venue: "Basement 47" },
    ],
  },
  {
    title: "Sunday Slow",
    vibe: "Lazy brunch · garden walk",
    vibeKeys: ["bougie"],
    vibeTone: "bg-emerald-400 text-ink",
    bg: "bg-cream",
    duration: "5h",
    cost: "$45–$75 pp",
    stops: [
      { time: "11:00a", venue: "Six Spoons" },
      { time: "1:30p",  venue: "Glasshouse Gallery" },
      { time: "3:15p",  venue: "Harbor Promenade" },
    ],
  },
  {
    title: "Live Music Wander",
    vibe: "Jazz, soul, vinyl",
    vibeKeys: ["live"],
    vibeTone: "bg-amber-400 text-ink",
    bg: "bg-coral/20",
    duration: "4h",
    cost: "$55–$95 pp",
    stops: [
      { time: "7:30p", venue: "Loose Leaf Live" },
      { time: "9:15p", venue: "Mason St. Records" },
      { time: "10:45p", venue: "Underline Club" },
    ],
  },
];

export function QuickPicks() {
  return (
    <section className="border-b-2 border-ink bg-cream">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-ink/60">/ steal a night</span>
              <h2 className="mt-2 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">
                Steal a <span className="font-serif italic font-normal text-coral">night.</span>
              </h2>
              <p className="mt-3 max-w-md text-lg">Grab a ready-made plan and go. Tap, tweak, show up.</p>
            </div>
            <span className="hidden font-mono text-[11px] uppercase tracking-widest text-ink/60 sm:inline">
              ← drag to scroll →
            </span>
          </div>
        </Reveal>

        <div className="mt-12 -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-6 sm:-mx-6 sm:px-6 [scrollbar-width:thin]">
          {PICKS.map((p, i) => (
            <Reveal key={p.title} delay={i * 70} variant="scale" className="snap-start">
              <article
                className={`group relative flex w-[300px] shrink-0 flex-col rounded-3xl border-2 border-ink ${p.bg} p-5 shadow-brut transition-pop hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brut-lg sm:w-[340px]`}
              >
                <span className={`inline-flex w-fit items-center rounded-full border-2 border-ink ${p.vibeTone} px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest`}>
                  {p.vibe}
                </span>
                <h3 className="mt-4 font-display text-3xl font-extrabold leading-[0.95]">{p.title}</h3>

                <ol className="mt-5 space-y-2 border-t-2 border-dashed border-ink/30 pt-4">
                  {p.stops.map((s, idx) => (
                    <li key={s.time} className="flex items-center gap-3">
                      <span className="grid h-7 w-12 shrink-0 place-items-center rounded-md border-2 border-ink bg-cream/90 font-mono text-[10px] font-bold">
                        {s.time}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-display text-base font-bold">{s.venue}</span>
                      <span className="font-mono text-[10px] font-bold text-ink/40">0{idx + 1}</span>
                    </li>
                  ))}
                </ol>

                <div className="mt-5 flex items-center justify-between border-t-2 border-dashed border-ink/30 pt-3 font-mono text-[11px] uppercase tracking-widest text-ink/70">
                  <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {p.duration}</span>
                  <span>{p.cost}</span>
                </div>

                <WizardButton
                  ariaLabel={`Steal ${p.title}`}
                  preset={{
                    title: p.title,
                    vibeLabel: p.vibe,
                    budgetLabel: p.cost,
                    crewLabel: p.duration,
                    stops: p.stops,
                  }}
                  className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border-2 border-ink bg-ink font-mono text-xs font-bold uppercase tracking-widest text-cream shadow-brut transition-pop hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brut-lg"
                >
                  Steal this plan <ArrowUpRight className="h-4 w-4" />
                </WizardButton>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
