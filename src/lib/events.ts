import musicImg from "@/assets/event-music.jpg";
import techImg from "@/assets/event-tech.jpg";
import foodImg from "@/assets/event-food.jpg";
import artImg from "@/assets/event-art.jpg";
import wellnessImg from "@/assets/event-wellness.jpg";
import sportsImg from "@/assets/event-sports.jpg";

export type EventCategory = "Music" | "Tech" | "Food" | "Arts" | "Wellness" | "Sports";

export const CATEGORIES: EventCategory[] = ["Music", "Tech", "Food", "Arts", "Wellness", "Sports"];

export type EventItem = {
  id: string;
  title: string;
  category: EventCategory;
  date: string; // ISO
  city: string;
  venue: string;
  price: number; // 0 = Free
  image: string;
  blurb: string;
  organizer: string;
};

export const EVENTS: EventItem[] = [
  {
    id: "neon-nights",
    title: "Neon Nights: Indie Pop Festival",
    category: "Music",
    date: "2026-06-12T20:00:00",
    city: "Brooklyn, NY",
    venue: "Warehouse 9",
    price: 49,
    image: musicImg,
    organizer: "Riff Collective",
    blurb: "An electric night of rising indie pop acts under one roof, with rooftop afterparty.",
  },
  {
    id: "founder-summit",
    title: "Founder Summit 2026",
    category: "Tech",
    date: "2026-05-22T09:00:00",
    city: "San Francisco, CA",
    venue: "Pier 27",
    price: 199,
    image: techImg,
    organizer: "Build Forward",
    blurb:
      "A full day of talks, workshops, and unfiltered Q&As with founders building the next wave of AI products.",
  },
  {
    id: "night-market",
    title: "Sunset Night Market",
    category: "Food",
    date: "2026-05-30T17:30:00",
    city: "Austin, TX",
    venue: "Zilker Park",
    price: 0,
    image: foodImg,
    organizer: "Hungry City",
    blurb:
      "60+ local vendors, live DJs, and string lights as the sun goes down. Free entry, eat your way through.",
  },
  {
    id: "modern-canvas",
    title: "Modern Canvas: Gallery Opening",
    category: "Arts",
    date: "2026-06-05T19:00:00",
    city: "Chicago, IL",
    venue: "Loft 41 Gallery",
    price: 25,
    image: artImg,
    organizer: "Loft 41",
    blurb:
      "Opening night for ten emerging painters, with curator-led walkthrough and complimentary drinks.",
  },
  {
    id: "sunrise-flow",
    title: "Sunrise Flow Mountain Retreat",
    category: "Wellness",
    date: "2026-07-04T06:30:00",
    city: "Boulder, CO",
    venue: "Flagstaff Summit",
    price: 65,
    image: wellnessImg,
    organizer: "Still Mind Co.",
    blurb:
      "Greet the day with 90 minutes of vinyasa, breathwork, and a hot herbal tea ceremony at the summit.",
  },
  {
    id: "court-clash",
    title: "Court Clash: Championship Finals",
    category: "Sports",
    date: "2026-06-18T19:30:00",
    city: "Los Angeles, CA",
    venue: "Crypto Arena",
    price: 89,
    image: sportsImg,
    organizer: "West League",
    blurb:
      "The two best teams of the season face off for the title. Halftime show by surprise headliner.",
  },
];

export function getEvent(id: string) {
  return EVENTS.find((e) => e.id === id);
}

export function formatEventDate(iso: string) {
  const d = new Date(iso);
  return {
    weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
    month: d.toLocaleDateString("en-US", { month: "short" }),
    day: d.getDate(),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    full: d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
  };
}
