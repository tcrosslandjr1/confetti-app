/**
 * Configuration for the IntersectionObserver behind sponsored impression
 * tracking. Exposes both the compile-time defaults and runtime overrides
 * (URL query params + localStorage) so impression timing can be tuned
 * quickly without redeploying.
 *
 * Override priority (first match wins):
 *   1. URL query (?adThreshold=0.25&adRootMargin=-10%25%200px) — also persisted
 *   2. localStorage (`confetti.adImpression.v1`)
 *   3. AD_IMPRESSION_DEFAULTS below
 *
 * Threshold is clamped to [0, 1]. rootMargin is passed straight to the
 * observer; it must be a valid CSS margin string (e.g. "0px", "-20% 0px").
 */

export type AdImpressionConfig = {
  /** Fraction of the element that must be visible before counting (0–1). */
  threshold: number;
  /** CSS margin applied to the viewport root for the observer. */
  rootMargin: string;
};

export const AD_IMPRESSION_DEFAULTS: AdImpressionConfig = {
  threshold: 0.5,
  rootMargin: "0px",
};

const STORAGE_KEY = "confetti.adImpression.v1";

function clampThreshold(value: number): number {
  if (Number.isNaN(value)) return AD_IMPRESSION_DEFAULTS.threshold;
  return Math.min(1, Math.max(0, value));
}

function isValidRootMargin(value: string): boolean {
  // Accept any non-empty string with px/%/0 tokens; the observer will
  // throw on truly malformed values, which we surface in the console.
  return /^-?\d+(\.\d+)?(px|%)?(\s+-?\d+(\.\d+)?(px|%)?){0,3}$/.test(value.trim());
}

function readStorage(): Partial<AdImpressionConfig> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<AdImpressionConfig>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStorage(patch: Partial<AdImpressionConfig>) {
  if (typeof window === "undefined") return;
  try {
    const next = { ...readStorage(), ...patch };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / privacy errors */
  }
}

function readUrlOverrides(): Partial<AdImpressionConfig> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const out: Partial<AdImpressionConfig> = {};
  const t = params.get("adThreshold");
  if (t !== null) {
    const n = Number(t);
    if (!Number.isNaN(n)) out.threshold = clampThreshold(n);
  }
  const rm = params.get("adRootMargin");
  if (rm !== null && isValidRootMargin(rm)) {
    out.rootMargin = rm;
  }
  // ?adImpressionReset=1 clears persisted overrides
  if (params.get("adImpressionReset") === "1" && typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
  // Persist URL overrides so they survive navigation
  if (Object.keys(out).length > 0) writeStorage(out);
  return out;
}

export function getAdImpressionConfig(): AdImpressionConfig {
  const url = readUrlOverrides();
  const stored = readStorage();
  return {
    threshold: clampThreshold(
      url.threshold ?? stored.threshold ?? AD_IMPRESSION_DEFAULTS.threshold
    ),
    rootMargin:
      url.rootMargin ??
      (stored.rootMargin && isValidRootMargin(stored.rootMargin)
        ? stored.rootMargin
        : AD_IMPRESSION_DEFAULTS.rootMargin),
  };
}

export function setAdImpressionConfig(patch: Partial<AdImpressionConfig>) {
  const clean: Partial<AdImpressionConfig> = {};
  if (typeof patch.threshold === "number") clean.threshold = clampThreshold(patch.threshold);
  if (typeof patch.rootMargin === "string" && isValidRootMargin(patch.rootMargin)) {
    clean.rootMargin = patch.rootMargin;
  }
  writeStorage(clean);
}

export function resetAdImpressionConfig() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
