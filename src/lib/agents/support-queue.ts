/**
 * Support Queue Agent
 *
 * AI-powered customer support triage built for a one-man company.
 * Handles ticket creation, auto-categorization, AI draft responses,
 * escalation rules, and resolution tracking.
 *
 * Flow:
 *  1. User submits a ticket (in-app, email, etc.)
 *  2. AI classifies category + priority using keyword patterns
 *  3. AI generates a draft response for common issues
 *  4. Escalation rules route billing, legal, and crash reports to Tyrone
 *  5. AI auto-resolves simple queries (password resets, how-to, general)
 *  6. Admin dashboard shows queue, escalated tickets, and resolution stats
 *
 * Escalation rules:
 *  - Billing always escalates
 *  - Bugs with "crash" or "data loss" escalate
 *  - Anything mentioning "legal" or "lawsuit" escalates
 *
 * AI auto-responds to:
 *  - Password resets, how-to questions, feature info, general inquiries
 */

import { supabase } from "../supabase";

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export type TicketPriority = "p1_critical" | "p2_high" | "p3_medium" | "p4_low";
export type TicketStatus = "new" | "ai_responded" | "escalated" | "awaiting_user" | "resolved" | "closed";
export type TicketCategory = "bug" | "feature_request" | "billing" | "account" | "venue_issue" | "booking_problem" | "general";

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  aiResponse?: string;
  escalationReason?: string;
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  role: "user" | "ai" | "admin";
  content: string;
  timestamp: string;
}

export interface EscalationRule {
  category: TicketCategory;
  keywords: string[];
  autoPriority: TicketPriority;
  requiresHuman: boolean;
}

export interface TicketQueueFilter {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
}

export interface TicketStats {
  totalTickets: number;
  byStatus: Record<TicketStatus, number>;
  byPriority: Record<TicketPriority, number>;
  byCategory: Record<TicketCategory, number>;
  avgResolutionTimeMs: number;
  aiResolutionRate: number;
  escalationRate: number;
}

// ═══════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════

const ESCALATION_RULES: EscalationRule[] = [
  {
    category: "billing",
    keywords: ["charge", "refund", "payment", "invoice", "subscription", "billing", "price", "cost", "money"],
    autoPriority: "p2_high",
    requiresHuman: true,
  },
  {
    category: "bug",
    keywords: ["crash", "data loss", "lost data", "deleted", "wiped", "corrupted", "broken"],
    autoPriority: "p1_critical",
    requiresHuman: true,
  },
  {
    category: "general",
    keywords: ["legal", "lawsuit", "attorney", "lawyer", "sue", "court", "litigation"],
    autoPriority: "p1_critical",
    requiresHuman: true,
  },
];

const CATEGORY_KEYWORDS: Record<TicketCategory, string[]> = {
  bug: ["bug", "error", "crash", "broken", "not working", "glitch", "issue", "fail", "stuck", "freeze", "slow"],
  feature_request: ["feature", "add", "wish", "would be nice", "suggestion", "could you", "please add", "request", "idea", "improve"],
  billing: ["billing", "charge", "payment", "refund", "subscription", "invoice", "price", "cancel", "upgrade", "downgrade"],
  account: ["account", "login", "password", "sign in", "email", "profile", "settings", "delete account", "reset"],
  venue_issue: ["venue", "restaurant", "bar", "club", "closed", "wrong address", "wrong hours", "menu", "location"],
  booking_problem: ["booking", "reservation", "table", "cancelled", "no show", "waitlist", "confirm", "rsvp"],
  general: ["help", "question", "how to", "info", "about", "what is", "where", "contact"],
};

const AI_RESPONSE_TEMPLATES: Record<string, string> = {
  password_reset: "Hi there! To reset your password, tap the profile icon > Settings > Account > Reset Password. You'll receive an email with a reset link within a few minutes. If you don't see it, check your spam folder. Let me know if you need anything else!",
  how_to_plan: "Great question! To create a plan in Confetti, just tap the + button on the home screen and tell our AI concierge what kind of night you're looking for. You can specify vibes, budget, group size, and more. The AI will generate a curated itinerary with multiple stops!",
  how_to_group: "To start a group plan, go to the Groups tab and tap 'Create Group.' Share the invite code with your friends, and once everyone joins, each person picks their vibe preferences. Our AI merges everyone's tastes into one perfect plan!",
  feature_info: "Thanks for reaching out! Confetti is an AI-powered dining and nightlife concierge. We help you discover amazing venues, plan group outings, and earn rewards when you check in at partner spots. Want to know about a specific feature?",
  general_inquiry: "Thanks for reaching out to Confetti! I'd be happy to help. Could you give me a bit more detail about what you're looking for? I'll do my best to point you in the right direction.",
  venue_report: "Thanks for reporting this venue issue! We take accuracy seriously. I've flagged this for our team to review, and we'll update the venue information as quickly as possible. If you have specific corrections (hours, address, etc.), please share them and we'll fast-track the update.",
  booking_help: "I understand booking issues can be frustrating. Let me look into this for you. In the meantime, you can check your reservation status under Profile > My Bookings. If you need to make changes, you can also contact the venue directly through the venue detail page in the app.",
  bug_acknowledged: "Sorry you're running into this! I've logged the issue and our team will investigate. In the meantime, try force-closing the app and reopening it. If you're on an older version, updating to the latest release from the App Store often fixes known bugs.",
};

