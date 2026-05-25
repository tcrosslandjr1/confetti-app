import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Sparkles, Compass, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CITIES, setSelectedCity, type City } from "@/lib/cities";
import { cn } from "@/lib/utils";

const US_REGIONS = [
  "DC · MD · VA",
  "Manhattan · BK",
  "LA County",
  "Cook County",
  "Miami-Dade",
  "Bay Area",
  "Metro ATL",
  "Puget Sound",
  "Music City",
  "Clark County",
  "Harris County",
  "Shelby County",
  "East TN",
  "Hamilton County",
  "Great Smokies",
  "Maricopa County",
  "Travis County",
  "Mile High",
  "Suffolk County",
  "Delaware Valley",
  "Orleans Parish",
  "SoCal",
  "Multnomah County",
  "Lowcountry",
];

function isUS(city: City) {
  return US_REGIONS.includes(city.region);
}

const FILTERS = [
  { key: "all", label: "All cities" },
  { key: "us", label: "United States" },
  { key: "intl", label: "International" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function CitySearch() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const term = normalize(query);
    let list = CITIES;
    if (filter === "us") list = list.filter(isUS);
    if (filter === "intl") list = list.filter((c) => !isUS(c));
    if (!term) return list;
    return list.filter(
      (c) =>
        normalize(c.name).includes(term) ||
        normalize(c.region).includes(term) ||
        c.emoji === term,
    );
  }, [query, filter]);

  const grouped = useMemo(() => {
    if (query.trim()) return { "Search results": filtered };
    if (filter === "us") return { "United States": filtered };
    if (filter === "intl") return { International: filtered };
    return {
      "United States": filtered.filter(isUS),
      International: filtered.filter((c) => !isUS(c)),
    };
  }, [filtered, query, filter]);

  const flatList = useMemo(
    () => Object.values(grouped).flat(),
    [grouped],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((i) => Math.min(i + 1, flatList.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && focusedIndex >= 0) {
        e.preventDefault();
        const city = flatList[focusedIndex];
        if (city) {
          setSelectedCity(city.slug);
          window.location.href = `/cities/${city.slug}`;
        }
      } else if (e.key === "Escape") {
        setQuery("");
        setFocusedIndex(-1);
        inputRef.current?.blur();
      }
    },
    [flatList, focusedIndex],
  );

  useEffect(() => {
    setFocusedIndex(-1);
  }, [query, filter]);

  useEffect(() => {
    if (focusedIndex >= 0 && gridRef.current) {
      const el = gridRef.current.querySelector<HTMLElement>(`[data-city-index="${focusedIndex}"]`);
      el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [focusedIndex]);

  const resultCount = flatList.length;

  return (
    <div className="w-full">
      {/* Search bar */}
      <div className="mx-auto max-w-xl">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search cities, regions, or vibes…"
            className="h-14 rounded-2xl border-2 border-ink/15 bg-card pl-12 pr-12 text-base shadow-sm transition-all focus:border-primary focus:shadow-brut"
            aria-label="Search cities"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-ink"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-all",
                filter === f.key
                  ? "border-ink bg-ink text-cream shadow-brut"
                  : "border-ink/15 bg-card text-ink hover:border-ink/40 hover:-translate-y-0.5 hover:shadow-sm",
              )}
            >
              {f.label}
            </button>
          ))}
          <span className="ml-2 text-xs text-muted-foreground">
            {resultCount} city{resultCount !== 1 ? "ies" : "y"}
          </span>
        </div>
      </div>

      {/* Results */}
      <div ref={gridRef} className="mt-10">
        {resultCount === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-md rounded-2xl border-2 border-dashed border-border bg-card p-10 text-center"
          >
            <MapPin className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-lg font-semibold">No cities found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different search term or browse all cities.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
              className="mt-4"
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" /> Show all
            </Button>
          </motion.div>
        ) : (
          Object.entries(grouped).map(([group, cities]: [string, City[]]) =>
            cities.length === 0 ? null : (
              <div key={group} className="mt-10 first:mt-6">
                <h2 className="mb-4 text-xl font-bold tracking-tight text-ink">
                  {group}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {cities.length}
                  </span>
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {cities.map((city, idx) => {
                      const globalIndex = flatList.indexOf(city);
                      const isFocused = globalIndex === focusedIndex;
                      return (
                        <motion.div
                          key={city.slug}
                          layout
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{ duration: 0.2 }}
                          data-city-index={globalIndex}
                        >
                          <CityCard
                            city={city}
                            isFocused={isFocused}
                            onMouseEnter={() => setFocusedIndex(globalIndex)}
                          />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            ),
          )
        )}
      </div>
    </div>
  );
}

