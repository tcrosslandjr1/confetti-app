/**
 * Weather Service — Open-Meteo
 * Docs: https://open-meteo.com/en/docs
 *
 * 100% free. No API key. No signup. No rate limits for reasonable use.
 * Used for: outdoor/rooftop recs, rain contingency, "best time to go" logic.
 */

// ─── Types ──────────────────────────────────────────────────────────

export interface WeatherRequest {
  lat: number;
  lng: number;
  date?: string; // ISO date — omit for current conditions
  hours?: number; // forecast hours ahead (default 24)
}

export interface CurrentWeather {
  temperature: number; // °F
  feelsLike: number;
  humidity: number; // %
  precipitation: number; // mm
  cloudCover: number; // %
  windSpeed: number; // mph
  weatherCode: number;
  description: string;
  isGoodForOutdoor: boolean;
  icon: string; // emoji representation
}

export interface HourlyForecast {
  time: string; // ISO
  temperature: number;
  precipitation: number;
  precipitationProbability: number;
  cloudCover: number;
  windSpeed: number;
  weatherCode: number;
  description: string;
  isGoodForOutdoor: boolean;
}

export interface WeatherInsight {
  summary: string; // "Perfect rooftop weather until 9pm"
  recommendation: "outdoor" | "indoor" | "flexible";
  bestWindow?: { start: string; end: string }; // best outdoor window
  rainRisk: "none" | "low" | "moderate" | "high";
  temperatureRange: { low: number; high: number };
}

// ─── Weather Code Mapping ───────────────────────────────────────────

const WEATHER_DESCRIPTIONS: Record<number, { text: string; icon: string }> = {
  0: { text: "Clear sky", icon: "☀️" },
  1: { text: "Mainly clear", icon: "🌤️" },
  2: { text: "Partly cloudy", icon: "⛅" },
  3: { text: "Overcast", icon: "☁️" },
  45: { text: "Foggy", icon: "🌫️" },
  48: { text: "Freezing fog", icon: "🌫️" },
  51: { text: "Light drizzle", icon: "🌦️" },
  53: { text: "Moderate drizzle", icon: "🌦️" },
  55: { text: "Dense drizzle", icon: "🌧️" },
  61: { text: "Slight rain", icon: "🌧️" },
  63: { text: "Moderate rain", icon: "🌧️" },
  65: { text: "Heavy rain", icon: "🌧️" },
  71: { text: "Slight snow", icon: "🌨️" },
  73: { text: "Moderate snow", icon: "🌨️" },
  75: { text: "Heavy snow", icon: "❄️" },
  80: { text: "Rain showers", icon: "🌦️" },
  81: { text: "Moderate showers", icon: "🌧️" },
  82: { text: "Violent showers", icon: "⛈️" },
  95: { text: "Thunderstorm", icon: "⛈️" },
  96: { text: "Thunderstorm with hail", icon: "⛈️" },
  99: { text: "Thunderstorm with heavy hail", icon: "⛈️" },
};

function getWeatherDescription(code: number): { text: string; icon: string } {
  return WEATHER_DESCRIPTIONS[code] || { text: "Unknown", icon: "❓" };
}

function isOutdoorFriendly(code: number, temp: number, windSpeed: number): boolean {
  // No rain/snow, temp between 50-95°F, wind under 20mph
  const noRain = code <= 3;
  const goodTemp = temp >= 50 && temp <= 95;
  const calmWind = windSpeed < 20;
  return noRain && goodTemp && calmWind;
}

// ─── API Calls ──────────────────────────────────────────────────────

const BASE_URL = "https://api.open-meteo.com/v1/forecast";

/**
 * Get current weather conditions for a location.
 */
export async function getCurrentWeather(lat: number, lng: number): Promise<CurrentWeather> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,cloud_cover,wind_speed_10m,weather_code",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    precipitation_unit: "mm",
  });

  const res = await fetch(`${BASE_URL}?${params}`);
  if (!res.ok) throw new Error(`Weather API failed: ${res.status}`);
  const data = await res.json();
  const current = data.current;

  const { text, icon } = getWeatherDescription(current.weather_code);

  return {
    temperature: Math.round(current.temperature_2m),
    feelsLike: Math.round(current.apparent_temperature),
    humidity: current.relative_humidity_2m,
    precipitation: current.precipitation,
    cloudCover: current.cloud_cover,
    windSpeed: Math.round(current.wind_speed_10m),
    weatherCode: current.weather_code,
    description: text,
    isGoodForOutdoor: isOutdoorFriendly(current.weather_code, current.temperature_2m, current.wind_speed_10m),
    icon,
  };
}

