import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Sparkles, Users, Heart, Flame, Utensils, Wallet, Clock, MapPin,
  Share2, Plane, Martini, Dice5, Mic2, Music, Waves, Cloud,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/boarding-pass-planner")({
  component: BoardingPassPlanner,
  head: () => ({
    meta: [
      { title: "Boarding Pass Planner — Confetti" },
      { name: "description", content: "Pick the vibe; get a boarding pass for the night." },
    ],
  }),
});

const occasions = ["Girls Night", "Guys Night", "Date Night", "Group Hangout"];
const moods = ["Chill", "Romantic", "Turn Up", "Luxe", "Competitive", "Foodie"];
const cravings = [
  "Champagne Brunch","Seafood / Crab","Hookah","Lounge","Casino Night",
  "Karaoke","Dancing","Comedy","Rooftop","Steakhouse",
];
const groupTypes = ["Shared Culture", "Multiracial / Mixed", "Open To Anything"];
const budgets = ["$", "$$", "$$$", "$$$$"];
const times = ["Early Evening", "Late Night", "All Night"];

const destinationMap: Record<string, string[]> = {
  "Champagne Brunch": ["Bubbles & Brunch", "Mimosa Mile", "The Rosé Room"],
  "Seafood / Crab": ["Crab House Cove", "Butter Bay", "Seafood Social"],
  Hookah: ["Velvet Smoke", "Cloud Lounge", "Midnight Mirage"],
  Lounge: ["The Velvet Room", "Luxe Lounge", "After Dark"],
  "Casino Night": ["Jackpot After Dark", "Lucky Table", "Velvet Casino"],
  Karaoke: ["Mic Drop", "Midnight Karaoke", "The Singalong Suite"],
  Dancing: ["Rhythm District", "Dancefloor Drive", "After Hours"],
  Comedy: ["The Laugh Lounge", "Comedy Corner", "Punchline Place"],
  Rooftop: ["Golden Hour", "Skyline Social", "Rooftop Reserve"],
  Steakhouse: ["The High Table", "Prime Night", "Reservations Only"],
};

function BoardingPassPlanner() {
  const [occasion, setOccasion] = useState("Girls Night");
  const [mood, setMood] = useState("Luxe");
  const [craving, setCraving] = useState("Champagne Brunch");
  const [groupType, setGroupType] = useState("Multiracial / Mixed");
  const [budget, setBudget] = useState("$$$");
  const [time, setTime] = useState("Early Evening");
  const [city, setCity] = useState("Washington, DC");

  const destination = useMemo(() => {
    const names = destinationMap[craving] || ["The Night Out"];
    if (mood === "Luxe" && craving !== "Champagne Brunch") return names[1] || names[0];
    if (occasion === "Date Night") return names[2] || names[0];
    return names[0];
  }, [craving, mood, occasion]);

  const itinerary = useMemo(() => {
    const mixed = groupType.includes("Multiracial");
    if (craving === "Champagne Brunch") return [
      "Champagne brunch or mimosa tower reservation",
      "Golden-hour photos, shopping, spa, or rooftop stop",
      mixed ? "Passport playlist: everyone adds five songs" : "Music and conversation that match the group's vibe",
      "Dessert lounge, tea, or late-afternoon cocktails",
    ];
    if (craving === "Seafood / Crab") return [
      "Crab house, seafood boil, or waterfront dinner",
      "Fit check and group photo before the table gets messy",
      mood === "Turn Up" ? "Rooftop, lounge, dancing, or hookah after" : "Comedy, dessert, walk, or laid-back lounge",
      "Late-night bites or one final drink stop",
    ];
    if (craving === "Hookah") return [
      "Dinner first: tapas, wings, seafood, or Mediterranean",
      "Hookah lounge with music, mocktails, and couches",
      mixed ? "Rotate the playlist so everyone gets a moment" : "Pick the room based on the group's shared music taste",
      "Late-night food run before heading home",
    ];
    if (craving === "Casino Night") return [
      "Steak, seafood, or dressed-up dinner",
      "Casino night, game lounge, cards, or table games",
      "Celebrate wins with a lounge, dessert, or cigar bar",
      "End with late-night diner food, tacos, or pizza",
    ];
    return [
      `Start with a ${craving.toLowerCase()} anchor`,
      occasion === "Date Night" ? "Add a romantic activity or scenic walk" : "Add one group activity everyone can join",
      mixed ? "Let each person contribute one song, dish, or stop" : "Build around the group's shared style",
      "Close with dessert, lounge, hookah, or late-night food",
    ];
  }, [craving, occasion, mood, groupType]);

  const Icon =
    craving === "Casino Night" ? Dice5 :
    craving === "Karaoke" ? Mic2 :
    craving === "Lounge" ? Martini :
    craving === "Seafood / Crab" ? Waves :
    craving === "Hookah" ? Cloud : Music;

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground">
      <section className="mx-auto grid min-h-[calc(100vh-48px)] max-w-7xl grid-cols-1 gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles size={22} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Night-out boarding pass</p>
              <h1 className="text-3xl font-semibold sm:text-4xl">Where are we headed?</h1>
            </div>
          </div>

          <div className="space-y-6">
            <Picker title="Boarding group" icon={<Users size={18} />} options={occasions} value={occasion} onChange={setOccasion} />
            <Picker title="Mood" icon={<Flame size={18} />} options={moods} value={mood} onChange={setMood} />
            <Picker title="Destination type" icon={<Utensils size={18} />} options={cravings} value={craving} onChange={setCraving} />
            <Picker title="Group style" icon={<Heart size={18} />} options={groupTypes} value={groupType} onChange={setGroupType} />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Picker title="Fare" icon={<Wallet size={18} />} options={budgets} value={budget} onChange={setBudget} compact />
              <Picker title="Boarding time" icon={<Clock size={18} />} options={times} value={time} onChange={setTime} compact />
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

        <div className="flex items-center">
          <div className="w-full overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px]">
              <div className="p-6 sm:p-8">
                <div className="mb-8 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
                      Boarding Pass
                    </p>
                    <h2 className="mt-2 text-4xl font-black tracking-normal sm:text-6xl">
                      {destination}
                    </h2>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Icon size={24} />
                  </div>
                </div>

                <div className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <PassField label="From" value={city} />
                  <PassField label="Group" value={occasion} />
                  <PassField label="Mood" value={mood} />
                  <PassField label="Fare" value={budget} />
                </div>

                <div className="space-y-3">
                  {itinerary.map((item, index) => (
                    <div key={item} className="flex gap-3 rounded-md bg-muted/60 p-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-6">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-dashed border-border bg-muted/40 p-6 lg:border-l lg:border-t-0">
                <div className="flex h-full flex-col justify-between gap-6">
                  <div>
                    <div className="mb-5 flex items-center gap-2 text-primary">
                      <Plane size={20} />
                      <p className="text-sm font-bold uppercase tracking-[0.16em]">Gate VIBE</p>
                    </div>
                    <div className="space-y-4">
                      <PassField label="Boarding" value={time} />
                      <PassField label="Destination Type" value={craving} />
                      <PassField label="Group Style" value={groupType} />
                    </div>
                  </div>
                  <button className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary font-semibold text-primary-foreground transition hover:opacity-90">
                    <Share2 size={18} />
                    Share Pass
                  </button>
                </div>
              </div>
            </div>
            <div className="flex h-12 items-center justify-center border-t border-dashed border-border bg-primary px-4 text-center text-xs font-bold uppercase tracking-[0.22em] text-primary-foreground">
              Your destination is ready
            </div>
          </div>
        </div>
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

function PassField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}
