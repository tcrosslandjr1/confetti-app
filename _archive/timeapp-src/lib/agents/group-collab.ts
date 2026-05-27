/**
 * Group Collaboration Agent
 * ─────────────────────────
 * Handles group creation (company teams, friend groups, family circles, custom),
 * invite management, preference merging across members, AI-curated plans with
 * voting, creative plan naming, consensus detection, and plan refinement.
 *
 * Flow: Create Group → Invite Members → Members Join → Pick Categories →
 *       AI Merges Profiles → AI Curates Plan (with creative name) →
 *       Members Vote → AI Refines Until Consensus → Plan Approved
 */

import { supabase } from "../supabase";
import { chat, getAIConfig } from "./ai-provider";
import { getTasteProfileLocal, type TasteProfile } from "./user-intelligence";
import { discoverVenuesMock, type DiscoveredVenue } from "./venue-discovery";

// ─── Types ────────────────────────────────────────────────────

export type GroupType = "company" | "friends" | "family" | "custom";
export type MemberRole = "host" | "co-host" | "member";
export type MemberStatus = "invited" | "joined" | "declined";
export type PlanStatus = "drafting" | "voting" | "refining" | "approved" | "completed";
export type VoteValue = "up" | "down" | "neutral";

export interface Group {
  id: string;
  name: string;
  type: GroupType;
  emoji: string;
  createdBy: string;
  inviteCode: string;
  settings: GroupSettings;
  members: GroupMember[];
  createdAt: string;
}

export interface GroupSettings {
  maxMembers: number;
  kidFriendly: boolean;
  sharedBudget: number | null;
  defaultCity: string;
  categoryVoting: boolean;
}

export interface GroupMember {
  id: string;
  userId: string;
  displayName: string;
  avatar: string;
  role: MemberRole;
  status: MemberStatus;
  categories: string[];
  joinedAt: string | null;
}

export interface GroupPlan {
  id: string;
  groupId: string;
  name: string;
  subtitle: string;
  emoji: string;
  status: PlanStatus;
  date: string | null;
  stops: GroupPlanStop[];
  consensusScore: number;
  totalVotes: number;
  createdAt: string;
}

export interface GroupPlanStop {
  id: string;
  planId: string;
  venue: DiscoveredVenue;
  order: number;
  duration: number;
  note: string;
  votes: StopVote[];
  score: number;
}

export interface StopVote {
  userId: string;
  displayName: string;
  vote: VoteValue;
  votedAt: string;
}

export interface CategoryPick {
  userId: string;
  categories: string[];
}

// ─── Constants ────────────────────────────────────────────────

const GROUP_TYPE_DEFAULTS: Record<GroupType, Partial<GroupSettings>> = {
  company: { maxMembers: 50, kidFriendly: false, sharedBudget: null, categoryVoting: true },
  friends: { maxMembers: 20, kidFriendly: false, sharedBudget: null, categoryVoting: true },
  family: { maxMembers: 15, kidFriendly: true, sharedBudget: null, categoryVoting: true },
  custom: { maxMembers: 30, kidFriendly: false, sharedBudget: null, categoryVoting: true },
};

const GROUP_EMOJIS: Record<GroupType, string[]> = {
  company: ["🏢", "💼", "🤝", "⚡"],
  friends: ["👯", "🎉", "🔥", "✨"],
  family: ["👨‍👩‍👧‍👦", "🏠", "💛", "🌟"],
  custom: ["🎯", "🚀", "🌈", "💫"],
};

const AVAILABLE_CATEGORIES = [
  "Fine Dining", "Casual Eats", "Street Food", "Brunch",
  "Rooftop Bars", "Speakeasies", "Dive Bars", "Wine Bars",
  "Live Music", "Comedy Shows", "Art Galleries", "Museums",
  "Outdoor Adventures", "Sunset Spots", "Game Nights", "Karaoke",
  "Family Activities", "Kid-Friendly", "Date Night", "Late Night",
  "Wellness & Spa", "Sports", "Shopping", "Cultural Experiences",
  "Food Trucks", "Coffee & Dessert", "Cocktail Crawl", "Dance Clubs",
];

function priceLevelToNumber(priceLevel: string | number | undefined): number {
  if (typeof priceLevel === "number") return priceLevel;
  return Math.max(1, Math.min(4, priceLevel?.length ?? 2));
}

