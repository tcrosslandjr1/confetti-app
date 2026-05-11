/**
 * UTM utilities for sponsored CTAs.
 *
 * Ensures every sponsored outbound link carries a consistent set of UTM
 * parameters. If the configured `cta_url` already specifies any of these,
 * the existing value is preserved — we only fill in missing defaults.
 */

export type UtmContext = {
  /** Where the click originated, e.g. "marquee_top", "marquee_bottom", "promoted_slot". */
  surface: string;
  /** Brand name, used to derive utm_campaign when missing. */
  brand: string;
  /** Occasion / creative label, used for utm_content when missing. */
  occasion?: string;
};

export const DEFAULT_UTM = {
  utm_source: "confettiplan",
  utm_medium: "sponsored",
} as const;

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 60) || "untagged"
  );
}

/**
 * Return `href` with consistent UTM params applied. Existing UTM params on
 * the URL win; missing ones are filled with sensible defaults derived from
 * the sponsorship context. Works for both relative ("/wizard?x=1") and
 * absolute ("https://...") URLs, and is a no-op for non-http(s) schemes
 * like "mailto:" or "tel:".
 */
export function withUtm(href: string | null | undefined, ctx: UtmContext): string {
  const fallback = "/wizard";
  if (!href || !href.trim()) href = fallback;

  // Skip non-navigational schemes.
  if (/^(mailto:|tel:|sms:|javascript:)/i.test(href)) return href;

  // URL needs a base for relative paths; use a throwaway origin.
  const base = "https://_local_/";
  let url: URL;
  try {
    url = new URL(href, base);
  } catch {
    return href;
  }

  const defaults: Record<string, string> = {
    utm_source: DEFAULT_UTM.utm_source,
    utm_medium: DEFAULT_UTM.utm_medium,
    utm_campaign: slugify(ctx.brand),
    utm_content: slugify(ctx.occasion ?? ctx.surface),
    utm_term: slugify(ctx.surface),
  };

  for (const [k, v] of Object.entries(defaults)) {
    if (!url.searchParams.has(k) || !url.searchParams.get(k)) {
      url.searchParams.set(k, v);
    }
  }

  // Preserve relative form when the original was relative.
  if (url.origin === "https://_local_") {
    return `${url.pathname}${url.search}${url.hash}`;
  }
  return url.toString();
}
