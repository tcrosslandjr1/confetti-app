# Confetti Boarding Pass Idea Engine

## Purpose

This document is a structured reference for the **Recommendation Agent**. It maps Confetti's full query taxonomy (15 categories, 90+ queries) into actionable idea pipelines so the agent can generate diverse, category-aware boarding passes for any city.

When building a boarding pass, the agent should:
1. Identify which categories match the user's vibe, occasion, and group
2. Pull relevant query templates to source venue ideas
3. Mix categories across stops to create variety within a single itinerary
4. Use tags to ensure thematic consistency
5. Check refresh cadence to know which data is time-sensitive

---

## Category → Boarding Pass Mapping

### 📍 TRENDING AREAS
**When to use:** User is new to a city or wants to know which neighborhoods to target. This category sets the *geography* for other categories.
**Query seeds:**
- `trending neighborhoods in {city}`
- `popular districts to visit in {city}`
- `best nightlife districts in {city}`
- `best food neighborhoods in {city}`
- `best shopping districts in {city}`
- `best arts districts in {city}`

**Boarding pass role:** Use as a **routing layer** — pick the neighborhood first, then source stops from other categories within that area to keep travel time tight. Also useful for "explore a neighborhood" themed boarding passes (brunch → shops → gallery → dinner all in one district).
**Refresh:** Monthly
**Tags:** `trending, popular, area, neighborhood, nightlife, food, shopping, art, instagrammy`

---

### 🎭 THINGS TO DO
**When to use:** User wants experiences and events, not just restaurants. Covers the full spectrum from free weekend plans to romantic date nights.
**Query seeds:**
- `things to do this weekend in {city}` (daily)
- `things to do tonight in {city}` (daily)
- `free things to do in {city}` (weekly)
- `cheap things to do in {city}` (weekly)
- `outdoor things to do in {city}` (weekly)
- `indoor things to do in {city}` (weekly — great for rainy days)
- `date night ideas in {city}` (weekly)
- `fun group activities in {city}` (weekly)

**Boarding pass role:** This is the most versatile category. Events and activities make strong Main Events or Twist Moments. Date night queries feed romantic boarding passes. Group activities are perfect for Party Room itineraries. Indoor/outdoor variants let you adapt to weather.
**Refresh:** Daily for weekend/tonight; weekly for everything else
**Tags:** `events, weekend, tonight, free, cheap, budget, outdoors, indoor, rainy-day, date-night, romantic, group, friends, activity`

---

### ⭐ POPULAR PLACES
**When to use:** User wants proven, highly-rated, crowd-favorite spots. The "safe bet" category — what everyone loves.
**Query seeds:**
- `popular restaurants in {city}` (weekly)
- `popular bars in {city}` (weekly)
- `popular brunch spots in {city}` (weekly)
- `popular attractions in {city}` (monthly)
- `popular rooftop bars in {city}` (weekly)
- `popular cafes in {city}` (monthly)
- `popular dessert spots in {city}` (monthly)

**Boarding pass role:** Anchor stops — the "can't miss" venues that give a boarding pass credibility. Best for Main Events and Warm-ups. Popular rooftops and dessert spots also work as Finales. Pair with hidden gems from Locals Love to balance mainstream with discovery.
**Refresh:** Weekly for restaurants/bars/brunch/rooftops; monthly for attractions/cafes/dessert
**Tags:** `popular, dining, food, bars, nightlife, brunch, daytime, attractions, tourism, rooftop, views, cafe, coffee, dessert`

---

### ✨ UNIQUE EXPERIENCES
**When to use:** User wants something they've never done before. "Surprise me" energy. This is Confetti's secret weapon — the category that makes boarding passes feel magical.
**Query seeds:**
- `unique things to do in {city}` (monthly)
- `immersive experiences in {city}` (monthly)
- `pop up experiences in {city}` (weekly — time-sensitive!)
- `hidden speakeasies in {city}` (monthly)
- `themed bars in {city}` (monthly)
- `themed restaurants in {city}` (monthly)
- `secret spots in {city}` (monthly)

