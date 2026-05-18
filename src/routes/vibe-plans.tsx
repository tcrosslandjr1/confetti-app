import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, MapPin, Loader2, ArrowLeft, Waves, Mountain } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { MobileHeader } from "@/components/AppShell";
import { cn } from "@/lib/utils";
import { generatePlan } from "@/lib/generate-plan.functions";
import { classifyOuting } from "@/lib/classify-outing.functions";
import type { GeneratedPlan } from "@/lib/agents/types";
import { CITIES, findCityLoose, type CityContext } from "@/lib/agents/city-context";
import { matchState, isKnownCity } from "@/lib/agents/states";
import { detectWaterfront } from "@/lib/agents/waterfront";
import { setActiveLoop, makeDemoLoop, type ActiveLoop } from "@/lib/loop-store";
import {
  CATEGORY_GROUPS,
  OUTING_CATEGORIES,
  CATEGORIES_BY_ID,
  categoriesInGroup,
  resolveCategories,
  buildCategoryDirective,
  type CategoryGroupId,
} from "@/lib/agents/outing-categories";

export const Route = createFileRoute("/vibe-plans")({
  component: VibePlansPage,
});

type Vibe = {
  id: string;
  label: string;
  occasionId: string;
  mood: string;
  emoji: string;
};

const VIBES: Vibe[] = [
  { id: "chill", label: "Chill", occasionId: "date_night", mood: "mellow", emoji: "🌙" },
  { id: "turn_up", label: "Turn Up", occasionId: "girls_night", mood: "hyped", emoji: "🔥" },
  { id: "soft_life", label: "Soft Life", occasionId: "date_night", mood: "romantic", emoji: "🤍" },
  {
    id: "instagrammy",
    label: "Instagrammy",
    occasionId: "girls_night",
    mood: "aesthetic",
    emoji: "📸",
  },
  { id: "day_party", label: "Day Party", occasionId: "birthday", mood: "social", emoji: "☀️" },
  { id: "wine_night", label: "Wine Night", occasionId: "date_night", mood: "easy", emoji: "🍷" },
  {
    id: "adventurous",
    label: "Adventurous",
    occasionId: "out_of_towner",
    mood: "social",
    emoji: "🎢",
  },
  {
    id: "country_vibes",
    label: "Country Vibes",
    occasionId: "girls_night",
    mood: "social",
    emoji: "🤠",
  },
  { id: "live_music", label: "Live Music", occasionId: "friends", mood: "social", emoji: "🎤" },
  // Guys-night / bachelor pack
  { id: "guys_night", label: "Guys Night", occasionId: "friends", mood: "social", emoji: "🍻" },
  { id: "bachelor", label: "Bachelor", occasionId: "birthday", mood: "hyped", emoji: "🥃" },
  { id: "yacht", label: "Yacht Party", occasionId: "birthday", mood: "hyped", emoji: "🛥️" },
  { id: "casino", label: "Casino", occasionId: "friends", mood: "hyped", emoji: "🎰" },
  { id: "grown_man", label: "Grown Man", occasionId: "friends", mood: "easy", emoji: "🥃" },
  {
    id: "cigar_whiskey",
    label: "Cigar & Whiskey",
    occasionId: "friends",
    mood: "easy",
    emoji: "🚬",
  },
  { id: "wild", label: "Wild", occasionId: "birthday", mood: "wild", emoji: "🎉" },
  { id: "late_night", label: "Late Night", occasionId: "friends", mood: "hyped", emoji: "🌃" },
  { id: "surprise", label: "Surprise Me", occasionId: "friends", mood: "social", emoji: "✨" },
];

// Vibes that gate adult-entertainment toggle visibility (must be 21+ AND on-vibe).
const ADULT_TRIGGER_IDS = new Set(["bachelor", "wild", "turn_up", "late_night"]);

