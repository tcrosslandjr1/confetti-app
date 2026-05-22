import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Sparkles, Users, Heart, Flame, Utensils, Wallet, Clock, MapPin,
  Share2, Plane, Martini, Dice5, Mic2, Music, Waves, Cloud,
  Coffee, Library, Landmark, Croissant, Search, Plus, Shuffle,
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
const groupTypes = ["Shared Culture", "Multiracial / Mixed", "Open To Anything"];
const budgets = ["$", "$$", "$$$", "$$$$"];
const times = ["Morning", "Early Evening", "Late Night", "All Night"];

const tripModes = [
  { name: "One Move", stops: 1, detail: "One stop, no pressure" },
  { name: "A Lil' Plan", stops: 2, detail: "Two stops, dinner plus a move" },
  { name: "Oh We Outside", stops: 4, detail: "Three or more stops, full itinerary" },
];

const destinationTypes = [
  "Champagne Brunch","Coffee Date","Breakfast Date","Library Date","Museum Date",
  "Seafood / Crab","Hookah","Lounge","Casino Night","Karaoke","Rooftop","Steakhouse",
];

const quickPicks = [
  { type: "Coffee Date", destination: "The Latte Stop", icon: Coffee },
  { type: "Breakfast Date", destination: "Sunrise Table", icon: Croissant },
  { type: "Champagne Brunch", destination: "Bubbles & Brunch", icon: Martini },
  { type: "Library Date", destination: "The Reading Room", icon: Library },
  { type: "Museum Date", destination: "Gallery Walk", icon: Landmark },
  { type: "Seafood / Crab", destination: "Crab House Cove", icon: Waves },
  { type: "Hookah", destination: "Velvet Smoke", icon: Cloud },
  { type: "Casino Night", destination: "Jackpot After Dark", icon: Dice5 },
];

const destinationMap: Record<string, string[]> = {
  "Champagne Brunch": ["Bubbles & Brunch", "Mimosa Mile", "The Rosé Room"],
  "Coffee Date": ["The Latte Stop", "Espresso Lane", "Coffee Corner"],
  "Breakfast Date": ["Sunrise Table", "Pancake Run", "Morning Plate"],
  "Library Date": ["The Reading Room", "Quiet Pages", "Library Lane"],
  "Museum Date": ["Gallery Walk", "Museum Mile", "The Art Stop"],
  "Seafood / Crab": ["Crab House Cove", "Butter Bay", "Seafood Social"],
  Hookah: ["Velvet Smoke", "Cloud Lounge", "Midnight Mirage"],
  Lounge: ["The Velvet Room", "Luxe Lounge", "After Dark"],
  "Casino Night": ["Jackpot After Dark", "Lucky Table", "Velvet Casino"],
  Karaoke: ["Mic Drop", "Midnight Karaoke", "The Singalong Suite"],
  Rooftop: ["Golden Hour", "Skyline Social", "Rooftop Reserve"],
  Steakhouse: ["The High Table", "Prime Night", "Reservations Only"],
};

