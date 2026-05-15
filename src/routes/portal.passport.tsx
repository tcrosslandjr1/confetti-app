import { createFileRoute } from "@tanstack/react-router";
import { BookMarked, MapPin, Sparkles, Trophy } from "lucide-react";

export const Route = createFileRoute("/portal/passport")({
  head: () => ({
    meta: [
      { title: "Your Confetti Passport — My Portal | Confetti" },
      {
        name: "description",
        content: "Every great night earns a stamp. Your past Confetti adventures, collected.",
      },
    ],
  }),
  component: PassportPage,
});

type Stamp = {
  id: string;
  city: string;
  date: string;
  theme: string;
  stops: number;
  xp: number;
};

const STAMPS: Stamp[] = [
  { id: "s-1", city: "Washington DC", date: "May 10, 2026", theme: "Harbor Heatwave", stops: 4, xp: 120 },
  { id: "s-2", city: "Washington DC", date: "April 28, 2026", theme: "Moonlit Mischief", stops: 3, xp: 90 },
  { id: "s-3", city: "New York", date: "April 15, 2026", theme: "Velvet & Vinyl", stops: 4, xp: 150 },
  { id: "s-4", city: "Miami", date: "March 22, 2026", theme: "Neon Nomads", stops: 5, xp: 200 },
];

function PassportPage() {
  const totalAdventures = STAMPS.length;
  const citiesVisited = new Set(STAMPS.map((s) => s.city)).size;
  const totalXP = STAMPS.reduce((sum, s) => sum + s.xp, 0);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          My Portal
        </p>
        <h1 className="mt-1 flex items-center gap-2 font-display text-4xl font-bold text-ink">
          <BookMarked className="h-8 w-8 text-coral" /> Your Confetti Passport
        </h1>
        <p className="mt-2 text-muted-foreground">Every great night earns a stamp.</p>
      </header>

      <ul className="grid gap-5 sm:grid-cols-2">
        {STAMPS.map((s) => (
          <li
            key={s.id}
            className="relative overflow-hidden rounded-2xl border-2 border-ink bg-cream p-6 shadow-brut"
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-coral/10 blur-2xl" />
            <div className="flex items-start gap-4">
              <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full border-4 border-dashed border-coral bg-cream text-center shadow-[inset_0_0_0_2px_rgba(0,0,0,0.05)]">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-coral">
                    Confetti
                  </div>
                  <div className="mt-0.5 font-display text-[10px] font-extrabold leading-tight text-ink">
                    {s.city.split(" ")[0].toUpperCase()}
                    <br />
                    {s.city.split(" ").slice(1).join(" ").toUpperCase() || "STAMP"}
                  </div>
                  <div className="mt-0.5 font-mono text-[8px] text-muted-foreground">
                    {s.date.replace(",", "")}
                  </div>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {s.city}
                </div>
                <h3 className="mt-1 font-display text-xl font-extrabold text-ink">{s.theme}</h3>
                <div className="mt-1 text-xs text-muted-foreground">{s.date}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-background px-2.5 py-1 text-[11px] font-bold text-ink">
                    <Sparkles className="h-3 w-3 text-coral" /> {s.stops} stops
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-coral px-2.5 py-1 text-[11px] font-bold text-cream">
                    <Trophy className="h-3 w-3" /> {s.xp} XP
                  </span>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="grid gap-3 rounded-2xl border-2 border-ink bg-cream p-5 shadow-brut sm:grid-cols-3">
        <Stat label="Total Adventures" value={totalAdventures} />
        <Stat label="Cities Visited" value={citiesVisited} />
        <Stat label="Total XP" value={totalXP} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="font-display text-3xl font-extrabold text-coral">{value}</div>
      <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