function VibePlansPage() {
  const generate = useServerFn(generatePlan);
  const navigate = useNavigate();

  const [cityQuery, setCityQuery] = useState("");
  const [pendingState, setPendingState] = useState<ReturnType<typeof matchState>>(null);
  const [city, setCity] = useState<CityContext | null>(null);
  const [vibe, setVibe] = useState<Vibe | null>(null);
  const [customVibe, setCustomVibe] = useState("");
  const [budget, setBudget] = useState(75);
  const [groupSize, setGroupSize] = useState(4);
  const [energy, setEnergy] = useState(3);
  const [waterfrontPref, setWaterfrontPref] = useState<"auto" | "yes" | "no">("auto");
  const [includeYacht, setIncludeYacht] = useState(false);
  const [includeCasino, setIncludeCasino] = useState(false);
  const [includeAdult, setIncludeAdult] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  // Outing categories
  const [activeGroup, setActiveGroup] = useState<CategoryGroupId>("social");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [catSearch, setCatSearch] = useState("");
  const [freeText, setFreeText] = useState("");
  const [classifying, setClassifying] = useState(false);
  const classify = useServerFn(classifyOuting);

  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const waterfront = city ? detectWaterfront(city) : null;

  function handleCitySearch() {
    const q = cityQuery.trim();
    if (!q) return;
    setError(null);
    // State first → ask clarification
    const state = matchState(q);
    if (state) {
      setPendingState(state);
      setCity(null);
      return;
    }
    // Known city in registry
    if (isKnownCity(q)) {
      const found = findCityLoose(q, q);
      if (found) {
        setCity(found);
        setPendingState(null);
        return;
      }
    }
    // Unknown — surface fallback options
    setPendingState({
      state: "unknown",
      label: `"${q}"`,
      cities: CITIES,
    });
  }

  function pickCity(c: CityContext) {
    setCity(c);
    setPendingState(null);
    setCityQuery(c.label);
  }

  function reset() {
    setPlan(null);
    setError(null);
  }

  async function build() {
    if (!city) return;
    const v = vibe ?? {
      id: "custom",
      label: customVibe || "Surprise me",
      occasionId: "friends",
      mood: "social",
      emoji: "✨",
    };
    setLoading(true);
    setError(null);
    try {
      const tweaks: string[] = [];
      if (waterfrontPref === "yes" && waterfront?.hasWaterfront) {
        tweaks.push("strongly prefer waterfront stops");
      } else if (waterfrontPref === "no" || !waterfront?.hasWaterfront) {
        tweaks.push(
          "use scenic alternatives (rooftops, overlooks, skyline, mountain or desert views) — no waterfront stops",
        );
      }
      const energyLabel = ["mellow", "easy", "social", "hyped", "wild"][energy - 1] ?? "social";
      tweaks.push(`energy: ${energyLabel}`);
      if (customVibe.trim()) tweaks.push(`custom vibe: ${customVibe.trim()}`);

      const resolved = resolveCategories(selectedCats);
      if (resolved) tweaks.push(buildCategoryDirective(resolved, freeText));
      else if (freeText.trim()) tweaks.push(`user said: "${freeText.trim().slice(0, 200)}"`);

      const budgetTier: 1 | 2 | 3 | 4 = budget < 40 ? 1 : budget < 100 ? 2 : budget < 200 ? 3 : 4;

      const adultOk = includeAdult && ageConfirmed && vibe ? ADULT_TRIGGER_IDS.has(vibe.id) : false;

      const result = await generate({
        data: {
          city: city.city,
          occasionId: v.occasionId,
          occasionLabel: v.label,
          vibeId: v.id,
          vibeLabel: v.label,
          currentMood: v.mood,
          groupSize,
          budget: budgetTier,
          tweakDirective: tweaks.join("; "),
          includeYacht: includeYacht && (waterfront?.hasWaterfront ?? false),
          includeCasino,
          includeAdultEntertainment: adultOk,
        },
      });
      setPlan(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate a plan. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function lockIn() {
    if (!plan || !city) return;
    const v = vibe ?? {
      id: "custom",
      label: customVibe || "Surprise me",
      occasionId: "friends",
      mood: "social",
      emoji: "✨",
    };
    const loop: ActiveLoop = {
      ...makeDemoLoop({
        passenger: "GUEST",
        groupSize,
        occasion: v.label,
        vibe: v.label,
        to: v.label.toUpperCase(),
        boardingTime: plan.stops[0]?.time ?? "6:00 PM",
        stops: plan.stops.map((s) => ({
          id: s.id,
          name: s.name,
          type: s.type,
          time: s.time,
          area: s.area,
          venueId: s.venueId,
          lat: s.lat,
          lng: s.lng,
          rationale: s.rationale,
          slot: s.slot,
        })),
      }),
      city: plan.city,
      experienceName: plan.experienceName,
      experienceTagline: plan.experienceTagline,
      blueprint: plan.blueprint,
      estimatedSpend: plan.estimatedSpend,
      fitScore: plan.fitScore,
      guardrailNote: plan.guardrailNote,
      bonusMove: plan.bonus,
      planParams: {
        city: city.city,
        occasionId: v.occasionId,
        occasionLabel: v.label,
        vibeId: v.id,
        vibeLabel: v.label,
        groupSize,
      },
    };
    setActiveLoop(loop);
    navigate({ to: "/boarding-pass" });
  }

  // ── Render: plan view ─────────────────────────────────────────────
  if (plan) {
    const stopCount = plan.stops.length;
    return (
      <div className="min-h-screen bg-background pb-12">
        <MobileHeader eyebrow="Vibe Plans" title={plan.experienceName} />
        <div className="space-y-4 px-5">
          <Button variant="ghost" size="sm" onClick={reset}>
            <ArrowLeft className="mr-1 h-4 w-4" /> New plan
          </Button>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">{plan.experienceTagline}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <Badge variant="secondary">{plan.city}</Badge>
              <Badge variant="secondary">{plan.vibeLabel}</Badge>
              <Badge variant="secondary">{plan.estimatedSpend}</Badge>
            </div>
          </Card>

          {plan.stops.map((stop, i) => (
            <Card key={stop.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    {stop.time} · {stop.slot}
                  </div>
                  <h3 className="mt-1 text-base font-semibold">{stop.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {stop.type}
                    {stop.area ? ` · ${stop.area}` : ""}
                  </p>
                  <p className="mt-2 text-sm">{stop.rationale}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => void build()} disabled={loading}>
                  Swap
                </Button>
              </div>
              {i < plan.stops.length - 1 ? <div className="mt-3 h-px w-full bg-border" /> : null}
            </Card>
          ))}

          {plan.bonus ? (
            <Card className="border-dashed p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Bonus</div>
              <div className="text-sm font-semibold">{plan.bonus.name}</div>
              <p className="text-xs text-muted-foreground">{plan.bonus.reason}</p>
            </Card>
          ) : null}

          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => void build()} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Regenerate"}
            </Button>
            <Button variant="secondary" className="flex-1" onClick={lockIn}>
              Lock in {stopCount} stop{stopCount === 1 ? "" : "s"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: builder ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-16">
      <MobileHeader eyebrow="Vibe Plans" title="Plan a night that fits the city." />
      <div className="space-y-5 px-5">
        {/* City */}
        <Card className="p-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            City
          </label>
          <div className="mt-2 flex gap-2">
            <Input
              placeholder="Nashville, Memphis, Tennessee…"
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCitySearch();
              }}
            />
            <Button onClick={handleCitySearch} size="sm">
              <MapPin className="h-4 w-4" />
            </Button>
          </div>

          {pendingState ? (
            <div className="mt-3 rounded-lg border border-dashed p-3">
              <p className="text-sm">
                Which city in <span className="font-semibold">{pendingState.label}</span>?
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {pendingState.cities.map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => pickCity(c)}
                    className="rounded-full border bg-card px-3 py-1 text-xs hover:bg-accent"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {city ? (
            <div className="mt-3 flex items-center gap-2 text-xs">
              <Badge variant="default">{city.label}</Badge>
              {waterfront?.hasWaterfront ? (
                <Badge variant="secondary" className="gap-1">
                  <Waves className="h-3 w-3" /> {waterfront.waterType ?? "waterfront"}
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <Mountain className="h-3 w-3" /> scenic
                </Badge>
              )}
            </div>
          ) : null}
        </Card>

        {/* Vibe */}
        <Card className="p-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Vibe
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {VIBES.map((v) => (
              <button
                key={v.id}
                onClick={() => setVibe(v)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs transition",
                  vibe?.id === v.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-card hover:bg-accent",
                )}
              >
                <span className="mr-1">{v.emoji}</span>
                {v.label}
              </button>
            ))}
          </div>
          <Input
            className="mt-3"
            placeholder="Custom vibe (optional)…"
            value={customVibe}
            onChange={(e) => setCustomVibe(e.target.value)}
          />
        </Card>

        {/* Knobs */}
        <Card className="space-y-5 p-4">
          <div>
            <div className="flex justify-between text-xs">
              <span className="font-semibold uppercase tracking-wider text-muted-foreground">
                Budget / person
              </span>
              <span>${budget}</span>
            </div>
            <Slider
              min={15}
              max={400}
              step={5}
              value={[budget]}
              onValueChange={([v]) => setBudget(v ?? 75)}
              className="mt-2"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs">
              <span className="font-semibold uppercase tracking-wider text-muted-foreground">
                Group size
              </span>
              <span>{groupSize}</span>
            </div>
            <Slider
              min={1}
              max={20}
              step={1}
              value={[groupSize]}
              onValueChange={([v]) => setGroupSize(v ?? 4)}
              className="mt-2"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs">
              <span className="font-semibold uppercase tracking-wider text-muted-foreground">
                Energy
              </span>
              <span>{["mellow", "easy", "social", "hyped", "wild"][energy - 1]}</span>
            </div>
            <Slider
              min={1}
              max={5}
              step={1}
              value={[energy]}
              onValueChange={([v]) => setEnergy(v ?? 3)}
              className="mt-2"
            />
          </div>

          {/* Waterfront / scenic toggle — only when city has waterfront */}
          {waterfront?.hasWaterfront ? (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Waterfront
              </div>
              <div className="mt-2 flex gap-2">
                {(["auto", "yes", "no"] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setWaterfrontPref(opt)}
                    className={cn(
                      "flex-1 rounded-full border px-3 py-1.5 text-xs capitalize",
                      waterfrontPref === opt
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-card hover:bg-accent",
                    )}
                  >
                    {opt === "yes" ? "On the water" : opt === "no" ? "Skyline / scenic" : "Auto"}
                  </button>
                ))}
              </div>
            </div>
          ) : city ? (
            <p className="text-xs text-muted-foreground">
              {city.label} doesn't have a meaningful waterfront — using scenic alternatives
              (rooftops, overlooks, {city.environmentFeatures.slice(0, 2).join(", ") || "skyline"}).
            </p>
          ) : null}
        </Card>

        {/* Optional add-ons: yacht / casino / adult — gated by city + vibe */}
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Optional add-ons
            </div>
            <Badge variant="outline" className="text-[10px]">
              21+
            </Badge>
          </div>

          {waterfront?.hasWaterfront ? (
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>🛥️ Include yacht or boat option</span>
              <input
                type="checkbox"
                checked={includeYacht}
                onChange={(e) => setIncludeYacht(e.target.checked)}
                className="h-4 w-4"
              />
            </label>
          ) : null}

          <label className="flex items-start justify-between gap-3 text-sm">
            <span>
              🎰 Include casino stop
              {includeCasino ? (
                <span className="ml-1 block text-[10px] text-muted-foreground">
                  Play for fun — set a buffer before you sit down.
                </span>
              ) : null}
            </span>
            <input
              type="checkbox"
              checked={includeCasino}
              onChange={(e) => setIncludeCasino(e.target.checked)}
              className="mt-1 h-4 w-4"
            />
          </label>

          {vibe && ADULT_TRIGGER_IDS.has(vibe.id) ? (
            <div className="rounded-lg border border-dashed p-3">
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>🍸 Include optional adult entertainment</span>
                <input
                  type="checkbox"
                  checked={includeAdult}
                  onChange={(e) => setIncludeAdult(e.target.checked)}
                  className="h-4 w-4"
                />
              </label>
              {includeAdult ? (
                <label className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={ageConfirmed}
                    onChange={(e) => setAgeConfirmed(e.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5"
                  />
                  <span>
                    I confirm everyone in my group is 21+ and consents to adult-entertainment stops.
                    Off by default.
                  </span>
                </label>
              ) : null}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              Adult-entertainment toggle only appears for Bachelor / Wild / Turn Up / Late Night
              vibes.
            </p>
          )}
        </Card>

        {error ? (
          <Card className="border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </Card>
        ) : null}

        <Button
          size="lg"
          className="w-full"
          disabled={!city || loading}
          onClick={() => void build()}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" /> Generate my night
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
