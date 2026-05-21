/**
 * Business Portal Agent
 *
 * Handles the business-facing portal experience for Confetti.
 * After a business is approved via Admin Alerts, this agent manages:
 *  - Magic-link invite generation + email delivery
 *  - Portal session authentication (token-based)
 *  - Business profile management (hours, photos, menu)
 *  - Venue editing and multi-venue management
 *  - Portal navigation state
 *
 * Interlocks with:
 *  - boost-credits.ts → business registration, tiers, campaigns, coupons
 *  - admin-alerts.ts → approval triggers invite generation
 *  - orchestrator.ts → fires "business:portal_activated" event
 */

import {
  getBusiness,
  getBusinessByEmail,
  getTeamMembers,
  getBusinessCampaigns,
  getBusinessAnalytics,
  validateBusinessInvite,
  type BusinessAccount,
  type TeamMember,
  type BoostCampaign,
  type BoostAnalytics,
} from "./boost-credits";

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export type PortalSection =
  | "dashboard"
  | "campaigns"
  | "coupons"
  | "venue"
  | "team"
  | "analytics"
  | "credits"
  | "settings";

export interface PortalSession {
  id: string;
  businessId: string;
  memberId: string;
  email: string;
  role: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  lastActiveAt: string;
  isValid: boolean;
}

export interface VenueProfile {
  id: string;
  businessId: string;
  name: string;
  description: string;
  category: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  website?: string;
  hours: VenueHours;
  photos: VenuePhoto[];
  menuItems: MenuItem[];
  amenities: string[];
  priceRange: "$" | "$$" | "$$$" | "$$$$";
  reservationUrl?: string;
  socialLinks: {
    instagram?: string;
    tiktok?: string;
    facebook?: string;
    yelp?: string;
  };
  updatedAt: string;
}

export interface VenueHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  open: string; // "11:00"
  close: string; // "23:00"
  isClosed: boolean;
}

export interface VenuePhoto {
  id: string;
  url: string;
  caption?: string;
  isPrimary: boolean;
  uploadedAt: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string; // "appetizers", "cocktails", "mains", etc.
  isPopular: boolean;
  photoUrl?: string;
}

export interface InviteEmail {
  to: string;
  businessName: string;
  inviteUrl: string;
  type: "portal_access" | "team_invite";
  sentAt: string;
}

export interface PortalNotification {
  id: string;
  businessId: string;
  type: "campaign_live" | "coupon_redeemed" | "check_in" | "review" | "credit_low" | "team_joined";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════
// In-Memory Store
// ═══════════════════════════════════════════════════════════

const sessionStore = new Map<string, PortalSession>();
const venueProfileStore = new Map<string, VenueProfile>();
const inviteEmailStore = new Map<string, InviteEmail>();
const notificationStore = new Map<string, PortalNotification>();

let idCounter = 5000;
function nextId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${(idCounter++).toString(36)}`;
}

// ═══════════════════════════════════════════════════════════
// Portal Session Management
// ═══════════════════════════════════════════════════════════

/** Generate a magic-link URL for a business to access their portal */
export function generatePortalInviteLink(businessId: string): string | null {
  const business = getBusiness(businessId);
  if (!business || !business.inviteToken) return null;
  return `/portal/invite/${business.inviteToken}`;
}

/** Create a portal session from an invite token */
export function createPortalSession(token: string): PortalSession | null {
  const business = validateBusinessInvite(token);
  if (!business) return null;

  const members = getTeamMembers(business.id);
  const owner = members.find((m) => m.role === "owner");
  if (!owner) return null;

  const session: PortalSession = {
    id: nextId("psess"),
    businessId: business.id,
    memberId: owner.id,
    email: owner.email,
    role: owner.role,
    token: `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    lastActiveAt: new Date().toISOString(),
    isValid: true,
  };

  sessionStore.set(session.token, session);
  return session;
}

