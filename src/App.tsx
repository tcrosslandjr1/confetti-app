import {
  ArrowLeft,
  ArrowRight,
  Baby,
  Battery,
  BatteryCharging,
  Bell,
  CalendarCheck,
  Car,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Compass,
  Copy,
  Eye,
  Flame,
  GlassWater,
  Grip,
  Heart,
  Home as HomeIcon,
  IceCream,
  Lock,
  MapPin,
  Menu,
  MessageCircle,
  Mic,
  Moon,
  Mountain,
  Navigation,
  Palette,
  PartyPopper,
  Plane,
  PlaneTakeoff,
  Plus,
  RefreshCw,
  Route,
  Search,
  Send,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sofa,
  Sparkles,
  Star,
  Sunrise,
  TreePine,
  TrendingUp,
  Trophy,
  UserRound,
  Users,
  Utensils,
  WandSparkles,
  Wine,
  X,
  Zap,
  Radio,
  CircleCheck,
  Timer,
  Phone,
  ChevronUp,
  Wallet,
  Smartphone,
  Download,
  ExternalLink,
  Instagram,
  ThumbsUp,
  ThumbsDown,
  Shuffle,
  GripVertical,
  RotateCcw,
  Music,
  Globe,
  Link2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, MotionConfig, motion, type Transition, useMotionValue, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Component, CSSProperties, Fragment, ReactNode, useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, Navigate, Route as RouterRoute, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  fetchRouteIntelligence,
  isRouteIntelligenceConfigured,
  LiveTrafficAlert,
  LiveVenueDetail
} from "./lib/routeIntelligence";
import { buildAgentReply } from "./lib/aiAgent";
import { funSectors, sectorQuickChips } from "./lib/funSectors";
import {
  sendMessageLocal,
  trackBehaviorLocal,
  getUserContextLocal,
  getChatStatus,
  getAllPasses,
  getPassStats,
  revokePasses,
  type ChatResponse,
  type DiscoveredVenue,
  type WalletPass,
} from "./lib/agents";
import { Groups, GroupDetail, GroupPlanView } from "./components/GroupViews";
import { CouponWallet, BoostBadge, CheckInFlow, ConfettiPop, ConfettiSubscriptionCard, BusinessDashboard } from "./components/BoostViews";
import { MyWallet, FundAdminDashboard, BarcodeScanView } from "./components/WalletViews";
import { CommunityExplore, CommunityPlanDetail, ReputationProfile, SharePlanFlow } from "./components/CommunityViews";
import AdminWalletManager from "./components/AdminWalletManager";
import {
  completeAuthCallback,
  createAccountWithEmail,
  getCurrentAccount,
  isSupabaseConfigured,
  normalizeUsername,
  signInWithEmailOrUsername,
  signInWithSocial,
  signOutAccount,
  type AuthProviderId
} from "./lib/auth";
import { supabase } from "./lib/supabase";

const venues = [
  {
    id: "luma",
    name: "Luma Rooftop",
    type: "Rooftop Izakaya",
    image:
      "https://images.unsplash.com/photo-1559329007-40df8a9345d8?auto=format&fit=crop&w=900&q=80",
    match: 94,
    price: "$$$",
    area: "14th Street",
    tags: ["Skyline", "Date Night", "Craft Sake", "DJ after 9"],
    rating: 4.8,
    category: "nightlife"
  },
  {
    id: "atelier",
    name: "Atelier Sol",
    type: "Modern Coastal",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
    match: 91,
    price: "$$$$",
    area: "Georgetown",
    tags: ["Chef Table", "Warm", "Anniversary", "Wine"],
    rating: 4.9,
    category: "dining"
  },
  {
    id: "neon",
    name: "Neon Library",
    type: "Listening Lounge",
    image:
      "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=900&q=80",
    match: 88,
    price: "$$",
    area: "Shaw",
    tags: ["Vinyl", "Cocktails", "Crew Night", "Late"],
    rating: 4.7,
    category: "nightlife"
  },
  {
    id: "smash-stack",
    name: "Smash Stack",
    type: "Viral Smash Burgers",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80",
    match: 96,
    price: "$$",
    area: "Union Market",
    tags: ["TikTok Viral", "Ugly Delicious", "Loaded", "Late Night"],
    rating: 4.9,
    category: "trending-food"
  },
  {
    id: "wonderland-bar",
    name: "The Looking Glass",
    type: "Immersive Speakeasy",
    image:
      "https://images.unsplash.com/photo-1525268323446-0505b6fe7778?auto=format&fit=crop&w=900&q=80",
    match: 93,
    price: "$$$",
    area: "Dupont Circle",
    tags: ["Hidden Entry", "Cocktail Puzzles", "Speakeasy", "Instagrammable"],
    rating: 4.8,
    category: "hidden-gems"
  },
  {
    id: "dino-dig",
    name: "Discovery Zone",
    type: "Interactive Kids Museum",
    image:
      "https://images.unsplash.com/photo-1566140967404-b8b3932483f5?auto=format&fit=crop&w=900&q=80",
    match: 97,
    price: "$$",
    area: "National Mall",
    tags: ["Kids", "Gem Digging", "Hands-On", "All Ages"],
    rating: 4.9,
    category: "kids"
  },
  {
    id: "sunset-trail",
    name: "Golden Hour Trail",
    type: "Scenic Sunset Hike",
    image:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=80",
    match: 91,
    price: "Free",
    area: "Great Falls",
    tags: ["Sunset", "Nature", "TikTok Trail", "Photo Op"],
    rating: 4.7,
    category: "outdoor"
  },
  {
    id: "crispy-rice",
    name: "Kome Crispy Bar",
    type: "TikTok-Famous Crispy Rice",
    image:
      "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=80",
    match: 95,
    price: "$$",
    area: "H Street",
    tags: ["Crispy Rice", "Viral", "Date Spot", "Shareable"],
    rating: 4.8,
    category: "trending-food"
  },
  {
    id: "paint-pour",
    name: "Pour & Paint Lounge",
    type: "Creative Date Night",
    image:
      "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=900&q=80",
    match: 89,
    price: "$$",
    area: "Adams Morgan",
    tags: ["Paint & Sip", "Couples", "Creative", "BYOB"],
    rating: 4.6,
    category: "date-night"
  },
  {
    id: "splash-park",
    name: "Splash Adventure Park",
    type: "Family Water Play",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=900&q=80",
    match: 98,
    price: "$",
    area: "Yards Park",
    tags: ["Toddler Safe", "Free Play", "Picnic Area", "Summer Hit"],
    rating: 4.8,
    category: "kids"
  },
  {
    id: "birria-bus",
    name: "Birria Boss Truck",
    type: "Viral Birria Tacos",
    image:
      "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=900&q=80",
    match: 94,
    price: "$",
    area: "Columbia Heights",
    tags: ["Birria Everything", "Street Food", "TikTok Famous", "Cash Only"],
    rating: 4.9,
    category: "trending-food"
  },
  {
    id: "blanket-fort",
    name: "Fort Nite Cinema",
    type: "Blanket Fort Movie Night",
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80",
    match: 90,
    price: "$$",
    area: "Petworth",
    tags: ["Cozy", "Couples", "Snack Bar", "Retro Films"],
    rating: 4.7,
    category: "date-night"
  }
];

const trendingCategories = [
  { id: "viral-eats", label: "Viral Eats", emoji: "🔥", icon: Flame, color: "rose", description: "TikTok-famous food spots near you" },
  { id: "hidden-gems", label: "Hidden Gems", emoji: "🗝️", icon: Eye, color: "purple", description: "Secret speakeasies & underground spots" },
  { id: "kids-day", label: "Kids Day Out", emoji: "🎨", icon: Baby, color: "orange", description: "Family adventures the whole crew loves" },
  { id: "outdoor-vibes", label: "Outdoor Vibes", emoji: "🌅", icon: Mountain, color: "teal", description: "Sunset hikes, picnics & nature walks" },
  { id: "date-inspo", label: "Date Inspo", emoji: "💕", icon: Heart, color: "rose", description: "Creative dates beyond dinner & a movie" },
  { id: "late-night", label: "Late Night", emoji: "🌙", icon: Moon, color: "blue", description: "Where the night owls go after 10 PM" }
];

const moods = [
  ["Date Night", "rose", "Planning a velvet-booth date night..."],
  ["Rooftop", "blue", "Craving rooftop vibes..."],
  ["Crew", "purple", "Need a spot for the crew..."],
  ["Family", "orange", "Keeping it warm and easy..."],
  ["Hidden Gems", "teal", "Find me a secret speakeasy..."],
  ["Viral Eats", "rose", "What's blowing up on TikTok..."],
  ["Kids Fun", "orange", "Something the kids will love..."],
  ["Outdoor", "teal", "Sunset hike or picnic vibes..."]
];

const wizardCuisines = ["Japanese", "Modern American", "Thai", "Mediterranean", "Mexican", "Coastal", "Birria & Street Food", "Smash Burgers", "Crispy Rice Bars", "Vegan", "Korean Fusion", "Steakhouse"];
const wizardActivities = ["Rooftops", "Live music", "Chef table", "Hidden speakeasies", "Immersive art", "Family adventures", "Sunset hikes", "Paint & sip", "Food truck crawls", "Gem digging", "Splash parks", "Blanket fort cinema"];

const hoodCodes: Record<string, string> = {
  "Georgetown": "GTN",
  "Capitol Hill": "CPH",
  "14th Street": "14S",
  "Shaw": "SHW",
  "Union Market": "UMK",
  "Dupont Circle": "DPC",
  "National Mall": "NML",
  "Great Falls": "GRF",
  "H Street": "HST",
  "Adams Morgan": "ADM",
  "Yards Park": "YPK",
  "Columbia Heights": "CLH",
  "Petworth": "PTW"
};

const occasions = [
  { id: "date-night", label: "Date Night", emoji: "🌹", color: "rose" },
  { id: "mothers-day", label: "Mother's Day", emoji: "💐", color: "pink" },
  { id: "birthday", label: "Birthday", emoji: "🎂", color: "gold" },
  { id: "anniversary", label: "Anniversary", emoji: "💍", color: "purple" },
  { id: "crew-night", label: "Crew Night", emoji: "🔥", color: "orange" },
  { id: "family-day", label: "Family Day", emoji: "👨‍👩‍👧‍👦", color: "teal" },
  { id: "solo-adventure", label: "Solo Adventure", emoji: "🧭", color: "blue" },
  { id: "celebration", label: "Celebration", emoji: "🎉", color: "gold" },
  { id: "just-because", label: "Just Because", emoji: "✨", color: "purple" }
];

const seatingOptions = [
  { id: "patio", label: "Patio", emoji: "🌿" },
  { id: "booth", label: "Booth", emoji: "🛋️" },
  { id: "bar", label: "Bar Seating", emoji: "🍸" },
  { id: "window", label: "Window", emoji: "🪟" },
  { id: "rooftop", label: "Rooftop", emoji: "🌇" },
  { id: "private", label: "Private Room", emoji: "🚪" },
  { id: "no-pref", label: "No Preference", emoji: "👍" }
];

const preOrderMenus: Record<string, Array<{ item: string; price: number; tag: string }>> = {
  "Atelier Sol": [
    { item: "Yuzu Tuna Crudo", price: 22, tag: "🔥 spicy" },
    { item: "Miso Glazed Short Rib", price: 36, tag: "chef pick" },
    { item: "Coastal Wine Flight", price: 28, tag: "🍷 pairing" },
    { item: "Sparkling Rosé", price: 16, tag: "celebration" },
    { item: "Matcha Pavlova", price: 14, tag: "🌱 light" }
  ],
  "Luma Rooftop": [
    { item: "Craft Sake Flight", price: 24, tag: "🍶 signature" },
    { item: "Skyline Spritz", price: 18, tag: "🌅 sunset" },
    { item: "Wagyu Sliders", price: 28, tag: "🔥 popular" },
    { item: "Edamame Truffle", price: 14, tag: "🌱 starter" },
    { item: "Yuzu Cheesecake", price: 16, tag: "sweet" }
  ],
  "Neon Library": [
    { item: "Vinyl Old Fashioned", price: 19, tag: "🥃 classic" },
    { item: "Neon Espresso Martini", price: 20, tag: "☕ signature" },
    { item: "Small Plates Board", price: 24, tag: "sharing" },
    { item: "Midnight Negroni", price: 18, tag: "🌙 nightcap" }
  ]
};

const confettiStops = [
  {
    time: "6:30 PM",
    name: "Atelier Sol",
    detail: "Coastal tasting menu",
    area: "Georgetown",
    driveTravel: "12 min drive",
    rideTravel: "16 min Uber",
    parking: "Canal Garage · 4 min walk · $18",
    parkingSearchMinutes: 14,
    arrivalBufferMinutes: 10,
    pickup: "Front awning on M Street",
    address: "3050 K Street NW, Washington, DC",
    phone: "(202) 555-0184",
    hours: "5:00 PM - 11:00 PM",
    reservation: "Table held until 6:45 PM",
    website: "atelier-sol.example",
    entrance: "Main entrance faces the waterfront promenade",
    valet: {
      available: true,
      detail: "Valet at K Street entrance · $22 · text-ahead pickup"
    },
    businessNotes: "Check in with host under Crossland. Booth request and wine flight are attached to the reservation.",
    dress: "Elevated casual",
    match: 91,
    evCharger: "ChargePoint · Canal Garage L2 · 2 spots",
    role: "departure"
  },
  {
    time: "8:45 PM",
    name: "Luma Rooftop",
    detail: "Skyline cocktails",
    area: "14th Street",
    driveTravel: "8 min drive",
    rideTravel: "9 min Uber",
    parking: "14th & U garage · 3 min walk · $12",
    parkingSearchMinutes: 11,
    arrivalBufferMinutes: 8,
    pickup: "South curb near valet stand",
    address: "1418 U Street NW, Washington, DC",
    phone: "(202) 555-0148",
    hours: "4:00 PM - 1:30 AM",
    reservation: "Rooftop rail table at 8:45 PM",
    website: "lumaroof.example",
    entrance: "Use side elevator beside the lobby bar",
    valet: {
      available: true,
      detail: "Valet after 6 PM · $18 · pickup on U Street"
    },
    businessNotes: "Ask for the skyline side. Sake flight pre-order is queued for arrival.",
    dress: "Statement jacket",
    match: 94,
    evCharger: null,
    role: "layover"
  },
  {
    time: "10:30 PM",
    name: "Neon Library",
    detail: "Vinyl lounge nightcap",
    area: "Shaw",
    driveTravel: "Walkable",
    rideTravel: "Walkable",
    parking: "Keep car parked, 6 min walk",
    parkingSearchMinutes: 0,
    arrivalBufferMinutes: 6,
    pickup: "Corner of 9th and T",
    address: "901 T Street NW, Washington, DC",
    phone: "(202) 555-0199",
    hours: "7:00 PM - 2:00 AM",
    reservation: "Guest list check-in at 10:30 PM",
    website: "neonlibrary.example",
    entrance: "Look for the blue vinyl sign beside the bookstore door",
    valet: {
      available: false,
      detail: "No valet. Best option is to keep the car parked and walk."
    },
    businessNotes: "Vinyl lounge has a low-light room; arrive together for faster door check.",
    dress: "Nightlife polish",
    match: 88,
    evCharger: null,
    role: "destination"
  }
];

type TrafficSeverity = "clear" | "moderate" | "heavy";

const trafficAlerts: LiveTrafficAlert[] = [
  {
    id: "gtown-to-14th",
    severity: "heavy",
    route: "Georgetown → 14th Street",
    fromStop: "Atelier Sol",
    toStop: "Luma Rooftop",
    title: "M Street slowdown",
    detail: "Construction near Washington Circle is adding time before the rooftop stop.",
    currentEta: "20 min",
    normalEta: "12 min",
    currentEtaMinutes: 20,
    normalEtaMinutes: 12,
    delayMinutes: 8,
    leaveBy: "8:17 PM",
    recommendation: "Leave Atelier Sol 8 minutes earlier or switch to rideshare pickup on Wisconsin Ave.",
    updated: "2 min ago"
  },
  {
    id: "14th-to-shaw",
    severity: "moderate",
    route: "14th Street → Shaw",
    fromStop: "Luma Rooftop",
    toStop: "Neon Library",
    title: "U Street crowd surge",
    detail: "Event traffic is building around U Street, but the walking route is still fastest.",
    currentEta: "9 min walk",
    normalEta: "6 min walk",
    currentEtaMinutes: 9,
    normalEtaMinutes: 6,
    delayMinutes: 3,
    leaveBy: "10:15 PM",
    recommendation: "Keep the car parked and walk from Luma Rooftop to Neon Library.",
    updated: "Just now"
  },
  {
    id: "parking-georgetown",
    severity: "clear",
    route: "Home → Georgetown",
    fromStop: "Home",
    toStop: "Atelier Sol",
    title: "Parking still available",
    detail: "Canal Garage is showing normal evening availability near your first stop.",
    currentEta: "12 min",
    normalEta: "12 min",
    currentEtaMinutes: 12,
    normalEtaMinutes: 12,
    delayMinutes: 0,
    leaveBy: "6:05 PM",
    recommendation: "No route change needed. Use Canal Garage and walk 4 minutes.",
    updated: "5 min ago"
  }
];

const chatMessages = [
  { from: "user", text: "What's trending near me? Kids are with us tonight." },
  {
    from: "ai",
    text:
      "Fam-friendly vibes! Start with birria tacos at Birria Boss (TikTok-viral), then hit Discovery Zone for gem digging, and end at Splash Adventure Park before sunset. Total: ~$85 for 4."
  }
];

const adminUsers = [
  {
    id: "usr-001",
    name: "Tyrone Crossland",
    email: "tyrone@example.com",
    role: "Owner",
    status: "Active",
    plan: "Premium",
    lastSeen: "Now",
    plans: 12,
    risk: "Low"
  },
  {
    id: "usr-002",
    name: "Maya Johnson",
    email: "maya@example.com",
    role: "Member",
    status: "Active",
    plan: "Premium",
    lastSeen: "8 min ago",
    plans: 7,
    risk: "Low"
  },
  {
    id: "usr-003",
    name: "Jules Carter",
    email: "jules@example.com",
    role: "Member",
    status: "Review",
    plan: "Free",
    lastSeen: "Yesterday",
    plans: 2,
    risk: "Medium"
  }
];

const adminActivityLog = [
  {
    id: "act-001",
    actor: "Tyrone Crossland",
    action: "Changed Maya Johnson role to Member",
    target: "maya@example.com",
    type: "User Management",
    severity: "Info",
    time: "2 min ago",
    metadata: "Role update · Admin Center"
  },
  {
    id: "act-002",
    actor: "Confetti AI",
    action: "Generated route intelligence for active plan",
    target: "CNFT-DATE-0510",
    type: "AI Agent",
    severity: "Success",
    time: "9 min ago",
    metadata: "Traffic, parking, valet"
  },
  {
    id: "act-003",
    actor: "System",
    action: "Flagged account for profile review",
    target: "jules@example.com",
    type: "Security",
    severity: "Warning",
    time: "1 hr ago",
    metadata: "Medium risk · Manual review"
  },
  {
    id: "act-004",
    actor: "Tyrone Crossland",
    action: "Exported venue discovery results",
    target: "Washington, DC",
    type: "Data",
    severity: "Info",
    time: "Today",
    metadata: "18 sectors · top venues"
  }
];

const tabs = [
  { path: "/home", label: "Home", icon: HomeIcon },
  { path: "/quick-idea", label: "Idea", icon: Sparkles },
  { path: "/create-confetti", label: "Confetti", icon: Route },
  { path: "/community", label: "Community", icon: Globe },
  { path: "/groups", label: "Crew", icon: Users },
  { path: "/passport", label: "Passport", icon: Trophy },
  { path: "/chat", label: "Chat", icon: MessageCircle }
];

const socialPlatforms = [
  { id: "instagram", label: "Instagram", color: "#E4405F", icon: "📸" },
  { id: "tiktok", label: "TikTok", color: "#00F2EA", icon: "🎵" },
  { id: "yelp", label: "Yelp", color: "#FF1A1A", icon: "⭐" },
  { id: "google", label: "Google", color: "#4285F4", icon: "🔍" },
  { id: "spotify", label: "Spotify", color: "#1DB954", icon: "🎧" },
  { id: "twitter", label: "X / Twitter", color: "#1DA1F2", icon: "𝕏" }
];