function asGroupVenue(
  venue: Partial<DiscoveredVenue> & Pick<DiscoveredVenue, "id" | "name" | "category" | "address">
): DiscoveredVenue {
  const lat = venue.lat ?? venue.location?.lat ?? 0;
  const lng = venue.lng ?? venue.location?.lng ?? 0;

  return {
    ...venue,
    lat,
    lng,
    city: venue.city ?? "Washington",
    country: venue.country ?? "US",
    photoUrls: venue.photoUrls ?? venue.photos ?? [],
    cuisineTags: venue.cuisineTags ?? [venue.category],
    vibeTags: venue.vibeTags ?? [venue.category],
    occasionTags: venue.occasionTags ?? [],
    source: venue.source ?? "merged",
  };
}

const PLAN_NAME_PROMPT = `You are a creative naming genius for group outing plans. Generate a FUN, MEMORABLE plan name based on:
- The group type and vibe
- The categories/activities chosen
- The city/neighborhood
- Time of day if known

Rules:
- Make it catchy and evocative — like naming a concert tour or a movie
- Use wordplay, alliteration, cultural references, or local flavor
- Keep it under 6 words
- Also provide a short subtitle (under 10 words) and a single emoji

Examples of great names:
- "The Georgetown Crawl" (subtitle: "Five stops, zero regrets")
- "Midnight Mango Tour" (subtitle: "Sweet spots after dark")
- "Sunset & Sake Session" (subtitle: "Rooftop vibes, Japanese bites")
- "The Tiny Human Trail" (subtitle: "Family-proof fun across the city")
- "Quarter-End Celebration Express" (subtitle: "Team earned it, Confetti planned it")

Respond ONLY in this exact JSON format:
{"name": "...", "subtitle": "...", "emoji": "..."}`;

const PLAN_CURATION_PROMPT = `You are Confetti AI, curating a group outing plan. You have:
1. Merged taste profiles from all group members
2. Their voted categories
3. Venue discovery results

Your job:
- Select the best 4-6 stops that satisfy the group's combined preferences
- Order them logically (by time/geography)
- Add a brief note for each stop explaining why it fits this group
- Assign realistic durations (30-120 min)
- Balance different members' tastes — don't let one profile dominate

Respond ONLY in this JSON format:
{"stops": [{"venueIndex": 0, "duration": 60, "note": "..."}]}

venueIndex refers to the position in the venues array provided.`;

// ─── Utility ──────────────────────────────────────────────────

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "CNFT-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Mock Data Store (local mode) ────────────────────────────

const mockGroups: Map<string, Group> = new Map();
const mockPlans: Map<string, GroupPlan> = new Map();

// ─── Group CRUD ──────────────────────────────────────────────

