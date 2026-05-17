// Lightweight weather helper backed by Open-Meteo (free, no key).
// Geocodes a city label to lat/lon, fetches a 7-day forecast, picks the
// day matching the user's chosen date, and exposes a tiny React hook.

import { useEffect, useState } from "react";

export interface DayForecast {
  date: string; // ISO yyyy-mm-dd
  code: number; // WMO code
  tMax: number;
  tMin: number;
  precipProb: number; // 0-100
}

interface CachedGeo {
  lat: number;
  lon: number;
  ts: number;
}
const geoCache = new Map<string, CachedGeo>();

async function geocodeCity(city: string): Promise<{ lat: number; lon: number } | null> {
  const key = city.toLowerCase().trim();
  const hit = geoCache.get(key);
  if (hit && Date.now() - hit.ts < 24 * 60 * 60 * 1000) return { lat: hit.lat, lon: hit.lon };
  try {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", city);
    url.searchParams.set("count", "1");
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");
    const r = await fetch(url);
    if (!r.ok) return null;
    const j = (await r.json()) as { results?: Array<{ latitude: number; longitude: number }> };
    const top = j.results?.[0];
    if (!top) return null;
    geoCache.set(key, { lat: top.latitude, lon: top.longitude, ts: Date.now() });
    return { lat: top.latitude, lon: top.longitude };
  } catch {
    return null;
  }
}

async function fetchDaily(lat: number, lon: number): Promise<DayForecast[]> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
  );
  url.searchParams.set("temperature_unit", "fahrenheit");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "16");
  const r = await fetch(url);
  if (!r.ok) throw new Error("weather unavailable");
  const j = await r.json();
  return (j.daily.time as string[]).map((date, i) => ({
    date,
    code: j.daily.weather_code[i],
    tMax: Math.round(j.daily.temperature_2m_max[i]),
    tMin: Math.round(j.daily.temperature_2m_min[i]),
    precipProb: j.daily.precipitation_probability_max[i] ?? 0,
  }));
}

export const WMO: Record<number, { label: string; emoji: string }> = {
  0: { label: "Clear", emoji: "☀️" },
  1: { label: "Mostly clear", emoji: "🌤️" },
  2: { label: "Partly cloudy", emoji: "⛅" },
  3: { label: "Overcast", emoji: "☁️" },
  45: { label: "Fog", emoji: "🌫️" },
  48: { label: "Rime fog", emoji: "🌫️" },
  51: { label: "Light drizzle", emoji: "🌦️" },
  53: { label: "Drizzle", emoji: "🌦️" },
  55: { label: "Heavy drizzle", emoji: "🌧️" },
  61: { label: "Light rain", emoji: "🌦️" },
  63: { label: "Rain", emoji: "🌧️" },
  65: { label: "Heavy rain", emoji: "🌧️" },
  71: { label: "Light snow", emoji: "🌨️" },
  73: { label: "Snow", emoji: "❄️" },
  75: { label: "Heavy snow", emoji: "❄️" },
  80: { label: "Showers", emoji: "🌦️" },
  81: { label: "Heavy showers", emoji: "🌧️" },
  82: { label: "Violent showers", emoji: "⛈️" },
  95: { label: "Thunderstorm", emoji: "⛈️" },
  96: { label: "T-storm + hail", emoji: "⛈️" },
  99: { label: "Severe storm", emoji: "⛈️" },
};

export function describeWeather(code: number) {
  return WMO[code] ?? { label: "—", emoji: "🌡️" };
}

export interface UseWeatherResult {
  loading: boolean;
  error: string | null;
  forDate: DayForecast | null;
  outOfRange: boolean; // date is beyond 16-day forecast window
  daily: DayForecast[];
}

export function useWeather(city: string, date: string): UseWeatherResult {
  const [state, setState] = useState<UseWeatherResult>({
    loading: true,
    error: null,
    forDate: null,
    outOfRange: false,
    daily: [],
  });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    (async () => {
      const geo = await geocodeCity(city);
      if (!geo) {
        if (!cancelled)
          setState({
            loading: false,
            error: "Couldn't find city",
            forDate: null,
            outOfRange: false,
            daily: [],
          });
        return;
      }
      try {
        const daily = await fetchDaily(geo.lat, geo.lon);
        if (cancelled) return;
        const forDate = daily.find((d) => d.date === date) ?? null;
        const lastDate = daily[daily.length - 1]?.date;
        const outOfRange = !forDate && !!lastDate && date > lastDate;
        setState({ loading: false, error: null, forDate, outOfRange, daily });
      } catch (e) {
        if (!cancelled)
          setState({
            loading: false,
            error: (e as Error).message,
            forDate: null,
            outOfRange: false,
            daily: [],
          });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [city, date]);

  return state;
}
