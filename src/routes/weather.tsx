import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Loader2,
  MapPin,
  Search,
  Sun,
  Wind,
  Droplets,
  Thermometer,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/weather")({
  head: () => ({
    meta: [
      { title: "Local Weather — current conditions and 7-day forecast" },
      {
        name: "description",
        content:
          "Check your local weather with current conditions, hourly trend, and a 7-day forecast. Free, no sign-up required.",
      },
    ],
  }),
  component: WeatherPage,
});

interface Place {
  name: string;
  admin: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
}

interface WeatherData {
  current: {
    temperature: number;
    apparent: number;
    humidity: number;
    windSpeed: number;
    code: number;
    isDay: boolean;
    time: string;
  };
  daily: Array<{
    date: string;
    code: number;
    tMax: number;
    tMin: number;
    precipProb: number;
  }>;
}

const WMO: Record<number, { label: string; Icon: typeof Sun }> = {
  0: { label: "Clear sky", Icon: Sun },
  1: { label: "Mainly clear", Icon: Sun },
  2: { label: "Partly cloudy", Icon: Cloud },
  3: { label: "Overcast", Icon: Cloud },
  45: { label: "Fog", Icon: CloudFog },
  48: { label: "Rime fog", Icon: CloudFog },
  51: { label: "Light drizzle", Icon: CloudDrizzle },
  53: { label: "Drizzle", Icon: CloudDrizzle },
  55: { label: "Heavy drizzle", Icon: CloudDrizzle },
  61: { label: "Light rain", Icon: CloudRain },
  63: { label: "Rain", Icon: CloudRain },
  65: { label: "Heavy rain", Icon: CloudRain },
  71: { label: "Light snow", Icon: CloudSnow },
  73: { label: "Snow", Icon: CloudSnow },
  75: { label: "Heavy snow", Icon: CloudSnow },
  77: { label: "Snow grains", Icon: CloudSnow },
  80: { label: "Rain showers", Icon: CloudRain },
  81: { label: "Heavy showers", Icon: CloudRain },
  82: { label: "Violent showers", Icon: CloudRain },
  85: { label: "Snow showers", Icon: CloudSnow },
  86: { label: "Heavy snow showers", Icon: CloudSnow },
  95: { label: "Thunderstorm", Icon: CloudLightning },
  96: { label: "Thunderstorm w/ hail", Icon: CloudLightning },
  99: { label: "Severe thunderstorm", Icon: CloudLightning },
};

function describe(code: number) {
  return WMO[code] ?? { label: "Unknown", Icon: Cloud };
}

export interface WeatherAlert {
  id: string;
  event: string;
  severity: string;
  headline: string | null;
  description: string | null;
  sender: string | null;
  effective: string | null;
  expires: string | null;
}

async function fetchAlerts(
  lat: number,
  lon: number,
  country: string | null,
): Promise<{ alerts: WeatherAlert[]; supported: boolean }> {
  // Free U.S. National Weather Service API covers the United States and its
  // territories. We don't have a unified free alerts feed for other regions.
  const isUS =
    !country ||
    country === "United States" ||
    country === "United States of America" ||
    country === "USA";
  if (!isUS) return { alerts: [], supported: false };
  try {
    const url = new URL("https://api.weather.gov/alerts/active");
    url.searchParams.set("point", `${lat.toFixed(4)},${lon.toFixed(4)}`);
    const r = await fetch(url, { headers: { Accept: "application/geo+json" } });
    if (!r.ok) return { alerts: [], supported: true };
    const j = (await r.json()) as {
      features?: Array<{
        id: string;
        properties: {
          event?: string;
          severity?: string;
          headline?: string;
          description?: string;
          senderName?: string;
          effective?: string;
          expires?: string;
        };
      }>;
    };
    const all: WeatherAlert[] = (j.features ?? []).map((f) => ({
      id: f.id,
      event: f.properties.event ?? "Weather alert",
      severity: f.properties.severity ?? "Unknown",
      headline: f.properties.headline ?? null,
      description: f.properties.description ?? null,
      sender: f.properties.senderName ?? null,
      effective: f.properties.effective ?? null,
      expires: f.properties.expires ?? null,
    }));
    const severe = all.filter((a) => ["Severe", "Extreme"].includes(a.severity));
    return { alerts: severe.length > 0 ? severe : all, supported: true };
  } catch {
    return { alerts: [], supported: true };
  }
}

async function geocode(query: string): Promise<Place[]> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query);
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");
  const r = await fetch(url);
  if (!r.ok) throw new Error("Couldn't search for that location.");
  const j = (await r.json()) as {
    results?: Array<{
      name: string;
      admin1?: string;
      country?: string;
      latitude: number;
      longitude: number;
    }>;
  };
  return (j.results ?? []).map((p) => ({
    name: p.name,
    admin: p.admin1 ?? null,
    country: p.country ?? null,
    latitude: p.latitude,
    longitude: p.longitude,
  }));
}

