import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  Clock,
  DollarSign,
  Flame,
  Globe,
  AlertTriangle,
  Heart,
  Loader2,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Share2,
  Sparkles,
  Star,
  Utensils,
  Wine,
  X,
} from "lucide-react";
import { useWizard } from "./wizard-context";
import { useConfettiBurst } from "@/components/ConfettiBurst";
import { buildSmartSearchUrl } from "@/lib/maps-links";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getStoredLocation, requestUserLocation } from "@/lib/location";
import { getActiveLocation, getSelectedCity } from "@/lib/cities";
import { useAuth } from "@/lib/auth-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getDishInfo, dishMatches, hasAllergenConflict, ALL_DISH_NAMES, type DietFilter } from "@/lib/dish-info";
import { StopShareCard, type StopShareData } from "./StopShareCard";
import { toPng } from "html-to-image";
import { useNavigate } from "@tanstack/react-router";
import {
  getActiveLoop,
  setActiveLoop,
  makeDemoLoop,
  type ActiveLoop,
  type LoopStop,
} from "@/lib/loop-store";

type FavRow = {
  venue_name: string;
  vibe: string | null;
  tone: string | null;
  address: string | null;
  neighborhood: string | null;
};

type Vibe = { k: string; label: string; emoji: string; tone: string };
type Crew = { k: string; label: string; sub: string };
type When = { k: string; label: string };
type Budget = { k: string; label: string; sub: string };
type MustHave = { k: string; label: string };

const VIBES: Vibe[] = [
  { k: "rooftop", label: "Rooftop Chill", emoji: "🌇", tone: "bg-coral" },
  { k: "dance", label: "Dance Floor", emoji: "💃", tone: "bg-purple" },
  { k: "speakeasy", label: "Speakeasy", emoji: "🥃", tone: "bg-gold" },
  { k: "live", label: "Live Music", emoji: "🎷", tone: "bg-pink-300" },
  { k: "bougie", label: "Bougie Dinner", emoji: "🥂", tone: "bg-emerald-400" },
  { k: "dive", label: "Dive Bar", emoji: "🍻", tone: "bg-amber-300" },
  { k: "late", label: "Late Night Eats", emoji: "🍜", tone: "bg-sky-300" },
];

const CREW: Crew[] = [
  { k: "solo", label: "Just me", sub: "1" },
  { k: "date", label: "Date night", sub: "2" },
  { k: "small", label: "Small group", sub: "3–5" },
  { k: "squad", label: "Squad", sub: "6+" },
];

const WHEN: When[] = [
  { k: "tonight", label: "Tonight" },
  { k: "weekend", label: "This weekend" },
  { k: "pick", label: "Pick a date" },
];

const BUDGETS: Budget[] = [
  { k: "$", label: "$", sub: "cheap eats" },
  { k: "$$", label: "$$", sub: "comfortable" },
  { k: "$$$", label: "$$$", sub: "treat yourself" },
  { k: "$$$$", label: "$$$$", sub: "no ceiling" },
];

const MUSTS: MustHave[] = [
  { k: "live", label: "Live music" },
  { k: "outdoor", label: "Outdoor seating" },
  { k: "late", label: "Late-night" },
  { k: "kids", label: "Kid-friendly" },
  { k: "walk", label: "Walkable" },
  { k: "ig", label: "Instagram-worthy" },
];

const LOADING_LINES = [
  "Scanning the city…",
  "Filtering out boring spots…",
  "Cross-checking reservations…",
  "Curating your night…",
  "Plating it up…",
];

type Stop = {
  time: string;
  venue: string;
  vibe: string;
  tone: string;
  walk?: string;
  address?: string;
  neighborhood?: string;
  vibeKey?: string;
  placeId?: string;
  photo?: string | null;
  lat?: number;
  lng?: number;
};

type SwapCandidate = {
  id: string;
  venue: string;
  address?: string;
  neighborhood?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: number | null;
  photo?: string | null;
  lat?: number;
  lng?: number;
  vibeKey?: string | null;
  vibeLabel?: string;
  tone?: string;
  time?: string;
};

const SAMPLE_STOPS: Stop[][] = [
  [
    {
      time: "7:00 PM",
      venue: "Le Diplomate",
      vibe: "French bistro",
      tone: "bg-coral",
      walk: "10 min walk",
      address: "1601 14th St NW",
      neighborhood: "14th Street",
    },
    {
      time: "8:30 PM",
      venue: "Service Bar DC",
      vibe: "Craft cocktails",
      tone: "bg-purple",
      walk: "6 min walk",
      address: "926-928 U St NW",
      neighborhood: "U Street",
    },
    {
      time: "10:15 PM",
      venue: "Maydan",
      vibe: "Live-fire nightcap",
      tone: "bg-gold",
      address: "1346 Florida Ave NW",
      neighborhood: "U Street",
    },
  ],
  [
    {
      time: "6:30 PM",
      venue: "Rose's Luxury",
      vibe: "Bougie dinner",
      tone: "bg-emerald-400",
      walk: "8 min walk",
      address: "717 8th St SE",
      neighborhood: "Capitol Hill",
    },
    {
      time: "8:45 PM",
      venue: "Allegory",
      vibe: "Speakeasy",
      tone: "bg-gold",
      walk: "4 min walk",
      address: "1015 H St NW",
      neighborhood: "Mt Vernon Triangle",
    },
    {
      time: "10:30 PM",
      venue: "Flash",
      vibe: "Late dance",
      tone: "bg-purple",
      address: "645 Florida Ave NW",
      neighborhood: "Shaw",
    },
  ],
  [
    {
      time: "8:00 PM",
      venue: "All-Purpose Pizzeria",
      vibe: "Slice + spritz",
      tone: "bg-coral",
      walk: "5 min walk",
      address: "1250 9th St NW",
      neighborhood: "Shaw",
    },
    {
      time: "9:30 PM",
      venue: "Blues Alley",
      vibe: "Live jazz trio",
      tone: "bg-pink-300",
      walk: "7 min walk",
      address: "1073 Wisconsin Ave NW",
      neighborhood: "Georgetown",
    },
    {
      time: "11:15 PM",
      venue: "Toki Underground",
      vibe: "Late night ramen",
      tone: "bg-amber-300",
      address: "1234 H St NE",
      neighborhood: "H Street",
    },
  ],
];

// Deterministic mock detail generator — keeps results stable per venue name.
function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function partySizeFromCrew(crew: string | null): number {
  switch (crew) {
    case "solo":
      return 1;
    case "date":
      return 2;
    case "small":
      return 4;
    case "squad":
      return 6;
    default:
      return 2;
  }
}

/** Parse "7:30 PM" into { h:19, m:30 } */
function parseSlot(label: string): { h: number; m: number } | null {
  const m = label.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let hh = parseInt(m[1], 10) % 12;
  if (m[3].toUpperCase() === "PM") hh += 12;
  return { h: hh, m: parseInt(m[2], 10) };
}

/** Why this dish was suggested for the user, given their personalization. */
function dishReasons(
  name: string,
  p: {
    diet: DietFilter;
    topVenues: Set<string>;
    bookingsCount: number;
    dietLabel: string | null;
  } | null,
  isUsualVenue: boolean,
): string[] {
  const out: string[] = [];
  const info = getDishInfo(name);
  if (!info) return out;
  if (p) {
    const d = p.diet;
    if (d.vegan && info.vegan) out.push("Vegan ✓");
    else if (d.vegetarian && (info.vegetarian || info.vegan)) out.push("Vegetarian ✓");
    else if (d.pescatarian && (info.pescatarian || info.vegetarian || info.vegan))
      out.push("Pescatarian ✓");
    if (d.glutenFree && info.glutenFree) out.push("Gluten-free ✓");
    const avoid = (d.avoidAllergens ?? []).map((a) => a.toLowerCase());
    if (avoid.length > 0) {
      const conflict = hasAllergenConflict(info.allergens, avoid);
      if (!conflict) out.push(`Skips ${avoid.slice(0, 2).join(" + ")}`);
    }
    if (typeof info.spice === "number" && info.spice >= 2) out.push("Bold + spicy");
  }
  if (isUsualVenue) out.push("Crowd favorite at your usual spot");
  if (out.length === 0) out.push("Top-ordered here");
  return out.slice(0, 2);
}

/** Why this time slot is highlighted as peak for the user. */
function peakReason(
  p: { preferredHour: number | null; bookingsCount: number } | null,
  peakTime: string,
): string {
  const slot = parseSlot(peakTime);
  if (p?.preferredHour != null && slot) {
    const ph = p.preferredHour;
    const diff = Math.abs(slot.h * 60 + slot.m - ph * 60);
    if (diff <= 45) {
      const hr12 = ((ph + 11) % 12) + 1;
      const ampm = ph >= 12 ? "pm" : "am";
      return `Matches your usual ~${hr12}${ampm} window (${p.bookingsCount} past bookings)`;
    }
  }
  return "Most-booked slot here right now";
}

