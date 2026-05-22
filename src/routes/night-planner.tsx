import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Heart,
  Users,
  Utensils,
  Martini,
  Dice5,
  Mic2,
  Flame,
  MapPin,
  Wallet,
  Clock,
  Sparkles,
  Share2,
  Music,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/night-planner")({
  component: NightPlanner,
  head: () => ({
    meta: [
      { title: "Night-Out Planner — Confetti" },
      { name: "description", content: "Pick the vibe and Confetti builds the night." },
    ],
  }),
});

const occasions = ["Girls Night", "Guys Night", "Date Night", "Group Hangout"];
const moods = ["Chill", "Romantic", "Turn Up", "Grown", "Bougie", "Competitive"];
const cravings = [
  "Seafood / Crab",
  "Hookah",
  "Lounge",
  "Casino Night",
  "Karaoke",
  "Dancing",
  "Comedy",
  "Rooftop",
  "Steakhouse",
  "Late-Night Food",
];
const groupTypes = ["Shared Culture", "Multiracial / Mixed", "Open To Anything"];
const budgets = ["$", "$$", "$$$", "$$$$"];
const times = ["Early Evening", "Late Night", "All Night"];

function NightPlanner() {
  const [occasion, setOccasion] = useState("Girls Night");
  const [mood, setMood] = useState("Turn Up");
  const [craving, setCraving] = useState("Seafood / Crab");
  const [groupType, setGroupType] = useState("Multiracial / Mixed");
  const [budget, setBudget] = useState("$$$");
  const [time, setTime] = useState("Late Night");
  const [city, setCity] = useState("Washington, DC");

  const plan = useMemo(() => {
    const isMixed = groupType.includes("Multiracial");
    if (occasion === "Date Night") {
      return [
        craving.includes("Seafood")
          ? "Start with a seafood or crab house dinner"
          : `Start with a ${craving.toLowerCase()}-friendly dinner spot`,
        isMixed
          ? "Let each person pick one song or dessert stop from their background or taste"
          : "Add a romantic cultural food, music, or lounge moment",
        craving === "Casino Night"
          ? "Go to a casino night or game lounge"
          : craving === "Hookah"
          ? "Go to a hookah lounge with music and mocktails"
          : "Go to a lounge, jazz spot, karaoke room, or scenic walk",
        "End with dessert, tea, drinks, or a photo moment",
      ];
    }
    if (occasion === "Guys Night") {
      return [
        craving.includes("Seafood")
          ? "Seafood boil, crab house, wings, or steak dinner"
          : `Start with ${craving.toLowerCase()} as the anchor`,
        "Add competition: pool, bowling, darts, casino night, arcade bar, or sports",
        isMixed
          ? "Do a playlist rotation where every guy adds songs from his taste or background"
          : "Add music, sports, comedy, or a lounge that fits the group",
        "Finish with hookah, cigar lounge, diner food, tacos, or late-night pizza",
      ];
    }
    if (occasion === "Girls Night") {
      return [
        craving.includes("Seafood")
          ? "Crab house, seafood boil, tapas, or shareable dinner"
          : `Start with a ${craving.toLowerCase()} moment`,
        "Fit check, group photos, and one short video moment",
        isMixed
          ? "Use a passport playlist where everyone adds five songs"
          : "Choose music, dancing, karaoke, or lounge based on the culture and mood",
        "End with hookah, dessert, rooftop, or late-night bites",
      ];
    }
    return [
      "Pick a shareable dinner that works for the whole group",
      craving === "Casino Night"
        ? "Make casino night the main activity"
        : `Use ${craving.toLowerCase()} as the main vibe`,
      isMixed
        ? "Let everyone contribute one food, song, or activity idea"
        : "Build around the group's shared culture or favorite social style",
      "Close with dessert, lounge, karaoke, hookah, or late-night food",
    ];
  }, [occasion, craving, groupType]);

  const CravingIcon =
    craving === "Casino Night" ? Dice5 : craving === "Karaoke" ? Mic2 : craving === "Lounge" ? Martini : Music;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-8 px-5 py-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div className="flex flex-col justify-center">
          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles size={22} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Night-out planner</p>
              <h1 className="text-3xl font-semibold tracking-normal sm:text-5xl">
                What's the mood tonight?
              </h1>
            </div>
          </div>

          <div className="space-y-6 rounded-lg border border-border bg-card p-5 shadow-lg">
            <Picker title="Occasion" icon={<Users size={18} />} options={occasions} value={occasion} onChange={setOccasion} />
            <Picker title="Energy" icon={<Flame size={18} />} options={moods} value={mood} onChange={setMood} />
            <Picker title="Main craving" icon={<Utensils size={18} />} options={cravings} value={craving} onChange={setCraving} />
            <Picker title="Group type" icon={<Heart size={18} />} options={groupTypes} value={groupType} onChange={setGroupType} />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Picker title="Budget" icon={<Wallet size={18} />} options={budgets} value={budget} onChange={setBudget} compact />
              <Picker title="Time" icon={<Clock size={18} />} options={times} value={time} onChange={setTime} compact />
              <label className="space-y-2">
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <MapPin size={18} /> City
                </span>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none ring-primary/40 transition focus:ring-2"
                />
              </label>
            </div>
          </div>
        </div>

        <aside className="flex flex-col justify-center">
          <div className="rounded-lg border border-border bg-card p-5 shadow-lg">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Generated plan for {city}</p>
                <h2 className="mt-1 text-2xl font-semibold">
                  {occasion}: {mood} + {craving}
                </h2>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CravingIcon />
              </div>
            </div>

            <div className="space-y-3">
              {plan.map((step, index) => (
                <div key={step} className="flex gap-3 rounded-md bg-muted/50 p-4">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-6 text-foreground">{step}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md bg-muted/50 p-3">
                <p className="text-muted-foreground">Budget</p>
                <p className="mt-1 font-semibold">{budget}</p>
              </div>
              <div className="rounded-md bg-muted/50 p-3">
                <p className="text-muted-foreground">Time</p>
                <p className="mt-1 font-semibold">{time}</p>
              </div>
            </div>

            <button className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary font-semibold text-primary-foreground transition hover:opacity-90">
              <Share2 size={18} />
              Share This Plan
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
}

interface PickerProps {
  title: string;
  icon: React.ReactNode;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  compact?: boolean;
}

function Picker({ title, icon, options, value, onChange, compact = false }: PickerProps) {
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-2 text-sm font-medium text-foreground">
        {icon} {title}
      </p>
      <div className={cn("grid gap-2", compact ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3")}>
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={cn(
              "min-h-11 rounded-md border px-3 py-2 text-left text-sm transition",
              value === option
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:border-primary/50",
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
