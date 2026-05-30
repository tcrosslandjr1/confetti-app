// ── Night Builder Store ───────────────────────────────────────
// Holds venues the user has pinned from the Explore screen.
// Persists across navigations via sessionStorage.
// Used by: new.explore → new.plan → generateAiPlan (notes injection)
// ─────────────────────────────────────────────────────────────

export interface PinnedVenue {
  venue_slug: string;
  venue_name: string;
  category: string | null;
  neighborhood: string | null;
  snippet: string | null;
  outing: string; // which outing category was selected when pinned
}

const SESSION_KEY = "confetti_pinned_venues";
const CHANGE_EVENT = "night-builder-change";

// ── Internal state ─────────────────────────────────────────────

function loadFromSession(): PinnedVenue[] {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as PinnedVenue[]) : [];
  } catch {
    return [];
  }
}

function saveToSession(venues: PinnedVenue[]) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(venues));
  } catch {}
}

function emit() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// ── Public API ─────────────────────────────────────────────────

export function getPinnedVenues(): PinnedVenue[] {
  return loadFromSession();
}

export function addPinnedVenue(v: PinnedVenue) {
  const current = loadFromSession();
  if (current.some((p) => p.venue_slug === v.venue_slug)) return; // already pinned
  const next = [...current, v].slice(-6); // max 6 stops
  saveToSession(next);
  emit();
}

export function removePinnedVenue(venue_slug: string) {
  const next = loadFromSession().filter((p) => p.venue_slug !== venue_slug);
  saveToSession(next);
  emit();
}

export function togglePinnedVenue(v: PinnedVenue) {
  const current = loadFromSession();
  const exists = current.some((p) => p.venue_slug === v.venue_slug);
  if (exists) {
    removePinnedVenue(v.venue_slug);
  } else {
    addPinnedVenue(v);
  }
}

export function isPinned(venue_slug: string): boolean {
  return loadFromSession().some((p) => p.venue_slug === venue_slug);
}

export function clearPinnedVenues() {
  saveToSession([]);
  emit();
}

/** Subscribe to store changes. Returns unsubscribe fn. */
export function onNightBuilderChange(cb: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, cb);
  return () => window.removeEventListener(CHANGE_EVENT, cb);
}

// ── React hook ─────────────────────────────────────────────────

import { useState, useEffect } from "react";

export function useNightBuilder() {
  const [pinned, setPinned] = useState<PinnedVenue[]>(() => loadFromSession());

  useEffect(() => {
    const unsub = onNightBuilderChange(() => setPinned(loadFromSession()));
    return unsub;
  }, []);

  return {
    pinned,
    count: pinned.length,
    isPinned: (slug: string) => pinned.some((p) => p.venue_slug === slug),
    toggle: togglePinnedVenue,
    clear: clearPinnedVenues,
  };
}

// ── Inject pinned venues into AI notes ─────────────────────────

export function buildPinnedVenueNote(venues: PinnedVenue[]): string | undefined {
  if (venues.length === 0) return undefined;
  const list = venues
    .map((v, i) => {
      const parts = [
        `${i + 1}. ${v.venue_name}`,
        v.category ? `(${v.category}` : "",
        v.neighborhood ? `, ${v.neighborhood})` : v.category ? ")" : "",
        v.snippet ? ` — "${v.snippet}"` : "",
      ];
      return parts
        .join("")
        .replace(/\(\s*,/, "(")
        .replace(/\(\s*\)/, "");
    })
    .join("\n");

  return `PINNED VENUES: The user hand-picked these specific spots from the Explore screen. Build the itinerary around them as mandatory stops — do not replace or omit any. Add complementary stops only if the itinerary needs more than ${venues.length} stops:\n${list}`;
}
