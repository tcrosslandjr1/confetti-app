/**
 * Partnerships Agent
 *
 * Tracks venue deals, influencer agreements, and sponsorship pipeline
 * for Confetti. AI researches and drafts outreach, Tyrone negotiates.
 *
 * Features:
 *   - Full CRM-style partner pipeline (prospect -> signed -> active)
 *   - Activity log for every interaction (emails, calls, meetings)
 *   - Follow-up scheduling with overdue detection
 *   - AI-generated outreach emails from customizable templates
 *   - Revenue tracking and attribution per partner
 *   - Contract expiration alerts
 *   - Pipeline dashboard with metrics
 */

import { supabase } from "../supabase";

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export type PartnerType = "venue" | "influencer" | "sponsor" | "media" | "technology" | "event";
export type DealStage = "prospect" | "outreach" | "negotiating" | "contract_sent" | "signed" | "active" | "churned" | "declined";
export type PartnerTier = "bronze" | "silver" | "gold" | "platinum";

export interface Partner {
  id: string;
  name: string;
  type: PartnerType;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  socialHandle?: string;
  tier: PartnerTier;
  stage: DealStage;
  dealValue?: number;
  revenueShare?: number;
  contractStartDate?: string;
  contractEndDate?: string;
  notes: string[];
  tags: string[];
  lastContactAt?: string;
  nextFollowUpAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DealActivity {
  id: string;
  partnerId: string;
  type: "email" | "call" | "meeting" | "note" | "contract" | "payment";
  description: string;
  performedBy: string;
  timestamp: string;
}

export interface PartnershipMetrics {
  totalPartners: number;
  activeDeals: number;
  pipelineValue: number;
  monthlyRevenue: number;
  byType: Record<PartnerType, number>;
  byStage: Record<DealStage, number>;
  conversionRate: number;
}

export interface OutreachTemplate {
  id: string;
  name: string;
  type: PartnerType;
  subject: string;
  body: string;
  variables: string[];
}

// ═══════════════════════════════════════════════════════════
// In-Memory Store (local-first)
// ═══════════════════════════════════════════════════════════

const partnerStore = new Map<string, Partner>();
const activityStore = new Map<string, DealActivity[]>();
const templateStore = new Map<string, OutreachTemplate>();

let idCounter = 9000;
function nextId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${(idCounter++).toString(36)}`;
}

// ═══════════════════════════════════════════════════════════
// Outreach Templates (defaults)
// ═══════════════════════════════════════════════════════════

const DEFAULT_TEMPLATES: OutreachTemplate[] = [
  {
    id: "tmpl_venue_intro",
    name: "Venue Introduction",
    type: "venue",
    subject: "Partnership Opportunity with Confetti — {{venueName}}",
    body: `Hi {{contactName}},

I'm reaching out from Confetti, an AI-powered dining and nightlife concierge that helps people discover incredible venues like {{venueName}}.

We're building partnerships with standout spots in {{city}} to drive foot traffic through curated itineraries and exclusive experiences. Our users are exactly the kind of engaged, experience-seeking crowd that loves discovering new favorites.

Would you be open to a quick chat about how we could work together? We have several partnership tiers designed to fit different needs.

Best,
Tyrone — Confetti`,
    variables: ["contactName", "venueName", "city"],
  },
  {
    id: "tmpl_influencer_collab",
    name: "Influencer Collaboration",
    type: "influencer",
    subject: "Confetti x {{influencerName}} — Let's Create Something Fun",
    body: `Hey {{contactName}},

Love what you're doing on {{platform}}! Your content around {{niche}} is exactly the vibe Confetti is all about.

We're an AI-powered nightlife and dining concierge, and we're looking for creators who can authentically share the experience of using Confetti to plan amazing nights out.

We offer:
- Complimentary Confetti Black membership
- Sponsored outings with content creation opportunities
- Revenue share on referral signups

Would love to explore a collaboration. Free to chat this week?

Tyrone — Confetti`,
    variables: ["contactName", "influencerName", "platform", "niche"],
  },
  {
    id: "tmpl_sponsor_pitch",
    name: "Sponsor Pitch",
    type: "sponsor",
    subject: "Sponsorship Opportunity — Confetti's {{eventName}}",
    body: `Hi {{contactName}},

Confetti is hosting {{eventName}} and we're looking for brand partners who want to reach an engaged audience of dining and nightlife enthusiasts.

Our platform reaches {{userCount}} active users across major metro areas, with high engagement rates on curated experiences.

Sponsorship packages include:
- Brand placement in AI-generated itineraries
- Co-branded experiences and events
- Push notification and in-app features

Happy to send over our full deck. When works for a quick call?

Best,
Tyrone — Confetti`,
    variables: ["contactName", "eventName", "userCount"],
  },
];

// Initialize default templates
DEFAULT_TEMPLATES.forEach((t) => templateStore.set(t.id, t));

// ═══════════════════════════════════════════════════════════
// Partner Management
// ═══════════════════════════════════════════════════════════

/** Create a new partner as a prospect */
export function addPartner(
  name: string,
  type: PartnerType,
  contactName: string,
  contactEmail: string,
  metadata?: Partial<Pick<Partner, "contactPhone" | "website" | "socialHandle" | "dealValue" | "revenueShare" | "tags" | "notes">>
): Partner {
  const partner: Partner = {
    id: nextId("ptr"),
    name,
    type,
    contactName,
    contactEmail,
    contactPhone: metadata?.contactPhone,
    website: metadata?.website,
    socialHandle: metadata?.socialHandle,
    tier: "bronze",
    stage: "prospect",
    dealValue: metadata?.dealValue,
    revenueShare: metadata?.revenueShare,
    notes: metadata?.notes ?? [],
    tags: metadata?.tags ?? [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  partnerStore.set(partner.id, partner);
  activityStore.set(partner.id, []);

  // Log creation activity
  addActivity(partner.id, "note", `Partner created as ${type} prospect`, "system");

  return partner;
}

/** Advance a partner through the deal pipeline */
export function updatePartnerStage(partnerId: string, stage: DealStage): Partner | null {
  const partner = partnerStore.get(partnerId);
  if (!partner) return null;

  const previousStage = partner.stage;
  partner.stage = stage;
  partner.updatedAt = new Date().toISOString();

  // Auto-set contract dates when signed
  if (stage === "signed" && !partner.contractStartDate) {
    partner.contractStartDate = new Date().toISOString();
    // Default 12-month contract
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);
    partner.contractEndDate = endDate.toISOString();
  }

  // Auto-upgrade tier based on deal value when activated
  if (stage === "active" && partner.dealValue) {
    if (partner.dealValue >= 10000) partner.tier = "platinum";
    else if (partner.dealValue >= 5000) partner.tier = "gold";
    else if (partner.dealValue >= 2000) partner.tier = "silver";
  }

  addActivity(partnerId, "note", `Stage changed: ${previousStage} -> ${stage}`, "system");

  return partner;
}

/** Log an interaction with a partner */
export function addActivity(
  partnerId: string,
  type: DealActivity["type"],
  description: string,
  performedBy: string
): DealActivity | null {
  const partner = partnerStore.get(partnerId);
  if (!partner) return null;

  const activity: DealActivity = {
    id: nextId("act"),
    partnerId,
    type,
    description,
    performedBy,
    timestamp: new Date().toISOString(),
  };

  const activities = activityStore.get(partnerId) ?? [];
  activities.push(activity);
  activityStore.set(partnerId, activities);

  // Update last contact timestamp
  if (type !== "note") {
    partner.lastContactAt = activity.timestamp;
    partner.updatedAt = activity.timestamp;
  }

  return activity;
}

/** Schedule a follow-up date for a partner */
export function setFollowUp(partnerId: string, date: string): Partner | null {
  const partner = partnerStore.get(partnerId);
  if (!partner) return null;

  partner.nextFollowUpAt = date;
  partner.updatedAt = new Date().toISOString();
  return partner;
}

/** Get all partners with overdue follow-ups */
export function getOverdueFollowUps(): Partner[] {
  const now = new Date().toISOString();
  return Array.from(partnerStore.values()).filter(
    (p) => p.nextFollowUpAt && p.nextFollowUpAt < now && !["churned", "declined"].includes(p.stage)
  );
}

// ═══════════════════════════════════════════════════════════
// AI Outreach Generation
// ═══════════════════════════════════════════════════════════

/** Generate personalized outreach email based on partner info and optional template */
export function generateOutreach(
  partnerId: string,
  templateId?: string
): { subject: string; body: string } | null {
  const partner = partnerStore.get(partnerId);
  if (!partner) return null;

  // Find matching template
  let template: OutreachTemplate | undefined;
  if (templateId) {
    template = templateStore.get(templateId);
  } else {
    // Auto-select by partner type
    template = Array.from(templateStore.values()).find((t) => t.type === partner.type);
  }

  if (!template) {
    // Fallback generic outreach
    return {
      subject: `Partnership Opportunity — Confetti x ${partner.name}`,
      body: `Hi ${partner.contactName},\n\nI'm Tyrone from Confetti, an AI-powered dining and nightlife concierge. We're exploring a ${partner.type} partnership with ${partner.name} and would love to chat about how we could work together.\n\nWhen would be a good time to connect?\n\nBest,\nTyrone — Confetti`,
    };
  }

  // Variable replacement map
  const vars: Record<string, string> = {
    contactName: partner.contactName,
    venueName: partner.name,
    influencerName: partner.name,
    city: "your city",
    platform: partner.socialHandle ? "social media" : "your platform",
    niche: "lifestyle and nightlife",
    eventName: "our next community event",
    userCount: "10,000+",
  };

  let subject = template.subject;
  let body = template.body;

  for (const [key, value] of Object.entries(vars)) {
    const placeholder = `{{${key}}}`;
    subject = subject.replace(new RegExp(placeholder.replace(/[{}]/g, "\\$&"), "g"), value);
    body = body.replace(new RegExp(placeholder.replace(/[{}]/g, "\\$&"), "g"), value);
  }

  return { subject, body };
}

// ═══════════════════════════════════════════════════════════
// Pipeline & Retrieval
// ═══════════════════════════════════════════════════════════

/** Get pipeline view, optionally filtered by partner type */
export function getPartnerPipeline(type?: PartnerType): Record<DealStage, Partner[]> {
  const pipeline: Record<DealStage, Partner[]> = {
    prospect: [],
    outreach: [],
    negotiating: [],
    contract_sent: [],
    signed: [],
    active: [],
    churned: [],
    declined: [],
  };

  for (const partner of partnerStore.values()) {
    if (type && partner.type !== type) continue;
    pipeline[partner.stage].push(partner);
  }

  return pipeline;
}

/** Get a single partner by ID */
export function getPartnerById(partnerId: string): (Partner & { activities: DealActivity[] }) | null {
  const partner = partnerStore.get(partnerId);
  if (!partner) return null;
  const activities = activityStore.get(partnerId) ?? [];
  return { ...partner, activities };
}

/** Search partners by name, email, or tags */
export function searchPartners(query: string): Partner[] {
  const q = query.toLowerCase();
  return Array.from(partnerStore.values()).filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.contactEmail.toLowerCase().includes(q) ||
      p.contactName.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q))
  );
}

// ═══════════════════════════════════════════════════════════
// Metrics & Revenue
// ═══════════════════════════════════════════════════════════

/** Get partnership dashboard metrics */
export function getPartnershipMetrics(): PartnershipMetrics {
  const partners = Array.from(partnerStore.values());

  const byType: Record<PartnerType, number> = {
    venue: 0, influencer: 0, sponsor: 0, media: 0, technology: 0, event: 0,
  };
  const byStage: Record<DealStage, number> = {
    prospect: 0, outreach: 0, negotiating: 0, contract_sent: 0, signed: 0, active: 0, churned: 0, declined: 0,
  };

  let pipelineValue = 0;
  let monthlyRevenue = 0;
  let signedOrActive = 0;

  for (const p of partners) {
    byType[p.type]++;
    byStage[p.stage]++;
    if (["prospect", "outreach", "negotiating", "contract_sent"].includes(p.stage)) {
      pipelineValue += p.dealValue ?? 0;
    }
    if (p.stage === "active") {
      monthlyRevenue += (p.revenueShare ?? 0);
    }
    if (p.stage === "signed" || p.stage === "active") {
      signedOrActive++;
    }
  }

  const totalWithOutcome = signedOrActive + byStage.declined + byStage.churned;

  return {
    totalPartners: partners.length,
    activeDeals: byStage.active,
    pipelineValue,
    monthlyRevenue,
    byType,
    byStage,
    conversionRate: totalWithOutcome > 0 ? signedOrActive / totalWithOutcome : 0,
  };
}

/** Get contracts expiring within N days (default 30) */
export function getExpiringContracts(days: number = 30): Partner[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);
  const cutoffStr = cutoff.toISOString();

  return Array.from(partnerStore.values()).filter(
    (p) =>
      p.contractEndDate &&
      p.contractEndDate <= cutoffStr &&
      ["signed", "active"].includes(p.stage)
  );
}

/** Get revenue attribution by partner */
export function getRevenueByPartner(): Array<{ partner: Partner; monthlyRevenue: number; totalDealValue: number }> {
  return Array.from(partnerStore.values())
    .filter((p) => p.stage === "active")
    .map((p) => ({
      partner: p,
      monthlyRevenue: p.revenueShare ?? 0,
      totalDealValue: p.dealValue ?? 0,
    }))
    .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue);
}

// ═══════════════════════════════════════════════════════════
// Template Management
// ═══════════════════════════════════════════════════════════

/** Create a new outreach template */
export function createTemplate(
  name: string,
  type: PartnerType,
  subject: string,
  body: string,
  variables: string[]
): OutreachTemplate {
  const template: OutreachTemplate = {
    id: nextId("tmpl"),
    name,
    type,
    subject,
    body,
    variables,
  };
  templateStore.set(template.id, template);
  return template;
}

/** Get available templates, optionally by partner type */
export function getTemplates(type?: PartnerType): OutreachTemplate[] {
  const templates = Array.from(templateStore.values());
  if (type) return templates.filter((t) => t.type === type);
  return templates;
}

// ═══════════════════════════════════════════════════════════
// Demo Seed
// ═══════════════════════════════════════════════════════════

/** Create sample partners across stages + activities for demo */
export function seedPartnershipsDemo(): Partner[] {
  const samples: Array<{
    name: string;
    type: PartnerType;
    contactName: string;
    contactEmail: string;
    stage: DealStage;
    tier: PartnerTier;
    dealValue?: number;
    revenueShare?: number;
    tags: string[];
  }> = [
    {
      name: "The Blue Room",
      type: "venue",
      contactName: "Marcus Chen",
      contactEmail: "marcus@theblueroom.com",
      stage: "active",
      tier: "gold",
      dealValue: 5000,
      revenueShare: 500,
      tags: ["dc", "lounge", "cocktails"],
    },
    {
      name: "Mama's Kitchen",
      type: "venue",
      contactName: "Gloria Reyes",
      contactEmail: "gloria@mamaskitchen.com",
      stage: "signed",
      tier: "silver",
      dealValue: 2500,
      revenueShare: 250,
      tags: ["dc", "restaurant", "soul-food"],
    },
    {
      name: "NightVibes ATL",
      type: "influencer",
      contactName: "Jasmine Brooks",
      contactEmail: "jasmine@nightvibesatl.com",
      stage: "negotiating",
      tier: "bronze",
      dealValue: 1500,
      tags: ["atlanta", "nightlife", "instagram", "50k-followers"],
    },
    {
      name: "UrbanEats Co.",
      type: "sponsor",
      contactName: "David Park",
      contactEmail: "david@urbaneats.co",
      stage: "outreach",
      tier: "bronze",
      dealValue: 10000,
      tags: ["food-delivery", "sponsor", "national"],
    },
    {
      name: "DMV Foodie Blog",
      type: "media",
      contactName: "Keisha Williams",
      contactEmail: "keisha@dmvfoodie.com",
      stage: "prospect",
      tier: "bronze",
      tags: ["media", "blog", "dmv", "food"],
    },
    {
      name: "Rooftop Social NYC",
      type: "venue",
      contactName: "Anthony Russo",
      contactEmail: "anthony@rooftopsocial.nyc",
      stage: "contract_sent",
      tier: "bronze",
      dealValue: 7500,
      revenueShare: 750,
      tags: ["nyc", "rooftop", "upscale"],
    },
    {
      name: "EventBrite Local",
      type: "technology",
      contactName: "Sarah Lin",
      contactEmail: "sarah@eventbrite.com",
      stage: "declined",
      tier: "bronze",
      dealValue: 15000,
      tags: ["technology", "events", "integration"],
    },
    {
      name: "Club Mirage Miami",
      type: "venue",
      contactName: "Carlos Mendez",
      contactEmail: "carlos@clubmiragemmi.com",
      stage: "churned",
      tier: "silver",
      dealValue: 4000,
      tags: ["miami", "club", "nightlife"],
    },
  ];

  const created: Partner[] = [];

  for (const s of samples) {
    const partner = addPartner(s.name, s.type, s.contactName, s.contactEmail, {
      dealValue: s.dealValue,
      revenueShare: s.revenueShare,
      tags: s.tags,
    });

    // Set the stage and tier directly
    partner.stage = s.stage;
    partner.tier = s.tier;

    if (s.stage === "active" || s.stage === "signed") {
      const start = new Date();
      start.setMonth(start.getMonth() - 3);
      partner.contractStartDate = start.toISOString();
      const end = new Date();
      end.setMonth(end.getMonth() + 9);
      partner.contractEndDate = end.toISOString();
    }

    // Add sample activities
    if (s.stage !== "prospect") {
      addActivity(partner.id, "email", `Initial outreach sent to ${s.contactName}`, "Tyrone");
    }
    if (["negotiating", "contract_sent", "signed", "active"].includes(s.stage)) {
      addActivity(partner.id, "call", `Discovery call with ${s.contactName} — discussed partnership terms`, "Tyrone");
    }
    if (["contract_sent", "signed", "active"].includes(s.stage)) {
      addActivity(partner.id, "contract", "Partnership agreement sent for review", "Tyrone");
    }
    if (["signed", "active"].includes(s.stage)) {
      addActivity(partner.id, "contract", "Contract signed and countersigned", s.contactName);
    }
    if (s.stage === "active") {
      addActivity(partner.id, "payment", `First revenue share payment: $${s.revenueShare}`, "system");
    }

    // Set follow-ups for active pipeline
    if (["prospect", "outreach", "negotiating", "contract_sent"].includes(s.stage)) {
      const followUp = new Date();
      followUp.setDate(followUp.getDate() + Math.floor(Math.random() * 14) - 3); // some overdue
      setFollowUp(partner.id, followUp.toISOString());
    }

    created.push(partner);
  }

  return created;
}