async function reverseGeocode(lat: number, lon: number): Promise<Place> {
  // Open-Meteo's reverse endpoint is best-effort; fall back to coordinates.
  try {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/reverse");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");
    const r = await fetch(url);
    if (r.ok) {
      const j = (await r.json()) as {
        results?: Array<{
          name: string;
          admin1?: string;
          country?: string;
        }>;
      };
      const top = j.results?.[0];
      if (top) {
        return {
          name: top.name,
          admin: top.admin1 ?? null,
          country: top.country ?? null,
          latitude: lat,
          longitude: lon,
        };
      }
    }
  } catch {
    // ignored — fall through to coordinates label
  }
  return {
    name: `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
    admin: null,
    country: null,
    latitude: lat,
    longitude: lon,
  };
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day",
  );
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
  );
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "7");
  const r = await fetch(url);
  if (!r.ok) throw new Error("Weather service is unavailable. Please retry.");
  const j = await r.json();
  return {
    current: {
      temperature: j.current.temperature_2m,
      apparent: j.current.apparent_temperature,
      humidity: j.current.relative_humidity_2m,
      windSpeed: j.current.wind_speed_10m,
      code: j.current.weather_code,
      isDay: j.current.is_day === 1,
      time: j.current.time,
    },
    daily: j.daily.time.map((date: string, i: number) => ({
      date,
      code: j.daily.weather_code[i],
      tMax: j.daily.temperature_2m_max[i],
      tMin: j.daily.temperature_2m_min[i],
      precipProb: j.daily.precipitation_probability_max[i] ?? 0,
    })),
  };
}

function WeatherPage() {
  const [place, setPlace] = useState<Place | null>(null);
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [alertsSupported, setAlertsSupported] = useState(true);
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);

  async function loadFor(p: Place) {
    setLoading(true);
    setError(null);
    setAlerts([]);
    try {
      const [w, a] = await Promise.all([
        fetchWeather(p.latitude, p.longitude),
        fetchAlerts(p.latitude, p.longitude, p.country),
      ]);
      setPlace(p);
      setData(w);
      setAlerts(a.alerts);
      setAlertsSupported(a.supported);
      setResults(null);
      setQuery("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function useMyLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Your browser doesn't support geolocation.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const p = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          await loadFor(p);
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError("Location access was denied. Search for a city instead.");
        } else {
          setError("Couldn't get your location. Search for a city instead.");
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60_000 },
    );
  }

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setError(null);
    try {
      const r = await geocode(q);
      if (r.length === 0) {
        setError(`No matches for "${q}".`);
        setResults([]);
      } else if (r.length === 1) {
        await loadFor(r[0]);
      } else {
        setResults(r);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSearching(false);
    }
  }

  // Auto-attempt geolocation on first mount.
  useEffect(() => {
    useMyLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = data?.current;
  const CurrentIcon = current ? describe(current.code).Icon : Sun;
  const currentLabel = current ? describe(current.code).label : "";

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
      <header className="mb-6 space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Local weather</h1>
        <p className="text-sm text-muted-foreground">
          Current conditions and a 7-day forecast for any city, or use your current location.
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <form onSubmit={runSearch} className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a city (e.g. Lisbon, Tokyo)"
              className="pl-9"
              autoComplete="off"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={searching || !query.trim()}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
            <Button type="button" variant="outline" onClick={useMyLocation} disabled={locating}>
              {locating ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="mr-1.5 h-4 w-4" />
              )}
              My location
            </Button>
          </div>
        </form>

        {results && results.length > 1 && (
          <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
            {results.map((p, i) => (
              <li key={`${p.latitude}-${p.longitude}-${i}`}>
                <button
                  type="button"
                  onClick={() => loadFor(p)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {[p.admin, p.country].filter(Boolean).join(", ")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {error && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-destructive">
            <AlertTriangle className="h-3.5 w-3.5" />
            {error}
          </p>
        )}

        {loading && !data && (
          <div className="mt-6 flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading weather…
          </div>
        )}

        {data && place && current && (
          <article className="mt-6 space-y-6">
            {alerts.length > 0 && (
              <section aria-label="Active weather alerts" className="space-y-2">
                {alerts.map((a) => {
                  const expanded = expandedAlertId === a.id;
                  const extreme = a.severity === "Extreme";
                  return (
                    <Alert
                      key={a.id}
                      variant="destructive"
                      className={
                        extreme
                          ? "border-destructive bg-destructive/10"
                          : "border-destructive/60 bg-destructive/5"
                      }
                    >
                      <ShieldAlert className="h-4 w-4" />
                      <AlertTitle className="flex flex-wrap items-center gap-2">
                        <span>{a.event}</span>
                        <span className="rounded-full border border-destructive/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                          {a.severity}
                        </span>
                      </AlertTitle>
                      <AlertDescription className="space-y-1.5">
                        {a.headline && <p className="text-xs">{a.headline}</p>}
                        {(() => {
                          const now = Date.now();
                          const eff = a.effective ? new Date(a.effective) : null;
                          const exp = a.expires ? new Date(a.expires) : null;
                          if (!eff && !exp) return null;
                          const fmt = (d: Date) =>
                            d.toLocaleString(undefined, {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            });
                          const inEffect =
                            (!eff || eff.getTime() <= now) && (!exp || exp.getTime() > now);
                          const upcoming = !!eff && eff.getTime() > now;
                          const ended = !!exp && exp.getTime() <= now;
                          return (
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                {inEffect && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/20 px-2 py-0.5 font-semibold uppercase tracking-wide">
                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />
                                    Currently in effect
                                  </span>
                                )}
                                {upcoming && (
                                  <span className="rounded-full border border-current px-2 py-0.5 font-semibold uppercase tracking-wide opacity-80">
                                    Upcoming
                                  </span>
                                )}
                                {ended && (
                                  <span className="rounded-full border border-current px-2 py-0.5 font-semibold uppercase tracking-wide opacity-70">
                                    Ended
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] opacity-80">
                                {eff && exp
                                  ? `From ${fmt(eff)} until ${fmt(exp)}`
                                  : exp
                                    ? `In effect until ${fmt(exp)}`
                                    : `From ${fmt(eff!)}`}
                              </p>
                              {a.sender && (
                                <p className="text-[11px] opacity-70">Issued by {a.sender}</p>
                              )}
                            </div>
                          );
                        })()}
                        {a.description && (
                          <>
                            {expanded && (
                              <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed opacity-90">
                                {a.description}
                              </p>
                            )}
                            <button
                              type="button"
                              onClick={() => setExpandedAlertId(expanded ? null : a.id)}
                              className="text-[11px] font-medium underline underline-offset-2"
                            >
                              {expanded ? "Hide details" : "Show details"}
                            </button>
                          </>
                        )}
                      </AlertDescription>
                    </Alert>
                  );
                })}
              </section>
            )}
            {alerts.length === 0 && alertsSupported && (
              <p className="text-[11px] text-muted-foreground">
                No active severe weather alerts for this location.
              </p>
            )}
            {!alertsSupported && (
              <p className="text-[11px] text-muted-foreground">
                Severe weather alerts aren't available for this region yet (currently U.S. only).
              </p>
            )}
            <div className="flex flex-col gap-4 rounded-xl bg-muted/40 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {[place.name, place.admin, place.country].filter(Boolean).join(", ")}
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-5xl font-bold tracking-tight">
                    {Math.round(current.temperature)}°
                  </span>
                  <span className="text-sm text-muted-foreground">C</span>
                </div>
                <p className="mt-1 text-sm font-medium">{currentLabel}</p>
                <p className="text-xs text-muted-foreground">
                  Feels like {Math.round(current.apparent)}°C
                </p>
              </div>
              <CurrentIcon
                className={`h-20 w-20 ${current.isDay ? "text-amber-500" : "text-indigo-400"}`}
                strokeWidth={1.5}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Stat
                Icon={Thermometer}
                label="Feels like"
                value={`${Math.round(current.apparent)}°C`}
              />
              <Stat Icon={Droplets} label="Humidity" value={`${current.humidity}%`} />
              <Stat Icon={Wind} label="Wind" value={`${Math.round(current.windSpeed)} km/h`} />
            </div>

            <div>
              <h2 className="mb-2 text-sm font-semibold">7-day forecast</h2>
              <ul className="divide-y divide-border rounded-xl border border-border">
                {data.daily.map((d, i) => {
                  const { Icon, label } = describe(d.code);
                  const dt = new Date(d.date);
                  const dayLabel =
                    i === 0
                      ? "Today"
                      : dt.toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        });
                  return (
                    <li key={d.date} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                      <span className="w-24 font-medium">{dayLabel}</span>
                      <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate text-muted-foreground">{label}</span>
                      <span className="w-12 text-right text-xs text-sky-600">{d.precipProb}%</span>
                      <span className="w-20 text-right tabular-nums">
                        <span className="font-semibold">{Math.round(d.tMax)}°</span>
                        <span className="ml-1 text-muted-foreground">{Math.round(d.tMin)}°</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </article>
        )}
      </section>

      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        Weather data by Open-Meteo. Forecasts are estimates and can change.
      </p>
    </main>
  );
}

function Stat({ Icon, label, value }: { Icon: typeof Sun; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 text-base font-semibold tabular-nums">{value}</div>
    </div>
  );
}
