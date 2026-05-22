import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Sparkles,
  Users,
  Heart,
  Flame,
  Utensils,
  Wallet,
  Clock,
  MapPin,
  Share2,
  Plane,
  Martini,
  Dice5,
  Mic2,
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
  Navigation,
  CheckCircle2,
  Timer,
  Shield,
} from "lucide-react";

export const Route = createFileRoute("/boarding-pass-planner")({
  head: () => ({
    meta: [
      { title: "Boarding Pass Planner — Confetti" },
      { name: "description", content: "Plan your night out with a live boarding pass and trip crew." },
    ],
  }),
  component: BoardingPassPlanner,
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
  "Champagne Brunch",
  "Coffee Date",
  "Breakfast Date",
  "Library Date",
  "Museum Date",
  "Seafood / Crab",
  "Hookah",
  "Lounge",
  "Casino Night",
  "Karaoke",
  "Rooftop",
  "Steakhouse",
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

type CrewMember = {
  name: string;
  rsvp: string;
  status: string;
  travel: string;
  eta: string;
  location: string;
};

const initialCrew: CrewMember[] = [
  { name: "Maya", rsvp: "Going", status: "En Route", travel: "Uber / Lyft", eta: "12 min", location: "To Stop 1" },
  { name: "Tasha", rsvp: "Going", status: "Getting Ready", travel: "Carpool", eta: "Not started", location: "Pickup pending" },
  { name: "Bri", rsvp: "Going", status: "Landed", travel: "Driving", eta: "Arrived", location: "At Stop 1" },
  { name: "Nia", rsvp: "Maybe", status: "Running Late", travel: "Public Transit", eta: "22 min", location: "Green Line" },
];

const travelModes = ["Uber / Lyft", "Public Transit", "Driving", "Carpool", "Walking"];
const statuses = ["Getting Ready", "En Route", "Landed", "Running Late", "Leaving Soon"];
const rsvps = ["Going", "Maybe", "Can't Make It"];

function BoardingPassPlanner() {
  const [occasion, setOccasion] = useState("Girls Night");
  const [mood, setMood] = useState("Luxe");
  const [destinationType, setDestinationType] = useState("Champagne Brunch");
  const [groupType, setGroupType] = useState("Multiracial / Mixed");
  const [budget, setBudget] = useState("$$$");
  const [time, setTime] = useState("Early Evening");
  const [city, setCity] = useState("Washington, DC");
  const [tripMode, setTripMode] = useState("Oh We Outside");
  const [customSpot, setCustomSpot] = useState("");
  const [addedSpots, setAddedSpots] = useState<string[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>(initialCrew);
  const [inviteName, setInviteName] = useState("");
  const [myStatus, setMyStatus] = useState("Getting Ready");
  const [myTravel, setMyTravel] = useState("Uber / Lyft");
  const [shareEtaOnly, setShareEtaOnly] = useState(true);

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

    return (
      stopSets[destinationType] || [
        `Start with a ${destinationType.toLowerCase()} anchor`,
        occasion === "Date Night" ? "Add a romantic activity or scenic walk" : "Add one group activity everyone can join",
        mixed ? "Let each person contribute one song, dish, or stop" : "Build around the group's shared style",
        "Close with dessert, lounge, hookah, or late-night food",
      ]
    );
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
    destinationType === "Hookah" ? Cloud :
    Music;

  function addCustomSpot() {
    if (!customSpot.trim()) return;
    setAddedSpots([...addedSpots, customSpot.trim()]);
    setCustomSpot("");
  }

  function inviteCrewMember() {
    if (!inviteName.trim()) return;
    setCrew([
      ...crew,
      {
        name: inviteName.trim(),
        rsvp: "Invited",
        status: "Waiting",
        travel: "Not picked",
        eta: "Pending",
        location: "Invite sent",
      },
    ]);
    setInviteName("");
  }

  function updateCrew(index: number, field: keyof CrewMember, value: string) {
    setCrew(crew.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  }

  const enRouteCount = crew.filter((m) => m.status === "En Route").length;
  const landedCount = crew.filter((m) => m.status === "Landed").length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          {/* LEFT: Planner */}
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
              <Picker title="Group type" icon={<Users className="h-3.5 w-3.5" />} options={groupTypes} value={groupType} onChange={setGroupType} />

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
                          : "border-border bg-muted/40 text-foreground hover:border-primary/50"
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
                  <button
                    onClick={addCustomSpot}
                    className="inline-flex items-center gap-1 rounded-md bg-primary px-3 text-sm font-bold text-primary-foreground"
                  >
                    <Plus className="h-4 w-4" /> Add
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT: Boarding Pass + Crew */}
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

            {/* Crew status summary */}
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold">Live crew status</h3>
                  <p className="text-xs text-muted-foreground">Who's pulling up?</p>
                </div>
                <div className="flex gap-2 text-[11px]">
                  <span className="rounded-full bg-primary/10 px-2 py-1 font-bold text-primary">{enRouteCount} en route</span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-1 font-bold text-emerald-600">{landedCount} landed</span>
                </div>
              </div>

              <div className="space-y-2">
                {crew.map((m) => (
                  <div key={m.name} className="rounded-md border border-border bg-muted/30 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">{m.name}</p>
                        <p className="text-[11px] text-muted-foreground">{m.location}</p>
                      </div>
                      <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-bold uppercase">{m.rsvp}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <MiniStat icon={<CheckCircle2 className="h-3 w-3" />} label="Status" value={m.status} />
                      <MiniStat
                        icon={m.travel === "Public Transit" ? <Train className="h-3 w-3" /> : <Car className="h-3 w-3" />}
                        label="Travel"
                        value={m.travel}
                      />
                      <MiniStat icon={<Timer className="h-3 w-3" />} label="ETA" value={m.eta} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Bottom: Crew controls */}
        <div className="mt-6">
          <CrewPanel
            crew={crew}
            inviteName={inviteName}
            setInviteName={setInviteName}
            inviteCrewMember={inviteCrewMember}
            updateCrew={updateCrew}
            myStatus={myStatus}
            setMyStatus={setMyStatus}
            myTravel={myTravel}
            setMyTravel={setMyTravel}
            shareEtaOnly={shareEtaOnly}
            setShareEtaOnly={setShareEtaOnly}
          />
        </div>
      </div>
    </div>
  );
}

function CrewPanel({
  crew,
  inviteName,
  setInviteName,
  inviteCrewMember,
  updateCrew,
  myStatus,
  setMyStatus,
  myTravel,
  setMyTravel,
  shareEtaOnly,
  setShareEtaOnly,
}: {
  crew: CrewMember[];
  inviteName: string;
  setInviteName: (v: string) => void;
  inviteCrewMember: () => void;
  updateCrew: (i: number, f: keyof CrewMember, v: string) => void;
  myStatus: string;
  setMyStatus: (v: string) => void;
  myTravel: string;
  setMyTravel: (v: string) => void;
  shareEtaOnly: boolean;
  setShareEtaOnly: (v: boolean) => void;
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
        <button
          onClick={inviteCrewMember}
          className="inline-flex items-center gap-1 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Invite
        </button>
      </div>

      <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4">
        <p className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <Navigation className="h-3.5 w-3.5" /> How we pullin' up
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField label="My status" value={myStatus} options={statuses} onChange={setMyStatus} />
          <SelectField label="My travel" value={myTravel} options={travelModes} onChange={setMyTravel} />
        </div>

        <button
          onClick={() => setShareEtaOnly(!shareEtaOnly)}
          className={`mt-3 flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition ${
            shareEtaOnly
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-foreground"
          }`}
        >
          <Shield className="h-4 w-4" />
          Share ETA only, not exact location
        </button>
      </div>

      <div className="mt-5 space-y-2">
        {crew.map((m, i) => (
          <div key={m.name + i} className="rounded-md border border-border bg-muted/30 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-bold">{m.name}</p>
              <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-bold uppercase">{m.eta}</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <SelectField label="RSVP" value={m.rsvp} options={rsvps} onChange={(v) => updateCrew(i, "rsvp", v)} />
              <SelectField label="Status" value={m.status} options={statuses} onChange={(v) => updateCrew(i, "status", v)} />
              <SelectField label="Travel" value={m.travel} options={travelModes} onChange={(v) => updateCrew(i, "travel", v)} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Picker({
  title,
  icon,
  options,
  value,
  onChange,
  compact = false,
}: {
  title: string;
  icon: React.ReactNode;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  compact?: boolean;
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
                : "border-border bg-muted/40 text-foreground hover:border-primary/50"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-md border border-border bg-card px-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md bg-card p-2">
      <div className="flex items-center gap-1 text-muted-foreground">{icon}<span className="text-[9px] font-bold uppercase tracking-wider">{label}</span></div>
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
