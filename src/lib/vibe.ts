import type { Stop } from "@/lib/itineraries";

export type Crowd = "chill" | "lively" | "packed";
export type Noise = "quiet" | "moderate" | "loud";
export type Dress = "casual" | "smart" | "dressy";

export type VibePrefs = {
  crowd: Crowd;
  noise: Noise;
  dress: Dress;
};

export const DEFAULT_VIBE: VibePrefs = { crowd: "lively", noise: "moderate", dress: "casual" };

const PREFS_KEY = "vibe-prefs";

export function loadVibePrefs(): VibePrefs {
  if (typeof window === "undefined") return DEFAULT_VIBE;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_VIBE;
    const p = JSON.parse(raw);
    return {
      crowd: (["chill", "lively", "packed"] as const).includes(p.crowd)
        ? p.crowd
        : DEFAULT_VIBE.crowd,
      noise: (["quiet", "moderate", "loud"] as const).includes(p.noise)
        ? p.noise
        : DEFAULT_VIBE.noise,
      dress: (["casual", "smart", "dressy"] as const).includes(p.dress)
        ? p.dress
        : DEFAULT_VIBE.dress,
    };
  } catch {
    return DEFAULT_VIBE;
  }
}

export function saveVibePrefs(p: VibePrefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(p));
}

export type StopVibe = { crowd: Crowd; noise: Noise; dress: Dress };

const KW = (s: string, words: string[]) => words.some((w) => s.includes(w));

/** Heuristically infer a stop's vibe from its data. Frontend-only. */
export function inferStopVibe(s: Stop): StopVibe {
  const text = `${s.name} ${s.description ?? ""} ${s.what_to_do ?? ""} ${s.category}`.toLowerCase();
  const dressRaw = (s.dress_code ?? "").toLowerCase();

  // Dress
  let dress: Dress = "casual";
  if (KW(dressRaw, ["formal", "black tie", "cocktail", "elegant", "dressy", "jacket required"]))
    dress = "dressy";
  else if (KW(dressRaw, ["smart", "business", "upscale", "neat"])) dress = "smart";
  else if (dressRaw) dress = "casual";
  else if (KW(text, ["fine dining", "rooftop bar", "speakeasy", "tasting menu", "michelin"]))
    dress = "smart";

  // Noise
  let noise: Noise = "moderate";
  if (
    KW(text, ["library", "museum", "garden", "park", "scenic", "viewpoint", "tea", "spa", "quiet"])
  )
    noise = "quiet";
  else if (
    KW(text, [
      "club",
      "live music",
      "concert",
      "dj",
      "dance",
      "karaoke",
      "sports bar",
      "arcade",
      "loud",
    ])
  )
    noise = "loud";
  else if (s.category === "drinks" || KW(text, ["bar", "pub", "brewery"])) noise = "loud";
  else if (s.category === "scenic") noise = "quiet";

  // Crowd
  let crowd: Crowd = "lively";
  if (
    KW(text, [
      "intimate",
      "hidden",
      "secret",
      "speakeasy",
      "tasting",
      "private",
      "scenic",
      "garden",
      "viewpoint",
    ])
  )
    crowd = "chill";
  else if (KW(text, ["popular", "trending", "packed", "rooftop", "club", "festival", "iconic"]))
    crowd = "packed";
  else if (s.category === "scenic") crowd = "chill";
  else if (s.category === "drinks") crowd = "lively";

  return { crowd, noise, dress };
}

export function vibeMatchScore(stop: StopVibe, prefs: VibePrefs): number {
  const order = {
    crowd: ["chill", "lively", "packed"] as Crowd[],
    noise: ["quiet", "moderate", "loud"] as Noise[],
    dress: ["casual", "smart", "dressy"] as Dress[],
  };
  const dist =
    Math.abs(order.crowd.indexOf(stop.crowd) - order.crowd.indexOf(prefs.crowd)) +
    Math.abs(order.noise.indexOf(stop.noise) - order.noise.indexOf(prefs.noise)) +
    Math.abs(order.dress.indexOf(stop.dress) - order.dress.indexOf(prefs.dress));
  // 0 = perfect, 6 = max distance
  return Math.max(0, 100 - Math.round((dist / 6) * 100));
}

export type VibeMatch = "match" | "near" | "off";
export function matchLevel(score: number): VibeMatch {
  if (score >= 85) return "match";
  if (score >= 60) return "near";
  return "off";
}

export const CROWD_LABEL: Record<Crowd, string> = {
  chill: "Chill",
  lively: "Lively",
  packed: "Packed",
};
export const NOISE_LABEL: Record<Noise, string> = {
  quiet: "Quiet",
  moderate: "Moderate",
  loud: "Loud",
};
export const DRESS_LABEL: Record<Dress, string> = {
  casual: "Casual",
  smart: "Smart casual",
  dressy: "Dressy",
};
