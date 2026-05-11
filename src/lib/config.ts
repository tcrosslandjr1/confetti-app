// App-wide config constants.
//
// The Maps key is a publishable browser key — restrict it by HTTP referrer in
// the Google Cloud Console. We expose it via `import.meta.env` when present,
// with a hardcoded fallback so the client-side map embed always has a value.
// (`.env` is auto-managed by Lovable Cloud, so adding new VITE_* vars there
// isn't reliable; either set it in your hosting env or rely on the fallback.)

export const APP_NAME = "Confetti";
export const APP_TAGLINE = "Your city, curated.";
export const REWARD_CURRENCY = "Confetti";

const FALLBACK_MAPS_KEY = "AIzaSyBsrb-XAJEmVVFbXEZoaUAz4GRTWQOJWrU";

export const VITE_GOOGLE_MAPS_API_KEY: string =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ?? FALLBACK_MAPS_KEY;

// Back-compat alias used by existing imports.
export const GOOGLE_MAPS_API_KEY = VITE_GOOGLE_MAPS_API_KEY;