**Boarding pass role:** This is your **Twist Moment goldmine**. Speakeasies, themed bars, immersive experiences, and secret spots are what make a Confetti boarding pass different from a Google search. Pop-ups are especially powerful because they're fleeting — "this is only here for 2 more weeks."
**Refresh:** Weekly for pop-ups; monthly for everything else
**Tags:** `unique, experience, immersive, popup, event, speakeasy, hidden, nightlife, theme, bar, restaurant, secret, hidden-gem, local`

---

### 📸 INSTAGRAMMY
**When to use:** User cares about aesthetics, photos, content creation. "For the gram" energy. Especially strong for bachelorettes, birthdays, influencer-coded groups.
**Query seeds:**
- `instagrammable restaurants in {city}` (weekly)
- `instagrammable cafes in {city}` (weekly)
- `best photo spots in {city}` (weekly)
- `best murals in {city}` (monthly)
- `flower walls in {city}` (monthly)
- `rooftop photo spots in {city}` (weekly)
- `best scenic views in {city}` (monthly)
- `aesthetic cafes in {city}` (weekly)

**Boarding pass role:** Sprinkle across any itinerary for content-focused groups. Aesthetic cafes make great Warm-ups. Photo spots and murals work as Twist Moments (surprise detour for a group photo). Scenic views and rooftop spots are perfect Finales. For full "content day" boarding passes, stack multiple Instagrammy stops.
**Refresh:** Weekly for restaurants/cafes/photo spots/rooftops; monthly for murals/flower walls/views
**Tags:** `instagrammy, photo, restaurant, cafe, aesthetic, murals, art, flower-wall, rooftop, views, scenic, soft-life`

---

### 🎨 THEMES (Pre-Built Occasion Templates)
**When to use:** User names a specific occasion or group type. This category provides ready-made boarding pass skeletons the agent can fill with real venues.
**Query seeds:**
- `brunch baddies spots in {city}` (weekly)
- `soft life spots in {city}` (weekly)
- `guys night spots in {city}` (weekly)
- `girls night spots in {city}` (weekly)
- `classy quiet restaurants in {city}` (monthly — in-laws)
- `bachelor party spots in {city}` (weekly)
- `bachelorette party spots in {city}` (weekly)
- `family friendly activities in {city}` (monthly)
- `corporate team activities in {city}` (monthly)

**Boarding pass role:** These are **occasion accelerators**. When the user says "bachelorette in Miami," start here to get the vibe right, then cross-reference with Popular Places, Nightlife, and Instagrammy to fill the stops. Themes + other categories = a fully fleshed-out boarding pass in seconds.
**Refresh:** Weekly for social themes; monthly for family/corporate/in-laws
**Tags:** `brunch-baddies, mimosas, instagrammy, soft-life, luxury, wellness, guys-night, bars, girls-night, cocktails, photo, in-laws, classy, conversation-friendly, bachelor, turn-up, bachelorette, brunch, nightlife, family, kids, safe, corporate, team-building, professional`

---

### 💎 LOCALS LOVE
**When to use:** User wants authentic, off-the-beaten-path, "where do locals actually go." Anti-tourist energy.
**Query seeds:**
- `locals favorite restaurants in {city}` (monthly)
- `hidden gem restaurants in {city}` (monthly)
- `neighborhood bars in {city}` (monthly)
- `local breakfast spots in {city}` (monthly)
- `best local coffee shops in {city}` (monthly)
- `underrated places in {city}` (monthly)

**Boarding pass role:** These are your hidden-gem Twist Moments and cozy Finales. The "you'd never find this on Google" energy. Also great for Coffee Crawl or Breakfast Run daytime boarding passes. Underrated spots are particularly strong twist material — the "trust me on this one" recommendation.
**Refresh:** Monthly — locals' favorites are more stable
**Tags:** `local, favorites, food, hidden-gem, dining, bars, low-key, breakfast, coffee, chill, underrated`

---

### 🍽️ FOOD & DRINK
**When to use:** User's primary interest is eating. Covers cuisine types, new openings, and budget-friendly options.
**Query seeds:**
- `new restaurants in {city}` (weekly)
- `grand opening restaurants in {city}` (weekly)
- `best dinner restaurants in {city}` (weekly)
- `best seafood restaurants in {city}` (monthly)
- `best steakhouses in {city}` (monthly)
- `best sushi in {city}` (monthly)
- `best bbq in {city}` (monthly)
- `best food trucks in {city}` (weekly)

