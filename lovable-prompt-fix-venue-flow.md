# Fix: Plan My Night Venue Discovery → Boarding Pass Flow

There are three bugs in the Plan My Night flow that need to be fixed together. Please fix all three in one change.

---

## Bug 1: "No verified venues found for these vibes" warning shows even when venues ARE found

The warning message "No verified venues found for these vibes" is displaying at the top of the venue discovery results screen EVEN THOUGH venue cards (Le Diplomate, Service Bar DC, etc.) are rendering below it. The warning should only show when the venues array is actually empty.

**Fix:** Find the conditional that renders the "No verified venues found" warning. It's likely checking the wrong variable, or checking before the venues have loaded, or checking `verifiedVenues` while the cards render from a different array (like `mockVenues` or `allVenues`). Change the condition so it checks the SAME array that the venue cards render from. If `venues.length > 0` (or whatever array feeds the card list), do NOT show the warning. Only show the warning when that array is truly empty and loading is complete.

---

## Bug 2: "+ ADD" button navigates to portal/bookings page instead of adding venue to itinerary

When I tap the "+ ADD" button on a venue card in the discovery results, the app navigates to the `/bookings` portal page (the "Customer portal — My Bookings" screen) instead of adding that venue to my itinerary stops.

**Fix:** Find the onClick handler for the "+ ADD" button on venue discovery cards. It is currently calling `navigate("/bookings")` or similar. Replace that navigation with logic that:

1. Adds the selected venue to a `selectedStops` or `confettiStops` state array (create this array state if it doesn't exist)
2. Each added stop should store: venue name, category, address, vibe tags, and any other venue card data
3. After adding, either:
   - Show a visual confirmation (checkmark, "Added!" text, disable the button) so the user knows it worked
   - OR if this is the only venue needed, advance to the next step

The "+ ADD" button should NEVER navigate to `/bookings`. It should keep the user on the venue discovery screen until they're ready to proceed.

---

## Bug 3: Flow doesn't complete to Boarding Pass

After selecting venues, there's no clear path to generate and view the boarding pass. The full flow should be:

1. User goes through Plan My Night wizard steps (mood, group size, preferences)
2. Venue discovery shows matching venues
3. User taps "+ ADD" on venues they want → venues get added to their itinerary stops array
4. User taps a "Lock It In" / "Build My Night" / continue button → navigates to `/boarding-pass`
5. Boarding pass renders with the selected venues as stops

**Fix:** After at least one venue is added to the stops array, show a floating bottom bar or prominent button that says something like "Lock It In ✨" or "Build My Night" with a count of selected venues (e.g., "Build My Night (2 stops)"). When tapped, this button should:

1. Store the selected stops in state or context so the BoardingPass component can access them
2. Navigate to `/boarding-pass`
3. The boarding pass should render with the user's selected venues as the itinerary stops

If there's already a "Your night's locked in" section or similar UI at the bottom of the venue discovery screen, make sure its action button navigates to `/boarding-pass` (not `/bookings`) and passes the selected venues.

---

## Summary of Navigation Fixes

- "+ ADD" button on venue card → adds venue to selectedStops array (stays on current screen)
- "Lock It In" / "Build My Night" button → `navigate("/boarding-pass")` with stops data
- NEVER navigate to `/bookings` from the venue discovery flow

## Important

- Do NOT break any other routes or components
- Keep all existing venue card styling and layout
- The boarding pass component already exists — just make sure venues flow into it as stop data
