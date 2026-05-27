# Lovable Prompt — Confetti v0.3.0 Complete Features

Paste this into Lovable in sections if needed:

---

## PROMPT:

Rename the app from "Party Planner Plus" to **"Confetti"** everywhere — page titles, headers, tab bar, and branding. Confetti is a curated city experience app. Keep the current light theme and warm color palette.

Add the following features and routes:

### 1. Boarding Pass Itinerary (`/boarding-pass`)
This is the signature feature. After a user creates or generates a plan, show their itinerary as an **airline boarding pass** card:
- Top section: "BOARDING PASS" header with a plane icon, passenger name, date, and group size
- Route display showing departure → arrival (e.g. "HOME → NIGHT OUT")
- A "GATE" field showing the first venue area, "BOARDING TIME" showing start time, "SEAT" showing party size
- Below: a vertical timeline of stops, each showing: stop number, venue name, type, time, and a checkmark circle
- A dotted line divider and barcode-style decoration at the bottom
- Two buttons at the bottom: **"Add to Apple Wallet"** and **"Add to Google Wallet"** (with wallet icons)
- The card should have rounded corners, a subtle shadow, and feel like a real boarding pass with a tear-line perforation effect

### 2. Onboarding Wizard (`/onboarding`)
A multi-step onboarding flow for new users (show on first visit):
- **Step 1 — City**: "What city are you exploring?" with popular city chips (DC, NYC, LA, Miami, Atlanta, Chicago)
- **Step 2 — Tastes**: "What are you into?" Grid of cuisine chips: Italian, Mexican, Japanese, Seafood, Korean, Mediterranean, Soul Food, Indian, Thai, American, Ethiopian, Vegan
- **Step 3 — Vibes**: "Pick your vibe" Activity chips: Rooftop bars, Live music, Speakeasies, Art galleries, Outdoor dining, Food halls, Wine bars, Comedy clubs, Dancing, Karaoke, Breweries, Jazz clubs
- **Step 4 — Budget**: "Your comfort zone" Budget slider from $50 to $500+ per person
- **Step 5 — Group**: "Who's coming?" Group size selector: Solo, Couple, Small group (3-5), Squad (6+)
- Each step has a progress bar at top, Back/Next buttons, and animated transitions

### 3. Confetti Creator Wizard (`/create`)
A 4-step wizard for manually creating a plan:
- **Step 1 — Who**: Group size selector with animated icons
- **Step 2 — What**: Occasion picker (Date Night, Birthday, Girls Night, Business, Family, Just Because) as visual cards
- **Step 3 — When**: Date and time picker, duration selector (2hr, 3hr, 4hr, All night)
- **Step 4 — Vibe**: Mood/vibe selector (Chill, Upscale, Wild, Adventurous, Romantic, Cultural) with emoji cards
- Include a "Generate for me" shortcut card at Step 1 with a wand icon that links to `/quick-generate`
- Final step shows a summary and "Create My Plan" button that navigates to `/boarding-pass`

### 4. Active Plan with GPS Check-in (`/active-confetti`)
When a user is on their plan (itinerary in progress):
- Show the current stop highlighted with a pulsing "NOW" indicator
- An **"I'm Here"** button that simulates GPS check-in
- On check-in: show a confetti animation, award Confetti points (+50), and mark the stop as completed with a green checkmark
- Show a mini-map placeholder area at top
- "Next Stop" card showing what's coming up with ETA
- An "End Early" option at the bottom

### 5. Venue Detail Page (`/venue/:id`)
When tapping a venue from Discover or the boarding pass:
- Full-width hero image at top
- Venue name, type, rating (stars), price level, and area/neighborhood
- Tags row (e.g. "TikTok Viral", "Rooftop", "Craft Cocktails")
- "Why we picked this" AI explanation card
- Hours, phone, and address info
- "Add to Plan" and "Book Now" action buttons
- Photo grid (3-4 Unsplash food/venue images)

### 6. Confirmation Screen (`/confirmation`)
After booking/creating a plan:
- Full-screen confetti animation (42 colorful falling pieces)
- Large checkmark in a gradient circle
- "You're all set!" heading
- Summary of the plan (number of stops, date, group size)
- "Add to Apple Wallet" and "Add to Google Wallet" buttons
- "View Boarding Pass" primary CTA
- "Share with friends" secondary button

### 7. Passport / Gamification (`/passport`)
A rewards/gamification screen:
- User's "Passport" showing their level, total Confetti (reward currency) earned
- Achievement badges grid (Explorer, Night Owl, Foodie, Social Butterfly, etc.)
- Recent activity feed showing Confetti earned from check-ins
- Progress bar to next level
- "Redeem Confetti" section showing available rewards

### 8. AI Chat (`/chat`)
A chat interface for AI-powered recommendations:
- Chat bubble UI with user messages on right, AI on left
- AI avatar with sparkle icon
- Typing indicator animation (3 bouncing dots)
- Suggested quick replies as chips ("Find me a rooftop", "Date night ideas", "What's trending")
- Messages should have a typewriter reveal animation

### 9. Tab Bar
Bottom navigation with 5 tabs: Home (compass icon), Discover (search icon), Create (plus icon, centered/prominent), Passport (award icon), Profile (user icon). Active tab should have a dot indicator below it.

### 10. Update Home Screen
- Add a hero section: "Hey, [Name]" greeting
- Show the Quick Generate CTA card prominently
- Add a "Continue your plan" card if there's an active plan
- Recent/trending venues horizontal scroll
- "Your taste profile" summary card linking to `/taste-tuner`

Keep the existing Quick Generate, Taste Tuner, and Social Connect features. Make sure all routes are connected and navigable. Use the app name "Confetti" and reward currency "Confetti" throughout.