export async function createGroup(
  name: string,
  type: GroupType,
  creatorId: string,
  creatorName: string,
  settings?: Partial<GroupSettings>
): Promise<Group> {
  const defaults = GROUP_TYPE_DEFAULTS[type];
  const emojis = GROUP_EMOJIS[type];

  const group: Group = {
    id: generateId(),
    name,
    type,
    emoji: emojis[Math.floor(Math.random() * emojis.length)],
    createdBy: creatorId,
    inviteCode: generateInviteCode(),
    settings: {
      maxMembers: settings?.maxMembers ?? defaults.maxMembers ?? 20,
      kidFriendly: settings?.kidFriendly ?? defaults.kidFriendly ?? false,
      sharedBudget: settings?.sharedBudget ?? defaults.sharedBudget ?? null,
      defaultCity: settings?.defaultCity ?? "Washington, DC",
      categoryVoting: settings?.categoryVoting ?? defaults.categoryVoting ?? true,
    },
    members: [
      {
        id: generateId(),
        userId: creatorId,
        displayName: creatorName,
        avatar: creatorName.split(" ").map((n) => n[0]).join("").toUpperCase(),
        role: "host",
        status: "joined",
        categories: [],
        joinedAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
  };

  // Persist
  try {
    const { error } = await supabase.from("groups").insert({
      id: group.id,
      name: group.name,
      type: group.type,
      emoji: group.emoji,
      created_by: group.createdBy,
      invite_code: group.inviteCode,
      settings: group.settings,
    });
    if (error) throw error;

    await supabase.from("group_members").insert({
      id: group.members[0].id,
      group_id: group.id,
      user_id: creatorId,
      display_name: creatorName,
      role: "host",
      status: "joined",
    });
  } catch {
    // Fall through to local
  }

  mockGroups.set(group.id, group);
  return group;
}

export function createGroupLocal(
  name: string,
  type: GroupType,
  creatorId: string,
  creatorName: string,
  settings?: Partial<GroupSettings>
): Group {
  const defaults = GROUP_TYPE_DEFAULTS[type];
  const emojis = GROUP_EMOJIS[type];

  const group: Group = {
    id: generateId(),
    name,
    type,
    emoji: emojis[Math.floor(Math.random() * emojis.length)],
    createdBy: creatorId,
    inviteCode: generateInviteCode(),
    settings: {
      maxMembers: settings?.maxMembers ?? defaults.maxMembers ?? 20,
      kidFriendly: settings?.kidFriendly ?? defaults.kidFriendly ?? false,
      sharedBudget: settings?.sharedBudget ?? defaults.sharedBudget ?? null,
      defaultCity: settings?.defaultCity ?? "Washington, DC",
      categoryVoting: settings?.categoryVoting ?? defaults.categoryVoting ?? true,
    },
    members: [
      {
        id: generateId(),
        userId: creatorId,
        displayName: creatorName,
        avatar: creatorName.split(" ").map((n) => n[0]).join("").toUpperCase(),
        role: "host",
        status: "joined",
        categories: [],
        joinedAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
  };

  mockGroups.set(group.id, group);
  return group;
}

// ─── Invite & Join ────────────────────────────────────────────

export function inviteMember(
  groupId: string,
  userId: string,
  displayName: string,
  role: MemberRole = "member"
): GroupMember | null {
  const group = mockGroups.get(groupId);
  if (!group) return null;
  if (group.members.length >= group.settings.maxMembers) return null;
  if (group.members.some((m) => m.userId === userId)) return null;

  const member: GroupMember = {
    id: generateId(),
    userId,
    displayName,
    avatar: displayName.split(" ").map((n) => n[0]).join("").toUpperCase(),
    role,
    status: "invited",
    categories: [],
    joinedAt: null,
  };

  group.members.push(member);
  mockGroups.set(groupId, group);
  return member;
}

export function joinGroupByCode(
  inviteCode: string,
  userId: string,
  displayName: string
): Group | null {
  const group = Array.from(mockGroups.values()).find(
    (g) => g.inviteCode === inviteCode
  );
  if (!group) return null;
  if (group.members.length >= group.settings.maxMembers) return null;

  const existing = group.members.find((m) => m.userId === userId);
  if (existing) {
    existing.status = "joined";
    existing.joinedAt = new Date().toISOString();
  } else {
    group.members.push({
      id: generateId(),
      userId,
      displayName,
      avatar: displayName.split(" ").map((n) => n[0]).join("").toUpperCase(),
      role: "member",
      status: "joined",
      categories: [],
      joinedAt: new Date().toISOString(),
    });
  }

  mockGroups.set(group.id, group);
  return group;
}

// ─── Category Voting ──────────────────────────────────────────

export function submitCategories(
  groupId: string,
  userId: string,
  categories: string[]
): boolean {
  const group = mockGroups.get(groupId);
  if (!group) return false;

  const member = group.members.find((m) => m.userId === userId);
  if (!member) return false;

  member.categories = categories;
  mockGroups.set(groupId, group);
  return true;
}

export function getGroupCategories(groupId: string): { category: string; votes: number }[] {
  const group = mockGroups.get(groupId);
  if (!group) return [];

  const tally = new Map<string, number>();
  for (const member of group.members) {
    for (const cat of member.categories) {
      tally.set(cat, (tally.get(cat) ?? 0) + 1);
    }
  }

  return Array.from(tally.entries())
    .map(([category, votes]) => ({ category, votes }))
    .sort((a, b) => b.votes - a.votes);
}

export function getAvailableCategories(): string[] {
  return [...AVAILABLE_CATEGORIES];
}

// ─── Profile Merging ──────────────────────────────────────────

export function mergeGroupProfiles(groupId: string): TasteProfile | null {
  const group = mockGroups.get(groupId);
  if (!group) return null;

  const joinedMembers = group.members.filter((m) => m.status === "joined");
  if (joinedMembers.length === 0) return null;

  // Get each member's taste profile and merge
  const profiles = joinedMembers.map(() => getTasteProfileLocal());
  const averagePrice =
    profiles.reduce((sum, profile) => sum + priceLevelToNumber(profile.pricePreference), 0) /
    Math.max(profiles.length, 1);

  const merged: TasteProfile = {
    userId: `group-${groupId}`,
    cuisineScores: {},
    vibeScores: {},
    neighborhoodScores: {},
    occasionScores: {},
    timePatterns: {},
    pricePreference: "$".repeat(Math.round(averagePrice)),
    adventureScore: 0,
    socialScore: 0,
    eventCount: 0,
    lastComputedAt: new Date().toISOString(),
  };

  // Average all scores across members
  for (const profile of profiles) {
    for (const [k, v] of Object.entries(profile.cuisineScores)) {
      merged.cuisineScores[k] = (merged.cuisineScores[k] ?? 0) + v / profiles.length;
    }
    for (const [k, v] of Object.entries(profile.vibeScores)) {
      merged.vibeScores[k] = (merged.vibeScores[k] ?? 0) + v / profiles.length;
    }
    for (const [k, v] of Object.entries(profile.neighborhoodScores)) {
      merged.neighborhoodScores[k] = (merged.neighborhoodScores[k] ?? 0) + v / profiles.length;
    }
    for (const [k, v] of Object.entries(profile.occasionScores)) {
      merged.occasionScores[k] = (merged.occasionScores[k] ?? 0) + v / profiles.length;
    }
    merged.adventureScore += profile.adventureScore / profiles.length;
    merged.socialScore += profile.socialScore / profiles.length;
    merged.eventCount += profile.eventCount;
  }

  // Boost categories that members voted for
  const categoryVotes = getGroupCategories(groupId);
  for (const { category, votes } of categoryVotes) {
    const boost = (votes / joinedMembers.length) * 0.3;
    const key = category.toLowerCase().replace(/\s+/g, "_");
    merged.vibeScores[key] = (merged.vibeScores[key] ?? 0) + boost;
    merged.occasionScores[key] = (merged.occasionScores[key] ?? 0) + boost;
  }

  return merged;
}

// ─── AI Plan Generation ──────────────────────────────────────

export async function generateGroupPlan(
  groupId: string,
  date?: string
): Promise<GroupPlan | null> {
  const group = mockGroups.get(groupId);
  if (!group) return null;

  const mergedProfile = mergeGroupProfiles(groupId);
  if (!mergedProfile) return null;

  const topCategories = getGroupCategories(groupId).slice(0, 5);
  const categoryNames = topCategories.map((c) => c.category);

  // Discover venues based on merged profile
  const venues = discoverVenuesMock();

  // Generate creative plan name
  const planName = await generatePlanName(group, categoryNames);

  // Build the plan
  const plan: GroupPlan = {
    id: generateId(),
    groupId,
    name: planName.name,
    subtitle: planName.subtitle,
    emoji: planName.emoji,
    status: "voting",
    date: date ?? null,
    stops: venues.slice(0, 5).map((venue, i) => ({
      id: generateId(),
      planId: "",
      venue,
      order: i + 1,
      duration: venue.category?.toLowerCase().includes("dining") ? 75 : 45,
      note: generateStopNote(venue, group.type),
      votes: [],
      score: 0,
    })),
    consensusScore: 0,
    totalVotes: 0,
    createdAt: new Date().toISOString(),
  };

  plan.stops.forEach((s) => (s.planId = plan.id));
  mockPlans.set(plan.id, plan);
  return plan;
}

export function generateGroupPlanLocal(
  groupId: string,
  date?: string
): GroupPlan {
  const group = mockGroups.get(groupId);
  const topCategories = group ? getGroupCategories(groupId).slice(0, 5) : [];
  const categoryNames = topCategories.length > 0
    ? topCategories.map((c) => c.category)
    : ["Rooftop Bars", "Casual Eats", "Live Music"];

  const groupType = group?.type ?? "friends";
  const groupName = group?.name ?? "The Crew";

  // Generate a creative name locally
  const planName = generatePlanNameLocal(groupType, categoryNames, "Washington, DC");

  // Use mock venues
  const mockStops: GroupPlanStop[] = [
    {
      id: generateId(),
      planId: "",
      venue: asGroupVenue({
        id: "luma-rooftop",
        name: "Luma Rooftop",
        category: "Rooftop Izakaya",
        address: "1401 K St NW, Washington, DC",
        location: { lat: 38.9025, lng: -77.0324 },
        rating: 4.7,
        priceLevel: 3,
        vibeMatch: 94,
        photos: ["https://images.unsplash.com/photo-1559329007-40df8a9345d8?auto=format&fit=crop&w=900&q=80"],
      }),
      order: 1,
      duration: 75,
      note: "Starting elevated — skyline views set the tone for the whole night.",
      votes: [],
      score: 0,
    },
    {
      id: generateId(),
      planId: "",
      venue: asGroupVenue({
        id: "service-bar",
        name: "Service Bar",
        category: "Speakeasy Cocktails",
        address: "926 U St NW, Washington, DC",
        location: { lat: 38.9172, lng: -77.0258 },
        rating: 4.6,
        priceLevel: 3,
        vibeMatch: 91,
        photos: ["https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=900&q=80"],
      }),
      order: 2,
      duration: 60,
      note: "Hidden gem on U Street — craft cocktails in a moody basement.",
      votes: [],
      score: 0,
    },
    {
      id: generateId(),
      planId: "",
      venue: asGroupVenue({
        id: "birria-boss",
        name: "Birria Boss",
        category: "Street Food · Mexican",
        address: "2029 P St NW, Washington, DC",
        location: { lat: 38.9095, lng: -77.0463 },
        rating: 4.5,
        priceLevel: 1,
        vibeMatch: 88,
        photos: ["https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80"],
      }),
      order: 3,
      duration: 45,
      note: "TikTok-viral birria tacos — the group will be posting this.",
      votes: [],
      score: 0,
    },
    {
      id: generateId(),
      planId: "",
      venue: asGroupVenue({
        id: "flash-dc",
        name: "Flash",
        category: "Dance Club · Electronic",
        address: "645 Florida Ave NW, Washington, DC",
        location: { lat: 38.9154, lng: -77.0227 },
        rating: 4.4,
        priceLevel: 2,
        vibeMatch: 85,
        photos: ["https://images.unsplash.com/photo-1571204829887-3b8d69e4094d?auto=format&fit=crop&w=900&q=80"],
      }),
      order: 4,
      duration: 90,
      note: "End the night right — three floors of sound and a rooftop deck.",
      votes: [],
      score: 0,
    },
  ];

  // Kid-friendly swap for family groups
  if (groupType === "family") {
    mockStops[1] = {
      ...mockStops[1],
      venue: asGroupVenue({
        id: "discovery-zone",
        name: "Discovery Zone DC",
        category: "Family Experience · Interactive",
        address: "800 Maine Ave SW, Washington, DC",
        location: { lat: 38.8794, lng: -77.0244 },
        rating: 4.8,
        priceLevel: 2,
        vibeMatch: 92,
        photos: ["https://images.unsplash.com/photo-1566140967404-b8b3932483f5?auto=format&fit=crop&w=900&q=80"],
      }),
      note: "Hands-on fun for all ages — gem digging, science experiments, and a maker lab.",
    };
    mockStops[3] = {
      ...mockStops[3],
      venue: asGroupVenue({
        id: "splash-park",
        name: "Splash Adventure Park",
        category: "Outdoor · Family Fun",
        address: "1500 Maine Ave SW, Washington, DC",
        location: { lat: 38.8780, lng: -77.0235 },
        rating: 4.6,
        priceLevel: 1,
        vibeMatch: 90,
        photos: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=900&q=80"],
      }),
      note: "Perfect wind-down — splash pads, mini golf, and sunset views.",
    };
  }

  const plan: GroupPlan = {
    id: generateId(),
    groupId,
    name: planName.name,
    subtitle: planName.subtitle,
    emoji: planName.emoji,
    status: "voting",
    date: date ?? new Date().toISOString().split("T")[0],
    stops: mockStops,
    consensusScore: 0,
    totalVotes: 0,
    createdAt: new Date().toISOString(),
  };

  plan.stops.forEach((s) => (s.planId = plan.id));
  mockPlans.set(plan.id, plan);
  return plan;
}

// ─── Voting ──────────────────────────────────────────────────

export function voteOnStop(
  planId: string,
  stopId: string,
  userId: string,
  displayName: string,
  vote: VoteValue
): GroupPlanStop | null {
  const plan = mockPlans.get(planId);
  if (!plan) return null;

  const stop = plan.stops.find((s) => s.id === stopId);
  if (!stop) return null;

  // Remove existing vote from this user
  stop.votes = stop.votes.filter((v) => v.userId !== userId);

  // Add new vote
  stop.votes.push({
    userId,
    displayName,
    vote,
    votedAt: new Date().toISOString(),
  });

  // Recalculate stop score
  stop.score = stop.votes.reduce((sum, v) => {
    if (v.vote === "up") return sum + 1;
    if (v.vote === "down") return sum - 1;
    return sum;
  }, 0);

  // Recalculate plan consensus
  updatePlanConsensus(plan);

  mockPlans.set(planId, plan);
  return stop;
}

function updatePlanConsensus(plan: GroupPlan): void {
  const allVotes = plan.stops.flatMap((s) => s.votes);
  plan.totalVotes = allVotes.length;

  if (plan.totalVotes === 0) {
    plan.consensusScore = 0;
    return;
  }

  const upVotes = allVotes.filter((v) => v.vote === "up").length;
  plan.consensusScore = Math.round((upVotes / plan.totalVotes) * 100);

  // Auto-approve at 80%+ consensus
  if (plan.consensusScore >= 80 && plan.totalVotes >= plan.stops.length * 2) {
    plan.status = "approved";
  }
}

// ─── Plan Refinement ─────────────────────────────────────────

export function refinePlan(planId: string): GroupPlan | null {
  const plan = mockPlans.get(planId);
  if (!plan) return null;

  // Remove stops with negative scores
  plan.stops = plan.stops.filter((s) => s.score >= 0);

  // Re-order by score (highest first for the remaining)
  plan.stops.sort((a, b) => b.score - a.score);
  plan.stops.forEach((s, i) => (s.order = i + 1));

  plan.status = "voting";
  plan.consensusScore = 0;
  plan.totalVotes = 0;
  plan.stops.forEach((s) => {
    s.votes = [];
    s.score = 0;
  });

  mockPlans.set(planId, plan);
  return plan;
}

// ─── Creative Plan Naming ────────────────────────────────────

async function generatePlanName(
  group: Group,
  categories: string[]
): Promise<{ name: string; subtitle: string; emoji: string }> {
  try {
    const config = getAIConfig();
    if (!config) throw new Error("No AI config");

    const response = await chat([
      { role: "system", content: PLAN_NAME_PROMPT },
      {
        role: "user",
        content: `Group: "${group.name}" (${group.type})\nCity: ${group.settings.defaultCity}\nCategories: ${categories.join(", ")}\nMembers: ${group.members.length} people`,
      },
    ]);

    const parsed = JSON.parse(response.content);
    return {
      name: parsed.name || "The Confetti Plan",
      subtitle: parsed.subtitle || "Curated just for your crew",
      emoji: parsed.emoji || "🎯",
    };
  } catch {
    return generatePlanNameLocal(group.type, categories, group.settings.defaultCity);
  }
}

function generatePlanNameLocal(
  type: GroupType,
  categories: string[],
  city: string
): { name: string; subtitle: string; emoji: string } {
  const cityShort = city.split(",")[0].trim();

  const nameTemplates: Record<GroupType, string[]> = {
    friends: [
      `The ${cityShort} Crawl`,
      `Midnight ${cityShort} Express`,
      `Vibes & Bites Tour`,
      `The Golden Hour Circuit`,
      `Neon Nights ${cityShort}`,
      `The Flavor Trail`,
      `After Dark Adventure`,
      `The Rooftop Rally`,
    ],
    family: [
      `The Tiny Human Trail`,
      `Family Flavor Safari`,
      `The ${cityShort} Discovery Day`,
      `Little Explorers Big City`,
      `The Fun Zone Express`,
      `Sunset Family Crawl`,
      `Adventure Squad Outing`,
      `The Happy Trail`,
    ],
    company: [
      `Quarter-End Celebration Express`,
      `The Team Recharge Tour`,
      `Office Escape Route`,
      `The ${cityShort} Team Build`,
      `Culture & Cocktails Circuit`,
      `The Power Hour Crawl`,
      `Team Vibe Check Tour`,
      `The After-Five Express`,
    ],
    custom: [
      `The ${cityShort} Confetti`,
      `Curated Night Out`,
      `The Perfect Plan`,
      `Good Times Express`,
      `The Local's Circuit`,
      `Hidden Gems Tour`,
      `The Signature Route`,
      `The Ultimate Outing`,
    ],
  };

  const subtitleTemplates = [
    "Curated by Confetti AI, approved by the crew",
    "Five stops, zero regrets",
    `The best of ${cityShort} in one night`,
    "Every stop handpicked for your group",
    "From first sip to last bite",
    "Your crew, your vibe, your night",
  ];

  const emojis = ["🔥", "✨", "🌙", "🎉", "🍸", "🌆", "🎯", "💫"];

  const names = nameTemplates[type];
  const name = names[Math.floor(Math.random() * names.length)];
  const subtitle = subtitleTemplates[Math.floor(Math.random() * subtitleTemplates.length)];
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];

  // Try to incorporate a category into the name
  if (categories.length > 0 && Math.random() > 0.5) {
    const cat = categories[0];
    const catNames = [
      `Sunset & ${cat} Session`,
      `The ${cat} Express`,
      `${cat} & Good Vibes`,
    ];
    return {
      name: catNames[Math.floor(Math.random() * catNames.length)],
      subtitle,
      emoji,
    };
  }

  return { name, subtitle, emoji };
}

function generateStopNote(venue: DiscoveredVenue, groupType: GroupType): string {
  const notes: Record<GroupType, string[]> = {
    friends: [
      `Group favorite — ${venue.vibeMatch || 90}% vibe match across your crew.`,
      `This spot hits different with the whole squad.`,
      `Three of you have this cuisine in your top picks.`,
      `Perfect energy for the group right now.`,
    ],
    family: [
      `Kid-approved and parent-friendly — win-win.`,
      `All ages welcome, and the reviews mention great family vibes.`,
      `Fun for the little ones, cocktails for the grown-ups.`,
      `The whole family can find something to love here.`,
    ],
    company: [
      `Great for team bonding — open layout, easy conversation.`,
      `Professional but not stuffy — ideal for your team.`,
      `Private area available for group seating.`,
      `Popular pick for company outings in the area.`,
    ],
    custom: [
      `High vibe match for your group's combined taste.`,
      `This one stood out across everyone's preferences.`,
      `A crowd-pleaser with something for everyone.`,
      `Top-rated and group-friendly — solid pick.`,
    ],
  };

  const typeNotes = notes[groupType];
  return typeNotes[Math.floor(Math.random() * typeNotes.length)];
}

// ─── Getters ──────────────────────────────────────────────────

export function getGroup(groupId: string): Group | null {
  return mockGroups.get(groupId) ?? null;
}

export function getUserGroups(userId: string): Group[] {
  return Array.from(mockGroups.values()).filter((g) =>
    g.members.some((m) => m.userId === userId)
  );
}

export function getGroupPlans(groupId: string): GroupPlan[] {
  return Array.from(mockPlans.values()).filter((p) => p.groupId === groupId);
}

export function getPlan(planId: string): GroupPlan | null {
  return mockPlans.get(planId) ?? null;
}

export function approvePlan(planId: string): GroupPlan | null {
  const plan = mockPlans.get(planId);
  if (!plan) return null;
  plan.status = "approved";
  mockPlans.set(planId, plan);
  return plan;
}

// ─── Demo Seed ───────────────────────────────────────────────

export function seedDemoGroup(): Group {
  // Create a pre-populated demo group for showcase
  const group = createGroupLocal("The Saturday Crew", "friends", "demo-user", "Tyrone Crossland");

  // Add mock members
  inviteMember(group.id, "user-maya", "Maya Johnson");
  inviteMember(group.id, "user-jules", "Jules Carter");
  inviteMember(group.id, "user-devon", "Devon Park");

  // Mark them as joined
  const g = mockGroups.get(group.id)!;
  g.members.forEach((m) => {
    if (m.status === "invited") {
      m.status = "joined";
      m.joinedAt = new Date().toISOString();
    }
  });

  // Submit categories
  submitCategories(group.id, "demo-user", ["Rooftop Bars", "Casual Eats", "Live Music"]);
  submitCategories(group.id, "user-maya", ["Fine Dining", "Speakeasies", "Live Music"]);
  submitCategories(group.id, "user-jules", ["Street Food", "Dive Bars", "Late Night"]);
  submitCategories(group.id, "user-devon", ["Rooftop Bars", "Cocktail Crawl", "Dance Clubs"]);

  mockGroups.set(group.id, g);
  return g;
}