function CityCard({
  city,
  isFocused,
  onMouseEnter,
}: {
  city: City;
  isFocused: boolean;
  onMouseEnter: () => void;
}) {
  return (
    <div
      onMouseEnter={onMouseEnter}
      className={cn(
        "group relative flex flex-col rounded-2xl border-2 bg-card p-5 transition-all",
        isFocused
          ? "border-primary shadow-brut -translate-x-0.5 -translate-y-0.5"
          : "border-ink/10 hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5",
      )}
    >
      {/* Header — clickable link to city page */}
      <Link
        to="/cities/$slug"
        params={{ slug: city.slug }}
        className="flex items-start gap-4 rounded-xl p-1 -m-1 transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-ink/10 bg-surface-1 text-2xl">
          {city.emoji}
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-tight text-ink">{city.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{city.region}</span>
          </p>
        </div>
      </Link>

      {/* Quick actions */}
      <div className="mt-4 flex gap-2">
        <Button
          asChild
          size="sm"
          className="h-9 flex-1 gap-1.5 rounded-xl text-xs font-bold"
          onClick={() => setSelectedCity(city.slug)}
        >
          <Link to="/app/plan">
            <Sparkles className="h-3.5 w-3.5" />
            Plan my night
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-9 flex-1 gap-1.5 rounded-xl border-2 border-ink/15 text-xs font-bold hover:border-ink/30"
          onClick={() => setSelectedCity(city.slug)}
        >
          <Link to="/app/explore">
            <Compass className="h-3.5 w-3.5" />
            Quick picks
          </Link>
        </Button>
      </div>
    </div>
  );
}

/* ---------- Compact inline picker (for headers, hero, etc.) ---------- */

export function CityPickerTrigger({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const term = normalize(query);
    if (!term) return CITIES.slice(0, 6);
    return CITIES.filter(
      (c) =>
        normalize(c.name).includes(term) || normalize(c.region).includes(term),
    ).slice(0, 6);
  }, [query]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border-2 border-ink/15 bg-card px-4 py-2 text-sm font-semibold text-ink transition-all hover:border-ink/30",
          open && "border-primary shadow-brut",
        )}
      >
        <MapPin className="h-4 w-4 text-primary" />
        Pick a city
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-50 mt-2 w-80 rounded-2xl border-2 border-ink/15 bg-card p-3 shadow-brut-lg"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search cities…"
                className="h-10 w-full rounded-xl border-2 border-ink/15 bg-surface-1 pl-9 pr-8 text-sm text-ink placeholder:text-ink/35 focus:border-primary focus:outline-none focus:ring-0"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="mt-2 max-h-64 overflow-auto">
              {results.length === 0 ? (
                <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No cities found
                </p>
              ) : (
                results.map((city) => (
                  <Link
                    key={city.slug}
                    to="/cities/$slug"
                    params={{ slug: city.slug }}
                    onClick={() => {
                      setSelectedCity(city.slug);
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-primary/10"
                  >
                    <span className="text-xl">{city.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">{city.name}</p>
                      <p className="text-xs text-muted-foreground">{city.region}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>

            <div className="mt-2 border-t border-border pt-2">
              <Link
                to="/cities"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold text-primary hover:bg-primary/10"
              >
                <Compass className="h-3.5 w-3.5" />
                Browse all 50+ cities
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