/**
 * Get hourly forecast for planning.
 */
export async function getHourlyForecast(
  lat: number,
  lng: number,
  hours: number = 24
): Promise<HourlyForecast[]> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    hourly: "temperature_2m,precipitation,precipitation_probability,cloud_cover,wind_speed_10m,weather_code",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    forecast_hours: hours.toString(),
  });

  const res = await fetch(`${BASE_URL}?${params}`);
  if (!res.ok) throw new Error(`Weather API failed: ${res.status}`);
  const data = await res.json();
  const hourly = data.hourly;

  return hourly.time.map((time: string, i: number) => {
    const { text } = getWeatherDescription(hourly.weather_code[i]);
    return {
      time,
      temperature: Math.round(hourly.temperature_2m[i]),
      precipitation: hourly.precipitation[i],
      precipitationProbability: hourly.precipitation_probability[i],
      cloudCover: hourly.cloud_cover[i],
      windSpeed: Math.round(hourly.wind_speed_10m[i]),
      weatherCode: hourly.weather_code[i],
      description: text,
      isGoodForOutdoor: isOutdoorFriendly(
        hourly.weather_code[i],
        hourly.temperature_2m[i],
        hourly.wind_speed_10m[i]
      ),
    };
  });
}

/**
 * Generate a smart weather insight for Confetti itinerary planning.
 * Used by the Recommendation Agent to decide indoor vs outdoor stops.
 */
export async function getWeatherInsight(
  lat: number,
  lng: number,
  planningHours: number = 12
): Promise<WeatherInsight> {
  const forecast = await getHourlyForecast(lat, lng, planningHours);

  const temps = forecast.map((h) => h.temperature);
  const maxRainProb = Math.max(...forecast.map((h) => h.precipitationProbability));
  const outdoorHours = forecast.filter((h) => h.isGoodForOutdoor);

  // Find best outdoor window (consecutive good hours)
  let bestStart = -1;
  let bestLen = 0;
  let currentStart = -1;
  let currentLen = 0;

  forecast.forEach((h, i) => {
    if (h.isGoodForOutdoor) {
      if (currentStart === -1) currentStart = i;
      currentLen++;
      if (currentLen > bestLen) {
        bestLen = currentLen;
        bestStart = currentStart;
      }
    } else {
      currentStart = -1;
      currentLen = 0;
    }
  });

  // Determine rain risk
  let rainRisk: WeatherInsight["rainRisk"] = "none";
  if (maxRainProb > 70) rainRisk = "high";
  else if (maxRainProb > 40) rainRisk = "moderate";
  else if (maxRainProb > 15) rainRisk = "low";

  // Recommendation
  let recommendation: WeatherInsight["recommendation"] = "flexible";
  if (outdoorHours.length >= planningHours * 0.7) recommendation = "outdoor";
  else if (outdoorHours.length <= planningHours * 0.3) recommendation = "indoor";

  // Summary
  let summary: string;
  if (recommendation === "outdoor") {
    summary = `Great outdoor weather — ${temps[0]}°F and ${forecast[0].description.toLowerCase()}. Perfect for rooftops and patios.`;
  } else if (recommendation === "indoor") {
    summary = `${forecast[0].description} with ${maxRainProb}% rain chance. Stick to indoor spots tonight.`;
  } else {
    summary = `Mixed conditions — outdoor is good ${bestLen > 0 ? `from ${forecast[bestStart]?.time?.slice(11, 16)} to ${forecast[bestStart + bestLen - 1]?.time?.slice(11, 16)}` : "briefly"}. Have indoor backup plans.`;
  }

  return {
    summary,
    recommendation,
    bestWindow:
      bestLen >= 2
        ? { start: forecast[bestStart].time, end: forecast[bestStart + bestLen - 1].time }
        : undefined,
    rainRisk,
    temperatureRange: { low: Math.min(...temps), high: Math.max(...temps) },
  };
}
