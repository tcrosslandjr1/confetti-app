// User transport profile — local-first preferences for EV, maps app, and rideshare.
// SSR-safe (all reads guarded). Used by the Boarding Pass + Live Reroute layer.

export type TransportProfile = {
  hasEv: boolean;
  preferredMapsApp: "apple" | "google" | "auto";
  preferredRideshare: "uber" | "lyft";
  walkPreference: "low" | "medium" | "high";
};

const KEY = "confetti:transport-profile";

export const DEFAULT_TRANSPORT_PROFILE: TransportProfile = {
  hasEv: false,
  preferredMapsApp: "auto",
  preferredRideshare: "uber",
  walkPreference: "medium",
};

function isClient() {
  return typeof window !== "undefined";
}

export function getTransportProfile(): TransportProfile {
  if (!isClient()) return DEFAULT_TRANSPORT_PROFILE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_TRANSPORT_PROFILE;
    return { ...DEFAULT_TRANSPORT_PROFILE, ...(JSON.parse(raw) as Partial<TransportProfile>) };
  } catch {
    return DEFAULT_TRANSPORT_PROFILE;
  }
}

export function setTransportProfile(patch: Partial<TransportProfile>) {
  if (!isClient()) return;
  const next = { ...getTransportProfile(), ...patch };
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("confetti:transport-profile:changed"));
}

export function subscribeTransportProfile(cb: () => void): () => void {
  if (!isClient()) return () => {};
  const handler = () => cb();
  window.addEventListener("confetti:transport-profile:changed", handler);
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) cb();
  });
  return () => window.removeEventListener("confetti:transport-profile:changed", handler);
}
