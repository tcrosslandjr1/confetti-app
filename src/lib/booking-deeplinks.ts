// Real deeplinks into Resy / OpenTable / Tock / Yelp / Google search.
// All providers accept a name+city query string in their search/find endpoints.
// We never claim a real reservation slot — we just send the user pre-filtered
// to the provider's discovery surface with party size + date/time when supported.

export type BookProvider = "resy" | "opentable" | "tock" | "yelp" | "google";

export type BookingContext = {
  venueName: string;
  city?: string | null;
  /** ISO date YYYY-MM-DD, or freeform like "Sat" — passed when the provider supports it. */
  date?: string | null;
  /** "7:30 PM" or "19:30" */
  time?: string | null;
  partySize?: number | null;
  /** When set, this overrides the chosen provider. */
  forceProvider?: BookProvider;
  /** Pre-existing booking_url from the venue/itinerary stop — wins over everything else. */
  existingUrl?: string | null;
  /** Pre-existing booking_provider hint (e.g. "Resy") to bias provider choice. */
  existingProvider?: string | null;
};

export type BookingLink = {
  provider: BookProvider;
  label: string;
  url: string;
  /** True when we built a search-style fallback rather than a confirmed slot link. */
  isSearch: boolean;
};

const PROVIDER_LABEL: Record<BookProvider, string> = {
  resy: "Resy",
  opentable: "OpenTable",
  tock: "Tock",
  yelp: "Yelp",
  google: "Google",
};

function toIsoDate(input?: string | null): string | null {
  if (!input) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function to24h(input?: string | null): string | null {
  if (!input) return null;
  if (/^\d{1,2}:\d{2}$/.test(input)) return input.padStart(5, "0");
  const m = input.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2];
  const mer = m[3].toUpperCase();
  if (mer === "PM" && h < 12) h += 12;
  if (mer === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${min}`;
}

function pickProviderFromHint(hint?: string | null): BookProvider | null {
  if (!hint) return null;
  const h = hint.toLowerCase();
  if (h.includes("resy")) return "resy";
  if (h.includes("opentable") || h === "ot") return "opentable";
  if (h.includes("tock")) return "tock";
  if (h.includes("yelp")) return "yelp";
  return null;
}

/**
 * Build the best deeplink we can for a venue. Order of preference:
 *  1. existingUrl (already a real reservation page)
 *  2. forceProvider
 *  3. existingProvider hint
 *  4. Resy (best US coverage for the kinds of nightlife we recommend)
 */
export function buildBookingLink(ctx: BookingContext): BookingLink {
  if (ctx.existingUrl) {
    const provider = pickProviderFromHint(ctx.existingProvider) ?? "resy";
    return {
      provider,
      label: ctx.existingProvider ?? PROVIDER_LABEL[provider],
      url: ctx.existingUrl,
      isSearch: false,
    };
  }

  const provider: BookProvider =
    ctx.forceProvider ?? pickProviderFromHint(ctx.existingProvider) ?? "resy";

  const venueName = ctx.venueName.trim();
  const city = (ctx.city ?? "").trim();
  const q = encodeURIComponent(city ? `${venueName} ${city}` : venueName);
  const partySize = Math.max(1, Math.min(20, ctx.partySize ?? 2));
  const isoDate = toIsoDate(ctx.date);
  const time24 = to24h(ctx.time) ?? "19:30";

  switch (provider) {
    case "resy": {
      // Resy's search surface accepts a freetext query + filters via querystring.
      // Example: https://resy.com/cities/ny/search?date=2026-05-15&seats=2&query=Le%20Bernardin
      const params = new URLSearchParams({
        query: city ? `${venueName} ${city}` : venueName,
        seats: String(partySize),
      });
      if (isoDate) params.set("date", isoDate);
      return {
        provider,
        label: "Resy",
        url: `https://resy.com/search?${params.toString()}`,
        isSearch: true,
      };
    }
    case "opentable": {
      // OpenTable supports prefilled covers + dateTime on /s search.
      const params = new URLSearchParams({
        covers: String(partySize),
        term: city ? `${venueName} ${city}` : venueName,
      });
      if (isoDate) params.set("dateTime", `${isoDate}T${time24}`);
      return {
        provider,
        label: "OpenTable",
        url: `https://www.opentable.com/s?${params.toString()}`,
        isSearch: true,
      };
    }
    case "tock": {
      return {
        provider,
        label: "Tock",
        url: `https://www.exploretock.com/search?q=${q}`,
        isSearch: true,
      };
    }
    case "yelp": {
      const find = encodeURIComponent(venueName);
      const loc = encodeURIComponent(city);
      return {
        provider,
        label: "Yelp",
        url: `https://www.yelp.com/search?find_desc=${find}&find_loc=${loc}`,
        isSearch: true,
      };
    }
    case "google":
    default: {
      return {
        provider: "google",
        label: "Google",
        url: `https://www.google.com/search?q=${q}+reservation`,
        isSearch: true,
      };
    }
  }
}

/** Build all four major deeplinks at once — useful for a "Try another booking site" menu. */
export function buildAllBookingLinks(ctx: BookingContext): BookingLink[] {
  const providers: BookProvider[] = ["resy", "opentable", "tock", "yelp"];
  return providers.map((p) => buildBookingLink({ ...ctx, forceProvider: p }));
}
