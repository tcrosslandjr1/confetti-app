// App-wide config constants.
//
// The Maps key is a publishable browser key — restrict it by HTTP referrer in
// the Google Cloud Console. It is read from `import.meta.env`; do not hardcode
// a fallback here (a hardcoded key ships in every client bundle and can be
// scraped for billing abuse).

export const APP_NAME = "Confetti";
export const APP_TAGLINE = "Your city, curated.";
export const REWARD_CURRENCY = "Confetti";

export const VITE_GOOGLE_MAPS_API_KEY: string =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ?? "";

// Back-compat alias used by existing imports.
export const GOOGLE_MAPS_API_KEY = VITE_GOOGLE_MAPS_API_KEY;
