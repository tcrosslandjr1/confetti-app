# Boarding Pass Redesign — Lovable Prompt

Completely replace the current `/boarding-pass` route component with a premium airline-style boarding pass design. This is a full redesign of the BoardingPass component. Blend the design into the app's existing warm color palette (cream #fdf6ee background, warm accents).

## Design Structure

### Header Section
- Background: linear-gradient(135deg, #6C3CE1 0%, #8B5CF6 50%, #A78BFA 100%) — purple gradient
- Top-left: "CONFETTI." logo in Space Mono font, 28px, white, letter-spacing 4px, with a small yellow (#FCD34D) dot after the period
- Top-right: "ITINERARY" label in 11px mono, below it a yellow flight code like "CNFT-MOM-0510" in 14px mono bold
- Below logo: An occasion badge pill — frosted glass look (rgba(255,255,255,0.15) background, blur, white border), showing an emoji + occasion text like "💐 Mother's Day Experience"
- Header meta row at bottom with a top border divider: DATE, PASSENGERS, DAY values in Space Mono

### Route Section (airport-code style)
- Left station: 3-letter code like "GTN" in 36px mono bold with "Georgetown" label below and "Departure" label above in purple
- Center: horizontal route line with gradient, a yellow layover dot (⚡) in the middle, and a plane icon (✈) at 75%
- Right station: destination code like "CPH" with "Capitol Hill" below and "Destination" label above

### Vibe Pills Row
- Centered row of pills below the route: "🌸 Celebration", "🍽 Foodie", "🛍 Shopping", "💚 Eco"
- Pills have light purple gradient background (#EDE9FE to #F3E8FF), purple text

### Tear-Line Divider
- Simulated ticket tear with dashed line across the middle
- Left and right circular cutouts that match the page background color (#fdf6ee instead of dark)

### Stops Section (Flight Plan)
Each stop has:
- **Stop marker**: 36px rounded square icon with emoji, color-coded:
  - Departure: light purple bg (#EDE9FE), 🥂
  - Layover: light yellow bg (#FEF3C7), ⚡
  - Destination: light green bg (#DCFCE7), 🌟
- Vertical connector line between markers (2px #e5e5ea)
- **Stop content** beside the marker:
  - Type label: "DEPARTURE — 10:30 AM" in matching color, 9px uppercase mono
  - Name: "Brunch at Fiola Mare" in 15px bold
  - Detail: "Georgetown waterfront · Italian seafood" in 11px gray
  - **Parking detail card**: blue background (#EFF6FF), blue border, 🅿 icon, with primary info ("Valet at entrance · $20") in mono bold and secondary info (address, alternative garages) in small gray
  - **Sunday free parking badge**: green gradient background (#ECFDF5 to #D1FAE5), green "SUN" badge pill, and text "Free street meter parking · meters not enforced Sundays"
  - **Nav buttons row**: Two buttons side-by-side:
    - Apple Maps button: dark gradient (#1a1a2e to #2d2d44), white text, links to `maps://maps.apple.com/?daddr=ADDRESS&dirflg=d`
    - Google Maps button: blue gradient (#4285F4 to #5B9BF5), white text, links to `https://www.google.com/maps/dir/?api=1&destination=ADDRESS`
  - **Tags**: small pills like "Celebration", "⚡ DC Fast Charging", "~45 min total"

### Drive Time Chips
- Between stops: rounded pill with car emoji and text like "~12 MIN DRIVE → CITYCENTERDC"
- Light gray background (#F9FAFB), dashed border

### EV Charging Detail (Layover stop only)
- Green-bordered card (#BBF7D0 border, #F0FDF4 bg)
- EVgo logo badge (green bg, white text)
- Specs: "DC Fast · up to 200 kW"
- Time: "~25 min to 80%"
- Sub-detail: "7 stalls · CCS / CHAdeMO · P1 & P2 levels"

### Stats Footer
- 4-column grid: "3 Stops", "3 Hoods", "8h Duration", "⚡ EV Ready"
- Values in 18px mono bold, labels in 8px uppercase

### Confetti Reward Card
- Yellow gradient background (#FEF3C7 to #FDE68A)
- Left: 🎊 icon + "Complete this plan to earn Confetti Reward"
- Right: "+250" in large mono bold amber text

### Barcode Section
- Generated barcode bars (varied widths 1-4px, random heights 20-48px)
- Below: "CNFT-MOM-0510-TYRONE" in mono 10px, letter-spacing 3px

## Color Blending with App Theme
- Page background: use the app's cream #fdf6ee instead of the dark #0f0f1a
- Tear-line divider cutout circles: match #fdf6ee background
- Card shadow: soften to rgba(0,0,0,0.08) instead of heavy dark shadows
- Keep the purple gradient header, yellow accents, and green/blue detail cards as-is — they pop beautifully against cream
- Station codes and bold text: use #1a1a2e for contrast

## Animations
Add staggered CSS animations with cubic-bezier(0.34, 1.56, 0.64, 1) timing:
- Boarding pass slides up on load (0.6s)
- Stop markers reveal sequentially: stop 1 at 0.8s, stop 2 at 1.4s, stop 3 at 2.0s
- Each marker gets a pulsing glow animation after reveal (color-matched: purple, amber, green)
- Connector lines grow between markers with 0.4s delay after each marker
- Stop content slides in from left with staggered delays
- Tags and nav buttons fade in 0.3s after their stop content
- Drive time chips fade in between stops

## Fonts
- Use Space Mono (monospace) for: logo, flight code, meta values, parking primary info, EV specs, stats values, barcode text, nav button labels
- Use Inter (sans-serif) for: everything else — occasion badge, station names, stop names, descriptions, labels

## Data Source
- For now, hardcode the Mother's Day DC itinerary as sample data
- Structure the component so stop data comes from props/state (array of stop objects) for future dynamic boarding passes
- Each stop object: { type, time, name, detail, emoji, parkingInfo, sundayParking, appleMapUrl, googleMapUrl, tags, evInfo? }

## Implementation Notes
- Build as a new React component `BoardingPassV2.tsx` in `src/components/`
- Replace the current BoardingPass component import in the route
- Use Tailwind where possible, inline styles for gradients and complex shadows
- Generate barcode bars with a small JS snippet in useEffect
- Make it mobile-responsive (full-width under 460px, 2-col stats grid on small screens)
