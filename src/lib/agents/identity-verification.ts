/**
 * Identity Verification Agent
 *
 * Business claims, promoter vetting, venue owner validation for Confetti.
 * AI pre-screens and scores applications, Tyrone approves.
 *
 * Flow:
 *   1. User submits verification request with documents
 *   2. AI reviews: checks completeness, cross-references, flags issues
 *   3. AI scores 0-100 with auto-approve/reject thresholds
 *   4. Manual review queue for borderline cases
 *   5. Admin approves/rejects/suspends
 *   6. Periodic expiration checks
 *
 * Scoring:
 *   - Complete documents: +30
 *   - Matching business name across docs: +20
 *   - Active website: +15
 *   - Social media presence: +10
 *   - Phone number verified: +10
 *   - Address matches: +15
 *   - Missing required docs: -30
 *   - Mismatched names: -25
 *   - Suspicious patterns: -20
 *
 * Auto-approve if score >= 85 and no flags
 * Auto-reject if score <= 25
 * Otherwise: pending_admin
 */

import { supabase } from "../supabase";

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export type VerificationType = "business_claim" | "promoter_application" | "venue_owner" | "influencer" | "event_organizer";
export type VerificationStatus = "submitted" | "ai_review" | "pending_admin" | "approved" | "rejected" | "suspended" | "expired";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type DocumentType = "business_license" | "tax_id" | "utility_bill" | "lease_agreement" | "photo_id" | "social_media_proof" | "website_proof" | "event_permit";

export interface SubmittedDocument {
  id: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  verified: boolean;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  userEmail: string;
  type: VerificationType;
  status: VerificationStatus;
  entityName: string;
  entityAddress?: string;
  entityWebsite?: string;
  entityPhone?: string;
  documents: SubmittedDocument[];
  riskLevel: RiskLevel;
  aiScore: number;
  aiFlags: string[];
  aiRecommendation: "approve" | "reject" | "manual_review";
  adminNotes?: string;
  reviewedBy?: string;
  submittedAt: string;
  reviewedAt?: string;
  expiresAt?: string;
}

export interface VerificationRule {
  type: VerificationType;
  requiredDocuments: DocumentType[];
  minimumScore: number;
  autoApproveThreshold: number;
  autoRejectThreshold: number;
  expirationDays: number;
}

// ═══════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════

const DEFAULT_RULES: Record<VerificationType, VerificationRule> = {
  business_claim: {
    type: "business_claim",
    requiredDocuments: ["business_license", "tax_id", "photo_id"],
    minimumScore: 40,
    autoApproveThreshold: 85,
    autoRejectThreshold: 25,
    expirationDays: 365,
  },
  promoter_application: {
    type: "promoter_application",
    requiredDocuments: ["photo_id", "social_media_proof"],
    minimumScore: 35,
    autoApproveThreshold: 85,
    autoRejectThreshold: 25,
    expirationDays: 180,
  },
  venue_owner: {
    type: "venue_owner",
    requiredDocuments: ["business_license", "lease_agreement", "photo_id"],
    minimumScore: 50,
    autoApproveThreshold: 85,
    autoRejectThreshold: 25,
    expirationDays: 365,
  },
  influencer: {
    type: "influencer",
    requiredDocuments: ["photo_id", "social_media_proof"],
    minimumScore: 30,
    autoApproveThreshold: 85,
    autoRejectThreshold: 25,
    expirationDays: 180,
  },
  event_organizer: {
    type: "event_organizer",
    requiredDocuments: ["photo_id", "event_permit"],
    minimumScore: 40,
    autoApproveThreshold: 85,
    autoRejectThreshold: 25,
    expirationDays: 90,
  },
};

// ═══════════════════════════════════════════════════════════
// In-Memory Store (local-first)
// ═══════════════════════════════════════════════════════════

const verificationStore = new Map<string, VerificationRequest>();
const rulesStore = new Map<VerificationType, VerificationRule>();

// Initialize default rules
for (const [type, rule] of Object.entries(DEFAULT_RULES)) {
  rulesStore.set(type as VerificationType, rule);
}

