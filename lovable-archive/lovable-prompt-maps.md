# Lovable Prompt — Google Maps Integration

## PROMPT:

Add Google Maps integration throughout the app using the Google Maps JavaScript API. The API key is stored as an environment variable `VITE_GOOGLE_MAPS_API_KEY`. Install `@react-google-maps/api` for React components.

### 1. Active Confetti Mini-Map (`/active-confetti`)
At the top of the Active Confetti screen, add an interactive Google Map showing:
- Markers for each stop in the plan, numbered 1, 2, 3, etc.
- A polyline route connecting all stops in order
- The user's current location as a blue pulsing dot
- When a stop is checked in, its marker turns green
- The current/next stop marker should be highlighted (larger, animated bounce)
- Map height: 220px, rounded corners, with a slight shadow
- Center the map to fit all markers with appropriate zoom

### 2. Boarding Pass Map Strip (`/boarding-pass`)
Below the stop timeline on the boarding pass, add a static-style map strip:
- Show all stops as numbered markers on a compact map
- Draw the route path between stops
- Map height: 160px, full width, rounded bottom corners
- Include a "Get Directions" button that opens Google Maps with the full route in a new tab
- Use a clean/minimal map style (muted colors to match the app theme)

### 3. Venue Detail Map (`/venue/:id`)
On the venue detail page, add a map section:
- Show the venue location with a single marker
- Map height: 180px with rounded corners
- Below the map: venue address, "Get Directions" link, and estimated travel time from current location
- Tapping the map opens full Google Maps to that location

### 4. Quick Generate Route Preview (`/quick-generate`)
On the ready phase of Quick Generate, add a route overview:
- Small map preview (140px tall) between the vibe score card and the stops list
- Show all 3 generated stops as markers with the route path
- Display total route time/distance (e.g. "45 min total · 8.2 mi")
- When a stop is swapped, update the map markers and route accordingly

### 5. Discover Nearby (`/discover`)
Add a map/list toggle at the top of the Discover screen:
- Toggle button: "List" | "Map" view
- Map view shows all venue markers on a full-height map
- Tapping a marker shows a popup card with venue name, rating, and "View" button
- Cluster nearby markers when zoomed out

### 6. Map Styling
Use a custom map style that matches the app's light warm theme:
- Muted/subtle map colors (soft grays, warm whites)
- Highlight roads in a light warm tone
- Water in a soft blue
- Points of interest in the app's accent color
- Hide unnecessary labels for a cleaner look

### Technical Setup:
- Use `@react-google-maps/api` library with `useJsApiLoader` hook
- Create a shared `MapProvider` component that loads the API once with: `libraries: ["places", "geometry", "directions"]`
- Wrap the app's router in this provider
- Create reusable components: `ConfettiMap`, `VenueMarker`, `RoutePolyline`
- Use `DirectionsService` for route calculations between stops
- Handle loading state with a skeleton placeholder matching map dimensions
- Reference the API key as: `import.meta.env.VITE_GOOGLE_MAPS_API_KEY`