function BoardingPassPlanner() {
  const [occasion, setOccasion] = useState("Date Night");
  const [mood, setMood] = useState("Romantic");
  const [destinationType, setDestinationType] = useState("Coffee Date");
  const [groupType, setGroupType] = useState("Open To Anything");
  const [budget, setBudget] = useState("$$");
  const [time, setTime] = useState("Morning");
  const [city, setCity] = useState("Washington, DC");
  const [tripMode, setTripMode] = useState("A Lil' Plan");
  const [customSpot, setCustomSpot] = useState("");
  const [addedSpots, setAddedSpots] = useState<string[]>([]);

  const selectedTrip = tripModes.find((m) => m.name === tripMode) || tripModes[1];

  const destination = useMemo(() => {
    const names = destinationMap[destinationType] || ["The Night Out"];
    if (mood === "Luxe") return names[1] || names[0];
    if (occasion === "Date Night") return names[2] || names[0];
    return names[0];
  }, [destinationType, mood, occasion]);

  const baseStops = useMemo(() => {
    const mixed = groupType.includes("Multiracial");
    const stopSets: Record<string, string[]> = {
      "Coffee Date": [
        "Coffee shop, latte flight, or cozy cafe table",
        "Bookstore walk, park stroll, or quick dessert",
        "Museum, gallery, or scenic photo stop",
        "Dinner, lounge, or late-night tea",
      ],
      "Breakfast Date": [
        "Breakfast spot, pancakes, chicken and waffles, or bakery",
        "Morning walk, market, bookstore, or coffee refill",
        "Museum, park, or low-pressure activity",
        "Dessert, smoothie, or second cafe stop",
      ],
      "Library Date": [
        "Library visit, reading room, or quiet study-style date",
        "Coffee or tea nearby",
        "Bookstore, museum, or park walk",
        "Casual dinner or dessert after",
      ],
      "Museum Date": [
        "Museum or gallery walk",
        "Coffee, tea, or brunch nearby",
        "Bookstore, park, or scenic photo stop",
        "Dinner, jazz, lounge, or dessert",
      ],
      "Champagne Brunch": [
        "Champagne brunch or mimosa tower reservation",
        "Golden-hour photos, shopping, spa, or rooftop stop",
        mixed ? "Passport playlist: everyone adds five songs" : "Music and conversation that match the group's vibe",
        "Dessert lounge, tea, or late-afternoon cocktails",
      ],
      "Seafood / Crab": [
        "Crab house, seafood boil, or waterfront dinner",
        "Fit check and group photo before the table gets messy",
        "Rooftop, lounge, dancing, or hookah after",
        "Late-night bites or one final drink stop",
      ],
      Hookah: [
        "Dinner first: tapas, wings, seafood, or Mediterranean",
        "Hookah lounge with music, mocktails, and couches",
        "Playlist rotation or group-voted music stop",
        "Late-night food run before heading home",
      ],
      "Casino Night": [
        "Steak, seafood, or dressed-up dinner",
        "Casino night, game lounge, cards, or table games",
        "Celebrate wins with a lounge, dessert, or cigar bar",
        "End with late-night diner food, tacos, or pizza",
      ],
    };
    return stopSets[destinationType] || [
      `Start with a ${destinationType.toLowerCase()} anchor`,
      occasion === "Date Night" ? "Add a romantic activity or scenic walk" : "Add one group activity everyone can join",
      mixed ? "Let each person contribute one song, dish, or stop" : "Build around the group's shared style",
      "Close with dessert, lounge, hookah, or late-night food",
    ];
  }, [destinationType, occasion, groupType]);

  const itinerary = [
    ...baseStops.slice(0, selectedTrip.stops),
    ...addedSpots.map((s) => `Added spot: ${s}`),
  ];

  const Icon =
    destinationType === "Coffee Date" ? Coffee :
    destinationType === "Library Date" ? Library :
    destinationType === "Museum Date" ? Landmark :
    destinationType === "Breakfast Date" ? Croissant :
    destinationType === "Casino Night" ? Dice5 :
    destinationType === "Karaoke" ? Mic2 :
    destinationType === "Lounge" ? Martini :
    destinationType === "Seafood / Crab" ? Waves :
    destinationType === "Hookah" ? Cloud : Music;

  function addCustomSpot() {
    if (!customSpot.trim()) return;
    setAddedSpots([...addedSpots, customSpot.trim()]);
    setCustomSpot("");
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground">
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-[0.95fr_1.05fr]">
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
            <Picker title="Destination type" icon={<Utensils size={18} />} options={destinationTypes} value={destinationType} onChange={setDestinationType} />
            <Picker title="Group style" icon={<Heart size={18} />} options={groupTypes} value={groupType} onChange={setGroupType} />

            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                <Shuffle size={18} /> How outside are we?
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {tripModes.map((mode) => (
                  <button
                    key={mode.name}
                    onClick={() => setTripMode(mode.name)}
                    className={cn(
                      "rounded-md border p-3 text-left transition",
                      tripMode === mode.name
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:border-primary/50",
                    )}
                  >
                    <p className="font-semibold">{mode.name}</p>
                    <p className="mt-1 text-xs opacity-80">{mode.detail}</p>
                  </button>
                ))}
              </div>
            </div>

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

            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                <Plus size={18} /> Quick Pick
              </p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {quickPicks.map((pick) => {
                  const QuickIcon = pick.icon;
                  return (
                    <button
                      key={pick.type}
                      onClick={() => setDestinationType(pick.type)}
                      className="min-w-[150px] rounded-md border border-border bg-card p-3 text-left transition hover:border-primary"
                    >
                      <QuickIcon size={20} className="mb-3 text-primary" />
                      <p className="text-sm font-semibold">{pick.destination}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{pick.type}</p>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 text-muted-foreground" size={17} />
                  <input
                    value={customSpot}
                    onChange={(e) => setCustomSpot(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCustomSpot()}
                    placeholder="Look up a spot to add..."
                    className="h-11 w-full rounded-md border border-border bg-background pl-10 pr-3 text-sm outline-none ring-primary/40 transition focus:ring-2"
                  />
                </div>
                <button onClick={addCustomSpot} className="h-11 rounded-md bg-primary px-4 font-semibold text-primary-foreground transition hover:opacity-90">
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-full overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px]">
              <div className="p-6 sm:p-8">
                <div className="mb-8 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Boarding Pass</p>
                    <h2 className="mt-2 text-4xl font-black sm:text-6xl">{destination}</h2>
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
                    <div key={`${item}-${index}`} className="flex gap-3 rounded-md bg-muted/60 p-3">
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
                      <PassField label="Trip Mode" value={tripMode} />
                      <PassField label="Stops" value={`${itinerary.length}`} />
                      <PassField label="Destination Type" value={destinationType} />
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