/** Create a session from email login */
export function createSessionByEmail(email: string): PortalSession | null {
  const business = getBusinessByEmail(email);
  if (!business) return null;

  const members = getTeamMembers(business.id);
  const member = members.find((m) => m.email === email && m.isActive);
  if (!member) return null;

  const session: PortalSession = {
    id: nextId("psess"),
    businessId: business.id,
    memberId: member.id,
    email: member.email,
    role: member.role,
    token: `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastActiveAt: new Date().toISOString(),
    isValid: true,
  };

  sessionStore.set(session.token, session);
  return session;
}

/** Validate an active portal session */
export function validateSession(sessionToken: string): PortalSession | null {
  const session = sessionStore.get(sessionToken);
  if (!session || !session.isValid) return null;
  if (new Date(session.expiresAt) < new Date()) {
    session.isValid = false;
    return null;
  }
  session.lastActiveAt = new Date().toISOString();
  return session;
}

/** End a portal session */
export function endSession(sessionToken: string): boolean {
  const session = sessionStore.get(sessionToken);
  if (!session) return false;
  session.isValid = false;
  return true;
}

// ═══════════════════════════════════════════════════════════
// Invite Email Generation
// ═══════════════════════════════════════════════════════════

/** Queue an invite email for a newly approved business */
export function queuePortalInviteEmail(businessId: string): InviteEmail | null {
  const business = getBusiness(businessId);
  if (!business) return null;

  const inviteUrl = generatePortalInviteLink(businessId);
  if (!inviteUrl) return null;

  const email: InviteEmail = {
    to: business.contactEmail,
    businessName: business.businessName,
    inviteUrl,
    type: "portal_access",
    sentAt: new Date().toISOString(),
  };

  inviteEmailStore.set(`${businessId}_portal`, email);
  return email;
}

/** Queue a team invite email */
export function queueTeamInviteEmail(
  businessId: string,
  member: TeamMember
): InviteEmail | null {
  const business = getBusiness(businessId);
  if (!business || !member.inviteToken) return null;

  const email: InviteEmail = {
    to: member.email,
    businessName: business.businessName,
    inviteUrl: `/portal/team-invite/${member.inviteToken}`,
    type: "team_invite",
    sentAt: new Date().toISOString(),
  };

  inviteEmailStore.set(`${member.id}_invite`, email);
  return email;
}

// ═══════════════════════════════════════════════════════════
// Venue Profile Management
// ═══════════════════════════════════════════════════════════

/** Create or update a venue profile */
export function upsertVenueProfile(
  businessId: string,
  venueId: string,
  data: Partial<Omit<VenueProfile, "id" | "businessId" | "updatedAt">>
): VenueProfile {
  const existing = venueProfileStore.get(venueId);
  const defaultHours: DayHours = { open: "11:00", close: "23:00", isClosed: false };

  const profile: VenueProfile = {
    id: venueId,
    businessId,
    name: data.name ?? existing?.name ?? "",
    description: data.description ?? existing?.description ?? "",
    category: data.category ?? existing?.category ?? "",
    address: data.address ?? existing?.address ?? "",
    city: data.city ?? existing?.city ?? "",
    state: data.state ?? existing?.state ?? "",
    zipCode: data.zipCode ?? existing?.zipCode ?? "",
    phone: data.phone ?? existing?.phone ?? "",
    website: data.website ?? existing?.website,
    hours: data.hours ?? existing?.hours ?? {
      monday: defaultHours,
      tuesday: defaultHours,
      wednesday: defaultHours,
      thursday: defaultHours,
      friday: defaultHours,
      saturday: { ...defaultHours, close: "02:00" },
      sunday: { open: "12:00", close: "22:00", isClosed: false },
    },
    photos: data.photos ?? existing?.photos ?? [],
    menuItems: data.menuItems ?? existing?.menuItems ?? [],
    amenities: data.amenities ?? existing?.amenities ?? [],
    priceRange: data.priceRange ?? existing?.priceRange ?? "$$",
    reservationUrl: data.reservationUrl ?? existing?.reservationUrl,
    socialLinks: data.socialLinks ?? existing?.socialLinks ?? {},
    updatedAt: new Date().toISOString(),
  };

  venueProfileStore.set(venueId, profile);
  return profile;
}

/** Get a venue profile */
export function getVenueProfile(venueId: string): VenueProfile | null {
  return venueProfileStore.get(venueId) ?? null;
}

/** Add a photo to a venue */
export function addVenuePhoto(
  venueId: string,
  url: string,
  caption?: string,
  isPrimary = false
): VenuePhoto | null {
  const profile = venueProfileStore.get(venueId);
  if (!profile) return null;

  if (isPrimary) {
    profile.photos.forEach((p) => (p.isPrimary = false));
  }

  const photo: VenuePhoto = {
    id: nextId("vp"),
    url,
    caption,
    isPrimary,
    uploadedAt: new Date().toISOString(),
  };

  profile.photos.push(photo);
  profile.updatedAt = new Date().toISOString();
  return photo;
}

/** Add a menu item */
export function addMenuItem(
  venueId: string,
  item: Omit<MenuItem, "id">
): MenuItem | null {
  const profile = venueProfileStore.get(venueId);
  if (!profile) return null;

  const menuItem: MenuItem = {
    id: nextId("mi"),
    ...item,
  };

  profile.menuItems.push(menuItem);
  profile.updatedAt = new Date().toISOString();
  return menuItem;
}

/** Remove a menu item */
export function removeMenuItem(venueId: string, itemId: string): boolean {
  const profile = venueProfileStore.get(venueId);
  if (!profile) return false;
  profile.menuItems = profile.menuItems.filter((i) => i.id !== itemId);
  profile.updatedAt = new Date().toISOString();
  return true;
}

// ═══════════════════════════════════════════════════════════
// Portal Notifications
// ═══════════════════════════════════════════════════════════

/** Push a notification to a business portal */
export function pushPortalNotification(
  businessId: string,
  type: PortalNotification["type"],
  title: string,
  message: string
): PortalNotification {
  const notification: PortalNotification = {
    id: nextId("pn"),
    businessId,
    type,
    title,
    message,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  notificationStore.set(notification.id, notification);
  return notification;
}

/** Get unread notifications for a business */
export function getPortalNotifications(
  businessId: string,
  unreadOnly = false
): PortalNotification[] {
  return Array.from(notificationStore.values())
    .filter((n) => n.businessId === businessId && (!unreadOnly || !n.isRead))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/** Mark notifications as read */
export function markNotificationsRead(notificationIds: string[]): void {
  for (const id of notificationIds) {
    const n = notificationStore.get(id);
    if (n) n.isRead = true;
  }
}

// ═══════════════════════════════════════════════════════════
// Portal Dashboard Aggregation
// ═══════════════════════════════════════════════════════════

export interface PortalDashboardData {
  business: BusinessAccount;
  analytics: BoostAnalytics;
  activeCampaigns: BoostCampaign[];
  teamCount: number;
  venueCount: number;
  notifications: PortalNotification[];
  quickStats: {
    creditBalance: number;
    totalImpressions: number;
    totalCheckIns: number;
    conversionRate: number;
  };
}

/** Get aggregated dashboard data for a business portal */
export function getPortalDashboard(businessId: string): PortalDashboardData | null {
  const business = getBusiness(businessId);
  if (!business) return null;

  const analytics = getBusinessAnalytics(businessId);
  const campaigns = getBusinessCampaigns(businessId);
  const activeCampaigns = campaigns.filter((c) => c.status === "active");
  const team = getTeamMembers(businessId);
  const notifications = getPortalNotifications(businessId).slice(0, 10);

  return {
    business,
    analytics,
    activeCampaigns,
    teamCount: team.filter((m) => m.isActive).length,
    venueCount: business.venueIds.length,
    notifications,
    quickStats: {
      creditBalance: business.creditBalance,
      totalImpressions: analytics.impressions,
      totalCheckIns: analytics.checkIns,
      conversionRate: analytics.conversionRate,
    },
  };
}

// ═══════════════════════════════════════════════════════════
// Demo Seed
// ═══════════════════════════════════════════════════════════

/** Seed demo venue profiles for the portal */
export function seedPortalDemo(businessId: string): VenueProfile | null {
  const business = getBusiness(businessId);
  if (!business || business.venueIds.length === 0) return null;

  const venueId = business.venueIds[0];
  const profile = upsertVenueProfile(businessId, venueId, {
    name: business.businessName,
    description: "An elevated rooftop experience with craft cocktails and panoramic city views.",
    category: business.category ?? "restaurant",
    address: "1430 Rhode Island Ave NW",
    city: business.city,
    state: "DC",
    zipCode: "20005",
    phone: "(202) 555-0147",
    website: "https://lumarooftop.com",
    priceRange: "$$$",
    amenities: ["outdoor seating", "live DJ", "private events", "valet parking"],
    socialLinks: {
      instagram: "@lumarooftop",
      tiktok: "@lumadc",
    },
  });

  // Add some demo photos
  addVenuePhoto(venueId, "https://images.unsplash.com/photo-1559329007-40df8a9345d8?auto=format&fit=crop&w=800&q=80", "Rooftop view at sunset", true);
  addVenuePhoto(venueId, "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80", "Signature cocktails");
  addVenuePhoto(venueId, "https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=800&q=80", "DJ booth Friday nights");

  // Add demo menu items
  addMenuItem(venueId, { name: "Sunset Spritz", description: "Aperol, prosecco, orange", price: 16, category: "cocktails", isPopular: true });
  addMenuItem(venueId, { name: "Wagyu Sliders", description: "Three wagyu sliders, truffle aioli", price: 24, category: "small plates", isPopular: true });
  addMenuItem(venueId, { name: "Tuna Tartare", description: "Ahi tuna, avocado, crispy wonton", price: 19, category: "small plates", isPopular: false });
  addMenuItem(venueId, { name: "Luma Old Fashioned", description: "Woodford Reserve, demerara, orange", price: 18, category: "cocktails", isPopular: false });

  // Push a welcome notification
  pushPortalNotification(
    businessId,
    "campaign_live",
    "Welcome to Confetti!",
    "Your business portal is live. Start by setting up your venue profile and creating your first campaign."
  );

  return profile;
}