const tasteCards = [
  { id: 1, name: "Hidden speakeasy with craft cocktails", image: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=400", tags: ["Nightlife", "Cocktails", "Intimate"] },
  { id: 2, name: "Rooftop dining with city views", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400", tags: ["Rooftop", "Upscale", "Views"] },
  { id: 3, name: "Viral street food market crawl", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400", tags: ["Street Food", "Trendy", "Casual"] },
  { id: 4, name: "Live jazz dinner experience", image: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400", tags: ["Live Music", "Jazz", "Dinner"] },
  { id: 5, name: "Sunset hike to wine bar", image: "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=400", tags: ["Outdoor", "Wine", "Active"] },
  { id: 6, name: "Immersive art gallery after dark", image: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400", tags: ["Art", "Nightlife", "Culture"] },
  { id: 7, name: "Family-friendly food truck festival", image: "https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?w=400", tags: ["Family", "Casual", "Outdoor"] },
  { id: 8, name: "Omakase chef's counter experience", image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400", tags: ["Japanese", "Upscale", "Foodie"] }
];

const generatedStops = [
  { id: 1, name: "Birria Boss", type: "Street Tacos", time: "7:00 PM", duration: "45 min", area: "14th St", price: "$", match: 96, emoji: "🌮", detail: "TikTok-viral birria tacos with consommé", alternatives: [
    { name: "Taco Libre", type: "Modern Mexican", price: "$", match: 91 },
    { name: "El Rey", type: "Authentic Tacos", price: "$", match: 88 },
    { name: "Masa 14", type: "Latin Fusion", price: "$$", match: 85 }
  ]},
  { id: 2, name: "The Looking Glass", type: "Speakeasy", time: "8:15 PM", duration: "1 hr", area: "Georgetown", price: "$$", match: 94, emoji: "🍸", detail: "Hidden cocktail bar with puzzle entrance", alternatives: [
    { name: "The Gibson", type: "Classic Cocktails", price: "$$", match: 92 },
    { name: "Allegory", type: "Book-themed Bar", price: "$$", match: 89 },
    { name: "Bar Charley", type: "Neighborhood Bar", price: "$", match: 84 }
  ]},
  { id: 3, name: "Luma Rooftop", type: "Rooftop Bar", time: "9:30 PM", duration: "1.5 hr", area: "Shaw", price: "$$", match: 92, emoji: "🌃", detail: "360° city views with craft cocktails", alternatives: [
    { name: "Whiskey Charlie", type: "Waterfront Rooftop", price: "$$", match: 90 },
    { name: "POV at W Hotel", type: "Luxury Rooftop", price: "$$$", match: 87 },
    { name: "Top of the Gate", type: "Hotel Bar", price: "$$", match: 83 }
  ]}
];

const pageVariants = {
  initial: { opacity: 0, y: 18, scale: 0.985, filter: "blur(10px)" },
  animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, y: -10, scale: 1.008, filter: "blur(8px)" }
};

const pageTransition: Transition = {
  duration: 0.34,
  ease: [0.22, 1, 0.36, 1]
};

const panelTransition: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 30,
  mass: 0.85
};

const panelVariants = {
  initial: { x: 22, opacity: 0, filter: "blur(8px)" },
  animate: { x: 0, opacity: 1, filter: "blur(0px)" },
  exit: { x: -18, opacity: 0, filter: "blur(8px)" }
};

// Stops a render error in any single route from blanking the whole app.
// Previously a JS error during render produced a white screen with
// nothing the user could do to recover. Now they see a message + reload.
class RouteErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    console.error("[Confetti] route render error:", error);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, color: "#fff", maxWidth: 480, margin: "40px auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Something hiccuped.</h2>
          <p style={{ opacity: 0.7, fontSize: 14, marginBottom: 16 }}>
            {this.state.error.message || "An unexpected error stopped this page from rendering."}
          </p>
          <button
            onClick={() => window.location.assign("/home")}
            style={{ padding: "10px 18px", borderRadius: 12, background: "#6c63ff", color: "#fff", border: 0, fontWeight: 600, cursor: "pointer" }}
          >
            Back to home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Resolves :id from the URL and passes it to BusinessDashboard.
// The previous element={<BusinessDashboard businessId="" />} hardcoded
// an empty id, so every business route silently rendered "Business not found".
function BusinessRoute() {
  const { id } = useParams<{ id: string }>();
  return <BusinessDashboard businessId={id ?? ""} />;
}

// Resolves the current user id from auth and passes it to the wallet
// components. Replaces the previous hardcoded userId="demo-user" which
// made every user see the same demo wallet.
function WalletRoute({ kind }: { kind: "coupon" | "passes" }) {
  const [userId, setUserId] = useState<string>("demo-user");
  useEffect(() => {
    getCurrentAccount().then((a) => {
      if (a?.id) setUserId(a.id);
    });
  }, []);
  return kind === "coupon" ? <CouponWallet userId={userId} /> : <MyWallet userId={userId} />;
}

function App() {
  const location = useLocation();
  const [installReady, setInstallReady] = useState(false);

  useEffect(() => {
    const visits = Number(localStorage.getItem("concierge-visits") ?? "0") + 1;
    localStorage.setItem("concierge-visits", String(visits));
    setInstallReady(visits > 1 && !matchMedia("(display-mode: standalone)").matches);
  }, []);

  const showNav = !["/", "/onboarding", "/confirmation"].includes(location.pathname) && !location.pathname.startsWith("/auth");

  return (
    <MotionConfig transition={panelTransition} reducedMotion="user">
      <main className="app-canvas">
        <div className="phone-shell">
          <Aurora />
          <AnimatePresence initial={false} mode="sync">
            <RouteErrorBoundary key={location.pathname}>
            <Routes location={location}>
              <RouterRoute path="/" element={<Navigate to="/auth" replace />} />
              <RouterRoute path="/auth" element={<AuthPage />} />
              <RouterRoute path="/auth/callback" element={<AuthCallbackPage />} />
              <RouterRoute path="/onboarding" element={<Onboarding />} />
              <RouterRoute path="/home" element={<Home />} />
              <RouterRoute path="/quick-idea" element={<QuickIdea />} />
              <RouterRoute path="/create-confetti" element={<CreateConfetti />} />
              <RouterRoute path="/boarding-pass" element={<BoardingPass />} />
              <RouterRoute path="/venue/:id" element={<VenueDetail />} />
              <RouterRoute path="/active-confetti" element={<ActiveConfetti />} />
              <RouterRoute path="/confirmation" element={<Confirmation />} />
              <RouterRoute path="/passport" element={<Passport />} />
              <RouterRoute path="/chat" element={<Chat />} />
              <RouterRoute path="/profile" element={<Profile />} />
              <RouterRoute path="/admin" element={<AdminCenter />} />
              <RouterRoute path="/bookings" element={<Bookings />} />
              <RouterRoute path="/favorites" element={<Favorites />} />
              <RouterRoute path="/notifications" element={<Notifications />} />
              <RouterRoute path="/traffic-alerts" element={<TrafficAlerts />} />
              <RouterRoute path="/discover" element={<Discover />} />
              <RouterRoute path="/quick-generate" element={<QuickGenerate />} />
              <RouterRoute path="/taste-tuner" element={<TasteTuner />} />
              <RouterRoute path="/groups" element={<Groups />} />
              <RouterRoute path="/groups/:id" element={<GroupDetail />} />
              <RouterRoute path="/groups/:id/plan/:planId" element={<GroupPlanView />} />
              <RouterRoute path="/wallet" element={<WalletRoute kind="coupon" />} />
              <RouterRoute path="/wallet/passes" element={<WalletRoute kind="passes" />} />
              <RouterRoute path="/admin/fund" element={<FundAdminDashboard />} />
              <RouterRoute path="/admin/trending" element={<TrendingTracker />} />
              <RouterRoute path="/venue/scan" element={<BarcodeScanView />} />
              <RouterRoute path="/business/:id" element={<BusinessRoute />} />
              <RouterRoute path="/community" element={<CommunityExplore />} />
              <RouterRoute path="/community/plan/:planId" element={<CommunityPlanDetail />} />
              <RouterRoute path="/community/reputation" element={<ReputationProfile />} />
              <RouterRoute path="/community/share" element={<SharePlanFlow />} />
            </Routes>
            </RouteErrorBoundary>
          </AnimatePresence>
          <AnimatePresence initial={false}>
            {installReady ? <InstallPrompt onClose={() => setInstallReady(false)} /> : null}
          </AnimatePresence>
          <AnimatePresence initial={false}>
            {showNav ? <TabBar /> : null}
          </AnimatePresence>
        </div>
      </main>
    </MotionConfig>
  );
}

function Page({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      variants={reduceMotion ? undefined : pageVariants}
      initial={reduceMotion ? { opacity: 0 } : "initial"}
      animate={reduceMotion ? { opacity: 1 } : "animate"}
      exit={reduceMotion ? { opacity: 0 } : "exit"}
      transition={reduceMotion ? { duration: 0.12 } : pageTransition}
      className={`screen ${className}`}
    >
      {children}
    </motion.section>
  );
}

function ScrollReveal({ children, className = "", delay = 0, style }: { children: ReactNode; className?: string; delay?: number; style?: CSSProperties }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      style={style}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.985, filter: "blur(6px)" }}
      whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-40px" }}
      transition={reduceMotion ? { delay, duration: 0.12 } : { delay, ...panelTransition }}
    >
      {children}
    </motion.div>
  );
}

function useRouteIntelligence() {
  return useQuery({
    queryKey: ["route-intelligence", confettiStops.map((stop) => `${stop.name}:${stop.time}`).join("|")],
    queryFn: () => fetchRouteIntelligence(confettiStops),
    enabled: isRouteIntelligenceConfigured(),
    staleTime: 60_000,
    refetchInterval: 180_000,
    retry: 1
  });
}

function TrafficAlertsPanel({ compact = false }: { compact?: boolean }) {
  const routeIntelligence = useRouteIntelligence();
  const activeAlerts = routeIntelligence.data?.alerts?.length ? routeIntelligence.data.alerts : trafficAlerts;
  const visibleAlerts = compact ? activeAlerts.filter((alert) => alert.severity !== "clear").slice(0, 2) : activeAlerts;
  const severityConfig: Record<TrafficSeverity, { label: string; tone: string; icon: ReactNode }> = {
    clear: { label: "Clear", tone: "clear", icon: <Check /> },
    moderate: { label: "Moderate", tone: "moderate", icon: <Clock /> },
    heavy: { label: "Heavy", tone: "heavy", icon: <Bell /> }
  };

  const totalDelay = activeAlerts.reduce((sum, alert) => sum + alert.delayMinutes, 0);
  const worstAlert = activeAlerts.reduce((worst, alert) => (alert.delayMinutes > worst.delayMinutes ? alert : worst), activeAlerts[0]);
  const sourceLabel = routeIntelligence.data ? "Live" : isRouteIntelligenceConfigured() ? "Syncing" : "Demo";

  return (
    <div className={`traffic-panel ${compact ? "compact" : ""}`}>
      <div className="traffic-panel-header">
        <div>
          <p className="eyebrow">Traffic alerts</p>
          <h3>{totalDelay > 0 ? `${totalDelay} min route impact` : "Route looks clear"}</h3>
          <span className="traffic-source">{sourceLabel} route intelligence</span>
        </div>
        <span className={`traffic-badge ${severityConfig[worstAlert.severity].tone}`}>
          {severityConfig[worstAlert.severity].icon}
          {severityConfig[worstAlert.severity].label}
        </span>
      </div>

      <div className="traffic-list">
        {visibleAlerts.map((alert) => {
          const severity = severityConfig[alert.severity];
          return (
            <motion.article whileTap={{ scale: 0.98 }} className={`traffic-alert ${severity.tone}`} key={alert.id}>
              <div className="traffic-alert-icon">
                {severity.icon}
              </div>
              <div className="traffic-alert-copy">
                <div className="traffic-alert-title">
                  <b>{alert.title}</b>
                  <span>{alert.updated}</span>
                </div>
                <small>{alert.route}</small>
                <p>{alert.detail}</p>
                <div className="traffic-meta">
                  <span><Car /> {alert.currentEta}</span>
                  <span><Clock /> Leave by {alert.leaveBy}</span>
                  {alert.delayMinutes > 0 ? <span className="delay">+{alert.delayMinutes} min</span> : <span>On time</span>}
                </div>
                {!compact ? <em>{alert.recommendation}</em> : null}
              </div>
            </motion.article>
          );
        })}
      </div>

      {compact ? (
        <Link className="traffic-more" to="/traffic-alerts">
          View all traffic alerts <ChevronRight />
        </Link>
      ) : null}
    </div>
  );
}

function getRouteAlertForStop(index: number, alerts: LiveTrafficAlert[] = trafficAlerts) {
  const stop = confettiStops[index];
  const previousStop = index === 0 ? "Home" : confettiStops[index - 1].name;
  return alerts.find((alert) => alert.fromStop === previousStop && alert.toStop === stop.name);
}

function parseClockTime(time: string) {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;
  const [, hourText, minuteText, meridiem] = match;
  let hours = Number(hourText);
  const minutes = Number(minuteText);
  if (meridiem.toUpperCase() === "PM" && hours !== 12) hours += 12;
  if (meridiem.toUpperCase() === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function formatClockTime(totalMinutes: number) {
  const wrapped = ((totalMinutes % 1440) + 1440) % 1440;
  const hours24 = Math.floor(wrapped / 60);
  const minutes = wrapped % 60;
  const meridiem = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${meridiem}`;
}

function getArrivalPlan(stop: (typeof confettiStops)[number], index: number, alerts: LiveTrafficAlert[] = trafficAlerts) {
  const routeAlert = getRouteAlertForStop(index, alerts);
  const travelMinutes = routeAlert?.currentEtaMinutes ?? Number(stop.driveTravel.match(/\d+/)?.[0] ?? 0);
  const totalBuffer = travelMinutes + stop.parkingSearchMinutes + stop.arrivalBufferMinutes;
  const leaveBy = formatClockTime(parseClockTime(stop.time) - totalBuffer);

  return {
    routeAlert,
    travelMinutes,
    totalBuffer,
    leaveBy
  };
}

function mergeVenueDetails(stop: (typeof confettiStops)[number], liveVenue?: LiveVenueDetail) {
  return {
    address: liveVenue?.address ?? stop.address,
    phone: liveVenue?.phone ?? stop.phone,
    hours: liveVenue?.hours ?? stop.hours,
    website: liveVenue?.website ?? stop.website,
    parking: liveVenue?.parking ?? stop.parking,
    pickup: stop.pickup,
    valet: liveVenue?.valet ?? stop.valet,
    entrance: liveVenue?.entrance ?? stop.entrance,
    businessNotes: liveVenue?.businessNotes ?? stop.businessNotes,
    source: liveVenue?.source ?? "App itinerary"
  };
}

function ArrivalIntelligencePanel({ compact = false }: { compact?: boolean }) {
  const routeIntelligence = useRouteIntelligence();
  const activeAlerts = routeIntelligence.data?.alerts?.length ? routeIntelligence.data.alerts : trafficAlerts;
  const venueDetailsByName = new Map((routeIntelligence.data?.venues ?? []).map((venue) => [venue.stopName, venue]));
  const plans = confettiStops.map((stop, index) => ({ stop, index, plan: getArrivalPlan(stop, index, activeAlerts), venue: venueDetailsByName.get(stop.name) }));
  const visiblePlans = compact ? plans.slice(0, 2) : plans;
  const nextPlan = plans[0];

  return (
    <div className={`arrival-intel ${compact ? "compact" : ""}`}>
      <div className="arrival-intel-header">
        <div>
          <p className="eyebrow">Leave timing</p>
          <h3>Leave by {nextPlan.plan.leaveBy}</h3>
          <span>Includes traffic, parking search, valet, and arrival buffer.</span>
        </div>
        <Clock />
      </div>

      <div className="arrival-plan-list">
        {visiblePlans.map(({ stop, index, plan, venue }) => {
          const business = mergeVenueDetails(stop, venue);

          return (
          <article className="arrival-plan-card" key={stop.name}>
            <div className="arrival-plan-top">
              <div>
                <b>{stop.name}</b>
                <small>{index === 0 ? "From home" : `From ${confettiStops[index - 1].name}`} · arrive {stop.time}</small>
              </div>
              <strong>{plan.leaveBy}</strong>
            </div>

            <div className="arrival-plan-metrics">
              <span><Car /> {plan.travelMinutes} min traffic</span>
              <span><MapPin /> {stop.parkingSearchMinutes} min parking</span>
              <span><Clock /> {stop.arrivalBufferMinutes} min buffer</span>
            </div>

            <div className="business-detail-grid">
              <span><b>Parking</b>{business.parking}</span>
              <span><b>Valet</b>{business.valet.detail}</span>
              <span><b>Pickup</b>{business.pickup}</span>
              <span><b>Entrance</b>{business.entrance}</span>
            </div>

            {!compact ? (
              <div className="establishment-details">
                <p>{business.businessNotes}</p>
                <div>
                  <span><MapPin /> {business.address}</span>
                  <span><Phone /> {business.phone}</span>
                  <span><Clock /> {business.hours}</span>
                  <span><CalendarCheck /> {stop.reservation}</span>
                  <span><Globe /> {business.website}</span>
                  <span><Sparkles /> {business.source}</span>
                </div>
              </div>
            ) : null}
          </article>
        );
        })}
      </div>

      {compact ? (
        <Link className="traffic-more" to="/traffic-alerts">
          Full leave plan <ChevronRight />
        </Link>
      ) : null}
    </div>
  );
}

function Aurora() {
  return (
    <div className="aurora" aria-hidden="true">
      <span className="aurora-band band-one" />
      <span className="aurora-band band-two" />
      <span className="aurora-band band-three" />
    </div>
  );
}

function Header({ title, eyebrow, actions }: { title: string; eyebrow?: string; actions?: ReactNode }) {
  return (
    <header className="top-header">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
      </div>
      <div className="header-actions">{actions}</div>
    </header>
  );
}

function IconButton({ children, label, to, onClick }: { children: ReactNode; label: string; to?: string; onClick?: () => void }) {
  const content = (
    <motion.button whileTap={{ scale: 0.9 }} className="icon-btn" aria-label={label} title={label} onClick={onClick}>
      {children}
    </motion.button>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

function GradientButton({ children, to, wide = false }: { children: ReactNode; to?: string; wide?: boolean }) {
  const button = (
    <motion.button whileTap={{ scale: 0.95 }} className={`gradient-btn ${wide ? "wide" : ""}`}>
      <span>{children}</span>
    </motion.button>
  );
  return to ? <Link to={to}>{button}</Link> : button;
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"create" | "signin">("create");
  const [loading, setLoading] = useState(false);
  const [providerLoading, setProviderLoading] = useState<AuthProviderId | null>(null);
  const [status, setStatus] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: ""
  });

  const updateForm = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: key === "username" ? normalizeUsername(value) : value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      if (mode === "create") {
        const result = await createAccountWithEmail(form);
        setStatus({
          kind: "success",
          text: result.needsEmailConfirmation
            ? "Account created. Check your email to confirm, then keep building your taste profile."
            : "Account created. Your Confetti profile is ready."
        });
        window.setTimeout(() => navigate(result.needsEmailConfirmation ? "/onboarding" : "/home"), 700);
      } else {
        await signInWithEmailOrUsername(form.email, form.password);
        setStatus({ kind: "success", text: "Signed in. Taking you back to Confetti." });
        window.setTimeout(() => navigate("/home"), 500);
      }
    } catch (error) {
      setStatus({ kind: "error", text: error instanceof Error ? error.message : "Something went wrong." });
    } finally {
      setLoading(false);
    }
  };

  const continueWithProvider = async (provider: AuthProviderId) => {
    setProviderLoading(provider);
    setStatus(null);

    try {
      const result = await signInWithSocial(provider);
      if (result.redirecting && isSupabaseConfigured) {
        setStatus({ kind: "success", text: `Redirecting to ${provider === "google" ? "Google" : "Apple"} sign in.` });
      } else {
        setStatus({ kind: "success", text: `${provider === "google" ? "Google" : "Apple"} demo account connected.` });
        window.setTimeout(() => navigate("/home"), 500);
      }
    } catch (error) {
      setStatus({ kind: "error", text: error instanceof Error ? error.message : "Social sign in failed." });
    } finally {
      setProviderLoading(null);
    }
  };

  return (
    <Page className="auth-screen">
      <section className="auth-hero">
        <div className="app-mark">
          <Route />
        </div>
        <div>
          <p className="eyebrow">Confetti account</p>
          <h1>{mode === "create" ? "Create your going-out profile." : "Welcome back."}</h1>
          <p>Save taste, connect socials, and let the AI plan around your real-life rhythm.</p>
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-tabs" role="tablist" aria-label="Account options">
          <button type="button" className={mode === "create" ? "active" : ""} onClick={() => setMode("create")}>
            Create
          </button>
          <button type="button" className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>
            Sign in
          </button>
        </div>

        <div className="social-auth-grid">
          {(["google", "apple"] as AuthProviderId[]).map((provider) => (
            <button
              key={provider}
              type="button"
              className="social-auth-button"
              disabled={loading || providerLoading !== null}
              onClick={() => continueWithProvider(provider)}
            >
              <span className="social-logo">{provider === "google" ? "G" : "A"}</span>
              {providerLoading === provider ? "Connecting..." : provider === "google" ? "Google" : "Apple"}
            </button>
          ))}
        </div>

        <div className="auth-divider">
          <span />
          <b>{mode === "create" ? "or build with email" : "or use password"}</b>
          <span />
        </div>

        <form className="auth-form" onSubmit={submit}>
          {mode === "create" ? (
            <>
              <label className="auth-field">
                <span><UserRound /> Full name</span>
                <input value={form.fullName} onChange={(event) => updateForm("fullName", event.target.value)} placeholder="Tyrone Crossland" autoComplete="name" />
              </label>
              <label className="auth-field">
                <span><ShieldCheck /> Username</span>
                <input value={form.username} onChange={(event) => updateForm("username", event.target.value)} placeholder="tyrone_goes_out" autoComplete="username" />
              </label>
            </>
          ) : null}

          <label className="auth-field">
            <span><Globe /> {mode === "signin" ? "Email or username" : "Email"}</span>
            <input value={form.email} onChange={(event) => updateForm("email", event.target.value)} placeholder={mode === "signin" ? "email or username" : "you@example.com"} autoComplete={mode === "signin" ? "username" : "email"} />
          </label>

          <label className="auth-field">
            <span><Lock /> Password</span>
            <input value={form.password} onChange={(event) => updateForm("password", event.target.value)} placeholder="8 characters minimum" type="password" autoComplete={mode === "create" ? "new-password" : "current-password"} />
          </label>

          {status ? <p className={`auth-status ${status.kind}`}>{status.text}</p> : null}

          <button className="gradient-btn wide" type="submit" disabled={loading || providerLoading !== null}>
            <span>{loading ? "Working..." : mode === "create" ? "Create Account" : "Sign In"}</span>
          </button>
        </form>

        <div className="auth-footer">
          <button className="link-btn" type="button" onClick={() => navigate("/onboarding")}>
            Continue in demo mode
          </button>
          <small>{isSupabaseConfigured ? "Live Supabase auth is active." : "Demo auth is active until Supabase keys are added."}</small>
        </div>
      </section>
    </Page>
  );
}

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Finishing secure sign in...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    completeAuthCallback()
      .then(() => {
        if (!active) return;
        setMessage("Account connected. Opening Loop...");
        window.setTimeout(() => navigate("/home", { replace: true }), 600);
      })
      .catch((authError) => {
        if (!active) return;
        setError(authError instanceof Error ? authError.message : "The auth callback could not be completed.");
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <Page className="auth-screen auth-callback-screen">
      <section className="auth-hero">
        <div className="app-mark">
          {error ? <X /> : <ShieldCheck />}
        </div>
        <div>
          <p className="eyebrow">Secure callback</p>
          <h1>{error ? "Sign in needs attention." : "One second."}</h1>
          <p>{error ?? message}</p>
        </div>
      </section>
      <section className="auth-card">
        {error ? (
          <>
            <p className="auth-status error">{error}</p>
            <Link to="/auth" className="gradient-btn wide">
              <span>Back to Sign In</span>
            </Link>
          </>
        ) : (
          <div className="auth-loading">
            <span />
            <b>Syncing your profile and social links</b>
          </div>
        )}
      </section>
    </Page>
  );
}

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(-1);
  const [budget, setBudget] = useState(180);
  const [selected, setSelected] = useState(new Set(["Japanese", "Mediterranean", "Rooftops", "Live music"]));
  const progress = step < 0 ? 0 : ((step + 1) / 3) * 100;
  const choices = step === 0 ? wizardCuisines : wizardActivities;

  const toggle = (value: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  if (step === -1) {
    return (
      <Page className="splash">
        <motion.div
          initial={{ opacity: 0, y: 26, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 18 }}
          className="splash-lockup"
        >
          <div className="app-mark">
            <Route />
          </div>
          <h1>Confetti</h1>
          <p>Curated city experiences. Every outing is an adventure.</p>
        </motion.div>
        <div className="splash-actions">
          <GradientButton wide>
            <span onClick={() => setStep(0)}>Get Started</span>
          </GradientButton>
          <button className="link-btn" onClick={() => navigate("/home")}>
            Skip to Demo Mode
          </button>
        </div>
      </Page>
    );
  }

  return (
    <Page className="onboarding">
      <div className="progress-track">
        <motion.span animate={{ width: `${progress}%` }} transition={{ type: "spring", stiffness: 170, damping: 22 }} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          variants={panelVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={panelTransition}
          className="wizard-card"
        >
          <p className="eyebrow">Step {step + 1} of 3</p>
          <h1>{step === 0 ? "What tastes like a good night?" : step === 1 ? "What kind of energy are we chasing?" : "Set the spend comfort zone."}</h1>
          {step < 2 ? (
            <div className="chip-grid">
              {choices.map((choice, index) => (
                <motion.button
                  key={choice}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  whileTap={{ scale: 0.92 }}
                  className={`choice-chip ${selected.has(choice) ? "selected" : ""}`}
                  onClick={() => toggle(choice)}
                >
                  {choice}
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="budget-card">
              <div className="budget-value">${budget}</div>
              <input value={budget} min={60} max={420} type="range" onChange={(event) => setBudget(Number(event.target.value))} />
              <div className="range-labels">
                <span>Easy</span>
                <span>Premium</span>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      <div className="wizard-actions">
        <button className="ghost-btn" onClick={() => (step === 0 ? setStep(-1) : setStep(step - 1))}>
          Back
        </button>
        <GradientButton>
          <span onClick={() => (step === 2 ? navigate("/home") : setStep(step + 1))}>{step === 2 ? "Enter Confetti" : "Continue"}</span>
        </GradientButton>
      </div>
    </Page>
  );
}

function Home() {
  const [placeholder, setPlaceholder] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setInterval(() => setPlaceholder((value) => (value + 1) % moods.length), 2400);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <Page className="home-screen">
      <Header
        eyebrow="Friday, 6:42 PM"
        title="Good evening, Tyrone"
        actions={
          <>
            <IconButton label="Notifications" to="/notifications">
              <Bell />
            </IconButton>
            <IconButton label="Profile" to="/profile">
              <UserRound />
            </IconButton>
          </>
        }
      />
      <ScrollReveal className="hero-prompt">
        <Sparkles className="hero-spark" />
        <h2>What experience are you craving?</h2>
        <div className="prompt-box">
          <Search />
          <AnimatePresence mode="wait">
            <motion.span
              key={placeholder}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
            >
              {moods[placeholder][2]}
            </motion.span>
          </AnimatePresence>
          <VoiceButton />
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate("/quick-idea")} className="send-btn" aria-label="Send">
            <Send />
          </motion.button>
        </div>
      </ScrollReveal>
      <ScrollReveal className="mood-strip" delay={0.08}>
        {moods.map(([label, color], index) => (
          <motion.button
            key={label}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => navigate("/quick-idea")}
            className={`mood-chip ${color}`}
          >
            <span>{index === 0 ? "🌹" : index === 1 ? "🌇" : index === 2 ? "🔥" : index === 3 ? "☀️" : "✨"}</span>
            {label}
          </motion.button>
        ))}
      </ScrollReveal>
      <ScrollReveal className="trending-section" delay={0.12}>
        <div className="section-header">
          <h3><TrendingUp /> Trending Near You</h3>
          <Link to="/discover" className="see-all">See all <ChevronRight /></Link>
        </div>
        <div className="trending-scroll">
          {trendingCategories.map((cat, index) => (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.06 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/discover")}
              className={`trending-card ${cat.color}`}
            >
              <span className="trending-emoji">{cat.emoji}</span>
              <b>{cat.label}</b>
              <small>{cat.description}</small>
            </motion.button>
          ))}
        </div>
      </ScrollReveal>
      <ScrollReveal className="viral-spotlight" delay={0.16}>
        <div className="section-header">
          <h3><Flame /> Viral Right Now</h3>
        </div>
        <div className="viral-scroll">
          {venues.filter(v => v.category === "trending-food").map((venue, index) => (
            <motion.article
              key={venue.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(`/venue/${venue.id}`)}
              className="viral-card"
            >
              <img src={venue.image} alt="" />
              <div className="viral-badge">TikTok Viral</div>
              <div className="viral-info">
                <b>{venue.name}</b>
                <span>{venue.type} · {venue.price}</span>
              </div>
            </motion.article>
          ))}
        </div>
      </ScrollReveal>
      <div className="home-grid">
        <ScrollReveal className="glass-card featured-plan quick-gen-hero">
          <div className="card-topline">
            <span><WandSparkles style={{ width: 14, height: 14 }} /> AI Quick Generate</span>
            <span>Personalized</span>
          </div>
          <h3>One tap. Perfect night.</h3>
          <p>We know your taste from your socials, swipes, and past plans. Let AI build your ideal evening instantly.</p>
          <GradientButton to="/quick-generate">
            <Zap style={{ width: 16, height: 16 }} /> Generate My Plan
          </GradientButton>
        </ScrollReveal>
        <ScrollReveal className="glass-card featured-plan family-plan" delay={0.06}>
          <div className="card-topline">
            <span><Baby /> Kid-Friendly</span>
            <span>98% match</span>
          </div>
          <h3>Family adventure day: dig, splash, eat</h3>
          <p>Gem digging at Discovery Zone, splash park at the Yards, birria tacos for the win. Budget: ~$65.</p>
          <GradientButton to="/create-confetti">Plan Family Day</GradientButton>
        </ScrollReveal>
        <ScrollReveal className="mini-actions" delay={0.1}>
          <Link to="/bookings" className="mini-action">
            <CalendarCheck />
            My Bookings
          </Link>
          <Link to="/favorites" className="mini-action">
            <Heart />
            Favorites
          </Link>
          <Link to="/discover" className="mini-action">
            <Flame />
            Discover
          </Link>
        </ScrollReveal>
      </div>
    </Page>
  );
}

function VoiceButton() {
  return (
    <button className="voice-btn" aria-label="Voice input">
      <span />
      <span />
      <Mic />
    </button>
  );
}

function QuickIdea() {
  const navigate = useNavigate();
  const venue = venues[0];
  const [saved, setSaved] = useState(false);
  const [particles, setParticles] = useState(false);

  const save = () => {
    setSaved(true);
    setParticles(true);
    window.setTimeout(() => setParticles(false), 900);
    void (async () => {
      const account = await getCurrentAccount();
      const { trackInteraction } = await import("@/lib/agents/interaction-tracker");
      trackInteraction({
        userId: account?.id ?? "anonymous",
        eventType: saved ? "venue_unfavorite" : "venue_favorite",
        venueId: venue.id,
        metadata: { source: "quick_idea_card" },
      });
    })();
  };

  return (
    <Page className="quick-screen">
      <Header
        eyebrow="AI Venue Flashcard"
        title="Tonight's best pull"
        actions={
          <IconButton label="Refresh">
            <RefreshCw />
          </IconButton>
        }
      />
      <TiltVenueCard venue={venue} onOpen={() => navigate(`/venue/${venue.id}`)} />
      <div className="action-row flash-actions">
        <motion.button whileTap={{ scale: 0.88 }} className="circle-action skip" onClick={() => {
          void (async () => {
            const account = await getCurrentAccount();
            const { trackInteraction } = await import("@/lib/agents/interaction-tracker");
            trackInteraction({
              userId: account?.id ?? "anonymous",
              eventType: "venue_skip",
              venueId: venue.id,
              metadata: { source: "quick_idea_card" },
            });
          })();
        }}>
          <X />
        </motion.button>
        <GradientButton to="/create-confetti">
          <CalendarCheck />
          Build Itinerary
        </GradientButton>
        <motion.button whileTap={{ scale: 0.88 }} onClick={save} className={`circle-action save ${saved ? "active" : ""}`}>
          <Heart fill={saved ? "currentColor" : "none"} />
          {particles ? <ParticleBurst /> : null}
        </motion.button>
      </div>
    </Page>
  );
}

function TiltVenueCard({ venue, onOpen }: { venue: (typeof venues)[number]; onOpen: () => void }) {
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const x = useMotionValue(0);

  return (
    <motion.article
      drag="x"
      dragConstraints={{ left: -110, right: 110 }}
      style={{ rotateX, rotateY, x }}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        rotateY.set(((event.clientX - rect.left) / rect.width - 0.5) * 16);
        rotateX.set(-((event.clientY - rect.top) / rect.height - 0.5) * 12);
      }}
      onPointerLeave={() => {
        rotateX.set(0);
        rotateY.set(0);
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onOpen}
      className="venue-flashcard"
    >
      <img src={venue.image} alt="" />
      <div className="image-fade" />
      <div className="flash-content">
        <div className="match-ring" style={{ "--score": venue.match } as React.CSSProperties}>
          <span>{venue.match}%</span>
          <small>Vibe</small>
        </div>
        <div>
          <p className="eyebrow">{venue.type}</p>
          <h2>{venue.name}</h2>
          <p>
            {venue.area} · {venue.price}
          </p>
        </div>
        <div className="tag-row">
          {venue.tags.slice(0, 3).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </div>
    </motion.article>
  );
}

function CreateConfetti() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [occasion, setOccasion] = useState("date-night");
  const [vibe, setVibe] = useState<string[]>(["Romantic"]);
  const [partySize, setPartySize] = useState(2);
  const [arrivalMode, setArrivalMode] = useState<"rideshare" | "drive">("drive");
  const [evCharge, setEvCharge] = useState(true);
  const [stopCount, setStopCount] = useState(3);
  const [seating, setSeating] = useState("booth");
  const [preOrders, setPreOrders] = useState<Record<string, string[]>>({});
  const [authChecked, setAuthChecked] = useState(false);
  const [authedUserId, setAuthedUserId] = useState<string | null>(null);
  const isDriving = arrivalMode === "drive";

  // Require an account before letting the user build a plan. Without this
  // gate the wizard renders fine but the BoardingPass it generates can't be
  // personalized and can't be saved to a real profile.
  useEffect(() => {
    let cancelled = false;
    getCurrentAccount().then((account) => {
      if (cancelled) return;
      if (!account?.id) {
        navigate("/auth", { replace: true, state: { returnTo: "/create-confetti" } });
        return;
      }
      setAuthedUserId(account.id);
      setAuthChecked(true);
    });
    return () => { cancelled = true; };
  }, [navigate]);

  if (!authChecked) {
    return (
      <Page className="itinerary-screen">
        <Header eyebrow="Create Your Plan" title="Checking your account…" />
      </Page>
    );
  }

  const vibeOptions = ["Romantic", "Celebration", "Foodie", "Adventurous", "Chill", "Upscale", "Trendy", "Cozy"];

  const toggleVibe = (v: string) => {
    setVibe(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  };

  const togglePreOrder = (venue: string, item: string) => {
    setPreOrders(prev => {
      const current = prev[venue] || [];
      return { ...prev, [venue]: current.includes(item) ? current.filter(x => x !== item) : [...current, item] };
    });
  };

  const totalSteps = 4;

  return (
    <Page className="itinerary-screen">
      <Header eyebrow="Create Your Plan" title={step === 0 ? "Set the vibe" : step === 1 ? "How are you rolling?" : step === 2 ? "Pre-order food & drinks" : "Pick your seats"} />
      <div className="progress-track" style={{ marginBottom: 16 }}>
        <motion.span animate={{ width: `${((step + 1) / totalSteps) * 100}%` }} transition={{ type: "spring", stiffness: 170, damping: 22 }} />
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="step0" variants={panelVariants} initial="initial" animate="animate" exit="exit" transition={panelTransition}>
            <ScrollReveal className="glass-card quick-gen-shortcut" style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", cursor: "pointer", background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,214,160,0.1))", border: "1px solid rgba(139,92,246,0.3)" }}>
              <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }} style={{ width: 40, height: 40, borderRadius: 20, background: "linear-gradient(135deg, var(--purple), var(--teal))", display: "grid", placeItems: "center", flexShrink: 0 }}>
                <WandSparkles style={{ width: 20, height: 20, color: "#fff" }} />
              </motion.div>
              <div style={{ flex: 1 }} onClick={() => navigate("/quick-generate")}>
                <b style={{ fontSize: 14, display: "block" }}>Generate for me</b>
                <small style={{ opacity: 0.7 }}>AI builds your perfect plan from your taste profile</small>
              </div>
              <ChevronRight style={{ opacity: 0.5, flexShrink: 0 }} />
            </ScrollReveal>
            <ScrollReveal className="confetti-section">
              <p className="eyebrow" style={{ marginBottom: 8 }}>What's the occasion?</p>
              <div className="chip-grid">
                {occasions.map((occ) => (
                  <motion.button whileTap={{ scale: 0.92 }} key={occ.id} className={`choice-chip ${occasion === occ.id ? "selected" : ""}`} onClick={() => setOccasion(occ.id)}>
                    {occ.emoji} {occ.label}
                  </motion.button>
                ))}
              </div>
            </ScrollReveal>
            <ScrollReveal className="confetti-section" delay={0.06}>
              <p className="eyebrow" style={{ marginBottom: 8 }}>What's the vibe?</p>
              <div className="chip-grid">
                {vibeOptions.map((v) => (
                  <motion.button whileTap={{ scale: 0.92 }} key={v} className={`choice-chip ${vibe.includes(v) ? "selected" : ""}`} onClick={() => toggleVibe(v)}>
                    {v}
                  </motion.button>
                ))}
              </div>
            </ScrollReveal>
            <ScrollReveal className="confetti-section" delay={0.1}>
              <p className="eyebrow" style={{ marginBottom: 8 }}>Party size</p>
              <div className="stop-selector">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <motion.button whileTap={{ scale: 0.92 }} key={n} className={partySize === n ? "active" : ""} onClick={() => setPartySize(n)}>
                    <Users style={{ width: 14, height: 14 }} /> {n}
                  </motion.button>
                ))}
              </div>
            </ScrollReveal>
            <ScrollReveal className="confetti-section" delay={0.14}>
              <p className="eyebrow" style={{ marginBottom: 8 }}>How many stops?</p>
              <div className="stop-selector">
                {[2, 3, 4].map((n) => (
                  <motion.button whileTap={{ scale: 0.92 }} key={n} className={stopCount === n ? "active" : ""} onClick={() => setStopCount(n)}>
                    {n} stops
                  </motion.button>
                ))}
              </div>
            </ScrollReveal>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="step1" variants={panelVariants} initial="initial" animate="animate" exit="exit" transition={panelTransition}>
            <ScrollReveal className="confetti-section">
              <p className="eyebrow" style={{ marginBottom: 8 }}>Arrival mode</p>
              <div className="arrival-mode">
                <button className={!isDriving ? "active" : ""} onClick={() => setArrivalMode("rideshare")}>
                  <Navigation /> Rideshare
                </button>
                <button className={isDriving ? "active" : ""} onClick={() => setArrivalMode("drive")}>
                  <Car /> Driving
                </button>
              </div>
            </ScrollReveal>
            {isDriving && (
              <ScrollReveal className="confetti-section" delay={0.06}>
                <motion.button whileTap={{ scale: 0.96 }} className={`glass-card ev-toggle ${evCharge ? "ev-active" : ""}`} onClick={() => setEvCharge(!evCharge)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", width: "100%", textAlign: "left", background: evCharge ? "rgba(6,214,160,0.12)" : undefined, border: evCharge ? "1px solid rgba(6,214,160,0.4)" : undefined }}>
                  <BatteryCharging style={{ color: evCharge ? "var(--teal)" : "inherit", flexShrink: 0 }} />
                  <div>
                    <b style={{ display: "block", fontSize: 14 }}>Weave in EV charging</b>
                    <small style={{ opacity: 0.7 }}>We'll find chargers near your stops so your car charges while you enjoy</small>
                  </div>
                  <div style={{ marginLeft: "auto", width: 40, height: 22, borderRadius: 11, background: evCharge ? "var(--teal)" : "rgba(255,255,255,0.15)", position: "relative", flexShrink: 0 }}>
                    <motion.div animate={{ x: evCharge ? 18 : 0 }} style={{ width: 18, height: 18, borderRadius: 9, background: "#fff", position: "absolute", top: 2, left: 2 }} />
                  </div>
                </motion.button>
              </ScrollReveal>
            )}
            <ScrollReveal className="arrival-summary" delay={0.08}>
              {isDriving ? (
                <>
                  <b>Parking-aware route{evCharge ? " + EV charging" : ""}</b>
                  <span>{evCharge ? "Charger at Georgetown stop · $30 est. parking · live traffic watch on" : "$30 estimated parking · traffic-adjusted leave times included"}</span>
                </>
              ) : (
                <>
                  <b>Rideshare-ready plan</b>
                  <span>Shareable route, pickup notes, traffic alerts, and leave-by timing for Uber</span>
                </>
              )}
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <TrafficAlertsPanel compact />
            </ScrollReveal>
            <ScrollReveal delay={0.12}>
              <ArrivalIntelligencePanel compact />
            </ScrollReveal>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" variants={panelVariants} initial="initial" animate="animate" exit="exit" transition={panelTransition}>
            <ScrollReveal className="confetti-section">
              <p className="eyebrow" style={{ marginBottom: 4 }}>Pre-order food & drinks ahead</p>
              <small style={{ opacity: 0.6, display: "block", marginBottom: 14 }}>Your order will be ready when you arrive — skip the wait</small>
            </ScrollReveal>
            {confettiStops.slice(0, stopCount).map((stop, si) => {
              const menuItems = preOrderMenus[stop.name] || [];
              if (menuItems.length === 0) return null;
              const selected = preOrders[stop.name] || [];
              return (
                <ScrollReveal key={stop.name} className="glass-card" delay={si * 0.08} >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 13, background: "linear-gradient(135deg, var(--coral), var(--pink))", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700 }}>{si + 1}</div>
                    <div>
                      <b style={{ fontSize: 14 }}>{stop.name}</b>
                      <small style={{ display: "block", opacity: 0.6, fontSize: 12 }}>{stop.detail} · {stop.time}</small>
                    </div>
                  </div>
                  <div className="menu-scroll" style={{ gap: 8 }}>
                    {menuItems.map((mi) => (
                      <motion.button whileTap={{ scale: 0.94 }} key={mi.item} className={`menu-card ${selected.includes(mi.item) ? "selected-menu" : ""}`} onClick={() => togglePreOrder(stop.name, mi.item)} style={{ minWidth: 140, textAlign: "left", border: selected.includes(mi.item) ? "1px solid var(--teal)" : "1px solid rgba(255,255,255,0.08)", background: selected.includes(mi.item) ? "rgba(6,214,160,0.1)" : undefined }}>
                        <b style={{ fontSize: 13 }}>{mi.item}</b>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                          <small style={{ opacity: 0.6 }}>${mi.price}</small>
                          <small style={{ fontSize: 11 }}>{mi.tag}</small>
                        </div>
                        {selected.includes(mi.item) && <Check style={{ position: "absolute", top: 6, right: 6, width: 14, height: 14, color: "var(--teal)" }} />}
                      </motion.button>
                    ))}
                  </div>
                </ScrollReveal>
              );
            })}
            {Object.values(preOrders).flat().length > 0 && (
              <ScrollReveal className="arrival-summary" delay={0.1}>
                <b>Pre-order total: ${Object.entries(preOrders).reduce((sum, [venue, items]) => {
                  const menu = preOrderMenus[venue] || [];
                  return sum + items.reduce((s, item) => s + (menu.find(m => m.item === item)?.price || 0), 0);
                }, 0)}</b>
                <span>{Object.values(preOrders).flat().length} items across {Object.keys(preOrders).filter(k => preOrders[k].length > 0).length} stops</span>
              </ScrollReveal>
            )}
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" variants={panelVariants} initial="initial" animate="animate" exit="exit" transition={panelTransition}>
            <ScrollReveal className="confetti-section">
              <p className="eyebrow" style={{ marginBottom: 4 }}>Desired seating area</p>
              <small style={{ opacity: 0.6, display: "block", marginBottom: 14 }}>We'll request your preference at each restaurant</small>
              <div className="chip-grid">
                {seatingOptions.map((opt) => (
                  <motion.button whileTap={{ scale: 0.92 }} key={opt.id} className={`choice-chip ${seating === opt.id ? "selected" : ""}`} onClick={() => setSeating(opt.id)} style={{ fontSize: 14 }}>
                    {opt.emoji} {opt.label}
                  </motion.button>
                ))}
              </div>
            </ScrollReveal>
            <ScrollReveal className="glass-card" delay={0.08} >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <Sofa style={{ color: "var(--gold)", flexShrink: 0 }} />
                <div>
                  <b style={{ fontSize: 14, display: "block" }}>Seating request: {seatingOptions.find(s => s.id === seating)?.label}</b>
                  <small style={{ opacity: 0.6 }}>Applied to all dining stops · restaurants will do their best to accommodate</small>
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal className="glass-card" delay={0.14} >
              <h3 style={{ fontSize: 15, marginBottom: 10 }}>Your Plan Summary</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
                <div style={{ opacity: 0.7 }}>Occasion</div><div><b>{occasions.find(o => o.id === occasion)?.emoji} {occasions.find(o => o.id === occasion)?.label}</b></div>
                <div style={{ opacity: 0.7 }}>Vibe</div><div><b>{vibe.join(", ")}</b></div>
                <div style={{ opacity: 0.7 }}>Party</div><div><b>{partySize} {partySize === 1 ? "person" : "people"}</b></div>
                <div style={{ opacity: 0.7 }}>Stops</div><div><b>{stopCount} stops</b></div>
                <div style={{ opacity: 0.7 }}>Arrival</div><div><b>{isDriving ? "Driving" : "Rideshare"}{isDriving && evCharge ? " + EV" : ""}</b></div>
                <div style={{ opacity: 0.7 }}>Seating</div><div><b>{seatingOptions.find(s => s.id === seating)?.emoji} {seatingOptions.find(s => s.id === seating)?.label}</b></div>
                <div style={{ opacity: 0.7 }}>Pre-orders</div><div><b>{Object.values(preOrders).flat().length} items</b></div>
              </div>
            </ScrollReveal>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="wizard-actions" style={{ marginTop: 16 }}>
        <button className="ghost-btn" onClick={() => step > 0 ? setStep(step - 1) : navigate("/home")}>
          Back
        </button>
        <GradientButton>
          <span onClick={() => {
            if (step < totalSteps - 1) {
              setStep(step + 1);
            } else {
              navigate("/boarding-pass", {
                state: {
                  userId: authedUserId,
                  occasion,
                  vibe,
                  partySize,
                  arrivalMode,
                  evCharge,
                  stopCount,
                  seating,
                  preOrders,
                  builtAt: new Date().toISOString(),
                },
              });
            }
          }}>
            {step === totalSteps - 1 ? "Generate Boarding Pass" : "Continue"}
          </span>
        </GradientButton>
      </div>
    </Page>
  );
}

function BoardingPass() {
  const navigate = useNavigate();
  const location = useLocation();

  type WizardState = {
    userId?: string | null;
    occasion?: string;
    vibe?: string[];
    partySize?: number;
    arrivalMode?: "rideshare" | "drive";
    evCharge?: boolean;
    stopCount?: number;
    seating?: string;
    preOrders?: Record<string, string[]>;
    builtAt?: string;
  };
  const wizard = (location.state ?? null) as WizardState | null;

  // Read the wizard inputs the user just filled in. Falls back to demo
  // defaults only if the user landed here without going through Create.
  const [arrivalMode] = useState<"rideshare" | "drive">(wizard?.arrivalMode ?? "drive");
  const isDriving = arrivalMode === "drive";

  const occasionId = wizard?.occasion ?? "date-night";
  const activeOccasion = occasions.find(o => o.id === occasionId) ?? occasions[0];

  // Map the user's primary vibe / occasion to a theme. Previously this was
  // hardcoded to "nightlife" so every plan rendered the same color.
  const vibePrimary = wizard?.vibe?.[0]?.toLowerCase();
  const vibeTheme =
    occasionId === "date-night" ? "date-night"
    : occasionId === "family-night" ? "family"
    : occasionId === "solo" ? "solo"
    : occasionId === "celebration" || occasionId === "birthday" ? "celebration"
    : vibePrimary?.includes("romantic") ? "date-night"
    : vibePrimary?.includes("upscale") || vibePrimary?.includes("trendy") ? "nightlife"
    : vibePrimary?.includes("chill") || vibePrimary?.includes("cozy") ? "solo"
    : "nightlife";

  // Vary the stops on each build using a hash of (user + occasion + day).
  // Same user building the same occasion on the same day gets a stable
  // result; building again tomorrow (or with a different vibe) varies.
  const seedSource = [
    wizard?.userId ?? "anonymous",
    occasionId,
    (wizard?.vibe ?? []).join(","),
    wizard?.builtAt?.slice(0, 13) ?? new Date().toISOString().slice(0, 13), // hour-granularity
  ].join("|");
  let seed = 0;
  for (let i = 0; i < seedSource.length; i++) seed = (seed * 31 + seedSource.charCodeAt(i)) | 0;
  const rotate = ((seed % confettiStops.length) + confettiStops.length) % confettiStops.length;
  const orderedStops = [...confettiStops.slice(rotate), ...confettiStops.slice(0, rotate)];
  const departureStop = orderedStops[0];
  const destinationStop = orderedStops[orderedStops.length - 1];

  // Confetti code now reflects occasion + actual date instead of the
  // hardcoded "CNFT-DATE-0510" everyone was seeing.
  const builtDate = wizard?.builtAt ? new Date(wizard.builtAt) : new Date();
  const occasionTag = occasionId.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, "X");
  const datePart = `${String(builtDate.getMonth() + 1).padStart(2, "0")}${String(builtDate.getDate()).padStart(2, "0")}`;
  const confettiCode = `CNFT-${occasionTag}-${datePart}`;

  const departureCode = hoodCodes[departureStop.area] || "???";
  const destinationCode = hoodCodes[destinationStop.area] || "???";

  const themeColors: Record<string, { from: string; to: string; accent: string }> = {
    "date-night": { from: "#ff6b6b", to: "#ee5a9d", accent: "var(--gold)" },
    "nightlife": { from: "#8b5cf6", to: "#4cc9f0", accent: "var(--cyan)" },
    "family": { from: "#ff8a5b", to: "#ffd166", accent: "var(--orange)" },
    "solo": { from: "#06d6a0", to: "#4cc9f0", accent: "var(--teal)" },
    "celebration": { from: "#ffd166", to: "#ff6b6b", accent: "var(--gold)" }
  };
  const theme = themeColors[vibeTheme] || themeColors["date-night"];

  return (
    <Page className="itinerary-screen">
      <Header
        eyebrow="Your plan is ready"
        title="Boarding Pass"
        actions={
          <div className="header-actions">
            <IconButton label="Traffic" to="/traffic-alerts"><Car /></IconButton>
            <IconButton label="Share"><Share2 /></IconButton>
          </div>
        }
      />

      <ScrollReveal>
        <motion.div
          className="glass-card"
          style={{
            background: `linear-gradient(145deg, ${theme.from}18, ${theme.to}10)`,
            border: `1px solid ${theme.from}40`,
            borderRadius: 20,
            overflow: "hidden",
            position: "relative"
          }}
        >
          {/* Header band */}
          <div style={{
            background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
            padding: "14px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Route style={{ width: 20, height: 20 }} />
              <b style={{ fontSize: 16, letterSpacing: 1 }}>CONFETTI</b>
            </div>
            <span style={{ fontSize: 12, opacity: 0.9, fontFamily: "monospace", letterSpacing: 2 }}>{confettiCode}</span>
          </div>

          {/* Route summary */}
          <div style={{ padding: "18px 18px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ textAlign: "center" }}>
              <b style={{ fontSize: 28, fontFamily: "monospace", letterSpacing: 2 }}>{departureCode}</b>
              <p style={{ fontSize: 11, opacity: 0.6, margin: 0 }}>{departureStop.area}</p>
              <small style={{ fontSize: 10, opacity: 0.5 }}>{departureStop.time}</small>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "0 12px" }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: theme.from }} />
              <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${theme.from}, ${theme.to})`, opacity: 0.5 }} />
              {confettiStops.length > 2 && <span style={{ fontSize: 10, opacity: 0.5, padding: "0 4px" }}>{confettiStops.length - 2} layover{confettiStops.length - 2 > 1 ? "s" : ""}</span>}
              <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${theme.from}, ${theme.to})`, opacity: 0.5 }} />
              <PlaneTakeoff style={{ width: 16, height: 16, color: theme.to }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <b style={{ fontSize: 28, fontFamily: "monospace", letterSpacing: 2 }}>{destinationCode}</b>
              <p style={{ fontSize: 11, opacity: 0.6, margin: 0 }}>{destinationStop.area}</p>
              <small style={{ fontSize: 10, opacity: 0.5 }}>{destinationStop.time}</small>
            </div>
          </div>

          {/* Vibe tags */}
          <div style={{ padding: "12px 18px 0", display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: `${theme.from}20`, border: `1px solid ${theme.from}30` }}>{activeOccasion.emoji} {activeOccasion.label}</span>
            <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: `${theme.from}20`, border: `1px solid ${theme.from}30` }}>Romantic</span>
            <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: `${theme.from}20`, border: `1px solid ${theme.from}30` }}>Upscale</span>
          </div>

          <div style={{ padding: "14px 18px 0" }}>
            <TrafficAlertsPanel compact />
            <ArrivalIntelligencePanel compact />
          </div>

          {/* Dashed separator */}
          <div style={{ margin: "16px 0", borderTop: "2px dashed rgba(255,255,255,0.12)", position: "relative" }}>
            <div style={{ position: "absolute", left: -12, top: -12, width: 24, height: 24, borderRadius: 12, background: "var(--plum)" }} />
            <div style={{ position: "absolute", right: -12, top: -12, width: 24, height: 24, borderRadius: 12, background: "var(--plum)" }} />
          </div>

          {/* Stops detail */}
          <div style={{ padding: "0 18px" }}>
            {confettiStops.map((stop, index) => (
              <motion.div key={stop.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} style={{ display: "flex", gap: 12, marginBottom: 16, position: "relative" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 30, flexShrink: 0 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 14,
                    background: stop.role === "departure" ? `linear-gradient(135deg, ${theme.from}, ${theme.to})` : stop.role === "destination" ? theme.accent : "rgba(255,255,255,0.1)",
                    display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700
                  }}>
                    {stop.role === "departure" ? "D" : stop.role === "destination" ? "A" : "L"}
                  </div>
                  {index < confettiStops.length - 1 && <div style={{ flex: 1, width: 1, background: "rgba(255,255,255,0.1)", marginTop: 4 }} />}
                </div>
                <div style={{ flex: 1, paddingBottom: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <b style={{ fontSize: 14 }}>{stop.name}</b>
                    <span style={{ fontFamily: "monospace", fontSize: 12, opacity: 0.5 }}>{hoodCodes[stop.area]}</span>
                  </div>
                  <small style={{ display: "block", opacity: 0.6, fontSize: 12 }}>{stop.detail} · {stop.time}</small>
                  <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: "rgba(255,255,255,0.06)" }}>
                      {isDriving ? `🅿️ ${stop.parking.split("·")[0]}` : `📍 ${stop.pickup}`}
                    </span>
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: "rgba(255,255,255,0.06)" }}>
                      👔 {stop.dress}
                    </span>
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: "rgba(255,255,255,0.06)" }}>
                      ✨ {stop.match}% vibe
                    </span>
                  </div>
                  {stop.evCharger && (
                    <div style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: "rgba(6,214,160,0.1)", border: "1px solid rgba(6,214,160,0.25)", display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4, color: "var(--teal)" }}>
                      <BatteryCharging style={{ width: 12, height: 12 }} /> {stop.evCharger}
                    </div>
                  )}
                  {index < confettiStops.length - 1 && (
                    <div style={{ fontSize: 10, opacity: 0.4, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                      {isDriving ? <Car style={{ width: 11, height: 11 }} /> : <Navigation style={{ width: 11, height: 11 }} />}
                      {isDriving ? stop.driveTravel : stop.rideTravel} to next stop
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pre-orders section */}
          <div style={{ padding: "0 18px", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Utensils style={{ width: 14, height: 14, color: theme.accent }} />
              <b style={{ fontSize: 13 }}>Pre-ordered</b>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 8, background: "rgba(255,255,255,0.06)" }}>🍷 Coastal Wine Flight</span>
              <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 8, background: "rgba(255,255,255,0.06)" }}>🍶 Craft Sake Flight</span>
              <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 8, background: "rgba(255,255,255,0.06)" }}>🥃 Vinyl Old Fashioned</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
              <Sofa style={{ width: 14, height: 14, color: theme.accent }} />
              <span style={{ fontSize: 12, opacity: 0.7 }}>Seating: 🛋️ Booth requested at all stops</span>
            </div>
          </div>

          {/* Bottom stats */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "12px 18px", display: "flex", justifyContent: "space-between", fontSize: 11, opacity: 0.6 }}>
            <span>{confettiStops.length} stops</span>
            <span>{new Set(confettiStops.map(s => s.area)).size} hoods</span>
            <span>~4 hrs</span>
            {isDriving && <span style={{ color: "var(--teal)" }}>⚡ EV charged</span>}
          </div>

          {/* Confetti reward */}
          <div style={{
            background: `linear-gradient(135deg, ${theme.from}15, ${theme.to}10)`,
            padding: "10px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <PartyPopper style={{ width: 16, height: 16, color: "var(--gold)" }} />
              <span style={{ fontSize: 12 }}>Complete this plan to earn <b style={{ color: "var(--gold)" }}>+120 Confetti</b></span>
            </div>
          </div>

          {/* Barcode */}
          <div style={{ padding: "12px 18px 16px", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 2, marginBottom: 6 }}>
              {Array.from({ length: 32 }).map((_, i) => (
                <div key={i} style={{ width: i % 3 === 0 ? 3 : 2, height: 36, background: `rgba(255,255,255,${0.15 + Math.random() * 0.2})`, borderRadius: 1 }} />
              ))}
            </div>
            <span style={{ fontFamily: "monospace", fontSize: 10, opacity: 0.4, letterSpacing: 3 }}>{confettiCode}</span>
          </div>
        </motion.div>
      </ScrollReveal>

      {/* Add to Wallet — quick access */}
      <ScrollReveal>
        <motion.div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 8
          }}
        >
          <motion.button
            whileTap={{ scale: 0.96 }}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "11px 0",
              borderRadius: 14,
              border: "none",
              background: "#000",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Apple Wallet
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "11px 0",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google Wallet
          </motion.button>
        </motion.div>
      </ScrollReveal>

      <motion.div initial={{ y: 80 }} animate={{ y: 0 }} className="floating-bookbar">
        <div>
          <b>$370</b>
          <span>incl. parking + pre-orders</span>
        </div>
        <GradientButton to="/confirmation">Confirm Plan</GradientButton>
      </motion.div>
    </Page>
  );
}

/* ── Active Confetti — GPS Check-In ─────────────────────────────── */

type CheckInStatus = "upcoming" | "en-route" | "nearby" | "arrived" | "checked-in";

interface StopCheckin {
  status: CheckInStatus;
  arrivedAt?: string;
  notifiedBusiness: boolean;
}

function ActiveConfetti() {
  const navigate = useNavigate();
  const routeIntelligence = useRouteIntelligence();
  const [checkins, setCheckins] = useState<StopCheckin[]>(
    confettiStops.map((_, i) => ({
      status: i === 0 ? "en-route" : "upcoming",
      notifiedBusiness: false
    }))
  );
  const [activeStopIndex, setActiveStopIndex] = useState(0);
  const [gpsActive, setGpsActive] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyingStop, setNotifyingStop] = useState(0);
  const [expandedStop, setExpandedStop] = useState<number | null>(0);
  const [pulseAnim, setPulseAnim] = useState(true);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  const vibeTheme = "nightlife";
  const themeColors: Record<string, { from: string; to: string; accent: string }> = {
    "date-night": { from: "#ff6b6b", to: "#ee5a9d", accent: "var(--gold)" },
    "nightlife": { from: "#8b5cf6", to: "#4cc9f0", accent: "var(--cyan)" },
    "family": { from: "#ff8a5b", to: "#ffd166", accent: "var(--orange)" },
    "solo": { from: "#06d6a0", to: "#4cc9f0", accent: "var(--teal)" },
    "celebration": { from: "#ffd166", to: "#ff6b6b", accent: "var(--gold)" }
  };
  const theme = themeColors[vibeTheme] || themeColors["date-night"];
  const confettiCode = "CNFT-DATE-0510";

  // Simulate GPS tracking with elapsed timer
  useEffect(() => {
    if (!gpsActive) return;
    const interval = setInterval(() => setElapsedMinutes(m => m + 1), 60000);
    return () => clearInterval(interval);
  }, [gpsActive]);

  const startGps = useCallback(() => {
    setGpsActive(true);
    // Simulate "nearby" after brief delay for first stop
    setTimeout(() => {
      setCheckins(prev => {
        const copy = [...prev];
        if (copy[0].status === "en-route") copy[0] = { ...copy[0], status: "nearby" };
        return copy;
      });
    }, 2000);
  }, []);

  const handleImHere = (stopIndex: number) => {
    setCheckins(prev => {
      const copy = [...prev];
      copy[stopIndex] = {
        ...copy[stopIndex],
        status: "arrived",
        arrivedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      return copy;
    });
    // Show notify business modal
    setNotifyingStop(stopIndex);
    setShowNotifyModal(true);
  };

  const notifyBusiness = (stopIndex: number) => {
    setCheckins(prev => {
      const copy = [...prev];
      copy[stopIndex] = { ...copy[stopIndex], status: "checked-in", notifiedBusiness: true };
      return copy;
    });
    setShowNotifyModal(false);
    // Advance to next stop after check-in
    if (stopIndex < confettiStops.length - 1) {
      setTimeout(() => {
        setActiveStopIndex(stopIndex + 1);
        setExpandedStop(stopIndex + 1);
        setCheckins(prev => {
          const copy = [...prev];
          copy[stopIndex + 1] = { ...copy[stopIndex + 1], status: "en-route" };
          return copy;
        });
        // Simulate approach to next stop
        setTimeout(() => {
          setCheckins(prev => {
            const copy = [...prev];
            if (copy[stopIndex + 1].status === "en-route") copy[stopIndex + 1] = { ...copy[stopIndex + 1], status: "nearby" };
            return copy;
          });
        }, 3000);
      }, 1500);
    }
  };

  const skipNotify = () => {
    const stopIndex = notifyingStop;
    setCheckins(prev => {
      const copy = [...prev];
      copy[stopIndex] = { ...copy[stopIndex], status: "checked-in", notifiedBusiness: false };
      return copy;
    });
    setShowNotifyModal(false);
    if (stopIndex < confettiStops.length - 1) {
      setTimeout(() => {
        setActiveStopIndex(stopIndex + 1);
        setExpandedStop(stopIndex + 1);
        setCheckins(prev => {
          const copy = [...prev];
          copy[stopIndex + 1] = { ...copy[stopIndex + 1], status: "en-route" };
          return copy;
        });
      }, 1000);
    }
  };

  const allComplete = checkins.every(c => c.status === "checked-in");
  const completedCount = checkins.filter(c => c.status === "checked-in").length;
  const activeAlerts = routeIntelligence.data?.alerts?.length ? routeIntelligence.data.alerts : trafficAlerts;

  const statusConfig: Record<CheckInStatus, { label: string; color: string; bg: string }> = {
    "upcoming": { label: "Upcoming", color: "rgba(255,255,255,0.4)", bg: "rgba(255,255,255,0.06)" },
    "en-route": { label: "En Route", color: "var(--cyan)", bg: "rgba(76,201,240,0.12)" },
    "nearby": { label: "Nearby", color: "var(--gold)", bg: "rgba(255,209,102,0.15)" },
    "arrived": { label: "Arrived", color: "#06d6a0", bg: "rgba(6,214,160,0.15)" },
    "checked-in": { label: "Checked In", color: "#06d6a0", bg: "rgba(6,214,160,0.1)" }
  };

  return (
    <Page className="itinerary-screen">
      <Header
        eyebrow="Plan in progress"
        title="Active Plan"
        actions={
          <div className="header-actions">
            <IconButton label="Traffic" to="/traffic-alerts"><Car /></IconButton>
            <IconButton label="Share"><Share2 /></IconButton>
          </div>
        }
      />

      {/* GPS status bar */}
      <ScrollReveal>
        <motion.div style={{
          background: gpsActive ? "rgba(6,214,160,0.1)" : "rgba(255,255,255,0.05)",
          border: `1px solid ${gpsActive ? "rgba(6,214,160,0.3)" : "rgba(255,255,255,0.1)"}`,
          borderRadius: 16, padding: "12px 16px", marginBottom: 16,
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {gpsActive ? (
              <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                <Radio style={{ width: 20, height: 20, color: "var(--teal)" }} />
              </motion.div>
            ) : (
              <MapPin style={{ width: 20, height: 20, opacity: 0.5 }} />
            )}
            <div>
              <b style={{ fontSize: 13, display: "block" }}>{gpsActive ? "GPS Active — Tracking your plan" : "GPS Tracking Off"}</b>
              <small style={{ fontSize: 11, opacity: 0.6 }}>
                {gpsActive
                  ? `${completedCount}/${confettiStops.length} stops checked in`
                  : "Enable to auto-detect arrivals"}
              </small>
            </div>
          </div>
          {!gpsActive ? (
            <motion.button whileTap={{ scale: 0.95 }} onClick={startGps} style={{
              background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
              border: "none", borderRadius: 20, padding: "8px 16px",
              color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer"
            }}>
              Go Live
            </motion.button>
          ) : (
            <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--teal)" }}>{confettiCode}</span>
          )}
        </motion.div>
      </ScrollReveal>

      <ScrollReveal delay={0.04}>
        <TrafficAlertsPanel compact />
      </ScrollReveal>
      <ScrollReveal delay={0.06}>
        <ArrivalIntelligencePanel compact />
      </ScrollReveal>

      {/* Progress rail */}
      <div style={{ padding: "0 4px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 0, position: "relative" }}>
          {confettiStops.map((stop, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: i < confettiStops.length - 1 ? 1 : "none" }}>
              <motion.div
                animate={{
                  scale: i === activeStopIndex && gpsActive ? [1, 1.15, 1] : 1,
                  boxShadow: checkins[i].status === "checked-in"
                    ? "0 0 12px rgba(6,214,160,0.4)"
                    : checkins[i].status === "nearby"
                    ? "0 0 12px rgba(255,209,102,0.4)"
                    : "none"
                }}
                transition={{ repeat: i === activeStopIndex && gpsActive ? Infinity : 0, duration: 2 }}
                style={{
                  width: 32, height: 32, borderRadius: 16, flexShrink: 0,
                  display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700,
                  background: checkins[i].status === "checked-in"
                    ? "linear-gradient(135deg, #06d6a0, #4cc9f0)"
                    : checkins[i].status === "nearby" || checkins[i].status === "arrived"
                    ? `linear-gradient(135deg, ${theme.from}, ${theme.to})`
                    : i === activeStopIndex
                    ? `linear-gradient(135deg, ${theme.from}80, ${theme.to}80)`
                    : "rgba(255,255,255,0.1)",
                  border: i === activeStopIndex && gpsActive ? `2px solid ${theme.from}` : "2px solid transparent"
                }}
              >
                {checkins[i].status === "checked-in" ? (
                  <Check style={{ width: 16, height: 16 }} />
                ) : (
                  <span>{i + 1}</span>
                )}
              </motion.div>
              {i < confettiStops.length - 1 && (
                <div style={{
                  flex: 1, height: 3, marginLeft: -1, marginRight: -1,
                  background: checkins[i].status === "checked-in"
                    ? "linear-gradient(90deg, #06d6a0, #4cc9f0)"
                    : "rgba(255,255,255,0.08)",
                  borderRadius: 2
                }} />
              )}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          {confettiStops.map((stop, i) => (
            <span key={i} style={{
              fontSize: 9, opacity: i === activeStopIndex ? 1 : 0.5,
              color: checkins[i].status === "checked-in" ? "var(--teal)" : "inherit",
              width: 32, textAlign: "center", fontWeight: i === activeStopIndex ? 700 : 400
            }}>
              {hoodCodes[stop.area]}
            </span>
          ))}
        </div>
      </div>

      {/* Stop cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {confettiStops.map((stop, index) => {
          const ci = checkins[index];
          const sc = statusConfig[ci.status];
          const isExpanded = expandedStop === index;
          const isActive = index === activeStopIndex;
          const routeAlert = index < confettiStops.length - 1
            ? activeAlerts.find((alert) => alert.fromStop === stop.name && alert.toStop === confettiStops[index + 1].name)
            : null;

          return (
            <ScrollReveal key={stop.name}>
              <motion.div
                layout
                onClick={() => setExpandedStop(isExpanded ? null : index)}
                style={{
                  background: isActive ? `linear-gradient(145deg, ${theme.from}12, ${theme.to}08)` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isActive ? `${theme.from}40` : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 16, overflow: "hidden", cursor: "pointer",
                  opacity: ci.status === "checked-in" && !isExpanded ? 0.65 : 1
                }}
              >
                {/* Card header */}
                <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 12,
                    background: sc.bg, display: "grid", placeItems: "center", flexShrink: 0
                  }}>
                    {ci.status === "checked-in" ? (
                      <CircleCheck style={{ width: 20, height: 20, color: sc.color }} />
                    ) : ci.status === "nearby" || ci.status === "arrived" ? (
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                        <MapPin style={{ width: 20, height: 20, color: sc.color }} />
                      </motion.div>
                    ) : ci.status === "en-route" ? (
                      <Navigation style={{ width: 20, height: 20, color: sc.color }} />
                    ) : (
                      <Clock style={{ width: 20, height: 20, color: sc.color }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <b style={{ fontSize: 14 }}>{stop.name}</b>
                      <span style={{
                        fontSize: 10, padding: "2px 8px", borderRadius: 10,
                        background: sc.bg, color: sc.color, fontWeight: 600
                      }}>
                        {sc.label}
                      </span>
                    </div>
                    <small style={{ fontSize: 12, opacity: 0.6 }}>{stop.detail} · {stop.time}</small>
                    {ci.arrivedAt && (
                      <small style={{ display: "block", fontSize: 11, color: "var(--teal)", marginTop: 2 }}>
                        Arrived at {ci.arrivedAt} {ci.notifiedBusiness && "· Business notified"}
                      </small>
                    )}
                  </div>
                  <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                    <ChevronDown style={{ width: 16, height: 16, opacity: 0.4 }} />
                  </motion.div>
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div style={{ padding: "0 16px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        {/* Info row */}
                        <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 10, background: "rgba(255,255,255,0.06)" }}>
                            📍 {stop.area} · {hoodCodes[stop.area]}
                          </span>
                          <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 10, background: "rgba(255,255,255,0.06)" }}>
                            🅿️ {stop.parking.split("·")[0].trim()}
                          </span>
                          <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 10, background: "rgba(255,255,255,0.06)" }}>
                            👔 {stop.dress}
                          </span>
                          <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 10, background: "rgba(255,255,255,0.06)" }}>
                            ✨ {stop.match}% vibe
                          </span>
                        </div>
                        {stop.evCharger && (
                          <div style={{
                            fontSize: 10, padding: "4px 8px", borderRadius: 10,
                            background: "rgba(6,214,160,0.1)", border: "1px solid rgba(6,214,160,0.25)",
                            display: "inline-flex", alignItems: "center", gap: 4, marginTop: 8, color: "var(--teal)"
                          }}>
                            <BatteryCharging style={{ width: 12, height: 12 }} /> {stop.evCharger}
                          </div>
                        )}

                        {/* I'm Here button */}
                        {(ci.status === "nearby" || ci.status === "en-route") && gpsActive && (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => { e.stopPropagation(); handleImHere(index); }}
                            style={{
                              width: "100%", marginTop: 14, padding: "14px 0",
                              background: ci.status === "nearby"
                                ? `linear-gradient(135deg, ${theme.from}, ${theme.to})`
                                : "rgba(255,255,255,0.08)",
                              border: ci.status === "nearby" ? "none" : `1px solid ${theme.from}40`,
                              borderRadius: 14, color: "#fff", fontWeight: 700, fontSize: 14,
                              cursor: "pointer", display: "flex", alignItems: "center",
                              justifyContent: "center", gap: 8
                            }}
                          >
                            <MapPin style={{ width: 18, height: 18 }} />
                            {ci.status === "nearby" ? "I'm Here — Check In" : "I'm Here (override)"}
                          </motion.button>
                        )}

                        {ci.status === "arrived" && (
                          <div style={{
                            width: "100%", marginTop: 14, padding: "12px 0",
                            background: "rgba(6,214,160,0.1)", border: "1px solid rgba(6,214,160,0.2)",
                            borderRadius: 14, textAlign: "center", fontSize: 13, color: "var(--teal)"
                          }}>
                            <Timer style={{ width: 14, height: 14, display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                            Processing check-in…
                          </div>
                        )}

                        {ci.status === "checked-in" && (
                          <div style={{
                            width: "100%", marginTop: 14, padding: "12px 0",
                            background: "rgba(6,214,160,0.1)", borderRadius: 14,
                            textAlign: "center", fontSize: 13, color: "var(--teal)",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                          }}>
                            <CircleCheck style={{ width: 16, height: 16 }} />
                            Checked in{ci.notifiedBusiness ? " · Business notified" : ""}
                          </div>
                        )}

                        {/* Travel to next */}
                        {index < confettiStops.length - 1 && ci.status === "checked-in" && (
                          <div style={{ marginTop: 10, fontSize: 11, opacity: 0.5, display: "flex", alignItems: "center", gap: 4 }}>
                            <Car style={{ width: 12, height: 12 }} />
                            {routeAlert ? `${routeAlert.currentEta} (${routeAlert.delayMinutes > 0 ? `+${routeAlert.delayMinutes} min` : "on time"})` : stop.driveTravel} to {confettiStops[index + 1].name}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </ScrollReveal>
          );
        })}
      </div>

      {/* Completion card */}
      <AnimatePresence>
        {allComplete && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            style={{
              marginTop: 20, padding: 20, textAlign: "center",
              background: `linear-gradient(145deg, ${theme.from}15, ${theme.to}10)`,
              border: `1px solid ${theme.from}30`, borderRadius: 20
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              style={{ fontSize: 48, marginBottom: 8 }}
            >
              🎉
            </motion.div>
            <b style={{ fontSize: 18, display: "block" }}>Plan Complete!</b>
            <p style={{ fontSize: 13, opacity: 0.7, margin: "8px 0 16px" }}>
              All stops checked in. You earned <b style={{ color: "var(--gold)" }}>+120 Confetti!</b>
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/boarding-pass")}
                style={{
                  flex: 1, padding: "12px", background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12,
                  color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer"
                }}
              >
                View Keepsake
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/passport")}
                style={{
                  flex: 1, padding: "12px",
                  background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
                  border: "none", borderRadius: 12,
                  color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer"
                }}
              >
                Claim Confetti
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notify business modal */}
      <AnimatePresence>
        {showNotifyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowNotifyModal(false)}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
              display: "grid", placeItems: "center", zIndex: 100,
              padding: 24
            }}
          >
            <motion.div
              initial={{ scale: 0.85, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 40 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: "var(--plum)", borderRadius: 24, padding: 24,
                maxWidth: 360, width: "100%",
                border: `1px solid ${theme.from}30`
              }}
            >
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
                    display: "grid", placeItems: "center", margin: "0 auto 12px"
                  }}
                >
                  <Bell style={{ width: 28, height: 28 }} />
                </motion.div>
                <b style={{ fontSize: 18, display: "block" }}>You've arrived!</b>
                <p style={{ fontSize: 13, opacity: 0.7, margin: "8px 0 0" }}>
                  Notify <b>{confettiStops[notifyingStop].name}</b> that you're here?
                </p>
              </div>

              <div style={{
                background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 14, marginBottom: 16
              }}>
                <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>This will send your:</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                  <span style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <Check style={{ width: 14, height: 14, color: "var(--teal)" }} /> Reservation name &amp; party size
                  </span>
                  <span style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <Check style={{ width: 14, height: 14, color: "var(--teal)" }} /> Pre-order details
                  </span>
                  <span style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <Check style={{ width: 14, height: 14, color: "var(--teal)" }} /> Seating preference
                  </span>
                  <span style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <Check style={{ width: 14, height: 14, color: "var(--teal)" }} /> ETA: Now
                  </span>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => notifyBusiness(notifyingStop)}
                style={{
                  width: "100%", padding: "14px 0",
                  background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
                  border: "none", borderRadius: 14, color: "#fff",
                  fontWeight: 700, fontSize: 15, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  marginBottom: 10
                }}
              >
                <Bell style={{ width: 18, height: 18 }} />
                Notify {confettiStops[notifyingStop].name}
              </motion.button>

              <button
                onClick={skipNotify}
                style={{
                  width: "100%", padding: "12px 0",
                  background: "transparent", border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 14, color: "rgba(255,255,255,0.6)",
                  fontSize: 13, cursor: "pointer"
                }}
              >
                Skip — just check in
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom CTA when GPS not started */}
      {!gpsActive && (
        <motion.div initial={{ y: 80 }} animate={{ y: 0 }} className="floating-bookbar">
          <div>
            <b>3 stops</b>
            <span>Ready to go live</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={startGps}
            className="btn-gradient"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "12px 24px", borderRadius: 20, border: "none",
              background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
              color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer"
            }}
          >
            <Radio style={{ width: 16, height: 16 }} />
            Start GPS
          </motion.button>
        </motion.div>
      )}
    </Page>
  );
}

function VenueDetail() {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref });
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const venue = venues[0];
  const [arrivalMode, setArrivalMode] = useState<"rideshare" | "drive">("rideshare");
  const isDriving = arrivalMode === "drive";

  return (
    <Page className="detail-screen">
      <div ref={ref} className="detail-scroll">
        <motion.div style={{ y: imageY }} className="detail-hero">
          <img src={venue.image} alt="" />
          <div className="image-fade" />
          <div className="detail-buttons">
            <IconButton label="Back">
              <ArrowLeft onClick={() => navigate(-1)} />
            </IconButton>
            <IconButton label="Share">
              <Share2 />
            </IconButton>
          </div>
          <div className="detail-hero-copy">
            <p className="eyebrow">Venue Intelligence</p>
            <h1>{venue.name}</h1>
          </div>
        </motion.div>
        <div className="detail-sheet">
          <ScrollReveal className="detail-header">
            <div>
              <h2>{venue.name}</h2>
              <p>{venue.type} · {venue.area}</p>
            </div>
            <AnimatedStars value={venue.rating} />
          </ScrollReveal>
          <ScrollReveal className="tag-cloud">
            {venue.tags.concat(["Low wait", "Reservation smart", "Group friendly"]).map((tag, index) => (
              <span key={tag} className={`cloud-${index % 4}`}>
                {tag}
              </span>
            ))}
          </ScrollReveal>
          <ScrollReveal className="arrival-mode detail-arrival">
            <button className={!isDriving ? "active" : ""} onClick={() => setArrivalMode("rideshare")}>
              <Navigation />
              Uber
            </button>
            <button className={isDriving ? "active" : ""} onClick={() => setArrivalMode("drive")}>
              <Car />
              Drive
            </button>
          </ScrollReveal>
          <InfoSection title={isDriving ? "Driving & Parking" : "Rideshare Intel"} icon={isDriving ? <Car /> : <Navigation />}>
            {isDriving ? (
              <>
                <AccordionLine title="Best garage" value="4 min walk · $18 after 6 PM" />
                <AccordionLine title="Street odds" value="Medium before 7 PM, low after" />
              </>
            ) : (
              <>
                <AccordionLine title="Best drop-off" value="South curb by the valet stand" />
                <AccordionLine title="Smart pickup" value="Walk 2 min to avoid surge traffic" />
              </>
            )}
            <div className="map-placeholder">
              {isDriving ? <MapPin /> : <Navigation />}
              {isDriving ? "Smart parking map" : "Share route with Uber"}
            </div>
          </InfoSection>
          <InfoSection title="Menu Highlights" icon={<Utensils />}>
            <div className="menu-scroll">
              {["Yuzu tuna crudo $22", "Miso short rib $36", "Matcha pavlova $14"].map((item, index) => (
                <motion.div whileTap={{ scale: 0.96 }} className="menu-card" key={item}>
                  <b>{item}</b>
                  <span>{index === 0 ? "🔥 spicy" : index === 1 ? "chef pick" : "🌱 light"}</span>
                </motion.div>
              ))}
            </div>
          </InfoSection>
          <InfoSection title="Community Reviews" icon={<ShieldCheck />}>
            <Review name="Maya" tag="🌹 Date Night" text="The upstairs table at golden hour felt like a private event." />
            <Review name="Jules" tag="🔥 Crew Night" text="Fast service, no awkward dead zone between dinner and music." />
          </InfoSection>
        </div>
      </div>
      <div className="sticky-cta">
        <motion.button whileTap={{ scale: 0.9 }} className="heart-cta">
          <Heart />
        </motion.button>
        <GradientButton to="/confirmation" wide>Book Now</GradientButton>
      </div>
    </Page>
  );
}

function InfoSection({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <ScrollReveal className="detail-section">
      <h3>
        {icon}
        {title}
      </h3>
      {children}
    </ScrollReveal>
  );
}

function AccordionLine({ title, value }: { title: string; value: string }) {
  return (
    <motion.div whileTap={{ scale: 0.98 }} className="accordion-line">
      <span>{title}</span>
      <b>{value}</b>
      <ChevronRight />
    </motion.div>
  );
}

function Review({ name, tag, text }: { name: string; tag: string; text: string }) {
  return (
    <div className="review">
      <div className="avatar">{name[0]}</div>
      <div>
        <div className="review-head">
          <b>{name}</b>
          <span>{tag}</span>
        </div>
        <AnimatedStars value={4.8} compact />
        <p>{text}</p>
      </div>
    </div>
  );
}

function AnimatedStars({ value, compact = false }: { value: number; compact?: boolean }) {
  return (
    <div className={`stars ${compact ? "compact" : ""}`} aria-label={`${value} stars`}>
      {[0, 1, 2, 3, 4].map((star) => (
        <motion.span key={star} initial={{ scale: 0, color: "#fff" }} animate={{ scale: 1, color: "#FFD166" }} transition={{ delay: star * 0.08 }}>
          <Star fill="currentColor" />
        </motion.span>
      ))}
      {!compact ? <b>{value}</b> : null}
    </div>
  );
}

function Confirmation() {
  const [walletAdded, setWalletAdded] = useState<"none" | "apple" | "google">("none");
  const [walletLoading, setWalletLoading] = useState(false);

  const handleAddToWallet = async (type: "apple" | "google") => {
    setWalletLoading(true);
    // Simulate wallet pass generation — replace with real Supabase edge function call
    await new Promise(r => setTimeout(r, 1500));
    setWalletAdded(type);
    setWalletLoading(false);
  };

  return (
    <Page className="confirmation-screen">
      <Confetti />
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 150, damping: 16 }} className="success-mark">
        <Check />
      </motion.div>
      <h1>Confetti locked. The night is yours.</h1>
      <p>Your plan is confirmed — routes, reservations, pre-orders, and departure timing are set.</p>
      <ScrollReveal className="glass-card code-card">
        <span>Confetti code</span>
        <b>CNFT-MOM-0510</b>
        <button>
          <Copy />
        </button>
      </ScrollReveal>
      <ScrollReveal className="departure-card">
        <Clock />
        <div>
          <b>Leave by 7:15 PM</b>
          <span>22 min drive · traffic is light green</span>
        </div>
      </ScrollReveal>

      {/* Wallet Pass Section */}
      <ScrollReveal>
        <div style={{
          background: "linear-gradient(145deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 20,
          padding: "16px 18px",
          marginBottom: 16
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Wallet style={{ width: 18, height: 18, color: "var(--gold)" }} />
            <b style={{ fontSize: 14 }}>Save to Wallet</b>
          </div>
          <p style={{ fontSize: 12, opacity: 0.6, margin: "0 0 14px", lineHeight: 1.5 }}>
            Keep your boarding pass on your lock screen. Get live updates as you move through your plan.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            {/* Apple Wallet Button */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => handleAddToWallet("apple")}
              disabled={walletLoading || walletAdded === "apple"}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "12px 0",
                borderRadius: 14,
                border: "none",
                background: walletAdded === "apple"
                  ? "linear-gradient(135deg, rgba(6,214,160,0.2), rgba(6,214,160,0.1))"
                  : "#000",
                color: walletAdded === "apple" ? "var(--teal)" : "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: walletLoading ? "wait" : "pointer",
                opacity: walletLoading && walletAdded !== "apple" ? 0.6 : 1,
                transition: "all 0.3s"
              }}
            >
              {walletAdded === "apple" ? (
                <>
                  <CircleCheck style={{ width: 16, height: 16 }} />
                  Added
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  Add to Wallet
                </>
              )}
            </motion.button>

            {/* Google Wallet Button */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => handleAddToWallet("google")}
              disabled={walletLoading || walletAdded === "google"}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "12px 0",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.15)",
                background: walletAdded === "google"
                  ? "linear-gradient(135deg, rgba(6,214,160,0.2), rgba(6,214,160,0.1))"
                  : "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
                color: walletAdded === "google" ? "var(--teal)" : "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: walletLoading ? "wait" : "pointer",
                opacity: walletLoading && walletAdded !== "google" ? 0.6 : 1,
                transition: "all 0.3s"
              }}
            >
              {walletAdded === "google" ? (
                <>
                  <CircleCheck style={{ width: 16, height: 16 }} />
                  Added
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google Wallet
                </>
              )}
            </motion.button>
          </div>
          {walletAdded !== "none" && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ fontSize: 11, opacity: 0.5, textAlign: "center", marginTop: 10, marginBottom: 0 }}
            >
              Your boarding pass will update live as you check in at each stop
            </motion.p>
          )}
        </div>
      </ScrollReveal>

      <div className="dual-actions">
        <button className="outline-gradient">Add to Calendar</button>
        <GradientButton>Share with Group</GradientButton>
      </div>
      <GradientButton to="/active-confetti" wide>Start Plan — Go Live</GradientButton>
      <Link to="/home" className="countdown-link">
        <span />
        Back to Home
      </Link>
    </Page>
  );
}

function Passport() {
  const [tab, setTab] = useState("Stamps");
  const stamps = ["Viral Eats", "Hidden Gem", "Kids Day", "Outdoor", "Date Night", "Nightlife", "Rooftop", "Street Food"];
  return (
    <Page className="passport-screen">
      <Header eyebrow="Gamification hub" title="Your Passport" actions={<IconButton label="Profile" to="/profile"><UserRound /></IconButton>} />
      <div className="segmented-tabs">
        {["Stamps", "Badges", "Stats"].map((item) => (
          <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </div>
      {tab === "Stamps" ? (
        <motion.div className="stamp-grid" variants={{ animate: { transition: { staggerChildren: 0.08 } } }} initial="initial" animate="animate">
          {stamps.map((stamp, index) => (
            <motion.button variants={{ initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 } }} whileTap={{ scale: 0.92 }} key={stamp} className={`stamp stamp-${index % 4}`}>
              <span>{stamp[0]}</span>
              <b>{stamp}</b>
            </motion.button>
          ))}
        </motion.div>
      ) : tab === "Badges" ? (
        <div className="badge-list">
          {["TikTok Foodie", "Speakeasy Finder", "Family Explorer", "Sunset Chaser", "Night Owl", "Trail Blazer"].map((badge, index) => (
            <ScrollReveal key={badge} delay={index * 0.06} className={`glass-card badge-card ${index >= 4 ? "locked" : ""}`}>
              <div className="badge-emoji">{index >= 4 ? <Lock /> : ["🔥", "🗝️", "👨‍👩‍👧‍👦", "🌅"][index]}</div>
              <div>
                <h3>{badge}</h3>
                <p>{index >= 4 ? "Keep exploring to unlock this badge." : ["Try 5 viral food spots.", "Find 3 hidden bars.", "Complete 3 family adventures.", "Catch 3 sunset experiences."][index]}</p>
                <span className="progress-line"><i style={{ width: `${72 - index * 13}%` }} /></span>
              </div>
            </ScrollReveal>
          ))}
        </div>
      ) : (
        <div className="kpi-grid">
          {[
            ["48", "Experiences"],
            ["31", "Venues"],
            ["126", "Hours explored"],
            ["92", "Avg vibe match"]
          ].map(([value, label], index) => (
            <ScrollReveal key={label} delay={index * 0.06}>
              <Kpi value={Number(value)} label={label} />
            </ScrollReveal>
          ))}
        </div>
      )}
    </Page>
  );
}

function Kpi({ value, label }: { value: number; label: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let frame = 0;
    const total = 38;
    const tick = () => {
      frame += 1;
      setCount(Math.round((value * frame) / total));
      if (frame < total) requestAnimationFrame(tick);
    };
    tick();
  }, [value]);

  return (
    <article className="glass-card kpi-card">
      <div className="kpi-icon">
        <Sparkles />
      </div>
      <b>{count}</b>
      <span>{label}</span>
      <svg viewBox="0 0 120 30" aria-hidden="true">
        <path d="M2 24 C 18 10, 28 14, 42 18 S 70 4, 88 12 S 106 27, 118 8" />
      </svg>
    </article>
  );
}

function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{ from: "user" | "ai"; text: string; venues?: DiscoveredVenue[] }>>([]);
  const [chips, setChips] = useState<string[]>(sectorQuickChips.slice(0, 6));
  const [typing, setTyping] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    const userText = text.trim();
    setInput("");
    setMessages((prev) => [...prev, { from: "user", text: userText }]);
    setTyping(true);

    trackBehaviorLocal({
      eventType: "chat_query",
      metadata: { query: userText },
    });

    try {
      const response: ChatResponse = await sendMessageLocal(userText, {
        discoveredVenues: messages.flatMap((message) => message.venues ?? [])
      });

      setMessages((prev) => [
        ...prev,
        {
          from: "ai",
          text: response.message,
          venues: response.venues,
        },
      ]);

      if (response.suggestedChips?.length) {
        setChips(response.suggestedChips);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { from: "ai", text: "Hmm, I hit a snag. Try asking again — I'm here." },
      ]);
    } finally {
      setTyping(false);
    }
  };

  const handleChipTap = (chip: string) => {
    trackBehaviorLocal({
      eventType: "chip_tap",
      metadata: { chip },
    });
    handleSend(chip);
  };

  return (
    <Page className="chat-screen">
      <Header eyebrow="AI Chat Agent" title="Confetti AI" />
      <div className="quick-actions">
        {chips.map((chip) => (
          <motion.button whileTap={{ scale: 0.94 }} key={chip} onClick={() => handleChipTap(chip)}>
            {chip}
          </motion.button>
        ))}
      </div>
      <ScrollReveal className="agent-sector-panel">
        <div className="agent-sector-header">
          <div>
            <p className="eyebrow">Sector brain</p>
            <h3>{funSectors.length} outing sectors</h3>
          </div>
          <Sparkles />
        </div>
        <div className="agent-sector-stack">
          {funSectors.slice(0, 8).map((sector) => (
            <span key={sector.id}>{sector.shortLabel}</span>
          ))}
        </div>
      </ScrollReveal>
      <div className="chat-log">
        {messages.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="chat-bubble ai">
            <Typewriter text="Hey! I'm Confetti AI — your concierge for dining, nightlife, and every vibe in between. What are we getting into?" />
          </motion.div>
        )}
        {messages.map((message, index) => (
          <Fragment key={index}>
            <motion.div
              initial={{ opacity: 0, x: message.from === "user" ? 40 : -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.06 }}
              className={`chat-bubble ${message.from}`}
            >
              {message.from === "ai" ? <Typewriter text={message.text} /> : message.text}
            </motion.div>
            {message.venues?.map((venue) => (
              <motion.div
                key={venue.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-card"
              >
                {(venue.photos?.[0] ?? venue.photoUrls?.[0]) && <img src={venue.photos?.[0] ?? venue.photoUrls?.[0]} alt="" />}
                <div>
                  <b>{venue.name}</b>
                  <span>
                    {venue.vibeMatch ?? venue.matchScore ? `${venue.vibeMatch ?? venue.matchScore}% vibe` : venue.category}
                    {typeof venue.priceLevel === "number" ? ` · ${"$".repeat(venue.priceLevel)}` : venue.priceLevel ? ` · ${venue.priceLevel}` : ""}
                  </span>
                </div>
                <Link to={`/venue/${venue.id}`}>
                  <ChevronRight />
                </Link>
              </motion.div>
            ))}
          </Fragment>
        ))}
        {typing && <TypingDots />}
        <div ref={chatEndRef} />
      </div>
      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
      >
        <VoiceButton />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for a vibe, budget, neighborhood..."
        />
        <button type="submit" disabled={!input.trim()}>
          <Send />
        </button>
      </form>
    </Page>
  );
}

function Typewriter({ text }: { text: string }) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    setShown("");
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setShown(text.slice(0, index));
      if (index >= text.length) window.clearInterval(timer);
    }, 18);
    return () => window.clearInterval(timer);
  }, [text]);
  return <>{shown}</>;
}

function TypingDots() {
  return (
    <div className="typing-dots">
      <span />
      <span />
      <span />
    </div>
  );
}

function InlineVenueCard() {
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="inline-card">
      <img src={venues[0].image} alt="" />
      <div>
        <b>Luma Rooftop</b>
        <span>94% vibe · 7:15 PM open</span>
      </div>
      <Link to="/venue/luma">
        <ChevronRight />
      </Link>
    </motion.div>
  );
}

function Profile() {
  const [tab, setTab] = useState("Preferences");
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOutAccount();
    navigate("/auth");
  };

  return (
    <Page className="profile-screen">
      <section className="profile-hero">
        <div className="profile-avatar">TC</div>
        <h1>Tyrone Crossland</h1>
        <p>tyrone@example.com</p>
        <span>Premium ✨</span>
      </section>
      <div className="profile-links">
        <Link to="/bookings">Bookings</Link>
        <Link to="/favorites">Favorites</Link>
        <Link to="/notifications">Alerts</Link>
        <Link to="/admin">Admin</Link>
      </div>
      <div className="segmented-tabs">
        {["Preferences", "History", "Settings"].map((item) => (
          <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </div>
      {tab === "Preferences" ? (
        <div className="chip-grid compact">
          {wizardCuisines.concat(wizardActivities.slice(0, 4)).map((item) => (
            <button className="choice-chip selected" key={item}>{item}</button>
          ))}
          <div className="glass-card budget-mini">Budget comfort: $180-$320</div>
        </div>
      ) : tab === "History" ? (
        <BookingList />
      ) : (
        <div className="settings-list">
          <div className="settings-section-label" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.2, opacity: 0.5, padding: "12px 0 6px", fontWeight: 600 }}>Connected Socials</div>
          <small style={{ opacity: 0.6, display: "block", marginBottom: 10, fontSize: 12, padding: "0 4px" }}>Connect your socials so AI can learn your taste and generate personalized plans</small>
          {socialPlatforms.map((platform) => {
            const connected = platform.id === "instagram" || platform.id === "google";
            return (
              <button key={platform.id} style={{ borderLeft: `3px solid ${platform.color}` }}>
                <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{platform.icon}</span>
                {platform.label}
                {connected ? <i style={{ background: "var(--teal)" }} /> : <span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.6 }}>Connect</span>}
              </button>
            );
          })}
          <Link to="/taste-tuner" className="settings-taste-btn" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(6,214,160,0.08))", borderRadius: 12, marginTop: 10, textDecoration: "none", color: "inherit", border: "1px solid rgba(139,92,246,0.25)" }}>
            <SlidersHorizontal style={{ width: 18, height: 18, color: "var(--purple)", flexShrink: 0 }} />
            <div>
              <b style={{ fontSize: 13, display: "block" }}>Tune My Taste</b>
              <small style={{ opacity: 0.6, fontSize: 12 }}>Swipe to teach AI what you love</small>
            </div>
            <ChevronRight style={{ marginLeft: "auto", opacity: 0.4 }} />
          </Link>
          <div className="settings-section-label" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.2, opacity: 0.5, padding: "16px 0 6px", fontWeight: 600 }}>Account</div>
          <Link to="/admin" className="admin-settings-link">
            <span><ShieldCheck /></span>
            Admin Center
            <ChevronRight />
          </Link>
          {["Google connected", "Apple connected", "Notification preferences", "Privacy and data", "Sign out"].map((item, index) => (
            <button key={item} className={index === 4 ? "danger" : ""} onClick={index === 4 ? handleSignOut : undefined}>
              <span>{index < 2 ? <ShieldCheck /> : index === 4 ? <ArrowLeft /> : <SlidersHorizontal />}</span>
              {item}
              {index < 2 ? <i /> : <ChevronRight />}
            </button>
          ))}
          <small>Confetti v0.3.0</small>
        </div>
      )}
    </Page>
  );
}

/* ── Trending Venues Tracker (Admin) ─────────────────────────── */

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return "unknown";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
}

function platformColorMap(platform: string): string {
  const map: Record<string, string> = {
    tiktok: "#010101", instagram: "#E1306C", reddit: "#FF4500",
    youtube: "#FF0000", x: "#1DA1F2", yelp: "#D32323", google_places: "#4285F4"
  };
  return map[platform] || "#888";
}

const TRENDING_CITIES = [
  "Washington, DC", "New York City", "Los Angeles", "Miami", "Chicago",
  "London", "Paris", "Tokyo", "Dubai", "Toronto", "Barcelona", "Berlin",
  "Amsterdam", "Sydney", "Nashville", "Austin", "New Orleans", "Atlanta",
  "Seoul", "Bangkok", "Lisbon", "Cancún", "Ibiza", "Singapore", "Milan",
  "Rio de Janeiro", "Cape Town", "Bali", "San Francisco", "Las Vegas"
];

interface TrendingVenue {
  id: string;
  name: string;
  city: string;
  category: string;
  buzzScore: number;
  mentions: number;
  platforms: string[];
  trend: "rising" | "viral" | "steady" | "new";
  firstSeen: string;
  snippet: string;
  vibeTag: string;
}

const MOCK_TRENDING: TrendingVenue[] = [
  { id: "t1", name: "Superica", city: "Atlanta, GA", category: "Dining", buzzScore: 94, mentions: 1820, platforms: ["TikTok", "Instagram"], trend: "viral", firstSeen: "2 days ago", snippet: "Their queso fundido is blowing up on FoodTok right now", vibeTag: "Tex-Mex Hype" },
  { id: "t2", name: "Death & Co", city: "New York City", category: "Drinks & Nightlife", buzzScore: 89, mentions: 1340, platforms: ["Instagram", "Reddit"], trend: "rising", firstSeen: "5 days ago", snippet: "New seasonal cocktail menu getting massive love on r/cocktails", vibeTag: "Speakeasy Vibes" },
  { id: "t3", name: "Meow Wolf", city: "Las Vegas, NV", category: "Immersive", buzzScore: 97, mentions: 3100, platforms: ["TikTok", "Instagram", "YouTube"], trend: "viral", firstSeen: "1 week ago", snippet: "The new Omega Mart expansion is everywhere on social", vibeTag: "Mind-Bending" },
  { id: "t4", name: "Juliana's Pizza", city: "New York City", category: "Dining", buzzScore: 82, mentions: 920, platforms: ["TikTok", "Reddit"], trend: "rising", firstSeen: "3 days ago", snippet: "Back in the spotlight after a viral 'best pizza in NYC' debate", vibeTag: "Classic NY Slice" },
  { id: "t5", name: "Attaboy", city: "Nashville, TN", category: "Drinks & Nightlife", buzzScore: 78, mentions: 640, platforms: ["Instagram"], trend: "steady", firstSeen: "2 weeks ago", snippet: "Consistently mentioned in 'hidden gems Nashville' posts", vibeTag: "Craft Cocktails" },
  { id: "t6", name: "Ojo de Agua", city: "Cancún, Mexico", category: "Dining", buzzScore: 85, mentions: 1080, platforms: ["TikTok", "Instagram"], trend: "rising", firstSeen: "4 days ago", snippet: "Beachfront brunch content going viral with travel creators", vibeTag: "Tropical Brunch" },
  { id: "t7", name: "Nobu Dubai", city: "Dubai, UAE", category: "Luxury", buzzScore: 91, mentions: 2200, platforms: ["Instagram", "TikTok"], trend: "viral", firstSeen: "1 day ago", snippet: "Influencer dinner collab driving insane engagement numbers", vibeTag: "Luxury Dining" },
  { id: "t8", name: "Bar Cañete", city: "Barcelona, Spain", category: "Dining", buzzScore: 76, mentions: 520, platforms: ["Instagram", "Reddit"], trend: "steady", firstSeen: "3 weeks ago", snippet: "Featured in multiple 'best tapas' roundups this month", vibeTag: "Tapas Culture" },
];

const MOCK_NEW_OPENINGS: TrendingVenue[] = [
  { id: "n1", name: "Rosemary Social Club", city: "Washington, DC", category: "Drinks & Nightlife", buzzScore: 72, mentions: 310, platforms: ["Instagram"], trend: "new", firstSeen: "3 days ago", snippet: "New rooftop bar in Shaw getting early buzz from DC foodies", vibeTag: "Rooftop Scene" },
  { id: "n2", name: "Kōyō Ramen", city: "Austin, TX", category: "Dining", buzzScore: 68, mentions: 240, platforms: ["TikTok", "Instagram"], trend: "new", firstSeen: "1 week ago", snippet: "Japanese-Texan fusion ramen shop just opened on South Congress", vibeTag: "Fusion Eats" },
  { id: "n3", name: "Moonlight Social", city: "Miami, FL", category: "Live Entertainment", buzzScore: 81, mentions: 580, platforms: ["TikTok", "Instagram"], trend: "new", firstSeen: "5 days ago", snippet: "Open-air DJ sets on the water, already packed every weekend", vibeTag: "Waterfront Party" },
  { id: "n4", name: "Sakura Garden", city: "Tokyo, Japan", category: "Immersive", buzzScore: 88, mentions: 1400, platforms: ["Instagram", "YouTube"], trend: "new", firstSeen: "2 days ago", snippet: "Immersive digital art garden in Shibuya — instant tourist hit", vibeTag: "Digital Art" },
  { id: "n5", name: "The Velvet Room", city: "London, England", category: "Drinks & Nightlife", buzzScore: 74, mentions: 390, platforms: ["Instagram"], trend: "new", firstSeen: "6 days ago", snippet: "Members-only jazz cocktail lounge in Soho generating waitlist hype", vibeTag: "Jazz & Cocktails" },
];

const MOCK_PIPELINE = [
  { id: "p1", city: "Washington, DC", lastScan: "2 min ago", newVenues: 3, trending: 8, status: "live" as const },
  { id: "p2", city: "New York City", lastScan: "5 min ago", newVenues: 7, trending: 14, status: "live" as const },
  { id: "p3", city: "Miami, FL", lastScan: "3 min ago", newVenues: 4, trending: 11, status: "live" as const },
  { id: "p4", city: "Los Angeles, CA", lastScan: "8 min ago", newVenues: 5, trending: 9, status: "live" as const },
  { id: "p5", city: "London, England", lastScan: "12 min ago", newVenues: 2, trending: 6, status: "live" as const },
  { id: "p6", city: "Tokyo, Japan", lastScan: "15 min ago", newVenues: 3, trending: 5, status: "live" as const },
  { id: "p7", city: "Dubai, UAE", lastScan: "10 min ago", newVenues: 1, trending: 7, status: "live" as const },
  { id: "p8", city: "Barcelona, Spain", lastScan: "18 min ago", newVenues: 2, trending: 4, status: "paused" as const },
  { id: "p9", city: "Seoul, South Korea", lastScan: "22 min ago", newVenues: 1, trending: 3, status: "live" as const },
  { id: "p10", city: "Nashville, TN", lastScan: "6 min ago", newVenues: 2, trending: 6, status: "live" as const },
];

function TrendingTracker() {
  const [tab, setTab] = useState("Trending Now");
  const [cityFilter, setCityFilter] = useState("All Cities");
  const [scanning, setScanning] = useState(false);

  // Live data states (fall back to mocks when Supabase is unavailable)
  const [trendingVenues, setTrendingVenues] = useState<TrendingVenue[]>(MOCK_TRENDING);
  const [newOpenings, setNewOpenings] = useState<TrendingVenue[]>(MOCK_NEW_OPENINGS);
  const [pipeline, setPipeline] = useState(MOCK_PIPELINE);
  const [mentions, setMentions] = useState<Array<{platform: string; handle: string; content: string; time: string; platformColor: string}>>([]);
  const [platformStats, setPlatformStats] = useState<Array<{name: string; color: string; pct: number; mentions: string}>>([]);
  const [dataSource, setDataSource] = useState<"mock" | "live">("mock");

  // Fetch live data from Supabase
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const fetchData = async () => {
      try {
        // Fetch trending venues (approved + auto_approved, ordered by buzz)
        const { data: trendData } = await supabase
          .from("trending_venues")
          .select("*")
          .in("status", ["approved", "auto_approved"])
          .order("buzz_score", { ascending: false })
          .limit(30);

        if (trendData && trendData.length > 0) {
          const mapped: TrendingVenue[] = trendData.map((v: any) => ({
            id: v.id,
            name: v.name,
            city: v.city,
            category: v.category || "restaurant",
            buzzScore: v.buzz_score || 0,
            mentions: v.mention_count || 0,
            platforms: v.platforms || [],
            trend: v.trend || "steady",
            firstSeen: formatTimeAgo(v.first_seen),
            snippet: v.snippet || "",
            vibeTag: (v.vibe_tags && v.vibe_tags[0]) || v.category || "Trending"
          }));
          setTrendingVenues(mapped);
          setDataSource("live");
        }

        // Fetch new openings (pending venues, ordered by first_seen)
        const { data: newData } = await supabase
          .from("trending_venues")
          .select("*")
          .eq("status", "pending")
          .order("first_seen", { ascending: false })
          .limit(20);

        if (newData && newData.length > 0) {
          const mapped: TrendingVenue[] = newData.map((v: any) => ({
            id: v.id,
            name: v.name,
            city: v.city,
            category: v.category || "restaurant",
            buzzScore: v.buzz_score || 0,
            mentions: v.mention_count || 0,
            platforms: v.platforms || [],
            trend: "new" as const,
            firstSeen: formatTimeAgo(v.first_seen),
            snippet: v.snippet || "",
            vibeTag: (v.vibe_tags && v.vibe_tags[0]) || "New Spot"
          }));
          setNewOpenings(mapped);
        }

        // Fetch recent mentions for Social Buzz tab
        const { data: mentionData } = await supabase
          .from("social_mentions")
          .select("*, trending_venues(name)")
          .order("discovered_at", { ascending: false })
          .limit(10);

        if (mentionData && mentionData.length > 0) {
          const mapped = mentionData.map((m: any) => ({
            platform: m.platform,
            handle: m.creator_handle || "unknown",
            content: m.snippet || `Mention of ${m.trending_venues?.name || "venue"}`,
            time: formatTimeAgo(m.discovered_at),
            platformColor: platformColorMap(m.platform)
          }));
          setMentions(mapped);
        }

        // Aggregate platform stats from mentions
        const { data: platCounts } = await supabase
          .from("social_mentions")
          .select("platform")
          .gte("discovered_at", new Date(Date.now() - 7 * 86400000).toISOString());

        if (platCounts && platCounts.length > 0) {
          const counts: Record<string, number> = {};
          platCounts.forEach((r: any) => { counts[r.platform] = (counts[r.platform] || 0) + 1; });
          const total = platCounts.length;
          const platNames: Record<string, {label: string; color: string}> = {
            reddit: { label: "Reddit", color: "#FF4500" },
            youtube: { label: "YouTube", color: "#FF0000" },
            yelp: { label: "Yelp", color: "#D32323" },
            google_places: { label: "Google", color: "#4285F4" },
            tiktok: { label: "TikTok", color: "#010101" },
            instagram: { label: "Instagram", color: "#E1306C" },
            x: { label: "X / Twitter", color: "#1DA1F2" }
          };
          const stats = Object.entries(counts)
            .sort(([,a], [,b]) => b - a)
            .map(([key, count]) => ({
              name: platNames[key]?.label || key,
              color: platNames[key]?.color || "#888",
              pct: Math.round((count / total) * 100),
              mentions: count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count)
            }));
          setPlatformStats(stats);
        }

        // Fetch scan runs for pipeline tab
        const { data: scanData } = await supabase
          .from("scan_runs")
          .select("city, status, venues_found, mentions_found, started_at")
          .order("started_at", { ascending: false })
          .limit(100);

        if (scanData && scanData.length > 0) {
          const cityMap: Record<string, {lastScan: string; newVenues: number; trending: number; status: "live" | "paused"}> = {};
          scanData.forEach((s: any) => {
            if (!cityMap[s.city]) {
              cityMap[s.city] = {
                lastScan: formatTimeAgo(s.started_at),
                newVenues: s.venues_found || 0,
                trending: s.mentions_found || 0,
                status: s.status === "failed" ? "paused" : "live"
              };
            }
          });
          const pipelineData = Object.entries(cityMap).map(([city, data], i) => ({
            id: `p${i}`,
            city,
            ...data
          }));
          if (pipelineData.length > 0) setPipeline(pipelineData);
        }
      } catch (err) {
        console.warn("TrendingTracker: Supabase fetch failed, using mock data", err);
      }
    };

    fetchData();
    // Refresh every 60 seconds
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, []);

  const totalTrending = trendingVenues.length;
  const totalNew = newOpenings.length;
  const totalMentions = [...trendingVenues, ...newOpenings].reduce((s, v) => s + v.mentions, 0);
  const citiesMonitored = pipeline.filter((p) => p.status === "live").length;

  const filteredTrending = cityFilter === "All Cities"
    ? trendingVenues
    : trendingVenues.filter((v) => v.city.includes(cityFilter));
  const filteredNew = cityFilter === "All Cities"
    ? newOpenings
    : newOpenings.filter((v) => v.city.includes(cityFilter));

  const handleScan = async () => {
    setScanning(true);
    // Scan is triggered by pg_cron on cron-refresh-trending; the admin button
    // just plays the animation and lets the next refresh pick up new rows.
    setTimeout(() => setScanning(false), 3000);
  };

  const handleApprove = async (venueId: string) => {
    if (isSupabaseConfigured) {
      await supabase.from("trending_venues").update({ status: "approved", approved_at: new Date().toISOString() }).eq("id", venueId);
      setNewOpenings((prev) => prev.filter((v) => v.id !== venueId));
      // Refresh trending list
      const approved = newOpenings.find((v) => v.id === venueId);
      if (approved) setTrendingVenues((prev) => [{ ...approved, trend: "rising" as const }, ...prev]);
    }
  };

  const handleDismiss = async (venueId: string) => {
    if (isSupabaseConfigured) {
      await supabase.from("trending_venues").update({ status: "rejected" }).eq("id", venueId);
    }
    setNewOpenings((prev) => prev.filter((v) => v.id !== venueId));
  };

  const trendIcon = (trend: string) => {
    if (trend === "viral") return <Flame />;
    if (trend === "rising") return <TrendingUp />;
    if (trend === "new") return <Sparkles />;
    return <Eye />;
  };

  const platformColor = (p: string) => {
    if (p === "TikTok") return "#010101";
    if (p === "Instagram") return "#E1306C";
    if (p === "Reddit") return "#FF4500";
    if (p === "YouTube") return "#FF0000";
    return "#888";
  };

  return (
    <Page className="admin-screen">
      <Header
        eyebrow="Admin · Social Intelligence"
        title="Trending Tracker"
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <IconButton label="Scan Now" onClick={handleScan}><RefreshCw className={scanning ? "spin-icon" : ""} /></IconButton>
            <IconButton label="Back" to="/admin"><ArrowLeft /></IconButton>
          </div>
        }
      />

      {/* KPI Grid */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi">
          <Flame />
          <b>{totalTrending}</b>
          <span>Trending</span>
        </div>
        <div className="admin-kpi">
          <Sparkles />
          <b>{totalNew}</b>
          <span>New Openings</span>
        </div>
        <div className="admin-kpi">
          <Instagram />
          <b>{(totalMentions / 1000).toFixed(1)}k</b>
          <span>Social Mentions</span>
        </div>
        <div className="admin-kpi">
          <Globe />
          <b>{citiesMonitored}</b>
          <span>Cities Live</span>
        </div>
      </div>

      {/* City Filter */}
      <div style={{ padding: "0 20px 8px", display: "flex", gap: 8, alignItems: "center" }}>
        <MapPin size={14} style={{ opacity: 0.5 }} />
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          style={{
            flex: 1, padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)",
            background: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: "inherit",
            backdropFilter: "blur(8px)"
          }}
        >
          <option>All Cities</option>
          {TRENDING_CITIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div className="segmented-tabs">
        {["Trending Now", "New Openings", "Social Buzz", "Feed Pipeline"].map((item) => (
          <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </div>

      {/* ─── Trending Now Tab ─── */}
      {tab === "Trending Now" ? (
        <div className="admin-list">
          {scanning && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0 }}
              style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, background: "rgba(255,180,0,0.08)", borderRadius: 14, margin: "0 16px 12px" }}
            >
              <RefreshCw size={16} className="spin-icon" style={{ color: "#f5a623" }} />
              <span style={{ fontSize: 13, color: "#f5a623", fontWeight: 600 }}>Scanning social platforms for trending venues…</span>
            </motion.div>
          )}
          {filteredTrending.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, opacity: 0.5 }}>No trending venues in this city yet</div>
          ) : filteredTrending.map((venue, index) => (
            <ScrollReveal key={venue.id} delay={index * 0.05} className="admin-user-card" style={{ position: "relative" }}>
              <div className="admin-avatar" style={{
                background: venue.trend === "viral" ? "linear-gradient(135deg,#ff6b35,#f72585)" :
                  venue.trend === "rising" ? "linear-gradient(135deg,#f5a623,#ff6b35)" :
                  "linear-gradient(135deg,#6c63ff,#3b82f6)"
              }}>
                {trendIcon(venue.trend)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="admin-card-title">
                  <b>{venue.name}</b>
                  <span className={`status-pill ${venue.trend}`}>{venue.trend}</span>
                </div>
                <small style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <MapPin size={11} /> {venue.city} · {venue.category}
                </small>
                <p style={{ fontSize: 12, opacity: 0.7, margin: "4px 0 6px", lineHeight: 1.4 }}>{venue.snippet}</p>
                <div className="admin-meta-row">
                  <span style={{ fontWeight: 600 }}>🔥 {venue.buzzScore}</span>
                  <span>{venue.mentions.toLocaleString()} mentions</span>
                  {venue.platforms.map((p) => (
                    <span key={p} style={{ color: platformColor(p), fontWeight: 500 }}>{p}</span>
                  ))}
                  <span style={{ opacity: 0.5 }}>{venue.firstSeen}</span>
                </div>
                <div style={{ marginTop: 4 }}>
                  <span style={{
                    display: "inline-block", padding: "2px 8px", borderRadius: 6,
                    background: "rgba(108,99,255,0.1)", color: "#6c63ff",
                    fontSize: 11, fontWeight: 600
                  }}>{venue.vibeTag}</span>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

      /* ─── New Openings Tab ─── */
      ) : tab === "New Openings" ? (
        <div className="admin-list">
          {filteredNew.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, opacity: 0.5 }}>No new openings detected in this city</div>
          ) : filteredNew.map((venue, index) => (
            <ScrollReveal key={venue.id} delay={index * 0.05} className="admin-user-card">
              <div className="admin-avatar" style={{ background: "linear-gradient(135deg,#10b981,#6ee7b7)" }}>
                <Sparkles />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="admin-card-title">
                  <b>{venue.name}</b>
                  <span className="status-pill new">NEW</span>
                </div>
                <small style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <MapPin size={11} /> {venue.city} · {venue.category}
                </small>
                <p style={{ fontSize: 12, opacity: 0.7, margin: "4px 0 6px", lineHeight: 1.4 }}>{venue.snippet}</p>
                <div className="admin-meta-row">
                  <span style={{ fontWeight: 600 }}>🔥 {venue.buzzScore}</span>
                  <span>{venue.mentions.toLocaleString()} mentions</span>
                  {venue.platforms.map((p) => (
                    <span key={p} style={{ color: platformColor(p), fontWeight: 500 }}>{p}</span>
                  ))}
                  <span style={{ opacity: 0.5 }}>Opened {venue.firstSeen}</span>
                </div>
                <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
                  <button onClick={() => handleApprove(venue.id)} style={{
                    padding: "4px 12px", borderRadius: 8, border: "none",
                    background: "linear-gradient(135deg,#6c63ff,#f72585)", color: "#fff",
                    fontSize: 11, fontWeight: 600, cursor: "pointer"
                  }}>+ Add to Confetti</button>
                  <button onClick={() => handleDismiss(venue.id)} style={{
                    padding: "4px 12px", borderRadius: 8,
                    border: "1px solid rgba(0,0,0,0.1)", background: "transparent",
                    fontSize: 11, cursor: "pointer"
                  }}>Dismiss</button>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

      /* ─── Social Buzz Tab ─── */
      ) : tab === "Social Buzz" ? (
        <div className="admin-list">
          <ScrollReveal delay={0} style={{ padding: "16px 20px", borderRadius: 14, background: "rgba(108,99,255,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Zap size={16} style={{ color: "#6c63ff" }} />
              <b style={{ fontSize: 14 }}>Platform Breakdown</b>
            </div>
            {(platformStats.length > 0 ? platformStats : [
              { name: "TikTok", color: "#010101", pct: 42, mentions: "5.2k" },
              { name: "Instagram", color: "#E1306C", pct: 31, mentions: "3.8k" },
              { name: "Reddit", color: "#FF4500", pct: 15, mentions: "1.9k" },
              { name: "YouTube", color: "#FF0000", pct: 8, mentions: "980" },
              { name: "X / Twitter", color: "#1DA1F2", pct: 4, mentions: "510" }
            ]).map((platform) => (
              <div key={platform.name} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <span style={{ width: 70, fontSize: 12, fontWeight: 600 }}>{platform.name}</span>
                <div style={{ flex: 1, height: 8, borderRadius: 4, background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${platform.pct}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    style={{ height: "100%", borderRadius: 4, background: platform.color }}
                  />
                </div>
                <span style={{ width: 50, fontSize: 11, textAlign: "right", opacity: 0.6 }}>{platform.mentions}</span>
              </div>
            ))}
          </ScrollReveal>

          <div style={{ padding: "12px 0" }}>
            <div style={{ padding: "0 20px 8px", display: "flex", alignItems: "center", gap: 8 }}>
              <TrendingUp size={14} style={{ color: "#f5a623" }} />
              <b style={{ fontSize: 13 }}>Top Viral Moments (24h)</b>
            </div>
            {(mentions.length > 0 ? mentions : [
              { platform: "TikTok", handle: "@foodie.wanderlust", content: "\"This hidden speakeasy in NYC changed my life\" — 2.1M views", time: "6h ago", platformColor: "#010101" },
              { platform: "Instagram", handle: "@miamieats", content: "Reel: Moonlight Social opening weekend — 840K views", time: "12h ago", platformColor: "#E1306C" },
              { platform: "Reddit", handle: "r/cocktails", content: "\"Death & Co seasonal menu is their best yet\" — 4.2K upvotes", time: "18h ago", platformColor: "#FF4500" },
              { platform: "TikTok", handle: "@travel.with.jas", content: "\"Cancún brunch spot you NEED\" — 1.6M views", time: "20h ago", platformColor: "#010101" },
              { platform: "YouTube", handle: "@BestEverFoodReview", content: "\"Tokyo's craziest new immersive restaurant\" — 890K views", time: "1d ago", platformColor: "#FF0000" },
            ]).map((moment, index) => (
              <ScrollReveal key={index} delay={index * 0.05} className="admin-user-card">
                <div className="admin-avatar" style={{
                  background: moment.platform === "TikTok" ? "#010101" :
                    moment.platform === "Instagram" ? "linear-gradient(135deg,#E1306C,#F77737)" :
                    moment.platform === "Reddit" ? "#FF4500" :
                    moment.platform === "YouTube" ? "#FF0000" : "#1DA1F2",
                  fontSize: 10
                }}>
                  {moment.platform === "TikTok" ? "TT" : moment.platform === "Instagram" ? <Instagram size={16} /> : moment.platform[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="admin-card-title">
                    <b style={{ fontSize: 12 }}>{moment.handle}</b>
                    <span style={{ fontSize: 11, opacity: 0.5 }}>{moment.time}</span>
                  </div>
                  <p style={{ fontSize: 12, opacity: 0.7, margin: "2px 0 0", lineHeight: 1.4 }}>{moment.content}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>

      /* ─── Feed Pipeline Tab ─── */
      ) : (
        <div className="admin-list">
          <ScrollReveal delay={0} style={{ padding: "16px 20px", borderRadius: 14, background: "rgba(16,185,129,0.04)", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Zap size={16} style={{ color: "#10b981" }} />
              <b style={{ fontSize: 14 }}>AI Agent Status</b>
            </div>
            <p style={{ fontSize: 12, opacity: 0.7, margin: "4px 0 8px", lineHeight: 1.5 }}>
              The Confetti Social Intelligence Agent scans TikTok, Instagram, Reddit, YouTube, and X across all monitored cities.
              Trending venues are scored and queued for review. Approved venues are pushed to the Supabase backend automatically.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={{ padding: "4px 10px", borderRadius: 8, background: dataSource === "live" ? "rgba(16,185,129,0.12)" : "rgba(245,166,35,0.12)", color: dataSource === "live" ? "#10b981" : "#f5a623", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: dataSource === "live" ? "#10b981" : "#f5a623" }} /> {dataSource === "live" ? "Agent Online" : "Demo Mode"}
              </span>
              <span style={{ padding: "4px 10px", borderRadius: 8, background: "rgba(0,0,0,0.05)", fontSize: 11 }}>
                {pipeline.length > 0 ? `${pipeline.length} cities monitored` : "Last full scan: 2 min ago"}
              </span>
              <span style={{ padding: "4px 10px", borderRadius: 8, background: "rgba(0,0,0,0.05)", fontSize: 11 }}>
                Scan interval: 6h trends · 24h openings
              </span>
            </div>
          </ScrollReveal>

          {pipeline.map((city, index) => (
            <ScrollReveal key={city.id} delay={index * 0.04} className="admin-user-card">
              <div className="admin-avatar" style={{
                background: city.status === "live"
                  ? "linear-gradient(135deg,#10b981,#6ee7b7)"
                  : "linear-gradient(135deg,#f59e0b,#fbbf24)"
              }}>
                <Globe size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="admin-card-title">
                  <b>{city.city}</b>
                  <span className={`status-pill ${city.status === "live" ? "active" : "review"}`}>
                    {city.status === "live" ? "● Live" : "⏸ Paused"}
                  </span>
                </div>
                <div className="admin-meta-row">
                  <span><Clock size={10} /> {city.lastScan}</span>
                  <span><Sparkles size={10} /> {city.newVenues} new</span>
                  <span><Flame size={10} /> {city.trending} trending</span>
                </div>
              </div>
              <button className="admin-more" aria-label={`Configure ${city.city}`}>
                <SlidersHorizontal />
              </button>
            </ScrollReveal>
          ))}
        </div>
      )}
    </Page>
  );
}

function AdminCenter() {
  const [tab, setTab] = useState("Users");
  const activeUsers = adminUsers.filter((user) => user.status === "Active").length;
  const reviewUsers = adminUsers.filter((user) => user.status === "Review").length;
  const warnings = adminActivityLog.filter((item) => item.severity === "Warning").length;
  const walletStats = getPassStats();

  return (
    <Page className="admin-screen">
      <Header eyebrow="Admin center" title="User Management" actions={<IconButton label="Back" to="/profile"><ArrowLeft /></IconButton>} />

      <div className="admin-kpi-grid">
        <div className="admin-kpi">
          <Users />
          <b>{adminUsers.length}</b>
          <span>Total users</span>
        </div>
        <div className="admin-kpi">
          <CircleCheck />
          <b>{activeUsers}</b>
          <span>Active</span>
        </div>
        <div className="admin-kpi">
          <ShieldCheck />
          <b>{reviewUsers}</b>
          <span>Needs review</span>
        </div>
        <div className="admin-kpi">
          <Wallet />
          <b>{walletStats.active}</b>
          <span>Wallet passes</span>
        </div>
      </div>

      {/* Admin Quick Links */}
      <div style={{ padding: "0 20px 12px", display: "flex", gap: 8 }}>
        <Link to="/admin/trending" style={{
          flex: 1, display: "flex", alignItems: "center", gap: 8,
          padding: "10px 14px", borderRadius: 12,
          background: "linear-gradient(135deg, rgba(247,37,133,0.08), rgba(108,99,255,0.08))",
          textDecoration: "none", color: "inherit", fontSize: 13, fontWeight: 600
        }}>
          <Flame size={16} style={{ color: "#f72585" }} />
          Trending Tracker
          <ChevronRight size={14} style={{ marginLeft: "auto", opacity: 0.4 }} />
        </Link>
        <Link to="/admin/fund" style={{
          flex: 1, display: "flex", alignItems: "center", gap: 8,
          padding: "10px 14px", borderRadius: 12,
          background: "rgba(16,185,129,0.06)",
          textDecoration: "none", color: "inherit", fontSize: 13, fontWeight: 600
        }}>
          <CircleDollarSign size={16} style={{ color: "#10b981" }} />
          Reward Fund
          <ChevronRight size={14} style={{ marginLeft: "auto", opacity: 0.4 }} />
        </Link>
      </div>

      <div className="segmented-tabs">
        {["Users", "Activity Log", "Roles", "Wallet"].map((item) => (
          <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </div>

      {tab === "Users" ? (
        <div className="admin-list">
          {adminUsers.map((user, index) => (
            <ScrollReveal key={user.id} delay={index * 0.05} className="admin-user-card">
              <div className="admin-avatar">{user.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div>
              <div>
                <div className="admin-card-title">
                  <b>{user.name}</b>
                  <span className={`status-pill ${user.status.toLowerCase()}`}>{user.status}</span>
                </div>
                <small>{user.email}</small>
                <div className="admin-meta-row">
                  <span>{user.role}</span>
                  <span>{user.plan}</span>
                  <span>{user.plans} Plans</span>
                  <span>Seen {user.lastSeen}</span>
                </div>
              </div>
              <button className="admin-more" aria-label={`Manage ${user.name}`}>
                <SlidersHorizontal />
              </button>
            </ScrollReveal>
          ))}
        </div>
      ) : tab === "Activity Log" ? (
        <div className="activity-log">
          {adminActivityLog.map((item, index) => (
            <ScrollReveal key={item.id} delay={index * 0.05} className={`activity-log-row ${item.severity.toLowerCase()}`}>
              <div className="activity-icon">
                {item.severity === "Warning" ? <Bell /> : item.severity === "Success" ? <CircleCheck /> : <Clock />}
              </div>
              <div>
                <div className="admin-card-title">
                  <b>{item.action}</b>
                  <span>{item.time}</span>
                </div>
                <small>{item.actor} · {item.type} · {item.target}</small>
                <p>{item.metadata}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      ) : tab === "Wallet" ? (
        <AdminWalletManager />
      ) : (
        <div className="admin-list">
          {[
            ["Owner", "Full access to billing, users, data exports, and admin logs"],
            ["Manager", "Can manage venues, user support, activity review, and Confetti operations"],
            ["Support", "Can view users, activity logs, bookings, and support context"],
            ["Member", "Standard app access without admin permissions"]
          ].map(([role, detail], index) => (
            <ScrollReveal key={role} delay={index * 0.05} className="role-card">
              <Lock />
              <div>
                <b>{role}</b>
                <span>{detail}</span>
              </div>
            </ScrollReveal>
          ))}
        </div>
      )}
    </Page>
  );
}

function Bookings() {
  const [tab, setTab] = useState("Active");
  return (
    <Page className="portal-screen">
      <Header eyebrow="Customer portal" title="My Bookings" actions={<IconButton label="Back" to="/home"><ArrowLeft /></IconButton>} />
      <div className="segmented-tabs">
        {["Active", "Past", "Cancelled"].map((item) => (
          <button className={tab === item ? "active" : ""} onClick={() => setTab(item)} key={item}>{item}</button>
        ))}
      </div>
      <BookingList modification />
    </Page>
  );
}

function BookingList({ modification = false }: { modification?: boolean }) {
  return (
    <div className="booking-list">
      {venues.map((venue, index) => (
        <ScrollReveal key={venue.name} delay={index * 0.06} className="booking-card">
          <img src={venue.image} alt="" />
          <div>
            <b>{venue.name}</b>
            <span>May {12 + index}, 7:{index}5 PM · Party of {index + 2}</span>
            <small className={index === 2 ? "past" : "active"}>{index === 2 ? "Completed" : "Upcoming"}</small>
          </div>
          {modification ? <button className="modify-chip">Modify</button> : null}
        </ScrollReveal>
      ))}
      {modification ? (
        <ScrollReveal className="mod-sheet-preview">
          <h3>Booking Modifications</h3>
          <div className="form-row">Party size <b>4</b></div>
          <div className="form-row">Time change <b>8:00 PM</b></div>
          <div className="form-row">Special request <b>Window table</b></div>
          <GradientButton wide>Confirm Changes</GradientButton>
        </ScrollReveal>
      ) : null}
    </div>
  );
}

function Favorites() {
  return (
    <Page className="favorites-screen">
      <Header eyebrow="Saved venues" title="Favorites" actions={<IconButton label="Back" to="/home"><ArrowLeft /></IconButton>} />
      <div className="masonry-grid">
        {venues.concat(venues).map((venue, index) => (
          <motion.article whileTap={{ scale: 0.96 }} key={`${venue.name}-${index}`} className="favorite-tile">
            <img src={venue.image} alt="" />
            <Heart fill="currentColor" />
            <b>{venue.name}</b>
          </motion.article>
        ))}
      </div>
    </Page>
  );
}

function Notifications() {
  const notificationItems = [
    { text: "Luma Rooftop has a 7:15 PM table open.", icon: Bell, to: undefined },
    { text: "Your group voted yes on Neon Library.", icon: Users, to: undefined },
    { text: "Traffic shifted: leave 8 minutes earlier.", icon: Car, to: "/traffic-alerts" }
  ];

  return (
    <Page className="notifications-screen">
      <Header eyebrow="Notification center" title="Alerts" actions={<IconButton label="Back" to="/home"><ArrowLeft /></IconButton>} />
      {notificationItems.map((item, index) => {
        const Icon = item.icon;
        const content = (
          <>
            <Icon />
            <div>
              <b>{item.text}</b>
              <span>{index + 2} min ago</span>
            </div>
          </>
        );

        return item.to ? (
          <motion.article drag="x" dragConstraints={{ left: -80, right: 0 }} whileTap={{ scale: 0.98 }} className="notification traffic-notification unread" key={item.text}>
            <Link to={item.to}>{content}</Link>
          </motion.article>
        ) : (
          <motion.article drag="x" dragConstraints={{ left: -80, right: 0 }} whileTap={{ scale: 0.98 }} className={`notification ${index === 0 ? "unread" : ""}`} key={item.text}>
            {content}
          </motion.article>
        );
      })}
    </Page>
  );
}

function TrafficAlerts() {
  const firstStopPlan = getArrivalPlan(confettiStops[0], 0);

  return (
    <Page className="traffic-alerts-screen">
      <Header eyebrow="Live route watch" title="Traffic Alerts" actions={<IconButton label="Back" to="/active-confetti"><ArrowLeft /></IconButton>} />
      <ScrollReveal>
        <div className="traffic-hero">
          <div>
            <p className="eyebrow">Tonight's drive plan</p>
            <h2>Leave by {firstStopPlan.leaveBy}</h2>
            <span>Confetti is monitoring traffic, parking, valet timing, and venue check-in details.</span>
          </div>
          <Navigation />
        </div>
      </ScrollReveal>
      <ScrollReveal delay={0.06}>
        <TrafficAlertsPanel />
      </ScrollReveal>
      <ScrollReveal delay={0.08}>
        <ArrivalIntelligencePanel />
      </ScrollReveal>
      <ScrollReveal className="arrival-summary" delay={0.1}>
        <b>Auto reroute ready</b>
        <span>When connected to a live maps provider, this panel can refresh ETAs, push alerts, and suggest alternate pickup or parking options.</span>
      </ScrollReveal>
    </Page>
  );
}

function Discover() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("all");
  const filters = [
    { id: "all", label: "All" },
    { id: "trending-food", label: "🔥 Viral Eats" },
    { id: "hidden-gems", label: "🗝️ Hidden Gems" },
    { id: "kids", label: "🎨 Kids" },
    { id: "outdoor", label: "🌅 Outdoor" },
    { id: "date-night", label: "💕 Date Night" },
    { id: "nightlife", label: "🌙 Nightlife" }
  ];
  const filtered = activeFilter === "all" ? venues : venues.filter(v => v.category === activeFilter);

  return (
    <Page className="discover-screen">
      <Header eyebrow="What's trending locally" title="Discover" actions={<IconButton label="Back" to="/home"><ArrowLeft /></IconButton>} />
      <ScrollReveal className="discover-filters">
        {filters.map((filter) => (
          <motion.button
            key={filter.id}
            whileTap={{ scale: 0.94 }}
            className={`filter-chip ${activeFilter === filter.id ? "active" : ""}`}
            onClick={() => setActiveFilter(filter.id)}
          >
            {filter.label}
          </motion.button>
        ))}
      </ScrollReveal>
      <ScrollReveal className="glass-card trending-banner" delay={0.04}>
        <div className="banner-content">
          <TrendingUp />
          <div>
            <h3>Trending on TikTok Near You</h3>
            <p>Smash burgers, birria everything, hidden speakeasies, and sunset hikes are blowing up in your area right now.</p>
          </div>
        </div>
      </ScrollReveal>
      <div className="discover-grid">
        {filtered.map((venue, index) => (
          <ScrollReveal key={venue.id} delay={index * 0.05}>
            <motion.article
              whileTap={{ scale: 0.96 }}
              className="discover-card"
              onClick={() => navigate(`/venue/${venue.id}`)}
            >
              <img src={venue.image} alt="" />
              {venue.tags.includes("TikTok Viral") || venue.tags.includes("TikTok Famous") || venue.tags.includes("TikTok Trail") || venue.tags.includes("Viral") ? (
                <div className="viral-badge">Trending</div>
              ) : null}
              {venue.category === "kids" ? (
                <div className="viral-badge kids-badge">Kid Friendly</div>
              ) : null}
              <div className="discover-card-info">
                <b>{venue.name}</b>
                <span>{venue.type}</span>
                <div className="discover-meta">
                  <span><MapPin />{venue.area}</span>
                  <span>{venue.price}</span>
                  <span><Star fill="currentColor" />{venue.rating}</span>
                </div>
                <div className="tag-row">
                  {venue.tags.slice(0, 3).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
            </motion.article>
          </ScrollReveal>
        ))}
      </div>
      <ScrollReveal className="glass-card venue-room" delay={0.1}>
        <h3>Live from the Community</h3>
        <p><ShieldCheck /> Verified visitors are sharing live wait times at Smash Stack.</p>
        <div className="vote-row">
          <button>👍 34</button>
          <button>👎 1</button>
          <span><i style={{ width: "96%" }} /></span>
        </div>
      </ScrollReveal>
      <div className="activity-feed">
        {[
          "Maya found a hidden speakeasy entrance",
          "Chris took the kids to Discovery Zone gem dig",
          "Dana posted a sunset trail photo from Great Falls",
          "Jules went viral eating birria at Birria Boss",
          "Kai did paint & sip date night at Pour & Paint"
        ].map((activity, index) => (
          <ScrollReveal key={activity} delay={index * 0.05} className="activity-card">
            <div className="avatar">{activity[0]}</div>
            <div>
              <b>{activity}</b>
              <span>{index + 2} min ago</span>
            </div>
            <img src={venues[(index + 3) % venues.length].image} alt="" />
          </ScrollReveal>
        ))}
      </div>
    </Page>
  );
}

function QuickGenerate() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"generating" | "ready">("generating");
  const [stops, setStops] = useState(generatedStops);
  const [swapOpen, setSwapOpen] = useState<number | null>(null);
  const [tweakOpen, setTweakOpen] = useState(false);
  const [tweakText, setTweakText] = useState("");
  const [vibeScore] = useState(94);
  const [regenCount, setRegenCount] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setPhase("ready"), 2800);
    return () => window.clearTimeout(timer);
  }, [regenCount]);

  const swapStop = (stopIndex: number, altIndex: number) => {
    setStops(prev => {
      const next = [...prev];
      const alt = next[stopIndex].alternatives[altIndex];
      const old = next[stopIndex];
      next[stopIndex] = { ...old, name: alt.name, type: alt.type, price: alt.price, match: alt.match, alternatives: [{ name: old.name, type: old.type, price: old.price, match: old.match }, ...old.alternatives.filter((_, i) => i !== altIndex)] };
      return next;
    });
    setSwapOpen(null);
  };

  const moveStop = (from: number, direction: "up" | "down") => {
    const to = direction === "up" ? from - 1 : from + 1;
    if (to < 0 || to >= stops.length) return;
    setStops(prev => {
      const next = [...prev];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  };

  const regenerate = () => {
    setPhase("generating");
    setRegenCount(c => c + 1);
    setTweakOpen(false);
  };

  if (phase === "generating") {
    return (
      <Page className="quick-gen-screen">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", gap: 24, textAlign: "center" }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
            style={{ width: 80, height: 80, borderRadius: 40, background: "linear-gradient(135deg, var(--purple), var(--teal), var(--coral))", display: "grid", placeItems: "center" }}
          >
            <WandSparkles style={{ width: 36, height: 36, color: "#fff" }} />
          </motion.div>
          <div>
            <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: 22, marginBottom: 8 }}>
              Generating your plan...
            </motion.h2>
            <motion.div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
              {["Analyzing your taste profile", "Matching trending spots near you", "Optimizing route & timing"].map((step, i) => (
                <motion.p
                  key={step}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.8 }}
                  style={{ fontSize: 13, opacity: 0.7, display: "flex", alignItems: "center", gap: 6 }}
                >
                  <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.4 }}>
                    {i === 0 ? <Sparkles style={{ width: 14 }} /> : i === 1 ? <MapPin style={{ width: 14 }} /> : <Route style={{ width: 14 }} />}
                  </motion.span>
                  {step}
                </motion.p>
              ))}
            </motion.div>
          </div>
          <motion.div
            style={{ width: "60%", height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}
          >
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2.6, ease: "easeInOut" }}
              style={{ height: "100%", borderRadius: 2, background: "linear-gradient(90deg, var(--purple), var(--teal))" }}
            />
          </motion.div>
        </div>
      </Page>
    );
  }

  return (
    <Page className="quick-gen-screen">
      <Header
        eyebrow="AI Generated Plan"
        title="Your perfect night"
        actions={
          <IconButton label="Back" to="/home">
            <ArrowLeft />
          </IconButton>
        }
      />
      <ScrollReveal className="glass-card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", marginBottom: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 22, background: "linear-gradient(135deg, var(--purple), var(--teal))", display: "grid", placeItems: "center" }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{vibeScore}%</span>
        </div>
        <div style={{ flex: 1 }}>
          <b style={{ fontSize: 14, display: "block" }}>Vibe Match Score</b>
          <small style={{ opacity: 0.6 }}>Based on your socials, swipes & past plans</small>
        </div>
        <Link to="/taste-tuner" style={{ color: "var(--teal)", fontSize: 12, textDecoration: "none" }}>Tune</Link>
      </ScrollReveal>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {stops.map((stop, index) => (
          <ScrollReveal key={`${stop.name}-${index}`} delay={index * 0.08}>
            <motion.div layout className="glass-card" style={{ padding: "14px 16px", position: "relative" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 16, background: "linear-gradient(135deg, var(--coral), var(--pink))", display: "grid", placeItems: "center", fontSize: 16 }}>{stop.emoji}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <motion.button whileTap={{ scale: 0.85 }} onClick={() => moveStop(index, "up")} disabled={index === 0} style={{ opacity: index === 0 ? 0.2 : 0.6, background: "none", border: "none", color: "inherit", padding: 0 }}>
                      <ChevronUp style={{ width: 16 }} />
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.85 }} onClick={() => moveStop(index, "down")} disabled={index === stops.length - 1} style={{ opacity: index === stops.length - 1 ? 0.2 : 0.6, background: "none", border: "none", color: "inherit", padding: 0 }}>
                      <ChevronDown style={{ width: 16 }} />
                    </motion.button>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <b style={{ fontSize: 15 }}>{stop.name}</b>
                    <span style={{ fontSize: 12, opacity: 0.6 }}>{stop.match}% match</span>
                  </div>
                  <p style={{ fontSize: 12, opacity: 0.7, margin: "2px 0 6px" }}>{stop.type} · {stop.area} · {stop.price}</p>
                  <div style={{ display: "flex", gap: 6, fontSize: 12, opacity: 0.5 }}>
                    <span><Clock style={{ width: 12, height: 12 }} /> {stop.time}</span>
                    <span>· {stop.duration}</span>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSwapOpen(swapOpen === index ? null : index)}
                  style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, padding: "6px 10px", color: "var(--teal)", fontSize: 12, display: "flex", alignItems: "center", gap: 4, cursor: "pointer", flexShrink: 0 }}
                >
                  <Shuffle style={{ width: 14 }} /> Swap
                </motion.button>
              </div>

              <AnimatePresence>
                {swapOpen === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: "hidden", marginTop: 10, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 10 }}
                  >
                    <p style={{ fontSize: 11, opacity: 0.5, marginBottom: 8 }}>Tap to swap this stop:</p>
                    {stop.alternatives.map((alt, ai) => (
                      <motion.button
                        key={alt.name}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => swapStop(index, ai)}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "8px 10px", background: "rgba(255,255,255,0.04)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 6, color: "inherit", cursor: "pointer", textAlign: "left" }}
                      >
                        <div>
                          <b style={{ fontSize: 13 }}>{alt.name}</b>
                          <small style={{ display: "block", opacity: 0.6, fontSize: 11 }}>{alt.type} · {alt.price}</small>
                        </div>
                        <span style={{ fontSize: 12, color: "var(--teal)" }}>{alt.match}%</span>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal delay={0.2} className="gen-actions" style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setTweakOpen(!tweakOpen)}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 18px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "inherit", cursor: "pointer", fontSize: 14 }}
        >
          <RotateCcw style={{ width: 16 }} /> Regenerate with tweaks
        </motion.button>

        <AnimatePresence>
          {tweakOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                {["More chill", "Add dessert", "Make it fancy", "Kid-friendly"].map(suggestion => (
                  <motion.button
                    key={suggestion}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => { setTweakText(suggestion); regenerate(); }}
                    style={{ padding: "6px 12px", background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: 20, color: "inherit", fontSize: 12, whiteSpace: "nowrap", cursor: "pointer" }}
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={tweakText}
                  onChange={e => setTweakText(e.target.value)}
                  placeholder="e.g. 'more chill, add a dessert spot'"
                  style={{ flex: 1, padding: "10px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "inherit", fontSize: 13, outline: "none" }}
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={regenerate}
                  style={{ padding: "10px 16px", background: "linear-gradient(135deg, var(--purple), var(--teal))", border: "none", borderRadius: 10, color: "#fff", cursor: "pointer", flexShrink: 0 }}
                >
                  <RefreshCw style={{ width: 16 }} />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <GradientButton wide>
          <span onClick={() => navigate("/boarding-pass")}>
            <PlaneTakeoff style={{ width: 16, height: 16 }} /> Lock In This Plan
          </span>
        </GradientButton>
      </ScrollReveal>
    </Page>
  );
}

function TasteTuner() {
  const navigate = useNavigate();
  const [currentCard, setCurrentCard] = useState(0);
  const [liked, setLiked] = useState<number[]>([]);
  const [disliked, setDisliked] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const bgLeft = useTransform(x, [-200, 0], [0.6, 0]);
  const bgRight = useTransform(x, [0, 200], [0, 0.6]);

  const card = tasteCards[currentCard];

  const handleSwipe = (direction: "left" | "right") => {
    if (direction === "right") setLiked(prev => [...prev, currentCard]);
    else setDisliked(prev => [...prev, currentCard]);

    void (async () => {
      const account = await getCurrentAccount();
      const { trackInteraction } = await import("@/lib/agents/interaction-tracker");
      trackInteraction({
        userId: account?.id ?? "anonymous",
        eventType: direction === "right" ? "card_swipe_right" : "card_swipe_left",
        metadata: {
          source: "taste_tuner",
          cardIndex: currentCard,
          cardName: card?.name ?? "",
          cardTags: card?.tags ?? [],
        },
      });
    })();

    if (currentCard >= tasteCards.length - 1) {
      setDone(true);
    } else {
      setCurrentCard(prev => prev + 1);
    }
  };

  if (done) {
    return (
      <Page className="taste-tuner-screen">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", gap: 20, textAlign: "center" }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            style={{ width: 80, height: 80, borderRadius: 40, background: "linear-gradient(135deg, var(--teal), var(--purple))", display: "grid", placeItems: "center" }}
          >
            <Check style={{ width: 40, height: 40, color: "#fff" }} />
          </motion.div>
          <h2 style={{ fontSize: 22 }}>Taste profile updated!</h2>
          <p style={{ fontSize: 14, opacity: 0.7, maxWidth: 260 }}>
            You liked {liked.length} and passed on {disliked.length}. Your AI-generated plans will now match your vibe even better.
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <GradientButton to="/quick-generate">
              <Zap style={{ width: 14 }} /> Generate a Plan
            </GradientButton>
          </div>
          <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: "inherit", opacity: 0.6, cursor: "pointer", fontSize: 13 }}>Go back</button>
        </div>
      </Page>
    );
  }

  return (
    <Page className="taste-tuner-screen">
      <Header
        eyebrow={`${currentCard + 1} of ${tasteCards.length}`}
        title="Tune Your Taste"
        actions={
          <IconButton label="Back" to="/profile">
            <ArrowLeft />
          </IconButton>
        }
      />
      <p style={{ fontSize: 13, opacity: 0.6, textAlign: "center", marginBottom: 16 }}>Swipe right for more like this, left for less</p>

      <div style={{ position: "relative", height: 380, display: "flex", justifyContent: "center" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard}
            style={{ x, rotate, width: "85%", maxWidth: 340, position: "absolute" }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 100) handleSwipe("right");
              else if (info.offset.x < -100) handleSwipe("left");
            }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <div style={{ borderRadius: 20, overflow: "hidden", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", position: "relative" }}>
              <img src={card.image} alt="" style={{ width: "100%", height: 240, objectFit: "cover" }} />
              <motion.div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(255,60,60,0.3)", opacity: bgLeft, pointerEvents: "none", display: "grid", placeItems: "center" }}>
                <X style={{ width: 60, height: 60, color: "#fff" }} />
              </motion.div>
              <motion.div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(6,214,160,0.3)", opacity: bgRight, pointerEvents: "none", display: "grid", placeItems: "center" }}>
                <Heart style={{ width: 60, height: 60, color: "#fff" }} />
              </motion.div>
              <div style={{ padding: "14px 18px" }}>
                <h3 style={{ fontSize: 17, marginBottom: 6 }}>{card.name}</h3>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {card.tags.map(tag => (
                    <span key={tag} style={{ padding: "4px 10px", background: "rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 11 }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 20 }}>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => handleSwipe("left")}
          style={{ width: 56, height: 56, borderRadius: 28, background: "rgba(255,60,60,0.15)", border: "2px solid rgba(255,60,60,0.3)", display: "grid", placeItems: "center", color: "#ff3c3c", cursor: "pointer" }}
        >
          <X style={{ width: 24 }} />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => handleSwipe("right")}
          style={{ width: 56, height: 56, borderRadius: 28, background: "rgba(6,214,160,0.15)", border: "2px solid rgba(6,214,160,0.3)", display: "grid", placeItems: "center", color: "var(--teal)", cursor: "pointer" }}
        >
          <Heart style={{ width: 24 }} />
        </motion.button>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 16 }}>
        {tasteCards.map((_, i) => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: 4, background: i < currentCard ? (liked.includes(i) ? "var(--teal)" : "rgba(255,60,60,0.5)") : i === currentCard ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.15)" }} />
        ))}
      </div>
    </Page>
  );
}

function TabBar() {
  const location = useLocation();
  return (
    <motion.nav className="tab-bar" initial={{ y: 28, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 28, opacity: 0 }} transition={pageTransition}>
      {tabs.map(({ path, label, icon: Icon }) => {
        const active = location.pathname === path;
        return (
          <Link key={path} to={path} className={active ? "active" : ""}>
            {active ? <motion.i layoutId="tab-active-bg" className="tab-active-bg" /> : null}
            <motion.span animate={{ scale: active ? 1.12 : 1 }} whileTap={{ scale: 0.9 }} transition={panelTransition}>
              <Icon />
            </motion.span>
            <small>{label}</small>
            {active ? <motion.i layoutId="tab-dot" /> : null}
          </Link>
        );
      })}
    </motion.nav>
  );
}

function InstallPrompt({ onClose }: { onClose: () => void }) {
  return (
    <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="install-prompt">
      <Sparkles />
      <span>Add Confetti to your Home Screen</span>
      <button onClick={onClose}>Later</button>
    </motion.div>
  );
}

function ParticleBurst() {
  return (
    <span className="particle-burst">
      {Array.from({ length: 10 }).map((_, index) => (
        <i key={index} style={{ "--i": index } as React.CSSProperties} />
      ))}
    </span>
  );
}

function Confetti() {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 42 }).map((_, index) => (
        <span key={index} style={{ "--i": index } as React.CSSProperties} />
      ))}
    </div>
  );
}

export default App;
