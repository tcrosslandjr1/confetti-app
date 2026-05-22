import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Sparkles,
  Flame,
  Utensils,
  Wallet,
  Clock,
  MapPin,
  Share2,
  Plane,
  Martini,
  Music,
  Waves,
  Cloud,
  Coffee,
  Library,
  Landmark,
  Croissant,
  Search,
  Plus,
  Car,
  Train,
  UserPlus,
  Shield,
  Star,
  MessageCircle,
  ReceiptText,
  Camera,
  RotateCcw,
  Database,
  ThumbsUp,
  ThumbsDown,
  Heart,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/boarding-pass-planner")({
  head: () => ({
    meta: [
      { title: "Boarding Pass Planner — Confetti" },
      { name: "description", content: "Plan, invite crew, and learn the vibe before you go." },
    ],
  }),
  component: BoardingPassPlanner,
});

const occasions = ["Girls Night", "Guys Night", "Date Night", "Group Hangout"];
const moods = ["Chill", "Romantic", "Turn Up", "Luxe", "Competitive", "Foodie"];
const budgets = ["$", "$$", "$$$", "$$$$"];
const times = ["Morning", "Early Evening", "Late Night", "All Night"];

const tripModes = [
  { name: "One Move", stops: 1, detail: "One stop, no pressure" },
  { name: "A Lil' Plan", stops: 2, detail: "Two stops, dinner plus a move" },
  { name: "Oh We Outside", stops: 4, detail: "Three or more stops, full itinerary" },
];

const destinationTypes = [
  "Champagne Brunch",
  "Coffee Date",
  "Breakfast Date",
  "Library Date",
  "Museum Date",
  "Seafood / Crab",
  "Hookah",
  "Lounge",
  "Rooftop",
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
  Rooftop: ["Golden Hour", "Skyline Social", "Rooftop Reserve"],
};

type VenueIntel = {
  venue: string;
  photo: string;
  ordered: string[];
  talkedAbout: string[];
  watchOut: string;
  bestFor: string;
};

const venueIntel: Record<string, VenueIntel> = {
  "Champagne Brunch": {
    venue: "Brunch House Social",
    photo: "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=900&q=80",
    ordered: ["Mimosa tower", "Chicken & waffles", "Shrimp & grits"],
    talkedAbout: ["Birthday brunch energy", "Loud music", "Photo-friendly plates"],
    watchOut: "Reservations run behind after 1 PM.",
    bestFor: "Groups, celebrations, luxe daytime plans",
  },
  "Coffee Date": {
    venue: "The Corner Cafe",
    photo: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80",
    ordered: ["Lavender latte", "Cold brew", "Almond croissant"],
    talkedAbout: ["Cozy seating", "First-date friendly", "Quiet morning vibe"],
    watchOut: "Limited seating during weekend rush.",
    bestFor: "Low-pressure dates and soft starts",
  },
  "Breakfast Date": {
    venue: "Sunrise Kitchen",
    photo: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=900&q=80",
    ordered: ["Pancake stack", "Breakfast tacos", "Fresh juice"],
    talkedAbout: ["Fast service", "Casual vibe", "Good early meetups"],
    watchOut: "Best before 10:30 AM.",
    bestFor: "Morning dates and easy plans",
  },
  "Library Date": {
    venue: "City Reading Room",
    photo: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=80",
    ordered: ["Coffee nearby", "Tea nearby", "Bookstore stop after"],
    talkedAbout: ["Quiet chemistry", "Study-date vibe", "Cute walking route"],
    watchOut: "Keep the plan short if conversation is flowing.",
    bestFor: "Soft dates, introverts, book lovers",
  },
  "Museum Date": {
    venue: "Modern Gallery Walk",
    photo: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=900&q=80",
    ordered: ["Cafe latte", "Museum cafe pastry", "Wine bar after"],
    talkedAbout: ["Conversation starters", "Cute photos", "Easy second stop"],
    watchOut: "Some exhibits require timed entry.",
    bestFor: "Dates with built-in conversation",
  },
  "Seafood / Crab": {
    venue: "Crab House Cove",
    photo: "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=900&q=80",
    ordered: ["Snow crab legs", "Garlic butter shrimp", "Seafood boil bag"],
    talkedAbout: ["Messy but fun", "Big group tables", "Strong sauces"],
    watchOut: "Not ideal before an upscale lounge unless you plan time to reset.",
    bestFor: "Groups, loud dinners, casual fun",
  },
  Hookah: {
    venue: "Velvet Smoke Lounge",
    photo: "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?auto=format&fit=crop&w=900&q=80",
    ordered: ["Mint hookah", "Lemon drop mocktail", "Wings"],
    talkedAbout: ["Good couches", "Late-night music", "Chill group energy"],
    watchOut: "Crowd changes after midnight.",
    bestFor: "Late-night linkups and long conversations",
  },
  Lounge: {
    venue: "The Velvet Room",
    photo: "https://images.unsplash.com/photo-1575444758702-4a6b9222336e?auto=format&fit=crop&w=900&q=80",
    ordered: ["Signature cocktail", "Small plates", "Bottle service"],
    talkedAbout: ["Dressy crowd", "Music gets better late", "Good lighting"],
    watchOut: "Check dress code before going.",
    bestFor: "Luxe dates, girls night, grown vibe",
  },
  Rooftop: {
    venue: "Skyline Social",
    photo: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=900&q=80",
    ordered: ["Rosé", "Sliders", "Spritz"],
    talkedAbout: ["Views", "Golden hour", "Photos"],
    watchOut: "Weather can change the whole vibe.",
    bestFor: "Photo-ready plans and pre-lounge stops",
  },
};