**Boarding pass role:** The core dining inventory. New openings and grand openings make strong Twist Moments ("this place opened last Tuesday"). Cuisine-specific queries let you match dietary preferences or cravings. Food trucks are great budget-friendly Warm-ups or surprise stops. Best dinner is your Main Event anchor.
**Refresh:** Weekly for new/openings/dinner/food trucks; monthly for cuisine types
**Tags:** `new, dining, food, opening, dinner, popular, seafood, steakhouse, sushi, bbq, local, food-truck, budget`

---

### 🌙 NIGHTLIFE
**When to use:** User wants to go out OUT. Dancing, drinks, late-night energy.
**Query seeds:**
- `best nightclubs in {city}` (weekly)
- `best lounges in {city}` (weekly)
- `best cocktail bars in {city}` (weekly)
- `best dive bars in {city}` (monthly)
- `live music bars in {city}` (weekly)
- `karaoke bars in {city}` (monthly)

**Boarding pass role:** Clubs = Finale (peak energy, late night). Lounges = Warm-up (set the tone, ease into the night). Cocktail bars = Main Event or Warm-up (date-night anchor). Dive bars = Twist Moment (low-key detour in a fancy night). Live music = Main Event or Twist. Karaoke = group Twist Moment (everyone sings).
**Refresh:** Weekly for clubs/lounges/cocktail bars/live music; monthly for dive bars/karaoke
**Tags:** `club, turn-up, nightlife, lounge, soft-life, cocktails, bars, date-night, dive-bar, local, low-key, live-music, karaoke, group`

---

### 🧘 WELLNESS
**When to use:** User wants self-care, relaxation, soft-life energy. Expanded beyond spas to include the full pampering spectrum.
**Query seeds:**
- `best spas in {city}` (monthly)
- `best massage spas in {city}` (monthly)
- `best nail salons in {city}` (monthly)
- `best facial spas in {city}` (monthly)
- `best yoga studios in {city}` (monthly)

**Boarding pass role:** Anchor for wellness-themed boarding passes. Build a "Self-Care Sunday" pass: Yoga → Brunch → Spa → Aesthetic Cafe. Nail salons and facials pair well with shopping for "pamper + shop" days. Great for solo itineraries, couples, or girls' day out.
**Refresh:** Monthly
**Tags:** `spa, wellness, soft-life, massage, relaxing, nails, self-care, facial, yoga, chill`

---

### 🛍️ SHOPPING
**When to use:** User wants to shop — from high-end boutiques to thrift hunting.
**Query seeds:**
- `best shopping areas in {city}` (monthly)
- `local boutiques in {city}` (monthly)
- `best thrift stores in {city}` (monthly)
- `best vintage shops in {city}` (monthly)

**Boarding pass role:** Build daytime boarding passes: Brunch → Shopping District → Boutique → Cafe → Vintage Shop. Thrift/vintage stores are great Twist Moments for groups that love the hunt. Shopping districts also serve as the geographic anchor (like Trending Areas) to cluster other stops nearby.
**Refresh:** Monthly
**Tags:** `shopping, area, daytime, boutique, local, thrifting, budget, vintage`

---

### 🏔️ ADVENTURE
**When to use:** User wants active, adrenaline, or competitive experiences. Much broader than just hiking — now includes indoor action.
**Query seeds:**
- `best hikes near {city}` (monthly)
- `jet ski rentals in {city}` (monthly)
- `kayak paddleboard rentals in {city}` (monthly)
- `go kart racing in {city}` (monthly)
- `rage rooms in {city}` (monthly)
- `best arcades in {city}` (monthly)
- `golf courses and driving ranges in {city}` (monthly)

**Boarding pass role:** Build adventure boarding passes: Morning hike → Brunch → Water activity → Sunset dinner. Or indoor action passes: Go-karts → Arcade → BBQ → Karaoke. Rage rooms are an incredible Twist Moment ("we're going WHERE?"). Golf/driving ranges work for corporate or guys' night themes.
**Refresh:** Monthly
**Tags:** `hiking, outdoors, adventure, jetski, waterfront, kayak, paddleboard, go-kart, action, group, rage-room, unique, arcade, games, golf, sports`

