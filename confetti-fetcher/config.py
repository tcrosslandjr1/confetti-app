"""
Confetti DMV Data Fetcher — Configuration
==========================================
Set all API keys as environment variables or paste them directly below (not recommended for shared NAS).

Synology NAS: set via Control Panel > Task Scheduler > Edit Task > Environment Variables
"""

import os

# ─── API Keys ─────────────────────────────────────────────────────────────────
BRIGHTDATA_API_KEY = os.getenv("BRIGHTDATA_API_KEY", "")        # https://brightdata.com
BRIGHTDATA_ZONE    = os.getenv("BRIGHTDATA_ZONE", "datacenter") # your zone name

GOOGLE_PLACES_KEY  = os.getenv("GOOGLE_PLACES_KEY", "")         # https://console.cloud.google.com
YELP_API_KEY       = os.getenv("YELP_API_KEY", "")              # https://fusion.yelp.com

SUPABASE_URL       = os.getenv("SUPABASE_URL", "https://fybqzuoqvzldbdjytysi.supabase.co")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")    # service_role key (not anon!)

# ─── NAS Paths ────────────────────────────────────────────────────────────────
# On Synology NAS the path is /volume1/...
# On your Mac when mounted: /Volumes/home/...
EXCEL_PATH = os.getenv(
    "EXCEL_PATH",
    "/volume1/homes/admin/confetti_fetcher/confetti_venues.xlsx"
)
LOG_PATH = os.getenv(
    "LOG_PATH",
    "/volume1/homes/admin/confetti_fetcher/fetch_log.txt"
)

# ─── Search Geography ─────────────────────────────────────────────────────────
DMV_LOCATIONS = [
    {"city": "DC",       "label": "Washington DC",  "lat": 38.9072,  "lng": -77.0369, "radius_m": 15000},
    {"city": "Maryland", "label": "Bethesda MD",    "lat": 38.9847,  "lng": -77.0947, "radius_m": 10000},
    {"city": "Maryland", "label": "Silver Spring MD","lat": 38.9912,  "lng": -77.0261, "radius_m": 8000},
    {"city": "Maryland", "label": "College Park MD", "lat": 38.9897,  "lng": -76.9378, "radius_m": 8000},
    {"city": "Maryland", "label": "Annapolis MD",    "lat": 38.9784,  "lng": -76.4922, "radius_m": 8000},
    {"city": "Virginia", "label": "Arlington VA",   "lat": 38.8816,  "lng": -77.0910, "radius_m": 8000},
    {"city": "Virginia", "label": "Alexandria VA",  "lat": 38.8048,  "lng": -77.0469, "radius_m": 8000},
    {"city": "Virginia", "label": "Tysons VA",      "lat": 38.9187,  "lng": -77.2311, "radius_m": 8000},
    {"city": "Virginia", "label": "Reston VA",      "lat": 38.9586,  "lng": -77.3570, "radius_m": 8000},
]

