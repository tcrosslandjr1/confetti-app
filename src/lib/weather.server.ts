// Server-side weather fetcher used by the plan generator to bias venue choices
// (indoor vs outdoor, rain warnings) for the user's actual date + city.
// Uses Open-Meteo (free, no key). Safe for Worker SSR.

export interface ServerForecast {
  date: string;
  label: string; // human label e.g. "Light rain"
  emoji: string;
  tMaxF: number;
  tMinF: number;
  precipProb: number; // 0-100
  outOfRange?: boolean;
}

const WMO_LABEL: Record<number, { label: string; emoji: string }> = {
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

export async function fetchForecastForCityDate(
  city: string,
  date: string,
): Promise<ServerForecast | null> {
  try {
    const geoUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
    geoUrl.searchParams.set("name", city);
    geoUrl.searchParams.set("count", "1");
    const gr = await fetch(geoUrl, { signal: AbortSignal.timeout(4000) });
    if (!gr.ok) return null;
    const gj = (await gr.json()) as { results?: Array<{ latitude: number; longitude: number }> };
    const top = gj.results?.[0];
    if (!top) return null;

    const fUrl = new URL("https://api.open-meteo.com/v1/forecast");
    fUrl.searchParams.set("latitude", String(top.latitude));
    fUrl.searchParams.set("longitude", String(top.longitude));
    fUrl.searchParams.set(
      "daily",
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    );
    fUrl.searchParams.set("temperature_unit", "fahrenheit");
    fUrl.searchParams.set("timezone", "auto");
    fUrl.searchParams.set("forecast_days", "16");
    const fr = await fetch(fUrl, { signal: AbortSignal.timeout(4000) });
    if (!fr.ok) return null;
    const fj = await fr.json();
    const times = fj.daily.time as string[];
    const idx = times.indexOf(date);
    if (idx === -1) {
      const lastDate = times[times.length - 1];
      if (lastDate && date > lastDate) {
        return {
          date,
          label: "Beyond forecast window",
          emoji: "🗓️",
          tMaxF: 0,
          tMinF: 0,
          precipProb: 0,
          outOfRange: true,
        };
      }
      return null;
    }
    const code = fj.daily.weather_code[idx] as number;
    const w = WMO_LABEL[code] ?? { label: "—", emoji: "🌡️" };
    return {
      date,
      label: w.label,
      emoji: w.emoji,
      tMaxF: Math.round(fj.daily.temperature_2m_max[idx]),
      tMinF: Math.round(fj.daily.temperature_2m_min[idx]),
      precipProb: fj.daily.precipitation_probability_max[idx] ?? 0,
    };
  } catch {
    return null;
  }
}

export function weatherGuidance(f: ServerForecast): string {
  if (f.outOfRange)
    return "No forecast available (date beyond 16-day window). Pick venues that work in any weather.";
  const heavyRain = f.precipProb >= 60 || /heavy|thunder|storm|severe|violent/i.test(f.label);
  const someRain = f.precipProb >= 30 || /rain|drizzle|shower/i.test(f.label);
  const cold = f.tMaxF < 45;
  const hot = f.tMaxF > 88;
  const lines: string[] = [];
  if (heavyRain)
    lines.push(
      "HEAVY RAIN expected — strongly prefer indoor venues. Avoid rooftops, patios, walking tours, outdoor markets. Cluster stops to minimize transit.",
    );
  else if (someRain)
    lines.push(
      "Rain likely — bias indoor or covered venues. Avoid rooftops/patios as primary stops.",
    );
  if (cold)
    lines.push(
      `Cold (${f.tMaxF}°F high) — prefer cozy indoor venues, fireplaces, ramen/whiskey-bar energy.`,
    );
  if (hot)
    lines.push(
      `Hot (${f.tMaxF}°F high) — prefer A/C, frozen cocktails, water-adjacent or shaded patios.`,
    );
  if (!heavyRain && !someRain && !cold && !hot) {
    lines.push(
      `Pleasant weather (${f.label}, ${f.tMinF}–${f.tMaxF}°F) — rooftops, patios, walking-distance clusters all on the table.`,
    );
  }
  return lines.join(" ");
}