---

### 🏛️ CULTURE
**When to use:** User wants to learn, explore history, or appreciate art and architecture.
**Query seeds:**
- `best museums in {city}` (monthly)
- `art galleries in {city}` (monthly)
- `historical tours in {city}` (monthly)
- `architecture tours in {city}` (monthly)
- `local landmarks in {city}` (monthly)

**Boarding pass role:** Culture stops make sophisticated Warm-ups (gallery before dinner) or full-day boarding passes for visitors. Tours are strong Main Events. Landmarks pair well with Instagrammy photo spots. Great for "show my parents the city" or "first time visiting" contexts.
**Refresh:** Monthly
**Tags:** `museum, culture, family, gallery, art, history, tour, architecture, landmark, tourism, photo`

---

### 👨‍👩‍👧‍👦 FAMILY
**When to use:** User is traveling with kids or planning family-friendly outings.
**Query seeds:**
- `family friendly things to do in {city}` (monthly)
- `aquariums and zoos in {city}` (monthly)
- `bowling and mini golf in {city}` (monthly)

**Boarding pass role:** Filter the entire itinerary through a family-safe lens. No late-night stops, no bars. Focus on interactive experiences, kid-friendly dining, and activities with broad appeal. Aquariums/zoos are natural Main Events. Bowling/mini golf work as fun Twist Moments. Cross-reference with Culture (museums) and Popular Places (family restaurants).
**Refresh:** Monthly
**Tags:** `family, kids, safe, zoo, aquarium, games, group`

---

### 🌊 WATERFRONT
**When to use:** User wants water-adjacent experiences — dining with a view, boat rides, beach days, scenic walks.
**Query seeds:**
- `waterfront restaurants in {city}` (weekly)
- `boat cruises in {city}` (monthly)
- `best beaches near {city}` (monthly)
- `riverwalk things to do in {city}` (monthly)

**Boarding pass role:** Waterfront restaurants are premium Main Events or Finales (sunset dinner by the water). Boat cruises are unforgettable Twist Moments. Beach days anchor daytime boarding passes. Riverwalks are perfect transition moments between stops. This category elevates any boarding pass with scenic, memorable settings.
**Refresh:** Weekly for restaurants; monthly for cruises/beaches/riverwalk
**Tags:** `waterfront, dining, views, boat, activity, beach, daytime, riverwalk, scenic`

---

## Cross-Category Mixing Rules

The best boarding passes mix categories across stops. Here's the expanded mixing logic:

| User Vibe | Stop 1 (Warm-up) | Stop 2 (Main Event) | Stop 3 (Twist) | Stop 4 (Finale) |
|-----------|-------------------|---------------------|-----------------|------------------|
| "Turn up" | Popular rooftop | Food & Drink (dinner) | Unique (speakeasy) | Nightlife (club) |
| "Date night" | Locals Love (wine bar) | Food & Drink (dinner) | Unique (speakeasy) | Waterfront (walk) |
| "Girls trip" | Instagrammy (cafe) | Popular (brunch) | Shopping (boutiques) | Nightlife (lounge) |
| "Bachelorette" | Wellness (nails) | Themes (bachelorette) | Instagrammy (photo spot) | Nightlife (club) |
| "Bachelor party" | Adventure (go-karts) | Food & Drink (steakhouse) | Unique (themed bar) | Nightlife (club) |
| "Family visit" | Culture (museum) | Family (zoo/aquarium) | Locals Love (lunch) | Waterfront (riverwalk) |
| "Parents in town" | Culture (landmark) | Food & Drink (seafood) | Themes (in-laws dinner) | Locals Love (quiet bar) |
| "Self-care" | Wellness (yoga) | Instagrammy (aesthetic cafe) | Shopping (boutique) | Wellness (spa) |
| "Brunch baddies" | Instagrammy (cafe) | Themes (brunch baddies) | Instagrammy (murals) | Shopping (vintage) |
| "Adventure day" | Adventure (hike) | Locals Love (brunch) | Adventure (water sports) | Waterfront (sunset dinner) |
| "Culture day" | Culture (gallery) | Culture (museum) | Locals Love (hidden gem) | Food & Drink (dinner) |
| "Explore the city" | Trending Areas (district) | Popular (restaurant) | Unique (secret spot) | Locals Love (bar) |
| "Guys night" | Adventure (golf) | Food & Drink (BBQ) | Nightlife (dive bar) | Nightlife (live music) |
| "Corporate team" | Themes (team activity) | Food & Drink (dinner) | Adventure (arcade) | Nightlife (cocktail bar) |
| "Budget friendly" | Things To Do (free) | Food & Drink (food trucks) | Locals Love (hidden gem) | Things To Do (cheap) |
| "Content creation" | Instagrammy (murals) | Instagrammy (restaurant) | Instagrammy (rooftop) | Instagrammy (scenic view) |
| "Soft life" | Wellness (facial) | Instagrammy (aesthetic cafe) | Shopping (boutique) | Waterfront (sunset dinner) |
| "Waterfront day" | Waterfront (beach) | Waterfront (restaurant) | Adventure (kayak) | Waterfront (boat cruise) |