const quickPicks = [
  { type: "Coffee Date", destination: "The Latte Stop", icon: Coffee },
  { type: "Breakfast Date", destination: "Sunrise Table", icon: Croissant },
  { type: "Champagne Brunch", destination: "Bubbles & Brunch", icon: Martini },
  { type: "Library Date", destination: "The Reading Room", icon: Library },
  { type: "Museum Date", destination: "Gallery Walk", icon: Landmark },
  { type: "Seafood / Crab", destination: "Crab House Cove", icon: Waves },
  { type: "Hookah", destination: "Velvet Smoke", icon: Cloud },
];

type CrewMember = { name: string; status: string; travel: string; eta: string };

const initialCrew: CrewMember[] = [
  { name: "Maya", status: "En Route", travel: "Uber / Lyft", eta: "12 min" },
  { name: "Tasha", status: "Getting Ready", travel: "Carpool", eta: "Not started" },
  { name: "Bri", status: "Landed", travel: "Driving", eta: "Arrived" },
];

function BoardingPassPlanner() {
  const [occasion, setOccasion] = useState("Date Night");
  const [mood, setMood] = useState("Romantic");
  const [destinationType, setDestinationType] = useState("Coffee Date");
  const [budget, setBudget] = useState("$$");
  const [time, setTime] = useState("Morning");
  const [city, setCity] = useState("Washington, DC");
  const [tripMode, setTripMode] = useState("A Lil' Plan");
  const [customSpot, setCustomSpot] = useState("");
  const [addedSpots, setAddedSpots] = useState<string[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>(initialCrew);
  const [inviteName, setInviteName] = useState("");
  const [locationMode, setLocationMode] = useState("Trip Mode Only");
  const [learnVibe, setLearnVibe] = useState(true);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

  const selectedTrip = tripModes.find((m) => m.name === tripMode) || tripModes[1];
  const intel = venueIntel[destinationType] || venueIntel["Coffee Date"];

  const destination = useMemo(() => {
    const names = destinationMap[destinationType] || ["The Night Out"];
    if (mood === "Luxe") return names[1] || names[0];
    if (occasion === "Date Night") return names[2] || names[0];
    return names[0];
  }, [destinationType, mood, occasion]);

  const baseStops = useMemo(() => {
    const stopSets: Record<string, string[]> = {
      "Coffee Date": ["Coffee shop, latte flight, or cozy cafe table", "Bookstore walk, park stroll, or quick dessert", "Museum, gallery, or scenic photo stop", "Dinner, lounge, or late-night tea"],
      "Breakfast Date": ["Breakfast spot, pancakes, chicken and waffles, or bakery", "Morning walk, market, bookstore, or coffee refill", "Museum, park, or low-pressure activity", "Dessert, smoothie, or second cafe stop"],
      "Library Date": ["Library visit, reading room, or quiet study-style date", "Coffee or tea nearby", "Bookstore, museum, or park walk", "Casual dinner or dessert after"],
      "Museum Date": ["Museum or gallery walk", "Coffee, tea, or brunch nearby", "Bookstore, park, or scenic photo stop", "Dinner, jazz, lounge, or dessert"],
      "Champagne Brunch": ["Champagne brunch or mimosa tower reservation", "Golden-hour photos, shopping, spa, or rooftop stop", "Passport playlist: everyone adds five songs", "Dessert lounge, tea, or late-afternoon cocktails"],
      "Seafood / Crab": ["Crab house, seafood boil, or waterfront dinner", "Fit check and group photo before the table gets messy", "Rooftop, lounge, dancing, or hookah after", "Late-night bites or one final drink stop"],
      Hookah: ["Dinner first: tapas, wings, seafood, or Mediterranean", "Hookah lounge with music, mocktails, and couches", "Playlist rotation or group-voted music stop", "Late-night food run before heading home"],
      Lounge: ["Dinner or small plates nearby", "Lounge with music, drinks, and dress-code energy", "Rooftop or photo stop after", "Late-night food or dessert"],
      Rooftop: ["Golden-hour rooftop reservation", "Small plates, drinks, or mocktails", "Lounge, dancing, or hookah after", "Dessert or late-night food"],
    };
    return stopSets[destinationType] || [`Start with ${destinationType}`, "Add one activity", "Close with dessert or late-night food"];
  }, [destinationType]);

  const itinerary = [...baseStops.slice(0, selectedTrip.stops), ...addedSpots.map((s) => `Added spot: ${s}`)];

  const Icon =
    destinationType === "Coffee Date" ? Coffee :
    destinationType === "Library Date" ? Library :
    destinationType === "Museum Date" ? Landmark :
    destinationType === "Breakfast Date" ? Croissant :
    destinationType === "Lounge" ? Martini :
    destinationType === "Seafood / Crab" ? Waves :
    destinationType === "Hookah" ? Cloud :
    Music;

  function addCustomSpot() {
    if (!customSpot.trim()) return;
    setAddedSpots([...addedSpots, customSpot.trim()]);
    setCustomSpot("");
  }

  function inviteCrewMember() {
    if (!inviteName.trim()) return;
    setCrew([...crew, { name: inviteName.trim(), status: "Invited", travel: "Not picked", eta: "Pending" }]);
    setInviteName("");
  }

  function toggleFlip(index: number) {
    setFlippedCards({ ...flippedCards, [index]: !flippedCards[index] });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          {/* LEFT */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold">Night-out boarding pass</h1>
                <p className="text-xs text-muted-foreground">Where are we headed?</p>
              </div>
            </div>

            <div className="space-y-4">
              <Picker title="Occasion" icon={<Heart className="h-3.5 w-3.5" />} options={occasions} value={occasion} onChange={setOccasion} />
              <Picker title="Mood" icon={<Flame className="h-3.5 w-3.5" />} options={moods} value={mood} onChange={setMood} />
              <Picker title="Destination type" icon={<Utensils className="h-3.5 w-3.5" />} options={destinationTypes} value={destinationType} onChange={setDestinationType} />

              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <Plane className="h-3.5 w-3.5" /> How outside are we?
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {tripModes.map((m) => (
                    <button
                      key={m.name}
                      onClick={() => setTripMode(m.name)}
                      className={`rounded-md border p-3 text-left transition ${
                        tripMode === m.name
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-muted/40 hover:border-primary/50"
                      }`}
                    >
                      <p className="text-sm font-bold">{m.name}</p>
                      <p className="mt-0.5 text-[11px] opacity-80">{m.detail}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Picker title="Budget" icon={<Wallet className="h-3.5 w-3.5" />} options={budgets} value={budget} onChange={setBudget} compact />
                <Picker title="Time" icon={<Clock className="h-3.5 w-3.5" />} options={times} value={time} onChange={setTime} compact />
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> City
                  </p>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="h-11 w-full rounded-md border border-border bg-muted/40 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" /> Quick Pick
                </p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {quickPicks.map((pick) => {
                    const QIcon = pick.icon;
                    return (
                      <button
                        key={pick.type}
                        onClick={() => setDestinationType(pick.type)}
                        className="min-w-[150px] shrink-0 rounded-md border border-border bg-muted/30 p-3 text-left hover:border-primary"
                      >
                        <QIcon className="h-4 w-4 text-primary" />
                        <p className="mt-1 text-sm font-bold">{pick.destination}</p>
                        <p className="text-[11px] text-muted-foreground">{pick.type}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={customSpot}
                      onChange={(e) => setCustomSpot(e.target.value)}
                      placeholder="Look up a spot to add..."
                      className="h-11 w-full rounded-md border border-border bg-muted/40 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <button onClick={addCustomSpot} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 text-sm font-bold text-primary-foreground">
                    <Plus className="h-4 w-4" /> Add
                  </button>
                </div>
              </div>

              <TripMemoryControls
                locationMode={locationMode}
                setLocationMode={setLocationMode}
                learnVibe={learnVibe}
                setLearnVibe={setLearnVibe}
              />
            </div>
          </section>

          {/* RIGHT */}
          <div className="space-y-6">
            <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-80">Boarding Pass</p>
                    <h2 className="mt-1 font-display text-2xl font-bold">{destination}</h2>
                  </div>
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/15 backdrop-blur">
                    <Icon className="h-6 w-6" />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-4 gap-3 border-t border-white/20 pt-4">
                  <PassField label="Occasion" value={occasion} />
                  <PassField label="Mood" value={mood} />
                  <PassField label="City" value={city} />
                  <PassField label="Time" value={time} />
                </div>
              </div>

              <div className="space-y-2 p-5">
                {itinerary.map((item, i) => (
                  <div key={i} className="flex gap-3 rounded-md border border-border bg-muted/30 p-3">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {i + 1}
                    </div>
                    <p className="text-sm">{item}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-border bg-muted/30 px-5 py-3">
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> Gate VIBE</span>
                  <PassField label="Trip" value={tripMode} small />
                  <PassField label="Stops" value={String(itinerary.length)} small />
                  <PassField label="Budget" value={budget} small />
                </div>
                <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">
                  <Share2 className="h-3.5 w-3.5" /> Share
                </button>
              </div>
              <div className="border-t border-border bg-primary/5 px-5 py-2 text-center font-mono text-[10px] uppercase tracking-widest text-primary">
                Live trip ready
              </div>
            </section>

            <FlipCards itinerary={itinerary} intel={intel} flippedCards={flippedCards} toggleFlip={toggleFlip} />

            <CrewPanel crew={crew} inviteName={inviteName} setInviteName={setInviteName} inviteCrewMember={inviteCrewMember} />

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Star className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold">Vibe Report</h3>
                  <p className="text-xs text-muted-foreground">Save what the crew learned</p>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {["Food", "Music", "Crowd"].map((item) => <FeedbackCard key={item} label={item} />)}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlipCards({ itinerary, intel, flippedCards, toggleFlip }: {
  itinerary: string[]; intel: VenueIntel; flippedCards: Record<number, boolean>; toggleFlip: (i: number) => void;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-bold">Pre-event cards</h3>
          <p className="text-xs text-muted-foreground">Tap a stop to flip for venue intel</p>
        </div>
        <RotateCcw className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {itinerary.map((stop, index) => {
          const flipped = flippedCards[index];
          return (
            <button
              key={index}
              onClick={() => toggleFlip(index)}
              className="min-h-[340px] min-w-[260px] shrink-0 overflow-hidden rounded-lg border border-border bg-muted/30 text-left transition hover:border-primary"
            >
              {!flipped ? (
                <div>
                  <img src={intel.photo} alt={intel.venue} className="h-36 w-full object-cover" />
                  <div className="p-3">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Stop {index + 1}</p>
                    <p className="mt-1 text-sm font-bold">{intel.venue}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{stop}</p>
                    <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-primary">Tap to flip for highlights</p>
                  </div>
                </div>
              ) : (
                <div className="p-3">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Social + Review Buzz</p>
                  <p className="mt-1 text-sm font-bold">{intel.venue}</p>
                  <div className="mt-3 space-y-3">
                    <InfoList icon={<ReceiptText className="h-3 w-3" />} title="People order" items={intel.ordered} />
                    <InfoList icon={<MessageCircle className="h-3 w-3" />} title="People talk about" items={intel.talkedAbout} />
                    <div className="rounded-md border border-primary/30 bg-primary/5 p-2">
                      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                        <Camera className="h-3 w-3" /> Best for
                      </p>
                      <p className="mt-0.5 text-xs">{intel.bestFor}</p>
                    </div>
                    <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2">
                      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                        <Shield className="h-3 w-3" /> Heads up
                      </p>
                      <p className="mt-0.5 text-xs">{intel.watchOut}</p>
                    </div>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function TripMemoryControls({ locationMode, setLocationMode, learnVibe, setLearnVibe }: {
  locationMode: string; setLocationMode: (v: string) => void; learnVibe: boolean; setLearnVibe: (v: boolean) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <p className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        <Database className="h-3.5 w-3.5" /> Trip Memory
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        {["Off", "ETA Only", "Trip Mode Only"].map((mode) => (
          <button
            key={mode}
            onClick={() => setLocationMode(mode)}
            className={`rounded-md border px-3 py-2 text-left text-sm transition ${
              locationMode === mode ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>
      <button
        onClick={() => setLearnVibe(!learnVibe)}
        className={`mt-3 flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition ${
          learnVibe ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
        }`}
      >
        <Sparkles className="h-4 w-4" />
        Learn my vibe anonymously for better future suggestions
      </button>
    </div>
  );
}

function CrewPanel({ crew, inviteName, setInviteName, inviteCrewMember }: {
  crew: CrewMember[]; inviteName: string; setInviteName: (v: string) => void; inviteCrewMember: () => void;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <UserPlus className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold">Invite Crew</h3>
          <p className="text-xs text-muted-foreground">Same pass, live updates</p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          value={inviteName}
          onChange={(e) => setInviteName(e.target.value)}
          placeholder="Invite by name, phone, or @handle"
          className="h-11 flex-1 rounded-md border border-border bg-muted/40 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button onClick={inviteCrewMember} className="inline-flex items-center gap-1 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground">
          <Plus className="h-4 w-4" /> Invite
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {crew.map((m, i) => (
          <div key={i} className="rounded-md border border-border bg-muted/30 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-bold">{m.name}</p>
              <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-bold uppercase">{m.eta}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <MiniStat icon={<CheckCircle2 className="h-3 w-3" />} label="Status" value={m.status} />
              <MiniStat icon={m.travel === "Public Transit" ? <Train className="h-3 w-3" /> : <Car className="h-3 w-3" />} label="Travel" value={m.travel} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Picker({ title, icon, options, value, onChange, compact = false }: {
  title: string; icon: React.ReactNode; options: string[]; value: string; onChange: (v: string) => void; compact?: boolean;
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {icon} {title}
      </p>
      <div className={`grid gap-2 ${compact ? "grid-cols-4" : "grid-cols-2 sm:grid-cols-3"}`}>
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`min-h-11 rounded-md border px-3 py-2 text-left text-sm transition ${
              value === option
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-muted/40 hover:border-primary/50"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function InfoList({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <div>
      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {icon} {title}
      </p>
      <ul className="mt-1 space-y-0.5">
        {items.map((item) => (
          <li key={item} className="text-xs">• {item}</li>
        ))}
      </ul>
    </div>
  );
}

function FeedbackCard({ label }: { label: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-3">
      <p className="text-sm font-bold">{label}</p>
      <div className="mt-2 flex gap-2">
        <button className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-border bg-card px-2 py-1.5 text-xs hover:border-primary">
          <ThumbsUp className="h-3 w-3" /> Loved
        </button>
        <button className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-border bg-card px-2 py-1.5 text-xs hover:border-primary">
          <ThumbsDown className="h-3 w-3" /> Skip
        </button>
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md bg-card p-2">
      <div className="flex items-center gap-1 text-muted-foreground">
        {icon}
        <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-0.5 text-[11px] font-bold">{value}</p>
    </div>
  );
}

function PassField({ label, value, small = false }: { label: string; value: string; small?: boolean }) {
  return (
    <div>
      <p className={`font-mono ${small ? "text-[9px]" : "text-[10px]"} uppercase tracking-wider opacity-70`}>{label}</p>
      <p className={`mt-0.5 font-bold ${small ? "text-xs" : "text-sm"}`}>{value}</p>
    </div>
  );
}