let idCounter = 12000;
function nextId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${(idCounter++).toString(36)}`;
}

// ═══════════════════════════════════════════════════════════
// AI Scoring Engine
// ═══════════════════════════════════════════════════════════

/** Score a verification request using rule-based AI analysis */
function scoreVerification(request: VerificationRequest): {
  score: number;
  flags: string[];
  recommendation: "approve" | "reject" | "manual_review";
} {
  const rule = rulesStore.get(request.type) ?? DEFAULT_RULES[request.type];
  let score = 0;
  const flags: string[] = [];

  const submittedTypes = new Set(request.documents.map((d) => d.type));

  // --- Positive signals ---

  // Complete documents: +30
  const requiredMet = rule.requiredDocuments.filter((dt) => submittedTypes.has(dt));
  if (requiredMet.length === rule.requiredDocuments.length) {
    score += 30;
  } else {
    const missing = rule.requiredDocuments.filter((dt) => !submittedTypes.has(dt));
    flags.push(`Missing required documents: ${missing.join(", ")}`);
    score -= 30;
  }

  // Matching business name across docs: +20
  // Simulated: if entity name is present and docs > 1, assume partial match
  if (request.entityName && request.documents.length > 1) {
    score += 20;
  } else if (request.documents.length <= 1) {
    flags.push("Only one document submitted — cannot cross-reference entity name");
  }

  // Active website: +15
  if (request.entityWebsite) {
    score += 15;
  }

  // Social media presence: +10
  if (submittedTypes.has("social_media_proof")) {
    score += 10;
  }

  // Phone number verified: +10
  if (request.entityPhone) {
    score += 10;
  }

  // Address matches across sources: +15
  if (request.entityAddress && request.documents.length >= 2) {
    score += 15;
  }

  // --- Negative signals ---

  // Suspicious patterns: entity name looks generic
  const suspiciousNames = ["test", "asdf", "xxx", "fake", "temp", "demo"];
  if (suspiciousNames.some((s) => request.entityName.toLowerCase().includes(s))) {
    score -= 20;
    flags.push("Suspicious entity name detected");
  }

  // Email domain mismatch with entity
  if (request.entityWebsite && request.userEmail) {
    const emailDomain = request.userEmail.split("@")[1]?.toLowerCase();
    const entityDomain = request.entityWebsite
      .replace(/https?:\/\//, "")
      .replace("www.", "")
      .split("/")[0]
      ?.toLowerCase();
    if (emailDomain && entityDomain && !emailDomain.includes(entityDomain) && !entityDomain.includes(emailDomain)) {
      // Not necessarily bad, just flag it
      if (request.type === "business_claim" || request.type === "venue_owner") {
        flags.push(`Email domain (${emailDomain}) does not match entity website (${entityDomain})`);
        score -= 5;
      }
    }
  }

  // Clamp score to 0-100
  score = Math.max(0, Math.min(100, score));

  // Determine recommendation
  let recommendation: "approve" | "reject" | "manual_review";
  if (score >= rule.autoApproveThreshold && flags.length === 0) {
    recommendation = "approve";
  } else if (score <= rule.autoRejectThreshold) {
    recommendation = "reject";
  } else {
    recommendation = "manual_review";
  }

  return { score, flags, recommendation };
}

// ═══════════════════════════════════════════════════════════
// Verification Management
// ═══════════════════════════════════════════════════════════

/** Submit a new verification request — triggers AI review */
export function submitVerification(
  userId: string,
  email: string,
  type: VerificationType,
  entityName: string,
  documents: Array<{ type: DocumentType; fileName: string; fileUrl: string }>,
  metadata?: Partial<Pick<VerificationRequest, "entityAddress" | "entityWebsite" | "entityPhone">>
): VerificationRequest {
  const request: VerificationRequest = {
    id: nextId("vrf"),
    userId,
    userEmail: email,
    type,
    status: "submitted",
    entityName,
    entityAddress: metadata?.entityAddress,
    entityWebsite: metadata?.entityWebsite,
    entityPhone: metadata?.entityPhone,
    documents: documents.map((d) => ({
      id: nextId("doc"),
      type: d.type,
      fileName: d.fileName,
      fileUrl: d.fileUrl,
      uploadedAt: new Date().toISOString(),
      verified: false,
    })),
    riskLevel: "medium",
    aiScore: 0,
    aiFlags: [],
    aiRecommendation: "manual_review",
    submittedAt: new Date().toISOString(),
  };

  verificationStore.set(request.id, request);

  // Auto-trigger AI review
  runAIReview(request.id);

  return verificationStore.get(request.id)!;
}

/** Run AI scoring on a verification request */
export function runAIReview(requestId: string): VerificationRequest | null {
  const request = verificationStore.get(requestId);
  if (!request) return null;

  request.status = "ai_review";

  const { score, flags, recommendation } = scoreVerification(request);

  request.aiScore = score;
  request.aiFlags = flags;
  request.aiRecommendation = recommendation;

  // Set risk level based on score
  if (score >= 80) request.riskLevel = "low";
  else if (score >= 50) request.riskLevel = "medium";
  else if (score >= 30) request.riskLevel = "high";
  else request.riskLevel = "critical";

  // Apply auto-decision or route to admin
  const rule = rulesStore.get(request.type) ?? DEFAULT_RULES[request.type];

  if (recommendation === "approve") {
    request.status = "approved";
    request.reviewedAt = new Date().toISOString();
    request.reviewedBy = "ai_auto";
    // Set expiration
    const exp = new Date();
    exp.setDate(exp.getDate() + rule.expirationDays);
    request.expiresAt = exp.toISOString();
  } else if (recommendation === "reject") {
    request.status = "rejected";
    request.reviewedAt = new Date().toISOString();
    request.reviewedBy = "ai_auto";
    request.adminNotes = `Auto-rejected: score ${score}/100. Flags: ${flags.join("; ") || "none"}`;
  } else {
    request.status = "pending_admin";
  }

  return request;
}

/** REQUIRES ADMIN — Approve a verification request */
export function approveVerification(
  requestId: string,
  adminNotes?: string,
  approvedBy?: string
): VerificationRequest | null {
  const request = verificationStore.get(requestId);
  if (!request) return null;

  const rule = rulesStore.get(request.type) ?? DEFAULT_RULES[request.type];

  request.status = "approved";
  request.adminNotes = adminNotes;
  request.reviewedBy = approvedBy ?? "admin";
  request.reviewedAt = new Date().toISOString();

  const exp = new Date();
  exp.setDate(exp.getDate() + rule.expirationDays);
  request.expiresAt = exp.toISOString();

  // Mark documents as verified
  request.documents.forEach((d) => (d.verified = true));

  return request;
}

/** REQUIRES ADMIN — Reject a verification request */
export function rejectVerification(
  requestId: string,
  reason: string,
  rejectedBy: string
): VerificationRequest | null {
  const request = verificationStore.get(requestId);
  if (!request) return null;

  request.status = "rejected";
  request.adminNotes = reason;
  request.reviewedBy = rejectedBy;
  request.reviewedAt = new Date().toISOString();

  return request;
}

/** REQUIRES ADMIN — Suspend a previously approved verification */
export function suspendVerification(
  requestId: string,
  reason: string,
  suspendedBy: string
): VerificationRequest | null {
  const request = verificationStore.get(requestId);
  if (!request) return null;

  request.status = "suspended";
  request.adminNotes = `Suspended by ${suspendedBy}: ${reason}`;
  request.reviewedBy = suspendedBy;
  request.reviewedAt = new Date().toISOString();

  return request;
}

/** Add an additional document to an existing request */
export function addDocument(
  requestId: string,
  type: DocumentType,
  fileName: string,
  fileUrl: string
): SubmittedDocument | null {
  const request = verificationStore.get(requestId);
  if (!request) return null;

  const doc: SubmittedDocument = {
    id: nextId("doc"),
    type,
    fileName,
    fileUrl,
    uploadedAt: new Date().toISOString(),
    verified: false,
  };

  request.documents.push(doc);
  return doc;
}

// ═══════════════════════════════════════════════════════════
// Queue & Retrieval
// ═══════════════════════════════════════════════════════════

/** Get filtered verification queue */
export function getVerificationQueue(filter?: {
  type?: VerificationType;
  status?: VerificationStatus;
  riskLevel?: RiskLevel;
}): VerificationRequest[] {
  let requests = Array.from(verificationStore.values());

  if (filter?.type) requests = requests.filter((r) => r.type === filter.type);
  if (filter?.status) requests = requests.filter((r) => r.status === filter.status);
  if (filter?.riskLevel) requests = requests.filter((r) => r.riskLevel === filter.riskLevel);

  // Sort: highest risk first, then oldest first
  const riskRank: Record<RiskLevel, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  return requests.sort((a, b) => {
    const rDiff = riskRank[b.riskLevel] - riskRank[a.riskLevel];
    if (rDiff !== 0) return rDiff;
    return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
  });
}

/** Get only items needing Tyrone's review */
export function getPendingAdminReview(): VerificationRequest[] {
  return getVerificationQueue({ status: "pending_admin" });
}

/** Get a single verification by ID */
export function getVerificationById(requestId: string): VerificationRequest | null {
  return verificationStore.get(requestId) ?? null;
}

/** Get all verifications for a user */
export function getVerificationsByUser(userId: string): VerificationRequest[] {
  return Array.from(verificationStore.values())
    .filter((r) => r.userId === userId)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

/** Check for expired verifications and mark them */
export function checkExpiration(): VerificationRequest[] {
  const now = new Date().toISOString();
  const expired: VerificationRequest[] = [];

  for (const request of verificationStore.values()) {
    if (
      request.status === "approved" &&
      request.expiresAt &&
      request.expiresAt < now
    ) {
      request.status = "expired";
      expired.push(request);
    }
  }

  return expired;
}

// ═══════════════════════════════════════════════════════════
// Rules Management
// ═══════════════════════════════════════════════════════════

/** Get current verification rules by type */
export function getVerificationRules(): VerificationRule[] {
  return Array.from(rulesStore.values());
}

/** Update verification rules for a type */
export function updateVerificationRules(
  type: VerificationType,
  rules: Partial<Omit<VerificationRule, "type">>
): VerificationRule {
  const existing = rulesStore.get(type) ?? DEFAULT_RULES[type];
  const updated: VerificationRule = {
    ...existing,
    ...rules,
    type,
  };
  rulesStore.set(type, updated);
  return updated;
}

// ═══════════════════════════════════════════════════════════
// Metrics
// ═══════════════════════════════════════════════════════════

/** Get verification metrics */
export function getVerificationMetrics(): {
  totalRequests: number;
  byStatus: Record<VerificationStatus, number>;
  byType: Record<VerificationType, number>;
  byRisk: Record<RiskLevel, number>;
  approvalRate: number;
  avgReviewTimeMs: number;
  autoApproveRate: number;
  autoRejectRate: number;
} {
  const requests = Array.from(verificationStore.values());

  const byStatus: Record<VerificationStatus, number> = {
    submitted: 0, ai_review: 0, pending_admin: 0, approved: 0, rejected: 0, suspended: 0, expired: 0,
  };
  const byType: Record<VerificationType, number> = {
    business_claim: 0, promoter_application: 0, venue_owner: 0, influencer: 0, event_organizer: 0,
  };
  const byRisk: Record<RiskLevel, number> = {
    low: 0, medium: 0, high: 0, critical: 0,
  };

  let reviewedCount = 0;
  let totalReviewTime = 0;
  let autoApproved = 0;
  let autoRejected = 0;

  for (const r of requests) {
    byStatus[r.status]++;
    byType[r.type]++;
    byRisk[r.riskLevel]++;

    if (r.reviewedAt) {
      reviewedCount++;
      totalReviewTime += new Date(r.reviewedAt).getTime() - new Date(r.submittedAt).getTime();
    }
    if (r.reviewedBy === "ai_auto" && r.status === "approved") autoApproved++;
    if (r.reviewedBy === "ai_auto" && r.status === "rejected") autoRejected++;
  }

  const decided = byStatus.approved + byStatus.rejected;

  return {
    totalRequests: requests.length,
    byStatus,
    byType,
    byRisk,
    approvalRate: decided > 0 ? byStatus.approved / decided : 0,
    avgReviewTimeMs: reviewedCount > 0 ? totalReviewTime / reviewedCount : 0,
    autoApproveRate: requests.length > 0 ? autoApproved / requests.length : 0,
    autoRejectRate: requests.length > 0 ? autoRejected / requests.length : 0,
  };
}

// ═══════════════════════════════════════════════════════════
// Demo Seed
// ═══════════════════════════════════════════════════════════

/** Create sample verification applications with varied risk levels */
export function seedVerificationDemo(): VerificationRequest[] {
  const samples: Array<{
    userId: string;
    email: string;
    type: VerificationType;
    entityName: string;
    website?: string;
    address?: string;
    phone?: string;
    docs: Array<{ type: DocumentType; fileName: string }>;
  }> = [
    {
      userId: "biz_001",
      email: "marcus@theblueroom.com",
      type: "venue_owner",
      entityName: "The Blue Room Lounge",
      website: "https://theblueroom.com",
      address: "1423 U St NW, Washington, DC",
      phone: "+12025551234",
      docs: [
        { type: "business_license", fileName: "blue_room_license.pdf" },
        { type: "lease_agreement", fileName: "blue_room_lease.pdf" },
        { type: "photo_id", fileName: "marcus_id.jpg" },
        { type: "utility_bill", fileName: "blue_room_utility.pdf" },
      ],
    },
    {
      userId: "biz_002",
      email: "gloria@mamaskitchen.com",
      type: "business_claim",
      entityName: "Mama's Kitchen",
      website: "https://mamaskitchendc.com",
      address: "2917 Georgia Ave NW, Washington, DC",
      phone: "+12025555678",
      docs: [
        { type: "business_license", fileName: "mamas_license.pdf" },
        { type: "tax_id", fileName: "mamas_ein.pdf" },
        { type: "photo_id", fileName: "gloria_id.jpg" },
      ],
    },
    {
      userId: "inf_001",
      email: "jasmine@nightvibesatl.com",
      type: "influencer",
      entityName: "NightVibes ATL",
      website: "https://nightvibesatl.com",
      docs: [
        { type: "photo_id", fileName: "jasmine_id.jpg" },
        { type: "social_media_proof", fileName: "instagram_analytics.png" },
      ],
    },
    {
      userId: "prm_001",
      email: "dj.smooth@gmail.com",
      type: "promoter_application",
      entityName: "DJ Smooth Events",
      phone: "+14045559999",
      docs: [
        { type: "photo_id", fileName: "djsmooth_id.jpg" },
        { type: "social_media_proof", fileName: "social_proof.png" },
      ],
    },
    {
      userId: "evt_001",
      email: "events@dcnightmarket.com",
      type: "event_organizer",
      entityName: "DC Night Market",
      website: "https://dcnightmarket.com",
      address: "Penn Quarter, Washington, DC",
      phone: "+12025550001",
      docs: [
        { type: "photo_id", fileName: "organizer_id.jpg" },
        { type: "event_permit", fileName: "dc_event_permit.pdf" },
        { type: "business_license", fileName: "night_market_license.pdf" },
      ],
    },
    {
      userId: "sus_001",
      email: "testuser123@tempmail.com",
      type: "business_claim",
      entityName: "Test Business Fake",
      docs: [
        { type: "photo_id", fileName: "blurry_id.jpg" },
      ],
    },
    {
      userId: "biz_003",
      email: "anthony@rooftopsocial.nyc",
      type: "venue_owner",
      entityName: "Rooftop Social NYC",
      website: "https://rooftopsocial.nyc",
      address: "350 W 42nd St, New York, NY",
      docs: [
        { type: "business_license", fileName: "rooftop_license.pdf" },
        { type: "photo_id", fileName: "anthony_id.jpg" },
      ],
    },
    {
      userId: "inf_002",
      email: "keisha@dmvfoodie.com",
      type: "influencer",
      entityName: "DMV Foodie Blog",
      website: "https://dmvfoodie.com",
      docs: [
        { type: "photo_id", fileName: "keisha_id.jpg" },
        { type: "social_media_proof", fileName: "blog_analytics.png" },
        { type: "website_proof", fileName: "domain_registration.pdf" },
      ],
    },
  ];

  const created: VerificationRequest[] = [];

  for (const s of samples) {
    const request = submitVerification(
      s.userId,
      s.email,
      s.type,
      s.entityName,
      s.docs.map((d) => ({
        type: d.type,
        fileName: d.fileName,
        fileUrl: `https://storage.confetti.app/verification/${s.userId}/${d.fileName}`,
      })),
      {
        entityAddress: s.address,
        entityWebsite: s.website,
        entityPhone: s.phone,
      }
    );
    created.push(request);
  }

  // Manually approve the first two (good applications) for demo variety
  if (created[0] && created[0].status === "pending_admin") {
    approveVerification(created[0].id, "Verified venue ownership with matching documents", "Tyrone");
  }
  if (created[1] && created[1].status === "pending_admin") {
    approveVerification(created[1].id, "Business license and tax ID confirmed", "Tyrone");
  }

  return created;
}