---

## Tag-to-Vibe Translation

When the user describes a mood, map it to tags and categories:

| User Says | Maps To Tags | Primary Categories |
|-----------|-------------|-------------------|
| "chill" / "low-key" / "relaxed" | `low-key, chill, soft-life, local` | Locals Love, Wellness |
| "turn up" / "party" / "lit" | `turn-up, nightlife, club, popular` | Nightlife, Popular Places |
| "bougie" / "fancy" / "upscale" | `classy, soft-life, rooftop, popular` | Popular Places, Waterfront, Themes |
| "adventure" / "outdoors" / "active" | `adventure, outdoors, waterfront, action` | Adventure, Waterfront |
| "aesthetic" / "content" / "for the gram" | `instagrammy, aesthetic, photo, views` | Instagrammy, Waterfront |
| "hidden gems" / "local" / "authentic" | `hidden-gem, local, favorites, underrated` | Locals Love, Food & Drink |
| "family" / "kids" / "parents visiting" | `family, kids, safe, culture` | Family, Culture, Themes |
| "date night" / "romantic" | `date-night, romantic, speakeasy, views` | Unique Experiences, Nightlife, Waterfront |
| "new spots" / "what just opened" | `new, opening, popup` | Food & Drink, Unique Experiences |
| "brunch" / "daytime" / "morning" | `brunch, daytime, breakfast, cafe, coffee` | Popular Places, Locals Love, Instagrammy |
| "wellness" / "self-care" / "pamper" | `wellness, spa, massage, self-care, nails` | Wellness, Shopping |
| "surprise me" / "unique" / "different" | `unique, immersive, secret, hidden, theme` | Unique Experiences |
| "shopping" / "retail therapy" | `shopping, boutique, thrifting, vintage` | Shopping, Trending Areas |
| "culture" / "history" / "art" | `museum, gallery, art, history, tour` | Culture, Instagrammy |
| "waterfront" / "water" / "beach" | `waterfront, beach, boat, riverwalk, scenic` | Waterfront, Adventure |
| "budget" / "cheap" / "free" | `free, cheap, budget, food-truck, thrifting` | Things To Do, Food & Drink, Shopping |
| "group" / "squad" / "friends" | `group, friends, games, karaoke, activity` | Things To Do, Adventure, Nightlife |
| "corporate" / "team building" | `corporate, team-building, professional` | Themes, Adventure |

---

## How to Use This File

1. **Receive user request** → Decode vibe (Layer 1 of Recommendation Agent)
2. **Match to categories** → Use the Tag-to-Vibe Translation table above
3. **Set geography** → Check Trending Areas to pick the right neighborhood(s)
4. **Pull query templates** → Source venue ideas from matched categories in `query-templates.csv`
5. **Mix across stops** → Use the Cross-Category Mixing Rules to build variety
6. **Apply the boarding pass format** → Theme name, 4 stops, twist, budget, pitch
7. **Refresh awareness** → Daily-refresh categories (Things To Do) surface time-sensitive events; weekly categories rotate frequently; monthly categories are stable foundations
