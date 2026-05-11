// Server-only scoring utilities for the viral discovery pipeline.
// Pure functions — safe to unit-test, no I/O.

export type Signal = "tiktok" | "instagram" | "press" | "blog" | "creator";

export type CandidateMention = {
  signals: Signal[];
  sourceUrl: string;
  sourceQuery: string;
  fetchedAt: number; // epoch ms
};

const AUTHORITY_WEIGHTS: Record<string, number> = {
  "tiktok.com": 1,
  "instagram.com": 1,
  "youtube.com": 0.85,
  "eater.com": 0.95,
  "timeout.com": 0.9,
  "thrillist.com": 0.85,
  "washingtonpost.com": 0.9,
  "washingtonian.com": 0.9,
  "infatuation.com": 0.9,
  "reddit.com": 0.6,
};

export function authorityFor(url: string): number {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    for (const [domain, weight] of Object.entries(AUTHORITY_WEIGHTS)) {
      if (host === domain || host.endsWith("." + domain)) return weight;
    }
    return 0.5; // generic blog/listicle baseline
  } catch {
    return 0.4;
  }
}

export function recencyBoost(fetchedAt: number, now = Date.now()): number {
  const days = (now - fetchedAt) / (1000 * 60 * 60 * 24);
  if (days <= 7) return 1;
  if (days >= 30) return 0.2;
  // linear decay 7d -> 30d, 1.0 -> 0.2
  return 1 - ((days - 7) / 23) * 0.8;
}

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/['’`]/g, "")
    .replace(/\b(the|a|an|restaurant|cafe|bar|lounge|bistro)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export type ScoreInputs = {
  mentions: CandidateMention[];
  rating?: number; // Google rating 0–5
  appEngagement?: number; // 0–1
};

export function computeTrendScore({ mentions, rating, appEngagement = 0 }: ScoreInputs): number {
  const tiktok = mentions.filter((m) => m.signals.includes("tiktok")).length;
  const insta = mentions.filter((m) => m.signals.includes("instagram")).length;

  // log dampening so 1 mention gets credit but 20 mentions don't dominate
  const damp = (n: number) => Math.log2(1 + n);

  const recency = mentions.length
    ? mentions.reduce((s, m) => s + recencyBoost(m.fetchedAt), 0) / mentions.length
    : 0;
  const authority = mentions.length
    ? mentions.reduce((s, m) => s + authorityFor(m.sourceUrl), 0) / mentions.length
    : 0;
  const ratingSignal =
    typeof rating === "number" ? Math.max(0, Math.min(1, (rating - 3.5) / 1.5)) : 0.5;

  const score =
    0.3 * damp(tiktok) +
    0.25 * damp(insta) +
    0.2 * recency +
    0.1 * authority +
    0.1 * ratingSignal +
    0.05 * appEngagement;

  return Math.round(score * 100) / 100;
}

export const TAG_VOCAB = [
  "tiktok_viral",
  "instagrammable",
  "hidden_gem",
  "creator_mentioned",
  "trending_this_week",
  "date_night",
  "foodie_hype",
  "photo_op",
  "worth_the_wait",
] as const;
export type ViralTag = (typeof TAG_VOCAB)[number];