// ═══════════════════════════════════════════════════════════
// In-Memory Store (local-first)
// ═══════════════════════════════════════════════════════════

const ticketStore = new Map<string, SupportTicket>();
const messageStore = new Map<string, TicketMessage[]>();

let idCounter = 5000;
function nextId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${(idCounter++).toString(36)}`;
}

// ═══════════════════════════════════════════════════════════
// Ticket Classification
// ═══════════════════════════════════════════════════════════

/** AI classification using keyword patterns for category + priority */
export function classifyTicket(ticket: Pick<SupportTicket, "subject" | "description">): {
  category: TicketCategory;
  priority: TicketPriority;
  requiresHuman: boolean;
  escalationReason?: string;
} {
  const text = `${ticket.subject} ${ticket.description}`.toLowerCase();

  // Score each category by keyword matches
  let bestCategory: TicketCategory = "general";
  let bestScore = 0;

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.filter((kw) => text.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestCategory = cat as TicketCategory;
    }
  }

  // Check escalation rules
  let priority: TicketPriority = "p4_low";
  let requiresHuman = false;
  let escalationReason: string | undefined;

  for (const rule of ESCALATION_RULES) {
    const matches = rule.keywords.filter((kw) => text.includes(kw));
    if (matches.length > 0) {
      // Use the highest priority (lowest p-number) found
      if (comparePriority(rule.autoPriority, priority) > 0) {
        priority = rule.autoPriority;
      }
      if (rule.requiresHuman) {
        requiresHuman = true;
        escalationReason = `Auto-escalated: matched keywords [${matches.join(", ")}] in category "${rule.category}"`;
      }
    }
  }

  // Default priority by category if not escalated
  if (!requiresHuman) {
    switch (bestCategory) {
      case "bug":
        priority = "p3_medium";
        break;
      case "billing":
        priority = "p2_high";
        requiresHuman = true;
        escalationReason = "Billing issues always require human review";
        break;
      case "booking_problem":
        priority = "p3_medium";
        break;
      case "feature_request":
        priority = "p4_low";
        break;
      case "account":
        priority = "p3_medium";
        break;
      default:
        priority = "p4_low";
    }
  }

  return { category: bestCategory, priority, requiresHuman, escalationReason };
}

/** Compare two priorities — returns positive if a is higher priority */
function comparePriority(a: TicketPriority, b: TicketPriority): number {
  const rank: Record<TicketPriority, number> = {
    p1_critical: 4,
    p2_high: 3,
    p3_medium: 2,
    p4_low: 1,
  };
  return rank[a] - rank[b];
}

// ═══════════════════════════════════════════════════════════
// AI Response Generation
// ═══════════════════════════════════════════════════════════

/** Generate an AI draft response based on ticket context */
export function generateAIResponse(ticket: SupportTicket): string | null {
  const text = `${ticket.subject} ${ticket.description}`.toLowerCase();

  // Password reset
  if (text.includes("password") || text.includes("reset") || text.includes("forgot") || text.includes("can't log in")) {
    return AI_RESPONSE_TEMPLATES.password_reset;
  }

  // How-to: planning
  if (text.includes("how") && (text.includes("plan") || text.includes("itinerary") || text.includes("create"))) {
    return AI_RESPONSE_TEMPLATES.how_to_plan;
  }

  // How-to: groups
  if (text.includes("group") && (text.includes("how") || text.includes("invite") || text.includes("create"))) {
    return AI_RESPONSE_TEMPLATES.how_to_group;
  }

  // Feature info
  if (text.includes("what is") || text.includes("what does") || text.includes("about confetti")) {
    return AI_RESPONSE_TEMPLATES.feature_info;
  }

  // Venue issues
  if (ticket.category === "venue_issue") {
    return AI_RESPONSE_TEMPLATES.venue_report;
  }

  // Booking problems
  if (ticket.category === "booking_problem") {
    return AI_RESPONSE_TEMPLATES.booking_help;
  }

  // Bug report (non-critical)
  if (ticket.category === "bug" && !ticket.escalationReason) {
    return AI_RESPONSE_TEMPLATES.bug_acknowledged;
  }

  // General fallback
  if (ticket.category === "general" || ticket.category === "feature_request") {
    return AI_RESPONSE_TEMPLATES.general_inquiry;
  }

  return null;
}

// ═══════════════════════════════════════════════════════════
// Ticket Management
// ═══════════════════════════════════════════════════════════

/** Create a new support ticket — auto-categorizes, sets priority, drafts AI response */
export function createTicket(
  userId: string,
  userEmail: string,
  subject: string,
  description: string
): SupportTicket {
  const classification = classifyTicket({ subject, description });

  const ticket: SupportTicket = {
    id: nextId("tkt"),
    userId,
    userEmail,
    subject,
    description,
    category: classification.category,
    priority: classification.priority,
    status: "new",
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Initial user message
  const userMsg: TicketMessage = {
    id: nextId("msg"),
    ticketId: ticket.id,
    role: "user",
    content: description,
    timestamp: ticket.createdAt,
  };
  ticket.messages.push(userMsg);

  // Check if escalation is needed
  if (classification.requiresHuman) {
    ticket.status = "escalated";
    ticket.escalationReason = classification.escalationReason;
  } else {
    // Try AI auto-response
    const aiReply = generateAIResponse(ticket);
    if (aiReply) {
      ticket.aiResponse = aiReply;
      ticket.status = "ai_responded";
      const aiMsg: TicketMessage = {
        id: nextId("msg"),
        ticketId: ticket.id,
        role: "ai",
        content: aiReply,
        timestamp: new Date().toISOString(),
      };
      ticket.messages.push(aiMsg);
    }
  }

  ticketStore.set(ticket.id, ticket);
  messageStore.set(ticket.id, ticket.messages);
  return ticket;
}

/** Escalate a ticket to the admin queue */
export function escalateTicket(ticketId: string, reason: string): SupportTicket | null {
  const ticket = ticketStore.get(ticketId);
  if (!ticket) return null;

  ticket.status = "escalated";
  ticket.escalationReason = reason;
  ticket.priority = comparePriority(ticket.priority, "p2_high") >= 0 ? ticket.priority : "p2_high";
  ticket.updatedAt = new Date().toISOString();

  const sysMsg: TicketMessage = {
    id: nextId("msg"),
    ticketId,
    role: "ai",
    content: `Ticket escalated to admin: ${reason}`,
    timestamp: new Date().toISOString(),
  };
  ticket.messages.push(sysMsg);
  return ticket;
}

/** Mark a ticket as resolved */
export function resolveTicket(ticketId: string, resolution: string): SupportTicket | null {
  const ticket = ticketStore.get(ticketId);
  if (!ticket) return null;

  ticket.status = "resolved";
  ticket.resolvedAt = new Date().toISOString();
  ticket.updatedAt = new Date().toISOString();

  const resMsg: TicketMessage = {
    id: nextId("msg"),
    ticketId,
    role: "admin",
    content: `Resolved: ${resolution}`,
    timestamp: new Date().toISOString(),
  };
  ticket.messages.push(resMsg);
  return ticket;
}

/** Add a message to an existing ticket */
export function addMessage(ticketId: string, role: "user" | "ai" | "admin", content: string): TicketMessage | null {
  const ticket = ticketStore.get(ticketId);
  if (!ticket) return null;

  const msg: TicketMessage = {
    id: nextId("msg"),
    ticketId,
    role,
    content,
    timestamp: new Date().toISOString(),
  };
  ticket.messages.push(msg);

  // If user replies, mark awaiting
  if (role === "user" && ticket.status === "ai_responded") {
    ticket.status = "awaiting_user";
  }
  if (role === "admin") {
    ticket.status = "awaiting_user";
  }
  ticket.updatedAt = new Date().toISOString();
  return msg;
}

// ═══════════════════════════════════════════════════════════
// Queue & Retrieval
// ═══════════════════════════════════════════════════════════

/** Get filtered ticket queue */
export function getTicketQueue(filter?: TicketQueueFilter): SupportTicket[] {
  let tickets = Array.from(ticketStore.values());
  if (filter?.status) tickets = tickets.filter((t) => t.status === filter.status);
  if (filter?.priority) tickets = tickets.filter((t) => t.priority === filter.priority);
  if (filter?.category) tickets = tickets.filter((t) => t.category === filter.category);

  // Sort by priority (highest first), then by creation date (oldest first)
  return tickets.sort((a, b) => {
    const pDiff = comparePriority(a.priority, b.priority);
    if (pDiff !== 0) return -pDiff; // higher priority first
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

/** Get only escalated tickets for Tyrone */
export function getEscalatedTickets(): SupportTicket[] {
  return getTicketQueue({ status: "escalated" });
}

/** Get a single ticket by ID */
export function getTicket(ticketId: string): SupportTicket | null {
  return ticketStore.get(ticketId) ?? null;
}

// ═══════════════════════════════════════════════════════════
// Stats & Analytics
// ═══════════════════════════════════════════════════════════

/** Get ticket queue statistics */
export function getTicketStats(): TicketStats {
  const tickets = Array.from(ticketStore.values());

  const byStatus = {
    new: 0, ai_responded: 0, escalated: 0, awaiting_user: 0, resolved: 0, closed: 0,
  } as Record<TicketStatus, number>;

  const byPriority = {
    p1_critical: 0, p2_high: 0, p3_medium: 0, p4_low: 0,
  } as Record<TicketPriority, number>;

  const byCategory = {
    bug: 0, feature_request: 0, billing: 0, account: 0, venue_issue: 0, booking_problem: 0, general: 0,
  } as Record<TicketCategory, number>;

  let totalResolutionTime = 0;
  let resolvedCount = 0;
  let aiResolvedCount = 0;
  let escalatedCount = 0;

  for (const t of tickets) {
    byStatus[t.status]++;
    byPriority[t.priority]++;
    byCategory[t.category]++;

    if (t.resolvedAt) {
      totalResolutionTime += new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime();
      resolvedCount++;
    }
    if (t.status === "ai_responded" || (t.status === "resolved" && t.aiResponse)) {
      aiResolvedCount++;
    }
    if (t.status === "escalated") {
      escalatedCount++;
    }
  }

  return {
    totalTickets: tickets.length,
    byStatus,
    byPriority,
    byCategory,
    avgResolutionTimeMs: resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0,
    aiResolutionRate: tickets.length > 0 ? aiResolvedCount / tickets.length : 0,
    escalationRate: tickets.length > 0 ? escalatedCount / tickets.length : 0,
  };
}

// ═══════════════════════════════════════════════════════════
// Demo Seed
// ═══════════════════════════════════════════════════════════

/** Create sample support tickets for demo */
export function seedSupportDemo(): SupportTicket[] {
  const samples: Array<{ userId: string; email: string; subject: string; description: string }> = [
    {
      userId: "user_001",
      email: "alex@example.com",
      subject: "App crashes when I open group chat",
      description: "Every time I try to open the group chat feature, the app crashes immediately. I've tried reinstalling but the same thing happens. This is a data loss risk because I lose my chat history each time.",
    },
    {
      userId: "user_002",
      email: "jordan@example.com",
      subject: "How do I create a group plan?",
      description: "I just downloaded Confetti and I love it! But I'm confused about how to create a group plan with my friends. Can you walk me through it?",
    },
    {
      userId: "user_003",
      email: "sam@example.com",
      subject: "Wrong charge on my account",
      description: "I was charged $4.99 twice this month for Confetti Black. I should only have one charge. Can I get a refund for the duplicate?",
    },
    {
      userId: "user_004",
      email: "taylor@example.com",
      subject: "Venue hours are wrong",
      description: "The listing for Mama's Kitchen in DC shows they close at 10pm but they actually close at midnight on weekends. Can you update this?",
    },
    {
      userId: "user_005",
      email: "casey@example.com",
      subject: "Feature request: dark mode",
      description: "Would love to see a dark mode option in the app. Using it at night at bars is really bright. Great app otherwise!",
    },
    {
      userId: "user_006",
      email: "riley@example.com",
      subject: "Can't reset my password",
      description: "I forgot my password and the reset email never arrives. I've checked spam. Please help me get back into my account.",
    },
    {
      userId: "user_007",
      email: "morgan@example.com",
      subject: "Reservation didn't go through",
      description: "I booked a table through Confetti for Friday night at The Blue Room but when I showed up they had no record of my reservation. This is really frustrating.",
    },
    {
      userId: "user_008",
      email: "drew@example.com",
      subject: "Legal inquiry about data usage",
      description: "I'd like to understand how my personal data is being used and shared. I may need to consult with my lawyer about GDPR compliance. Please provide your data processing documentation.",
    },
  ];

  const tickets: SupportTicket[] = [];
  for (const s of samples) {
    tickets.push(createTicket(s.userId, s.email, s.subject, s.description));
  }
  return tickets;
}
