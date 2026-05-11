/**
 * Smoke test for /trips/:id — verifies the VibeRow used inside the trip
 * detail timeline still mounts and renders its inferred vibe summary.
 *
 * We render <VibeRow /> directly with a realistic Stop fixture rather than
 * mounting the full route. Mounting /trips/:id end-to-end would require
 * stubbing auth, Supabase, and several heavy widgets (BoardingPass,
 * GooglePhotos, PromotedSlot, etc.) — overkill for a smoke check whose
 * goal is "does the VibeRow component still render without throwing".
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { VibeRow } from "@/routes/trips.$id";
import { DEFAULT_VIBE } from "@/lib/vibe";
import type { Stop } from "@/lib/itineraries";

const stopFixture: Stop = {
  id: "stop-1",
  itinerary_id: "trip-1",
  position: 1,
  name: "Rooftop Sunset Bar",
  category: "drinks",
  description: "Lively rooftop bar with skyline views.",
  what_to_do: "Order the spritz and grab a window seat.",
  address: "123 Skyline Ave",
  start_time: "19:30:00",
  duration_minutes: 90,
  est_cost: "$$",
  booking_status: "planned",
  dress_code: "smart casual",
  travel_from_prev: null,
  review_snippets: [],
} as unknown as Stop;

describe("/trips/:id — VibeRow smoke", () => {
  it("renders the VibeRow with a vibe-match label and percentage", () => {
    render(<VibeRow stop={stopFixture} prefs={DEFAULT_VIBE} />);

    const row = screen.getByTestId("vibe-row");
    expect(row).toBeInTheDocument();
    expect(row.textContent ?? "").toMatch(/%/);
    expect(row.textContent ?? "").toMatch(/vibe|off your vibe|close to your vibe/i);
  });
});