/** Resolve an ISO timestamp from the wizard's pickedDate + a "7:00 PM" slot. Falls back to today. */
function slotToIso(pickedDate: string, slot: string): string | null {
  const t = parseSlot(slot);
  if (!t) return null;
  const base = pickedDate ? new Date(`${pickedDate}T00:00:00`) : new Date();
  base.setHours(t.h, t.m, 0, 0);
  // If picking "today" and the time has already passed, push to tomorrow
  if (!pickedDate && base.getTime() < Date.now()) base.setDate(base.getDate() + 1);
  return base.toISOString();
}
const KNOWN_FOR = [
  "tasting menu",
  "natural wine list",
  "house cocktails",
  "wood-fired pies",
  "raw bar",
  "live jazz nights",
  "rooftop sunsets",
  "vinyl listening room",
  "small plates",
  "late-night ramen",
  "espresso martinis",
  "garden patio",
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
  const rating = (4.2 + (h % 8) / 10).toFixed(1); // 4.2 - 4.9
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
  const ALL_DIETARY = [
    "Gluten-free menu",
    "Vegan options",
    "Vegetarian",
    "Pescatarian",
    "Dairy-free",
    "Nut-free kitchen",
  ] as const;
  const ALL_ALLERGENS = [
    "peanuts",
    "tree nuts",
    "shellfish",
    "dairy",
    "eggs",
    "soy",
    "sesame",
    "wheat/gluten",
  ] as const;
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
  // Popular dishes / drinks (deterministic)
  const ALL_DISHES = [
    "Truffle rigatoni",
    "Spicy tuna crispy rice",
    "Wood-fired margherita",
    "Wagyu sliders",
    "Charred octopus",
    "Burrata + peaches",
    "Short rib tacos",
    "Hand-cut pappardelle",
    "Yuzu old fashioned",
    "Espresso martini",
    "Smoked negroni",
    "Lychee martini",
    "Bone marrow toast",
    "Crispy duck rolls",
    "Hamachi crudo",
    "Chocolate olive oil cake",
  ];
  const popularDishes = [0, 1, 2].map((i) => ALL_DISHES[(h >> (i * 3)) % ALL_DISHES.length]);
  // De-dupe
  const dishes = Array.from(new Set(popularDishes)).slice(0, 3);
  // Popular booking times + per-slot availability (deterministic per venue)
  const TIME_SLOTS = [
    "6:30 PM",
    "7:00 PM",
    "7:30 PM",
    "8:00 PM",
    "8:30 PM",
    "9:00 PM",
    "9:30 PM",
    "10:00 PM",
  ];
  const startIdx = h % (TIME_SLOTS.length - 2);
  const popularTimes = TIME_SLOTS.slice(startIdx, startIdx + 3);
  const peakTime = popularTimes[1];
  type SlotLevel = "open" | "limited" | "few" | "full";
  const popularAvailability: { time: string; level: SlotLevel; seatsLeft: number }[] =
    popularTimes.map((t, i) => {
      const r = (h >> (i * 5)) & 0xff;
      const isPeak = t === peakTime;
      // Peak slot skews scarcer; off-peak skews more open
      const seatsLeft = isPeak ? r % 4 : 2 + (r % 8);
      let level: SlotLevel;
      if (seatsLeft === 0) level = "full";
      else if (seatsLeft <= 2) level = "few";
      else if (seatsLeft <= 5) level = "limited";
      else level = "open";
      return { time: t, level, seatsLeft };
    });
  // The vibe descriptors
  const CROWDS = [
    "Date-night locals",
    "Industry crowd",
    "After-work professionals",
    "Stylish regulars",
    "Creative scene",
    "Neighborhood loyalists",
  ];
  const NOISE = ["Hushed", "Conversational", "Lively", "Buzzy", "Loud + electric"];
  const DRESS = ["Come as you are", "Smart casual", "Date-night sharp", "Dress to impress"];
  const LIGHTING = ["Candlelit", "Warm + low", "Moody amber", "Sunlit garden", "Neon glow"];
  const MUSIC = [
    "Vinyl jazz",
    "Ambient house",
    "Indie + soul",
    "Live acoustic",
    "Disco classics",
    "Lo-fi beats",
  ];
  const vibeProfile = {
    crowd: CROWDS[h % CROWDS.length],
    noise: NOISE[(h >> 2) % NOISE.length],
    dress: DRESS[(h >> 4) % DRESS.length],
    lighting: LIGHTING[(h >> 6) % LIGHTING.length],
    music: MUSIC[(h >> 8) % MUSIC.length],
  };
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
    dishes,
    popularTimes,
    peakTime,
    popularAvailability,
    vibeProfile,
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
  const [sortBy, setSortBy] = useState<"order" | "rating" | "price" | "distance" | "availability">(
    "order",
  );
  type PlaceInfo = {
    rating?: number;
    userRatingCount?: number;
    priceLevel?: number;
    openNow?: boolean;
    businessStatus?: string;
    displayName?: string;
    formattedAddress?: string;
    websiteUri?: string;
    googleMapsUri?: string;
    photos?: string[];
    found: boolean;
  };
  const [placesData, setPlacesData] = useState<Record<string, PlaceInfo>>({});
  const [placesLoading, setPlacesLoading] = useState(false);
  const [dynamicStops, setDynamicStops] = useState<Stop[] | null>(null);
  const [dynamicLoading, setDynamicLoading] = useState(false);
  const [dynamicError, setDynamicError] = useState<{ city: string | null; reason: "error" | "empty" } | null>(null);
  const [replacements, setReplacements] = useState<Record<number, Stop>>({});
  const [swapTarget, setSwapTarget] = useState<{ index: number; stop: Stop } | null>(null);
  const [swapLoading, setSwapLoading] = useState(false);
  const [swapCandidates, setSwapCandidates] = useState<SwapCandidate[]>([]);
  const [swapError, setSwapError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Record<string, FavRow>>({});
  const [showFavorites, setShowFavorites] = useState(false);
  const [reservingKey, setReservingKey] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<Record<string, string>>({});
  const [openDish, setOpenDish] = useState<{ name: string; venue: string } | null>(null);
  type Personalize = {
    preferredHour: number | null;
    diet: DietFilter;
    topVenues: Set<string>;
    bookingsCount: number;
    dietLabel: string | null;
    hourCounts: Record<number, number>;
    venueCounts: Record<string, number>;
  };
  const [personalize, setPersonalize] = useState<Personalize | null>(null);
  type DietPrefs = {
    vegan: boolean;
    vegetarian: boolean;
    pescatarian: boolean;
    glutenFree: boolean;
    allergens: string[];
  };
  const [dietPrefs, setDietPrefs] = useState<DietPrefs>({
    vegan: false,
    vegetarian: false,
    pescatarian: false,
    glutenFree: false,
    allergens: [],
  });
  const [dietSavedFlash, setDietSavedFlash] = useState(false);
  const [shareData, setShareData] = useState<StopShareData | null>(null);
  const [sharing, setSharing] = useState<string | null>(null);
  const shareRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { burst, layer } = useConfettiBurst();
  const navigate = useNavigate();

  const reserveSlot = useCallback(
    async (venueName: string, slot: string, level: "open" | "limited" | "few" | "full") => {
      if (level === "full") {
        toast.error("That slot is full — try another time.");
        return;
      }
      if (!user) {
        toast.error("Sign in to reserve a table.");
        return;
      }
      const startsAt = slotToIso(pickedDate, slot);
      if (!startsAt) {
        toast.error("Invalid time slot.");
        return;
      }
      const key = `${venueName}|${slot}`;
      setReservingKey(key);
      const { error } = await supabase.from("bookings").insert({
        user_id: user.id,
        venue_name: venueName,
        starts_at: startsAt,
        party_size: partySizeFromCrew(crew),
        status: "pending",
      });
      setReservingKey(null);
      if (error) {
        toast.error(error.message);
        return;
      }
      setBookedSlots((p) => ({ ...p, [key]: startsAt }));
      burst(window.innerWidth / 2, window.innerHeight / 3);

      // Continuously update peak hour + "your usual" venue from this reservation.
      const slotParsed = parseSlot(slot);
      let peakBumped = false;
      let usualBumped = false;
      setPersonalize((p) => {
        if (!p) return p;
        const hourCounts = { ...p.hourCounts };
        const venueCounts = { ...p.venueCounts };
        if (slotParsed && slotParsed.h >= 17 && slotParsed.h <= 23) {
          hourCounts[slotParsed.h] = (hourCounts[slotParsed.h] ?? 0) + 1;
        }
        venueCounts[venueName] = (venueCounts[venueName] ?? 0) + 1;
        let preferredHour: number | null = null;
        let max = 0;
        Object.entries(hourCounts).forEach(([h, c]) => {
          if (c > max) {
            max = c;
            preferredHour = parseInt(h, 10);
          }
        });
        const topVenues = new Set(p.topVenues);
        const wasUsual = topVenues.has(venueName);
        topVenues.add(venueName);
        peakBumped = preferredHour !== p.preferredHour;
        usualBumped = !wasUsual;
        return {
          ...p,
          hourCounts,
          venueCounts,
          preferredHour,
          topVenues,
          bookingsCount: p.bookingsCount + 1,
        };
      });

      const extras: string[] = [];
      if (usualBumped) extras.push(`${venueName} added to your usuals`);
      if (peakBumped && slotParsed) {
        const hr12 = ((slotParsed.h + 11) % 12) + 1;
        const ampm = slotParsed.h >= 12 ? "pm" : "am";
        extras.push(`peak hour now ~${hr12}${ampm}`);
      }
      toast.success(
        `Reserved ${venueName} at ${slot} ✓`,
        extras.length ? { description: extras.join(" · ") } : undefined,
      );
    },
    [user, pickedDate, crew, burst],
  );

  const shareStopCard = useCallback(async (data: StopShareData) => {
    setShareData(data);
    setSharing(data.venue);
    // Wait for the offscreen card to render
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    try {
      if (!shareRef.current) throw new Error("Card not mounted");
      const dataUrl = await toPng(shareRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#FAF6EF",
      });
      const blob = await (await fetch(dataUrl)).blob();
      const filename = `${data.venue.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-stop-card.png`;

      // Try Web Share API with file (mobile)
      const file = new File([blob], filename, { type: "image/png" });
      const navAny = navigator as Navigator & {
        canShare?: (d: { files: File[] }) => boolean;
        share?: (d: ShareData & { files?: File[] }) => Promise<void>;
      };
      if (navAny.canShare?.({ files: [file] }) && navAny.share) {
        try {
          await navAny.share({
            files: [file],
            title: data.venue,
            text: `${data.venue} — ${data.time} · ${data.vibe}`,
          });
          toast.success("Shared ✓");
          return;
        } catch (err) {
          // user cancelled — fall through to download
          if ((err as Error).name === "AbortError") return;
        }
      }
      // Fallback: download
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = filename;
      link.click();
      toast.success("Stop card downloaded");
    } catch (e) {
      console.error("[share]", e);
      toast.error("Couldn't generate share card");
    } finally {
      setSharing(null);
      setShareData(null);
    }
  }, []);

  const fallbackTones = [
    "bg-coral",
    "bg-purple",
    "bg-gold",
    "bg-emerald-400",
    "bg-pink-300",
    "bg-amber-300",
  ];
  const presetStops = useMemo(
    () =>
      preset?.stops?.map((s, i) => ({
        time: s.time,
        venue: s.venue,
        vibe: s.vibe ?? "Curated pick",
        tone: s.tone ?? fallbackTones[i % fallbackTones.length],
        walk: s.walk,
        address: s.address,
        neighborhood: s.neighborhood,
      })),
    [preset],
  );
  const baseStops = presetStops ?? dynamicStops ?? SAMPLE_STOPS[variant % SAMPLE_STOPS.length];
  const stops = useMemo(
    () => baseStops.map((s, i) => replacements[i] ?? s),
    [baseStops, replacements],
  );
  const sortedStops = useMemo(() => {
    const parseWalk = (w?: string) => {
      const m = w?.match(/(\d+)/);
      return m ? parseInt(m[1], 10) : Number.POSITIVE_INFINITY;
    };
    const parseTime = (t: string) => {
      const m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!m) return Number.POSITIVE_INFINITY;
      let h = parseInt(m[1], 10) % 12;
      if (/PM/i.test(m[3])) h += 12;
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
      arr.sort(
        (a, b) => availabilityScore(a.s.venue, a.s.time) - availabilityScore(b.s.venue, b.s.time),
      );
    }
    return arr;
  }, [stops, sortBy, placesData]);

  const openSwapForStop = useCallback(
    async (index: number, stop: Stop) => {
      setSwapTarget({ index, stop });
      setSwapLoading(true);
      setSwapError(null);
      setSwapCandidates([]);
      try {
        let loc = getActiveLocation();
        if (!loc) loc = await requestUserLocation().catch(() => null);
        const excludeIds = stops
          .map((s) => s.placeId)
          .filter((id): id is string => !!id);
        const sel = getSelectedCity();
        const { data, error } = await supabase.functions.invoke("wizard-itinerary", {
          body: {
            mode: "alternatives",
            vibe: stop.vibeKey ?? null,
            query: stop.vibeKey ? null : stop.vibe,
            budget,
            lat: loc?.lat ?? null,
            lng: loc?.lng ?? null,
            city: sel?.name ?? null,
            excludeIds,
            limit: 6,
          },
        });
        if (error) throw error;
        const list = (data?.candidates ?? []) as SwapCandidate[];
        if (!list.length) setSwapError("No other matches found nearby.");
        setSwapCandidates(list);
      } catch (e) {
        console.warn("[wizard swap]", e);
        setSwapError("Could not load alternatives. Try again.");
      } finally {
        setSwapLoading(false);
      }
    },
    [stops, budget],
  );

  const applySwap = useCallback(
    (candidate: SwapCandidate) => {
      if (!swapTarget) return;
      const { index, stop } = swapTarget;
      const next: Stop = {
        time: candidate.time ?? stop.time,
        venue: candidate.venue,
        vibe: candidate.vibeLabel ?? stop.vibe,
        tone: candidate.tone ?? stop.tone,
        address: candidate.address,
        neighborhood: candidate.neighborhood,
        vibeKey: candidate.vibeKey ?? stop.vibeKey,
        placeId: candidate.id,
        photo: candidate.photo,
        lat: candidate.lat,
        lng: candidate.lng,
      };
      setReplacements((prev) => ({ ...prev, [index]: next }));
      setSwapTarget(null);
      setSwapCandidates([]);
      toast.success(`Swapped in ${candidate.venue}`);
    },
    [swapTarget],
  );
  const totalSteps = 6;

  // If preset supplied, jump straight to result and seed vibe multi-select
  useEffect(() => {
    if (open && preset) {
      setVibe(preset.vibeKeys ?? []);
      setStep(7);
    }
  }, [open, preset]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Reset on close
  useEffect(() => {
    if (open) return;
    const t = setTimeout(() => {
      setStep(0);
      setVibe([]);
      setCrew(null);
      setWhen(null);
      setPickedDate("");
      setBudget(null);
      setMusts([]);
      setLoadingIdx(0);
      setVariant(0);
      setDynamicStops(null);
      setReplacements({});
    }, 220);
    return () => clearTimeout(t);
  }, [open]);

  // Loading text rotation
  useEffect(() => {
    if (step !== 6) return;
    setLoadingIdx(0);
    const interval = setInterval(() => setLoadingIdx((i) => i + 1), 700);
    const done = setTimeout(() => setStep(7), 3600);
    return () => {
      clearInterval(interval);
      clearTimeout(done);
    };
  }, [step]);

  // Build a real itinerary from Google Places using the user's location + selected vibes.
  // Skips when a curated preset is in play.
  useEffect(() => {
    if (step !== 6 || (preset && preset.stops?.length)) return;
    let cancelled = false;
    (async () => {
      setDynamicLoading(true);
      setDynamicError(null);
      const sel = getSelectedCity();
      const cityName = sel?.name ?? null;
      try {
        let loc = getActiveLocation();
        if (!loc) loc = await requestUserLocation().catch(() => null);
        const { data, error } = await supabase.functions.invoke("wizard-itinerary", {
          body: {
            vibes: vibe,
            budget,
            lat: loc?.lat ?? null,
            lng: loc?.lng ?? null,
            city: cityName,
            count: 3,
          },
        });
        if (cancelled) return;
        if (error) {
          console.warn("[wizard-itinerary]", error);
          setDynamicError({ city: cityName, reason: "error" });
          toast.error(
            cityName
              ? `Couldn't reach venue data for ${cityName}. Check your connection or try again.`
              : "Couldn't reach venue data. Check your connection or try again.",
          );
          return;
        }
        const fetched = (data?.stops ?? []) as Stop[];
        if (fetched.length) {
          setDynamicStops(fetched);
          setReplacements({});
        } else {
          setDynamicError({ city: cityName, reason: "empty" });
          toast.error(
            cityName
              ? `No verified venues found in ${cityName} for these vibes.`
              : "No verified venues found for these vibes.",
          );
        }
      } catch (err) {
        if (!cancelled) {
          console.warn("[wizard-itinerary]", err);
          setDynamicError({ city: cityName, reason: "error" });
          toast.error("Something went wrong fetching venues. Try again.");
        }
      } finally {
        if (!cancelled) setDynamicLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, variant]);

  // Fetch live Google Places data for the current stops as soon as results show.
  useEffect(() => {
    if (step !== 7 || !stops?.length) return;
    let cancelled = false;
    const queries = stops.map((s) => ({
      venue: s.venue,
      address: s.address,
      neighborhood: s.neighborhood,
    }));
    setPlacesLoading(true);
    setPlacesData({});
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("google-places", {
          body: { queries },
        });
        if (cancelled) return;
        if (error) {
          console.warn("[google-places]", error);
          return;
        }
        const map: Record<string, PlaceInfo> = {};
        for (const r of (data?.results ?? []) as Array<PlaceInfo & { venue: string }>) {
          map[r.venue] = r;
        }
        setPlacesData(map);
      } catch (e) {
        console.warn("[google-places] fetch failed", e);
      } finally {
        if (!cancelled) setPlacesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step, stops]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeWizard();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeWizard]);

  // Load favorites when wizard opens (or user changes)
  useEffect(() => {
    if (!open || !user) {
      setFavorites({});
      return;
    }
    let cancelled = false;
    supabase
      .from("favorite_stops")
      .select("venue_name,vibe,tone,address,neighborhood")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        const map: Record<string, FavRow> = {};
        (data ?? []).forEach((r) => {
          map[r.venue_name] = r as FavRow;
        });
        setFavorites(map);
      });
    return () => {
      cancelled = true;
    };
  }, [open, user]);

  const toggleFavorite = useCallback(
    async (s: Stop) => {
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
        else
          next[key] = {
            venue_name: s.venue,
            vibe: s.vibe ?? null,
            tone: s.tone ?? null,
            address: s.address ?? null,
            neighborhood: s.neighborhood ?? null,
          };
        return next;
      });
      if (isFav) {
        const { error } = await supabase
          .from("favorite_stops")
          .delete()
          .eq("user_id", user.id)
          .eq("venue_name", key);
        if (error) {
          toast.error("Couldn't remove favorite");
        } else toast.success(`Removed ${s.venue}`);
      } else {
        const { error } = await supabase.from("favorite_stops").insert({
          user_id: user.id,
          venue_name: s.venue,
          vibe: s.vibe ?? null,
          tone: s.tone ?? null,
          address: s.address ?? null,
          neighborhood: s.neighborhood ?? null,
        });
        if (error && !error.message.includes("duplicate")) {
          toast.error("Couldn't save favorite");
        } else toast.success(`Saved ${s.venue} ★`);
      }
    },
    [user, favorites],
  );

  // External "diet prefs updated" signal (e.g. user saves on profile page) → re-pull
  const [prefsVersion, setPrefsVersion] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => setPrefsVersion((v) => v + 1);
    window.addEventListener("loop:diet-prefs-updated", handler);
    return () => window.removeEventListener("loop:diet-prefs-updated", handler);
  }, []);

  // Load personalization (past bookings + dietary prefs) when wizard opens
  useEffect(() => {
    if (!open || !user) {
      setPersonalize(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const [{ data: prefs }, { data: bookings }] = await Promise.all([
        supabase
          .from("user_preferences")
          .select("cuisines,taste_profile")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("bookings")
          .select("venue_name,starts_at")
          .eq("user_id", user.id)
          .order("starts_at", { ascending: false })
          .limit(50),
      ]);
      if (cancelled) return;
      const cuisines: string[] = ((prefs?.cuisines ?? []) as string[]).map((c) =>
        String(c).toLowerCase(),
      );
      const tp = (prefs?.taste_profile ?? {}) as Record<string, unknown>;
      const dietRaw = String((tp.diet as string) ?? "").toLowerCase();
      const allergRaw = Array.isArray(tp.allergens)
        ? (tp.allergens as unknown[]).map((s) => String(s).toLowerCase())
        : [];
      const vegan = dietRaw.includes("vegan") || cuisines.includes("vegan");
      const vegetarian = vegan || dietRaw.includes("vegetarian") || cuisines.includes("vegetarian");
      const pescatarian = dietRaw.includes("pescatarian") || cuisines.includes("pescatarian");
      const glutenFree =
        dietRaw.includes("gluten") || cuisines.some((c) => c.includes("gluten-free"));
      const diet: DietFilter = {
        vegan,
        vegetarian,
        pescatarian,
        glutenFree,
        avoidAllergens: allergRaw,
      };
      const dietLabel = vegan
        ? "Vegan"
        : vegetarian
          ? "Vegetarian"
          : pescatarian
            ? "Pescatarian"
            : glutenFree
              ? "Gluten-free"
              : null;

      const hourCounts: Record<number, number> = {};
      const venueCounts: Record<string, number> = {};
      (bookings ?? []).forEach((b) => {
        const d = new Date(b.starts_at as string);
        const h = d.getHours();
        if (h >= 17 && h <= 23) hourCounts[h] = (hourCounts[h] ?? 0) + 1;
        venueCounts[b.venue_name as string] = (venueCounts[b.venue_name as string] ?? 0) + 1;
      });
      let preferredHour: number | null = null;
      let max = 0;
      Object.entries(hourCounts).forEach(([h, c]) => {
        if (c > max) {
          max = c;
          preferredHour = parseInt(h, 10);
        }
      });
      const topVenues = new Set<string>(
        Object.keys(venueCounts).filter((v) => venueCounts[v] >= 1),
      );
      Object.keys(favorites).forEach((v) => topVenues.add(v));
      setPersonalize({
        preferredHour,
        diet,
        topVenues,
        bookingsCount: bookings?.length ?? 0,
        dietLabel,
        hourCounts,
        venueCounts,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [open, user, favorites, prefsVersion]);

  // Seed wizard's editable diet prefs from saved personalization
  useEffect(() => {
    if (!personalize) return;
    setDietPrefs({
      vegan: !!personalize.diet.vegan,
      vegetarian: !!personalize.diet.vegetarian,
      pescatarian: !!personalize.diet.pescatarian,
      glutenFree: !!personalize.diet.glutenFree,
      allergens: personalize.diet.avoidAllergens ?? [],
    });
  }, [personalize]);

  type SlotLevel = "open" | "limited" | "few" | "full";
  type Availability = { time: string; level: SlotLevel; seatsLeft: number };
  type Details = ReturnType<typeof getDetails>;
  const personalizeDetails = useCallback(
    (d: Details, venue: string): Details & { isUsual: boolean; personalNote: string | null } => {
      if (!personalize) return { ...d, isUsual: false, personalNote: null };
      // 1) Filter dishes by dietary prefs
      const opts = personalize.diet;
      let filtered = d.dishes.filter((n) => dishMatches(n, opts));
      if (filtered.length < 3) {
        const h = hashStr(venue);
        const extras = ALL_DISH_NAMES.filter((n) => !filtered.includes(n) && dishMatches(n, opts));
        for (let i = 0; filtered.length < 3 && i < extras.length; i++) {
          filtered.push(extras[(h + i) % extras.length]);
        }
      }
      filtered = filtered.slice(0, 3);

      // 2) Re-rank availability around user's preferred hour
      let avail: Availability[] = d.popularAvailability;
      let peak = d.peakTime;
      if (personalize.preferredHour != null) {
        const ph = personalize.preferredHour;
        const slotMinutes = (t: string) => {
          const p = parseSlot(t);
          return p ? p.h * 60 + p.m : 0;
        };
        const closest = avail.reduce<{ time: string; diff: number }>(
          (best, s) => {
            const diff = Math.abs(slotMinutes(s.time) - ph * 60);
            return diff < best.diff ? { time: s.time, diff } : best;
          },
          { time: avail[0]?.time ?? "", diff: Number.POSITIVE_INFINITY },
        );
        peak = closest.time;
        avail = avail.map((slot) => {
          if (slot.time === peak) {
            const seatsLeft = Math.min(slot.seatsLeft, 2);
            const level: SlotLevel = seatsLeft === 0 ? "full" : "few";
            return { ...slot, seatsLeft, level };
          }
          // off-peak feels more open
          const seatsLeft = Math.max(slot.seatsLeft, 4);
          return { ...slot, seatsLeft, level: "open" as SlotLevel };
        });
      }

      const isUsual = personalize.topVenues.has(venue);
      const noteParts: string[] = [];
      if (personalize.preferredHour != null) noteParts.push(`your usual ${peak} window`);
      if (personalize.dietLabel) noteParts.push(`${personalize.dietLabel.toLowerCase()} picks`);
      const personalNote = noteParts.length ? `Tuned for ${noteParts.join(" · ")}` : null;

      return {
        ...d,
        dishes: filtered,
        popularAvailability: avail,
        peakTime: peak,
        isUsual,
        personalNote,
      };
    },
    [personalize],
  );

  if (!open) return null;

  const canAdvance =
    (step === 0 && vibe.length > 0) ||
    (step === 1 && !!crew) ||
    (step === 2 && !!when && (when !== "pick" || !!pickedDate)) ||
    (step === 3 && !!budget) ||
    step === 4 || // musts optional
    step === 5; // dietary optional

  function toggleAllergen(a: string) {
    setDietPrefs((p) => ({
      ...p,
      allergens: p.allergens.includes(a) ? p.allergens.filter((x) => x !== a) : [...p.allergens, a],
    }));
  }

  async function persistDietPrefs() {
    if (!user) return;
    try {
      const { data: existing } = await supabase
        .from("user_preferences")
        .select("taste_profile")
        .eq("user_id", user.id)
        .maybeSingle();
      const tp = (existing?.taste_profile ?? {}) as Record<string, unknown>;
      const diet = dietPrefs.vegan
        ? "vegan"
        : dietPrefs.vegetarian
          ? "vegetarian"
          : dietPrefs.pescatarian
            ? "pescatarian"
            : dietPrefs.glutenFree
              ? "gluten-free"
              : "";
      const nextTp = { ...tp, diet, allergens: dietPrefs.allergens };
      await supabase
        .from("user_preferences")
        .upsert({ user_id: user.id, taste_profile: nextTp }, { onConflict: "user_id" });
      // Update in-memory personalize so dish filtering reflects changes immediately
      setPersonalize((p) =>
        p
          ? {
              ...p,
              diet: {
                ...p.diet,
                vegan: dietPrefs.vegan,
                vegetarian: dietPrefs.vegetarian || dietPrefs.vegan,
                pescatarian: dietPrefs.pescatarian,
                glutenFree: dietPrefs.glutenFree,
                avoidAllergens: dietPrefs.allergens,
              },
              dietLabel: dietPrefs.vegan
                ? "Vegan"
                : dietPrefs.vegetarian
                  ? "Vegetarian"
                  : dietPrefs.pescatarian
                    ? "Pescatarian"
                    : dietPrefs.glutenFree
                      ? "Gluten-free"
                      : null,
            }
          : p,
      );
      setDietSavedFlash(true);
      setTimeout(() => setDietSavedFlash(false), 1500);
    } catch (err) {
      console.warn("[wizard] persist diet prefs failed", err);
    }
  }

  function next() {
    setStep((s) => Math.min(s + 1, 6));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }
  function toggleMust(k: string) {
    setMusts((m) => (m.includes(k) ? m.filter((x) => x !== k) : [...m, k]));
  }
  function build(e: React.MouseEvent) {
    burst(e.clientX, e.clientY);
    void persistDietPrefs();
    next();
  }
  function regenerate(e: React.MouseEvent) {
    burst(e.clientX, e.clientY);
    setVariant((v) => v + 1);
    setStep(6);
  }
  function wizardStopToLoopStop(s: Stop, i: number): LoopStop {
    return {
      id: s.placeId ?? `ws-${Date.now()}-${i}`,
      name: s.venue,
      type: s.vibe,
      time: s.time,
      area: s.neighborhood,
      address: s.address,
      venueId: s.placeId,
      lat: s.lat,
      lng: s.lng,
      kind: i === 0 ? "departure" : i === stops.length - 1 ? "destination" : "layover",
      bookable: true,
    };
  }

  function buildLoopFromWizard(): ActiveLoop {
    const loopStops = stops.map((s, i) => wizardStopToLoopStop(s, i));
    const existing = getActiveLoop();
    return makeDemoLoop({
      ...(existing ?? {}),
      passenger: existing?.passenger || (user?.email?.split("@")[0]?.toUpperCase() ?? "GUEST"),
      groupSize: crew === "solo" ? 1 : crew === "duo" ? 2 : crew === "small" ? 4 : 6,
      occasion: existing?.occasion,
      vibe: vibe[0] ?? existing?.vibe,
      vibes: vibe.length ? vibe : existing?.vibes,
      to: (vibe[0] || "NIGHT OUT").toUpperCase(),
      gate: stops[0]?.neighborhood?.toUpperCase().slice(0, 6) || existing?.gate || "GATE 1",
      boardingTime: stops[0]?.time || existing?.boardingTime || "7:00 PM",
      stops: loopStops,
    });
  }

  function savePlan(e: React.MouseEvent) {
    burst(e.clientX, e.clientY);
    const loop = buildLoopFromWizard();
    setActiveLoop(loop);
    toast.success("Added to boarding pass", {
      description: `${loop.stops.length} stops · ${loop.boardingTime}`,
    });
    setTimeout(() => {
      closeWizard();
      navigate({ to: "/boarding-pass" });
    }, 350);
  }

  function addStopToBoardingPass(stop: Stop, e: React.MouseEvent) {
    e.stopPropagation();
    burst(e.clientX, e.clientY);
    const existing = getActiveLoop();
    const newStop = wizardStopToLoopStop(stop, existing?.stops.length ?? 0);
    if (existing) {
      const dup = existing.stops.some(
        (s) => (s.venueId && s.venueId === newStop.venueId) || s.name === newStop.name,
      );
      if (dup) {
        toast.info(`${stop.venue} is already on your boarding pass.`);
        return;
      }
      const next: ActiveLoop = { ...existing, stops: [...existing.stops, newStop] };
      setActiveLoop(next);
      toast.success(`Added ${stop.venue} to boarding pass`, {
        description: `${next.stops.length} stops total`,
      });
    } else {
      const loop = makeDemoLoop({
        passenger: user?.email?.split("@")[0]?.toUpperCase() ?? "GUEST",
        to: stop.vibe.toUpperCase(),
        gate: stop.neighborhood?.toUpperCase().slice(0, 6) || "GATE 1",
        boardingTime: stop.time,
        stops: [newStop],
      });
      setActiveLoop(loop);
      toast.success(`Added ${stop.venue} to boarding pass`, {
        description: "New trip created",
      });
    }
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
            {step <= 5
              ? `Step ${step + 1} / ${totalSteps}`
              : step === 6
                ? "Building your night"
                : "Your night, ready"}
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
        {step <= 5 && (
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
                      onClick={() =>
                        setVibe((prev) =>
                          prev.includes(v.k) ? prev.filter((x) => x !== v.k) : [...prev, v.k],
                        )
                      }
                      className={`group relative overflow-hidden rounded-2xl border-2 border-ink p-4 text-left shadow-brut transition-pop ${v.tone} ${active ? "-translate-x-1 -translate-y-1 shadow-brut-lg ring-4 ring-ink/15" : "hover:-translate-x-0.5 hover:-translate-y-0.5"}`}
                    >
                      <div className="text-3xl">{v.emoji}</div>
                      <div className="mt-2 font-display text-lg font-extrabold leading-tight">
                        {v.label}
                      </div>
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
                      <div className="mt-1 font-mono text-[11px] uppercase tracking-widest">
                        {c.label}
                      </div>
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
                  <label className="mb-2 block font-mono text-[11px] font-bold uppercase tracking-widest">
                    Pick a date
                  </label>
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
                      <div className="mt-1 font-mono text-[10px] uppercase tracking-widest opacity-80">
                        {b.sub}
                      </div>
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
            <StepShell
              title="Dietary needs?"
              sub="We'll filter dishes and warn you about allergens."
            >
              <div className="space-y-5">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-ink/55">
                    Diet
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(
                      [
                        { k: "vegan", label: "Vegan" },
                        { k: "vegetarian", label: "Vegetarian" },
                        { k: "pescatarian", label: "Pescatarian" },
                        { k: "glutenFree", label: "Gluten-free" },
                      ] as const
                    ).map((d) => {
                      const active = dietPrefs[d.k];
                      return (
                        <button
                          key={d.k}
                          onClick={() =>
                            setDietPrefs((p) => {
                              // Diet options are mutually exclusive; clicking active one clears it.
                              const cleared: DietPrefs = {
                                ...p,
                                vegan: false,
                                vegetarian: false,
                                pescatarian: false,
                                glutenFree: false,
                              };
                              if (active) return cleared;
                              const nextP = { ...cleared, [d.k]: true } as DietPrefs;
                              // Vegan implies vegetarian
                              if (d.k === "vegan") nextP.vegetarian = true;
                              return nextP;
                            })
                          }
                          className={`rounded-full border-2 border-ink px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest shadow-brut transition-pop hover:-translate-y-0.5 ${active ? "-translate-y-0.5 bg-mint text-ink shadow-brut-lg" : "bg-cream"}`}
                        >
                          {active && <Check className="-mt-0.5 mr-1 inline h-3.5 w-3.5" />}
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 text-[11px] text-ink/55">
                    Pick one. Vegan automatically implies vegetarian.
                  </p>
                </div>

                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-ink/55">
                    Allergens to avoid
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[
                      "peanuts",
                      "tree nuts",
                      "shellfish",
                      "dairy",
                      "eggs",
                      "soy",
                      "sesame",
                      "wheat/gluten",
                      "fish",
                    ].map((a) => {
                      const active = dietPrefs.allergens.includes(a);
                      return (
                        <button
                          key={a}
                          onClick={() => toggleAllergen(a)}
                          className={`inline-flex items-center gap-1 rounded-full border-2 border-ink px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest shadow-brut transition-pop hover:-translate-y-0.5 ${active ? "-translate-y-0.5 bg-coral text-cream shadow-brut-lg" : "bg-cream"}`}
                        >
                          {active ? <Check className="h-3 w-3" /> : <span>⚠</span>}
                          {a}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 text-[11px] text-ink/55">
                    We'll flag matches in dish details and skip risky picks where possible.
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  {dietSavedFlash ? (
                    <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-mint-foreground">
                      Saved to your profile
                    </p>
                  ) : <span />}
                  {(dietPrefs.vegan ||
                    dietPrefs.vegetarian ||
                    dietPrefs.pescatarian ||
                    dietPrefs.glutenFree ||
                    dietPrefs.allergens.length > 0) && (
                    <button
                      type="button"
                      onClick={() =>
                        setDietPrefs({
                          vegan: false,
                          vegetarian: false,
                          pescatarian: false,
                          glutenFree: false,
                          allergens: [],
                        })
                      }
                      className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60 underline-offset-4 hover:text-coral hover:underline"
                    >
                      Clear dietary needs
                    </button>
                  )}
                </div>
              </div>
            </StepShell>
          )}

          {step === 6 && (
            <div className="flex min-h-[260px] flex-col items-center justify-center gap-5 py-8">
              <Loader2 className="h-12 w-12 animate-spin text-coral" />
              <div
                key={loadingIdx}
                className="font-display text-2xl font-extrabold"
                style={{ animation: "reveal-up 0.4s ease-out forwards" }}
              >
                {LOADING_LINES[Math.min(loadingIdx, LOADING_LINES.length - 1)]}
              </div>
              <div className="flex gap-1.5">
                {LOADING_LINES.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-6 rounded-full ${i <= loadingIdx ? "bg-ink" : "bg-ink/20"}`}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 7 && (
            <div>
              <h2 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">
                {preset ? preset.title : "Your night's "}
                {!preset && (
                  <span className="font-serif italic font-normal text-coral">locked in.</span>
                )}
              </h2>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-ink/60">
                {preset
                  ? [preset.vibeLabel, preset.crewLabel, preset.budgetLabel]
                      .filter(Boolean)
                      .join(" · ") || "Curated pick · ready to roll"
                  : `${vibe
                      .map((k) => VIBES.find((v) => v.k === k)?.label)
                      .filter(Boolean)
                      .join(" + ")} · ${CREW.find((c) => c.k === crew)?.label} · ${budget}`}
              </p>

              {(() => {
                const dietLabel = dietPrefs.vegan
                  ? "Vegan"
                  : dietPrefs.vegetarian
                    ? "Vegetarian"
                    : dietPrefs.pescatarian
                      ? "Pescatarian"
                      : dietPrefs.glutenFree
                        ? "Gluten-free"
                        : null;
                const allergens = dietPrefs.allergens;
                if (!dietLabel && allergens.length === 0) return null;
                return (
                  <div className="mt-4 rounded-2xl border-2 border-ink bg-mint/30 p-3 shadow-brut">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/70">
                        Your dietary needs
                      </p>
                      <button
                        type="button"
                        onClick={() => setStep(5)}
                        className="font-mono text-[10px] font-bold uppercase tracking-widest text-coral underline-offset-4 hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {dietLabel && (
                        <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-cream px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest">
                          <Check className="h-3 w-3" /> {dietLabel}
                        </span>
                      )}
                      {allergens.length > 0 && (
                        <>
                          <span className="font-mono text-[10px] uppercase tracking-widest text-ink/55">
                            avoiding
                          </span>
                          {allergens.map((a) => (
                            <span
                              key={a}
                              className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-coral px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-cream"
                            >
                              <span aria-hidden>⚠</span> {a}
                            </span>
                          ))}
                        </>
                      )}
                    </div>
                    <p className="mt-2 text-[11px] text-ink/60">
                      We'll flag risky dishes and prefer matches as you browse picks below.
                    </p>
                  </div>
                );
              })()}

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
                  Sort by
                </span>
                {placesLoading && (
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-ink/50">
                    <Loader2 className="h-3 w-3 animate-spin" /> live data…
                  </span>
                )}
                {(
                  [
                    { k: "order", label: "Night order" },
                    { k: "rating", label: "★ Highest rated" },
                    { k: "price", label: "$ Lowest price" },
                    { k: "distance", label: "📍 Closest" },
                    { k: "availability", label: "⏱ Open now" },
                  ] as const
                ).map((opt) => {
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
                  <Heart
                    className={`h-3 w-3 ${Object.keys(favorites).length > 0 ? "fill-coral text-coral" : ""} ${showFavorites ? "fill-cream text-cream" : ""}`}
                  />
                  Favorites ({Object.keys(favorites).length})
                </button>
              </div>

              {showFavorites && (
                <div
                  className="mt-3 rounded-2xl border-2 border-ink bg-cream/80 p-3"
                  style={{ animation: "reveal-up 0.3s ease-out forwards" }}
                >
                  <p className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
                    Your saved spots
                  </p>
                  {Object.keys(favorites).length === 0 ? (
                    <p className="mt-2 text-sm text-ink/70">
                      Tap the ♥ on any stop to save it here for later.
                    </p>
                  ) : (
                    <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                      {Object.values(favorites).map((f) => (
                        <li
                          key={f.venue_name}
                          className="flex items-start justify-between gap-2 rounded-xl border border-ink/20 bg-cream p-2"
                        >
                          <div className="min-w-0">
                            <div className="truncate font-display text-sm font-extrabold">
                              {f.venue_name}
                            </div>
                            <div className="truncate font-mono text-[10px] uppercase tracking-widest text-ink/60">
                              {[f.vibe, f.neighborhood].filter(Boolean).join(" · ") || "Saved"}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              toggleFavorite({
                                time: "",
                                venue: f.venue_name,
                                vibe: f.vibe ?? "",
                                tone: f.tone ?? "",
                                address: f.address ?? undefined,
                                neighborhood: f.neighborhood ?? undefined,
                              })
                            }
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
                  const mockBase = getDetails(s.venue, s.vibe);
                  const mock = personalizeDetails(mockBase, s.venue);
                  const live = placesData[s.venue];
                  const d = {
                    ...mock,
                    rating: typeof live?.rating === "number" ? live.rating.toFixed(1) : mock.rating,
                    reviewCount:
                      typeof live?.userRatingCount === "number"
                        ? live.userRatingCount
                        : mock.reviewCount,
                    priceLevel:
                      typeof live?.priceLevel === "number" && live.priceLevel > 0
                        ? live.priceLevel
                        : mock.priceLevel,
                  };
                  const openNow = live?.openNow;
                  const isFav = !!favorites[s.venue];
                  const photos = live?.photos ?? [];
                  const heroPhoto = photos[0];
                  const displayAddress =
                    live?.formattedAddress ??
                    [s.address, s.neighborhood].filter(Boolean).join(" · ");
                  const mapsHref =
                    live?.googleMapsUri ??
                    buildSmartSearchUrl({ name: `${s.venue}${s.address ? `, ${s.address}` : ""}${s.neighborhood ? `, ${s.neighborhood}` : ""}` });
                  return (
                    <li
                      key={`${variant}-${i}`}
                      className="overflow-hidden rounded-2xl border-2 border-ink bg-cream shadow-brut"
                      style={{
                        animation: `reveal-up 0.5s ${i * 110}ms cubic-bezier(0.22,1,0.36,1) backwards`,
                      }}
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setOpenStop(isOpen ? null : i)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setOpenStop(isOpen ? null : i);
                          }
                        }}
                        aria-expanded={isOpen}
                        className="flex w-full items-stretch gap-3 p-3 text-left transition-colors hover:bg-ink/[0.03] cursor-pointer"
                      >
                        {heroPhoto ? (
                          <div className="relative w-24 shrink-0 overflow-hidden rounded-xl border-2 border-ink">
                            <img
                              src={heroPhoto}
                              alt={s.venue}
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                            <div
                              className={`absolute inset-x-0 bottom-0 ${s.tone} border-t-2 border-ink px-1 py-0.5 text-center font-display text-[11px] font-extrabold leading-tight text-ink`}
                            >
                              {s.time}
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`grid w-20 shrink-0 place-items-center rounded-xl border-2 border-ink ${s.tone} font-display text-sm font-extrabold leading-tight text-ink`}
                          >
                            {s.time}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-display text-lg font-extrabold leading-tight">
                              {live?.displayName ?? s.venue}
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 font-mono text-[10px] font-bold">
                              <Star className="h-2.5 w-2.5 fill-current" /> {d.rating}
                            </span>
                          </div>
                          {displayAddress && (
                            <div className="mt-0.5 inline-flex items-center gap-1 font-mono text-[11px] text-ink/70">
                              <MapPin className="h-3 w-3" />
                              {displayAddress}
                            </div>
                          )}
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                            <span className="rounded-full border border-ink bg-cream px-2 py-0.5 font-mono uppercase tracking-widest">
                              {s.vibe}
                            </span>
                            <span className="font-mono text-[11px] text-ink/60">
                              {"$".repeat(d.priceLevel)}
                            </span>
                            {openNow === true && (
                              <span className="rounded-full border border-ink bg-mint px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest">
                                Open now
                              </span>
                            )}
                            {openNow === false && (
                              <span className="rounded-full border border-ink bg-coral/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest">
                                Closed
                              </span>
                            )}
                            {s.walk && (
                              <span className="font-mono text-[11px] text-ink/60">↳ {s.walk}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-center justify-between self-stretch gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(s);
                            }}
                            aria-pressed={isFav}
                            aria-label={
                              isFav
                                ? `Remove ${s.venue} from favorites`
                                : `Save ${s.venue} to favorites`
                            }
                            title={isFav ? "Remove from favorites" : "Save to favorites"}
                            className={`grid h-7 w-7 place-items-center rounded-full border-2 border-ink transition-pop hover:-translate-y-0.5 ${isFav ? "bg-coral text-cream" : "bg-cream text-ink hover:bg-coral/10"}`}
                          >
                            <Heart className={`h-3.5 w-3.5 ${isFav ? "fill-cream" : ""}`} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              shareStopCard({
                                venue: s.venue,
                                vibe: s.vibe,
                                time: s.time,
                                address: s.address,
                                neighborhood: s.neighborhood,
                                rating: d.rating,
                                priceLevel: d.priceLevel,
                                knownFor: d.knownFor,
                                popularAvailability: d.popularAvailability,
                                peakTime: d.peakTime,
                                dishes: d.dishes,
                                vibeProfile: d.vibeProfile,
                                dietary: d.dietary,
                                isUsual: d.isUsual,
                              });
                            }}
                            disabled={sharing === s.venue}
                            aria-label={`Share ${s.venue} stop card`}
                            title="Share stop card"
                            className="grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-cream text-ink transition-pop hover:-translate-y-0.5 hover:bg-gold/30 disabled:opacity-50"
                          >
                            {sharing === s.venue ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Share2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openSwapForStop(i, s);
                            }}
                            aria-label={`Swap ${s.venue} for another venue`}
                            title="Swap this stop"
                            className="grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-cream text-ink transition-pop hover:-translate-y-0.5 hover:bg-mint/40"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => addStopToBoardingPass(s, e)}
                            aria-label={`Add ${s.venue} to boarding pass`}
                            title="Add to boarding pass"
                            className="grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-coral text-cream transition-pop hover:-translate-y-0.5 hover:bg-ink"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                          <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-gold font-mono text-[11px] font-bold">
                            {displayIdx + 1}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 text-ink/60 transition-transform ${isOpen ? "rotate-180" : ""}`}
                          />
                        </div>
                      </div>

                      {isOpen && (
                        <div
                          className="border-t-2 border-dashed border-ink/30 bg-cream/60 p-4"
                          style={{ animation: "reveal-up 0.3s ease-out forwards" }}
                        >
                          {photos.length > 0 && (
                            <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1">
                              {photos.map((src, pi) => (
                                <a
                                  key={pi}
                                  href={src}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="relative block h-32 w-48 shrink-0 overflow-hidden rounded-xl border-2 border-ink shadow-brut transition-pop hover:-translate-y-0.5"
                                >
                                  <img
                                    src={src}
                                    alt={`${s.venue} photo ${pi + 1}`}
                                    loading="lazy"
                                    className="h-full w-full object-cover"
                                  />
                                </a>
                              ))}
                            </div>
                          )}
                          <p className="text-sm leading-relaxed text-ink/85">{d.blurb}</p>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full border border-ink bg-cream px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest">
                              <Star className="h-3 w-3 fill-gold text-gold" /> {d.rating}{" "}
                              <span className="text-ink/50">
                                ({d.reviewCount.toLocaleString()})
                              </span>
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
                            <p className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
                              Dietary options
                            </p>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {d.dietary.map((opt) => (
                                <span
                                  key={opt}
                                  className="inline-flex items-center gap-1 rounded-full border border-ink/30 bg-cream px-2 py-0.5 text-[11px] text-ink/85"
                                >
                                  ✓ {opt}
                                </span>
                              ))}
                            </div>
                            <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-ink/60">
                              Allergens — notify ahead
                            </p>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {d.allergens.length > 0 ? (
                                d.allergens.map((a) => (
                                  <span
                                    key={a}
                                    className="inline-flex items-center gap-1 rounded-full border border-coral/50 bg-coral/10 px-2 py-0.5 text-[11px] text-ink/85"
                                  >
                                    ⚠ {a}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[11px] text-ink/60">
                                  Kitchen accommodates most allergens — call ahead.
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border-2 border-ink/15 bg-cream/60 p-3">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
                                  Popular booked · live availability
                                  {d.isUsual && (
                                    <span className="ml-1.5 rounded-full bg-coral/20 px-1.5 py-0.5 text-[9px] text-ink/80">
                                      ★ your usual spot
                                    </span>
                                  )}
                                </p>
                                <span className="font-mono text-[9px] uppercase tracking-widest text-ink/45">
                                  Party of {partySizeFromCrew(crew)}
                                </span>
                              </div>
                              {d.personalNote && (
                                <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-mint/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-ink/75">
                                  <Sparkles className="h-2.5 w-2.5" /> {d.personalNote}
                                </p>
                              )}
                              <div className="mt-2 grid gap-1.5 sm:grid-cols-3">
                                {d.popularAvailability.map(({ time, level, seatsLeft }) => {
                                  const key = `${s.venue}|${time}`;
                                  const booked = !!bookedSlots[key];
                                  const busy = reservingKey === key;
                                  const isPeak = time === d.peakTime;
                                  const tone = booked
                                    ? "border-ink bg-mint text-ink"
                                    : level === "full"
                                      ? "border-ink/20 bg-cream/60 text-ink/40 cursor-not-allowed"
                                      : level === "few"
                                        ? "border-coral/60 bg-coral/15 text-ink hover:bg-coral/25"
                                        : level === "limited"
                                          ? "border-gold/70 bg-gold/20 text-ink hover:bg-gold/35"
                                          : "border-ink/40 bg-mint/40 text-ink hover:bg-mint/70";
                                  const dot = booked
                                    ? "bg-emerald-600"
                                    : level === "full"
                                      ? "bg-ink/30"
                                      : level === "few"
                                        ? "bg-coral"
                                        : level === "limited"
                                          ? "bg-gold"
                                          : "bg-emerald-500";
                                  const label = booked
                                    ? "Reserved"
                                    : level === "full"
                                      ? "Fully booked"
                                      : level === "few"
                                        ? `Only ${seatsLeft} left`
                                        : level === "limited"
                                          ? `${seatsLeft} seats`
                                          : "Plenty open";
                                  return (
                                    <button
                                      key={time}
                                      type="button"
                                      onClick={() => reserveSlot(s.venue, time, level)}
                                      disabled={level === "full" || booked || busy}
                                      aria-label={`Reserve ${s.venue} at ${time} — ${label}`}
                                      className={`group flex flex-col items-start gap-1 rounded-xl border-2 px-2.5 py-2 text-left transition-pop ${tone}`}
                                    >
                                      <div className="flex w-full items-center justify-between font-mono text-[11px] font-bold uppercase tracking-widest">
                                        <span>
                                          {isPeak && !booked && "★ "}
                                          {time}
                                        </span>
                                        <span className="relative inline-flex h-2 w-2">
                                          {level !== "full" && !booked && (
                                            <span
                                              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${dot}`}
                                            />
                                          )}
                                          <span
                                            className={`relative inline-flex h-2 w-2 rounded-full ${dot}`}
                                          />
                                        </span>
                                      </div>
                                      <span className="font-mono text-[10px] uppercase tracking-wider text-ink/70">
                                        {busy ? "Reserving…" : label}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                              <p className="mt-2 text-[11px] text-ink/65">
                                Tap a slot to reserve —{" "}
                                {personalize?.preferredHour != null ? "your usual window" : "peak"}{" "}
                                around <span className="font-semibold text-ink">{d.peakTime}</span>.
                              </p>
                              <p className="mt-1 inline-flex items-start gap-1 rounded-md bg-cream px-2 py-1 font-mono text-[10px] text-ink/70">
                                <Sparkles className="mt-[1px] h-2.5 w-2.5 shrink-0 text-coral" />
                                <span>
                                  Why ★ {d.peakTime}: {peakReason(personalize, d.peakTime)}
                                </span>
                              </p>
                              {d.dishes.length > 0 && (
                                <>
                                  <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-ink/60">
                                    Most ordered · why for you
                                  </p>
                                  <ul className="mt-1.5 space-y-1.5">
                                    {d.dishes.map((dish) => {
                                      const reasons = dishReasons(dish, personalize, d.isUsual);
                                      return (
                                        <li key={dish}>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setOpenDish({ name: dish, venue: s.venue })
                                            }
                                            className="group flex w-full flex-col gap-0.5 rounded-md px-1 py-1 text-left text-[12px] text-ink/85 transition-colors hover:bg-gold/20 hover:text-ink"
                                            aria-label={`See details for ${dish}`}
                                          >
                                            <span className="flex w-full items-center gap-1.5">
                                              <span aria-hidden>🔥</span>
                                              <span className="underline-offset-2 group-hover:underline">
                                                {dish}
                                              </span>
                                              <span className="ml-auto font-mono text-[9px] uppercase tracking-widest text-ink/45 opacity-0 transition-opacity group-hover:opacity-100">
                                                View →
                                              </span>
                                            </span>
                                            {reasons.length > 0 && (
                                              <span className="ml-5 flex flex-wrap gap-1">
                                                {reasons.map((r) => (
                                                  <span
                                                    key={r}
                                                    className="inline-flex items-center gap-0.5 rounded-full border border-ink/20 bg-mint/40 px-1.5 py-[1px] font-mono text-[9px] uppercase tracking-widest text-ink/75"
                                                  >
                                                    {r}
                                                  </span>
                                                ))}
                                              </span>
                                            )}
                                          </button>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </>
                              )}
                            </div>

                            <div className="rounded-xl border-2 border-ink/15 bg-cream/60 p-3">
                              <p className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
                                The vibe
                              </p>
                              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[12px]">
                                <dt className="text-ink/55">Crowd</dt>
                                <dd className="text-ink/90">{d.vibeProfile.crowd}</dd>
                                <dt className="text-ink/55">Noise</dt>
                                <dd className="text-ink/90">{d.vibeProfile.noise}</dd>
                                <dt className="text-ink/55">Dress</dt>
                                <dd className="text-ink/90">{d.vibeProfile.dress}</dd>
                                <dt className="text-ink/55">Lighting</dt>
                                <dd className="text-ink/90">{d.vibeProfile.lighting}</dd>
                                <dt className="text-ink/55">Music</dt>
                                <dd className="text-ink/90">{d.vibeProfile.music}</dd>
                              </dl>
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
        {step <= 5 && (
          <div className="flex items-center justify-between gap-3 border-t-2 border-ink bg-cream/80 px-5 py-4 backdrop-blur">
            <button
              onClick={back}
              disabled={step === 0}
              className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-ink bg-cream px-4 font-mono text-xs font-bold uppercase tracking-widest shadow-brut transition-pop hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            {step < 5 ? (
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
      <DishQuickView
        open={openDish}
        onOpenChange={(o) => !o && setOpenDish(null)}
        avoidAllergens={personalize?.diet.avoidAllergens ?? []}
      />
      {shareData && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            left: -10000,
            top: 0,
            pointerEvents: "none",
            opacity: 0,
          }}
        >
          <StopShareCard ref={shareRef} data={shareData} />
        </div>
      )}
      <Dialog
        open={!!swapTarget}
        onOpenChange={(o) => {
          if (!o) {
            setSwapTarget(null);
            setSwapCandidates([]);
            setSwapError(null);
          }
        }}
      >
        <DialogContent className="max-w-lg border-2 border-ink bg-cream">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-extrabold">
              Swap this stop
            </DialogTitle>
            <DialogDescription className="font-mono text-xs text-ink/70">
              {swapTarget
                ? `Pick a different ${swapTarget.stop.vibe.toLowerCase()} venue for your ${swapTarget.stop.time} stop.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {swapLoading && (
            <div className="flex items-center justify-center gap-2 py-8 font-mono text-xs text-ink/70">
              <Loader2 className="h-4 w-4 animate-spin" /> Finding alternatives…
            </div>
          )}
          {!swapLoading && swapError && (
            <div className="rounded-xl border-2 border-ink bg-coral/10 p-3 font-mono text-xs text-ink/80">
              {swapError}
            </div>
          )}
          {!swapLoading && !swapError && swapCandidates.length > 0 && (
            <ul className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
              {swapCandidates.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => applySwap(c)}
                    className="flex w-full items-stretch gap-3 rounded-2xl border-2 border-ink bg-cream p-2 text-left transition-pop hover:-translate-y-0.5 hover:bg-ink/[0.03]"
                  >
                    {c.photo ? (
                      <img
                        src={c.photo}
                        alt={c.venue}
                        loading="lazy"
                        className="h-20 w-20 shrink-0 rounded-xl border-2 border-ink object-cover"
                      />
                    ) : (
                      <div className="grid h-20 w-20 shrink-0 place-items-center rounded-xl border-2 border-ink bg-gold/40">
                        <MapPin className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-display text-base font-extrabold leading-tight">
                        {c.venue}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-[11px] text-ink/70">
                        {typeof c.rating === "number" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-ink">
                            <Star className="h-2.5 w-2.5 fill-current" />
                            {c.rating.toFixed(1)}
                            {typeof c.userRatingCount === "number" &&
                              ` · ${c.userRatingCount}`}
                          </span>
                        )}
                        {typeof c.priceLevel === "number" && c.priceLevel > 0 && (
                          <span>{"$".repeat(c.priceLevel)}</span>
                        )}
                      </div>
                      {c.address && (
                        <div className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-ink/60">
                          <MapPin className="h-3 w-3" />
                          {c.address}
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StepShell({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ animation: "reveal-up 0.4s ease-out forwards" }}>
      <h2 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">{title}</h2>
      <p className="mt-1 text-sm text-ink/70">{sub}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function DishQuickView({
  open,
  onOpenChange,
  avoidAllergens = [],
}: {
  open: { name: string; venue: string } | null;
  onOpenChange: (next: boolean) => void;
  avoidAllergens?: string[];
}) {
  const info = open ? getDishInfo(open.name) : null;
  const pairingTone =
    info?.pairing.type === "wine"
      ? "bg-purple/15 text-purple border-purple/40"
      : info?.pairing.type === "beer"
        ? "bg-gold/20 text-ink border-gold/50"
        : info?.pairing.type === "non-alcoholic"
          ? "bg-mint/40 text-ink border-ink/30"
          : "bg-coral/15 text-coral border-coral/40";

  const avoidLower = avoidAllergens.map((a) => a.toLowerCase());
  const matched = info ? info.allergens.filter((a) => avoidLower.includes(a.toLowerCase())) : [];

  return (
    <Dialog open={!!open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {open && info && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-coral/15 text-coral">
                  <Flame className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-ink/55">
                    Most ordered at {open.venue}
                  </p>
                  <DialogTitle className="font-display text-2xl">{open.name}</DialogTitle>
                </div>
              </div>
              <DialogDescription className="pt-2 text-sm text-ink/80">
                {info.description}
              </DialogDescription>
            </DialogHeader>

            {matched.length > 0 && (
              <div
                role="alert"
                className="rounded-xl border-2 border-coral bg-coral/15 p-3 shadow-brut"
              >
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-coral">
                  ⚠ Heads up — contains allergens you avoid
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {matched.map((a) => (
                    <span
                      key={a}
                      className="inline-flex items-center gap-1 rounded-full border-2 border-coral bg-cream px-2 py-0.5 text-[11px] font-bold text-coral"
                    >
                      ⚠ {a}
                    </span>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-ink/80">
                  Confirm with the kitchen before ordering or ask about a substitute.
                </p>
              </div>
            )}

            {typeof info.spice === "number" && info.spice > 0 && (
              <div className="flex items-center gap-1.5 text-[12px] text-ink/70">
                <span className="font-mono uppercase tracking-widest text-ink/55">Spice</span>
                <span aria-label={`${info.spice} of 3`}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Flame
                      key={i}
                      className={`inline h-3.5 w-3.5 ${i < info.spice! ? "fill-coral text-coral" : "text-ink/20"}`}
                    />
                  ))}
                </span>
              </div>
            )}

            <div className="rounded-xl border-2 border-ink/15 bg-cream/60 p-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink/55">
                Allergens — let your server know
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {info.allergens.length > 0 ? (
                  info.allergens.map((a) => {
                    const isMatch = avoidLower.includes(a.toLowerCase());
                    return (
                      <span
                        key={a}
                        className={
                          isMatch
                            ? "inline-flex items-center gap-1 rounded-full border-2 border-coral bg-coral/25 px-2 py-0.5 text-[11px] font-bold text-coral"
                            : "inline-flex items-center gap-1 rounded-full border border-coral/50 bg-coral/10 px-2 py-0.5 text-[11px] text-ink/85"
                        }
                      >
                        ⚠ {a}
                        {isMatch ? " · avoid" : ""}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-[11px] text-ink/65">
                    No common allergens — confirm prep with the kitchen.
                  </span>
                )}
              </div>
            </div>

            <div className={`rounded-xl border-2 p-3 ${pairingTone}`}>
              <div className="flex items-center gap-2">
                <Wine className="h-4 w-4" />
                <p className="font-mono text-[10px] uppercase tracking-widest opacity-80">
                  Recommended pairing · {info.pairing.type}
                </p>
              </div>
              <p className="mt-1 font-display text-lg font-bold leading-tight">
                {info.pairing.name}
              </p>
              <p className="mt-1 text-[12px] opacity-90">{info.pairing.why}</p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