# ─── Categories & Search Queries ──────────────────────────────────────────────
CATEGORIES = {
    "nightlife": {
        "google_types": ["night_club", "bar", "casino", "bowling_alley"],
        "google_queries": ["nightclub", "rooftop bar", "jazz bar", "cocktail lounge", "nightlife"],
        "yelp_terms": ["nightlife", "bars", "clubs", "cocktail bars", "dance clubs"],
        "tiktok_hashtags": ["DCnightlife", "DMVnightlife", "DCbar", "DCclubs", "DCrooftop"],
        "web_queries": ["best nightlife Washington DC 2024 2025", "trending bars DC Maryland Virginia"],
    },
    "restaurant": {
        "google_types": ["restaurant", "food", "meal_delivery"],
        "google_queries": ["best restaurant", "trending restaurant", "new restaurant", "popular food"],
        "yelp_terms": ["restaurants", "food"],
        "tiktok_hashtags": ["DCfood", "DMVfood", "DCrestaurant", "DCfoodie", "DMVeats", "DCfoodtiktok"],
        "web_queries": ["best restaurants Washington DC 2024 2025", "trending restaurants DMV"],
    },
    "brunch": {
        "google_types": ["restaurant", "cafe", "bakery"],
        "google_queries": ["brunch restaurant", "bottomless brunch", "Sunday brunch", "brunch spot"],
        "yelp_terms": ["brunch", "breakfast & brunch"],
        "tiktok_hashtags": ["DCbrunch", "DMVbrunch", "DCsundaybrunch", "brunchDC", "bottomlessbrunch"],
        "web_queries": ["best brunch spots DC Maryland Virginia 2024 2025", "bottomless brunch DC"],
    },
    "happy_hour": {
        "google_types": ["bar", "restaurant", "night_club"],
        "google_queries": ["happy hour bar", "happy hour deals", "after work drinks"],
        "yelp_terms": ["cocktail bars", "wine bars", "bars"],
        "tiktok_hashtags": ["DChappyhour", "DMVhappyhour", "happyhourDC", "afterworkDC"],
        "web_queries": ["best happy hour DC Maryland Virginia 2024 2025"],
    },
    "date_night": {
        "google_types": ["restaurant", "movie_theater", "art_gallery", "museum", "spa"],
        "google_queries": ["romantic restaurant", "date night spot", "couples activity", "rooftop dining"],
        "yelp_terms": ["restaurants", "arts & entertainment"],
        "tiktok_hashtags": ["DCdatenight", "DMVdatenight", "datenightDC", "romanticDC", "couplesactivitiesDC"],
        "web_queries": ["best date night ideas Washington DC 2024 2025", "romantic restaurants DMV"],
    },
    "guys_night": {
        "google_types": ["bar", "bowling_alley", "movie_theater", "night_club", "stadium"],
        "google_queries": ["sports bar", "axe throwing", "bowling", "arcade bar", "pool bar"],
        "yelp_terms": ["sports bars", "bowling", "arcades", "axe throwing"],
        "tiktok_hashtags": ["DCguysnight", "DMVguysnight", "sportsbarDC", "guysweekendDC"],
        "web_queries": ["guys night out ideas Washington DC Maryland Virginia 2024"],
    },
    "girls_night": {
        "google_types": ["night_club", "bar", "spa", "restaurant"],
        "google_queries": ["wine bar", "cocktail bar", "girls night out", "dance club", "paint and sip"],
        "yelp_terms": ["wine bars", "cocktail bars", "dance clubs"],
        "tiktok_hashtags": ["DCgirlsnight", "DMVgirlsnight", "girlsnightDC", "DCgirlstrip", "ladiesnight"],
        "web_queries": ["girls night out DC Maryland Virginia 2024 2025"],
    },
    "family": {
        "google_types": ["amusement_park", "aquarium", "zoo", "museum", "park", "bowling_alley"],
        "google_queries": ["family activity", "family fun", "things to do with kids", "family outing"],
        "yelp_terms": ["amusement parks", "zoos", "aquariums", "family-friendly"],
        "tiktok_hashtags": ["DCfamilyfun", "DMVfamilies", "DCkidsactivities", "familyfunDC", "thingstodowithkidsDC"],
        "web_queries": ["family activities Washington DC Maryland Virginia 2024 2025", "fun things for families DMV"],
    },
    "kids_education": {
        "google_types": ["museum", "library", "university", "aquarium", "zoo"],
        "google_queries": ["children's museum", "science museum", "kids workshop", "educational kids activity"],
        "yelp_terms": ["museums", "science & nature"],
        "tiktok_hashtags": ["DCkidsmuseum", "educationalDC", "kidslearningDC", "DMVkids", "smithsonianDC"],
        "web_queries": ["educational activities for kids Washington DC 2024 2025", "kids museums DMV"],
    },
    "adventure": {
        "google_types": ["park", "natural_feature", "campground", "gym", "stadium"],
        "google_queries": ["outdoor adventure", "hiking trail", "kayaking", "rock climbing", "escape room"],
        "yelp_terms": ["active life", "hiking", "rock climbing", "kayaking", "escape games"],
        "tiktok_hashtags": ["DCadventure", "DMVoutdoors", "hikingDC", "outdoorsDMV", "adventureDC"],
        "web_queries": ["outdoor adventure activities Washington DC Maryland Virginia 2024 2025"],
    },
    "coffee": {
        "google_types": ["cafe", "coffee_shop", "bakery"],
        "google_queries": ["local coffee shop", "independent cafe", "specialty coffee", "coffee roaster"],
        "yelp_terms": ["coffee & tea", "cafes"],
        "tiktok_hashtags": ["DCcoffee", "DMVcafe", "coffeeshopDC", "localcoffeeDC", "DCespresso"],
        "web_queries": ["best local coffee shops Washington DC Maryland Virginia 2024 2025", "specialty coffee DMV"],
    },
    "theme_park": {
        "google_types": ["amusement_park", "tourist_attraction"],
        "google_queries": ["amusement park", "theme park", "water park", "adventure park"],
        "yelp_terms": ["amusement parks"],
        "tiktok_hashtags": ["DMVthemepark", "sixflagsDC", "kidzooriaDC", "adventureparkDC"],
        "web_queries": ["theme parks near Washington DC Maryland Virginia 2024 2025"],
    },
    "trending": {
        "google_types": ["restaurant", "bar", "night_club", "tourist_attraction"],
        "google_queries": ["trending spot", "new opening", "most popular", "viral restaurant"],
        "yelp_terms": ["trending", "new"],
        "tiktok_hashtags": ["DMVtrending", "DCtrending", "newDC", "viralDC", "DCmustvisit", "DMVmustdo"],
        "web_queries": ["trending places Washington DC Maryland Virginia 2025", "new openings DMV 2025"],
    },
}

# ─── Scoring Weights ──────────────────────────────────────────────────────────
SCORING = {
    "tiktok_mentions_weight": 0.4,   # 40% — TikTok is the pulse
    "google_rating_weight":   0.25,  # 25%
    "yelp_rating_weight":     0.15,  # 15%
    "recency_weight":         0.20,  # 20% — how recently fetched / viral
    "trending_threshold":     60.0,  # score above this = is_trending = True
}

# ─── Fetch Limits ─────────────────────────────────────────────────────────────
GOOGLE_RESULTS_PER_QUERY = 20
YELP_RESULTS_PER_QUERY   = 20
TIKTOK_VIDEOS_PER_HASHTAG = 30
WEB_RESULTS_PER_QUERY    = 10

# ─── Dedup Threshold ──────────────────────────────────────────────────────────
# Fuzzy match ratio above this = same venue
FUZZY_MATCH_THRESHOLD = 85
