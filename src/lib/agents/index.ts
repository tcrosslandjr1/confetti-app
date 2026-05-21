/**
 * Confetti Agent System — Barrel Export
 * Unified entry point for all agent capabilities.
 */

// ─── AI Provider Engine ────────────────────────────────────────
export { chat, getAIConfig, getAvailableProviders } from "./ai-provider";
export type { AIMessage, AIResponse, AIProviderConfig } from "./ai-provider";

// ─── Venue Discovery Agent ────────────────────────────────────
export {
  discoverVenues,
  discoverVenuesMock,
  discoverTripCorridorVenues,
  getUserLocation,
  geocodeCity,
} from "./venue-discovery";
export type {
  DiscoveredVenue,
  GeoLocation,
  VenueSearchParams,
  TripCorridorParams,
} from "./venue-discovery";

// ─── User Intelligence Agent ──────────────────────────────────
export {
  trackBehavior,
  trackBehaviorLocal,
  getTasteProfile,
  getTasteProfileLocal,
  getUserContext,
  getUserContextLocal,
  recomputeTasteProfile,
  applyOnboardingPreferences,
  generateProfilePrompt,
} from "./user-intelligence";
export type {
  BehaviorEvent,
  BehaviorEventType,
  TasteProfile,
  UserContext,
} from "./user-intelligence";

// ─── Chat Agent ───────────────────────────────────────────────
export {
  sendMessage,
  sendMessageLocal,
  getChatStatus,
} from "./chat-agent";
export type {
  ChatIntent,
  ChatSession,
  ChatMessage,
  ChatContext,
  ChatResponse,
} from "./chat-agent";

// ─── Trip Planner Agent ───────────────────────────────────────
export {
  planTrip,
  planTripMock,
  getUserTrips,
} from "./trip-planner";
export type {
  TripRequest,
  TripStop,
  TripPlan,
  StopType,
} from "./trip-planner";

// ─── Group Collaboration Agent ───────────────────────────────
export {
  createGroup,
  createGroupLocal,
  inviteMember,
  joinGroupByCode,
  submitCategories,
  getGroupCategories,
  getAvailableCategories,
  mergeGroupProfiles,
  generateGroupPlan,
  generateGroupPlanLocal,
  voteOnStop,
  refinePlan,
  getGroup,
  getUserGroups,
  getGroupPlans,
  getPlan,
  approvePlan,
  seedDemoGroup,
} from "./group-collab";
export type {
  GroupType,
  MemberRole,
  MemberStatus,
  PlanStatus,
  VoteValue,
  Group,
  GroupSettings,
  GroupMember,
  GroupPlan,
  GroupPlanStop,
  StopVote,
  CategoryPick,
} from "./group-collab";

// ─── Boost Credits Agent ────────────────────────────────────
export {
  // Constants
  BUSINESS_TIERS,
  USER_TIER_CONFIG,
  // Business
  registerBusiness,
  updateBusinessTier,
  purchaseCredits,
  getBusiness,
  getBusinessesByCity,
  // Campaigns & Coupons
  createCampaign,
  createCoupon,
  getVenueCampaigns,
  getCampaignCoupon,
  getBusinessCampaigns,
  // Team
  inviteTeamMember,
  removeTeamMember,
  updateTeamMemberRole,
  getTeamMembers,
  getBusinessByEmail,
  validateBusinessInvite,
  // Boost engine
  applyBoosts,
  recordClickThrough,
  // Check-in & Redemption
  checkIn,
  redeemCoupon,
  // User subscription
  getUserSubscription,
  upgradeToBlack,
  canCreateConfetti,
  consumeConfetti,
  useOutingCredit,
  bookPrimeReservation,
  resetMonthlyBlackPerks,
  getUserCoupons,
  getUserCheckins,
  // Analytics
  getCampaignAnalytics,
  getBusinessAnalytics,
  // Demo
  seedBoostDemo,
} from "./boost-credits";
export type {
  BusinessTier,
  UserTier,
  CampaignStatus,
  CheckInMethod,
  CouponType,
  RedemptionStatus,
  BusinessAccount,
  BusinessTierConfig,
  BoostCampaign,
  Coupon,
  UserCheckin,
  CouponRedemption,
  UserSubscription,
  BoostAnalytics,
  BoostedVenue,
  TeamRole,
  TeamMember,
} from "./boost-credits";

// ─── Wallet Pass Agent ─────────────────────────────────────
export {
  // Confetti Fund
  depositFund,
  getFund,
  disburseFund,
  getFundDashboard,
  // Wallet Passes
  createWalletPasses,
  getUserPasses,
  getAllPasses,
  getPassStats,
  updatePassBalance,
  redeemViaBarcode,
  revokePasses,
  // Demo
  seedWalletDemo,
} from "./wallet-pass";
export type {
  PassPlatform,
  PassStatus,
  FundTransactionType,
  WalletPass,
  ConfettiFund,
  FundTransaction,
  FundDashboard,
} from "./wallet-pass";

// ─── Interaction Tracker (Implicit Learning) ─────────────────
export {
  trackInteraction,
  startViewTimer,
  trackImplicitSkips,
} from "./interaction-tracker";
export type {
  InteractionEvent,
  TrackInteractionParams,
} from "./interaction-tracker";

// ─── Community Agent ─────────────────────────────────────────
export {
  sharePlan,
  remixPlan,
  savePlanToCollection,
  submitReview,
  autoTrackVisit,
  getCommunityFeed,
  getSharedPlan,
  getPlanReviews,
  getUserSharedPlans,
  getUserReputation,
  getReputationTierInfo,
  getAllTiers,
  getAIInsights,
  getCommunityStats,
  seedCommunityDemo,
} from "./community";
export type {
  SharedPlan,
  SharedPlanStop,
  ExperienceReview,
  StopRating,
  UserReputation,
  CommunityBadge,
  CommunityFeedQuery,
  AIInsight,
  PlanOrigin,
  ReviewType,
  ReputationTier,
} from "./community";

// ─── Support Queue Agent ────────────────────────────────────
export {
  createTicket,
  classifyTicket,
  generateAIResponse,
  escalateTicket,
  resolveTicket,
  addMessage,
  getTicketQueue,
  getEscalatedTickets,
  getTicket,
  getTicketStats,
  seedSupportDemo,
} from "./support-queue";
export type {
  TicketPriority,
  TicketStatus,
  TicketCategory,
  SupportTicket,
  TicketMessage,
  EscalationRule,
  TicketQueueFilter,
  TicketStats,
} from "./support-queue";

// ─── Content CMS Agent ──────────────────────────────────────
export {
  createContent,
  generateContent,
  scheduleContent,
  publishContent,
  archiveContent,
  getContentCalendar,
  getContentByStatus,
  getContent,
  getTemplates,
  createTemplate,
  getContentMetrics,
  getOverallMetrics,
  seedContentDemo,
} from "./content-cms";
export type {
  ContentType,
  ContentStatus,
  AudienceSegment,
  ContentItem,
  ContentMetrics,
  ContentTemplate,
  ContentCalendarEntry,
  OverallMetrics,
} from "./content-cms";

// ─── Feature Flags Agent ────────────────────────────────────
export {
  createFlag,
  toggleFlag,
  setRolloutStrategy,
  evaluateFlag,
  evaluateFlags,
  recordFlagError,
  getFlagAuditLog,
  getAllFlags,
  getFlag,
  getFlagByKey,
  archiveFlag,
  getFlagMetrics,
  seedFlagDemo,
} from "./feature-flags";
export type {
  FlagStatus,
  RolloutStrategy,
  FlagEnvironment,
  FeatureFlag,
  FlagEvaluation,
  FlagAuditEntry,
  FlagMetrics,
} from "./feature-flags";

// ─── Feedback Pipeline Agent ────────────────────────────────
export {
  submitFeedback,
  triageFeedback,
  findDuplicates,
  voteFeedback,
  updateFeedbackStatus,
  getFeedbackQueue,
  getFeedbackTrends,
  getTopRequested,
  getBugsByPriority,
  getFeedbackStats,
  exportFeedbackReport,
  seedFeedbackDemo,
} from "./feedback-pipeline";
export type {
  FeedbackType,
  FeedbackStatus,
  FeedbackPriority,
  FeedbackSource,
  FeedbackItem,
  FeedbackTrend,
  FeedbackQueueFilter,
  FeedbackStats,
  FeedbackReport,
} from "./feedback-pipeline";

// ─── SEO/ASO Agent ─────────────────────────────────────────
export {
  addKeyword,
  updateKeywordRanks,
  getKeywordReport,
  getTopMovers,
  getStoreMetadata,
  updateStoreMetadata,
  generateASOSuggestions,
  generateDescription,
  getWebSEOAudit,
  getSEODashboard,
  seedASODemo,
} from "./seo-aso";
export type {
  Platform,
  KeywordStatus,
  RankChange,
  TrackedKeyword,
  StoreMetadata,
  ASOSuggestion,
  SEOPage,
  SEODashboard,
} from "./seo-aso";

// ─── Automated Reports Agent ──────────────────────────────────
export {
  createReportConfig,
  generateReport,
  generateDailyDigest,
  generateWeeklyReport,
  detectAnomalies,
  getReportHistory,
  getLatestReport,
  getActiveConfigs,
  updateConfig,
  pauseConfig,
  getMetricSnapshot,
  getMetricTrend,
  seedReportsDemo,
} from "./automated-reports";
export type {
  ReportType,
  ReportStatus,
  DeliveryMethod,
  MetricType,
  ReportConfig,
  GeneratedReport,
  ReportSection,
  Anomaly,
  MetricSnapshot,
} from "./automated-reports";

// ─── Finance Agent ─────────────────────────────────────────────
export {
  recordTransaction,
  requestRefund,
  approveRefund,
  rejectRefund,
  processRefund,
  requestPayout,
  approvePayout,
  getRefundQueue,
  getPayoutQueue,
  getRevenueMetrics,
  getTransactionHistory,
  getTaxSummary,
  getFinanceDashboard,
  detectFraudSignals,
  seedFinanceDemo,
} from "./finance";
export type {
  TransactionType,
  TransactionStatus,
  PayoutStatus,
  RefundReason,
  Transaction,
  RefundRequest,
  PayoutRecord,
  RevenueMetrics,
  TaxSummary,
  FinanceDashboard,
  FraudSignal,
} from "./finance";

// ─── Legal Compliance Agent ────────────────────────────────────
export {
  submitDataRequest,
  processDataRequest,
  approveDataRequest,
  executeDataDeletion,
  exportUserData,
  submitDMCA,
  analyzeDMCA,
  getPendingRequests,
  getRequestsByFramework,
  createPolicyVersion,
  getCurrentPolicy,
  getPolicyHistory,
  runComplianceAudit,
  getComplianceDashboard,
  getDeadlineAlerts,
  seedComplianceDemo,
} from "./legal-compliance";
export type {
  RequestType,
  RequestStatus,
  ComplianceFramework,
  DataRequest,
  PolicyDocument,
  ComplianceAudit,
  AuditFinding,
  DMCANotice,
  ComplianceDashboard,
} from "./legal-compliance";

// ─── Partnerships Agent ──────────────────────────────────────
export {
  addPartner,
  updatePartnerStage,
  addActivity,
  setFollowUp,
  getOverdueFollowUps,
  generateOutreach,
  getPartnerPipeline,
  getPartnerById,
  searchPartners,
  getPartnershipMetrics,
  getExpiringContracts,
  getRevenueByPartner,
  createTemplate as createPartnerTemplate,
  getTemplates as getPartnerTemplates,
  seedPartnershipsDemo,
} from "./partnerships";
export type {
  PartnerType,
  DealStage,
  PartnerTier,
  Partner,
  DealActivity,
  PartnershipMetrics,
  OutreachTemplate,
} from "./partnerships";

// ─── Pricing Agent ───────────────────────────────────────────
export {
  createPlan,
  updatePlan,
  deactivatePlan,
  getActivePlans,
  getPlanMetrics,
  createExperiment,
  startExperiment,
  recordExperimentConversion,
  endExperiment,
  createPromo,
  redeemPromo,
  validatePromo,
  generatePricingSuggestions,
  projectRevenue,
  getPricingDashboard,
  seedPricingDemo,
} from "./pricing";
export type {
  PricingModel,
  PlanType,
  PricingPlan,
  PricingExperiment,
  PromoCode,
  PricingSuggestion,
  RevenueProjection,
} from "./pricing";

// ─── Emergency Controls Agent ────────────────────────────────
export {
  createKillSwitch,
  activateKillSwitch,
  deactivateKillSwitch,
  toggleMaintenanceMode,
  getSystemStatus,
  getKillSwitches,
  recordServiceFailure,
  resetCircuitBreaker,
  getCircuitBreakers,
  emergencyBanUser,
  liftBan,
  getActiveBans,
  createAlert,
  acknowledgeAlert,
  resolveAlert,
  getActiveAlerts,
  scheduleMaintenanceWindow,
  startIncident,
  updateIncident,
  resolveIncident,
  getIncidentHistory,
  getEmergencyDashboard,
  seedEmergencyDemo,
} from "./emergency-controls";
export type {
  EmergencyAction,
  AlertSeverity,
  SystemStatus,
  KillSwitch,
  CircuitBreaker,
  EmergencyBan,
  SystemAlert,
  MaintenanceWindow,
  IncidentUpdate,
  IncidentLog,
} from "./emergency-controls";

// ─── Identity Verification Agent ─────────────────────────────
export {
  submitVerification,
  runAIReview,
  approveVerification,
  rejectVerification,
  suspendVerification,
  addDocument,
  getVerificationQueue,
  getPendingAdminReview,
  getVerificationById,
  getVerificationsByUser,
  checkExpiration,
  getVerificationRules,
  updateVerificationRules,
  getVerificationMetrics,
  seedVerificationDemo,
} from "./identity-verification";
export type {
  VerificationType,
  VerificationStatus,
  RiskLevel,
  DocumentType,
  SubmittedDocument,
  VerificationRequest,
  VerificationRule,
} from "./identity-verification";

// ─── Orchestrator Agent (Gear Train) ───────────────────────
export {
  defineWorkflow,
  fireEvent,
  acknowledgeGate,
  dismissGate,
  getPendingGates,
  getOverdueGates,
  getWorkflowDefinitions,
  toggleWorkflow,
  getActiveWorkflows,
  getWorkflowHistory,
  getWorkflowInstance,
  getRecentEvents,
  getOrchestratorDashboard,
  seedOrchestratorDemo,
} from "./orchestrator";
export type {
  StepMode,
  StepStatus,
  WorkflowStatus,
  EventSource,
  WorkflowStepDef,
  WorkflowDefinition,
  WorkflowStepInstance,
  WorkflowInstance,
  OrchestratorEvent,
  GateAlert,
  OrchestratorDashboard,
} from "./orchestrator";

// ─── Admin Alerts Agent (Dashboard Nerve Center) ──────────
export {
  pushAlert,
  acknowledgeAlert as acknowledgeAdminAlert,
  snoozeAlert,
  dismissAlert,
  bulkAcknowledge,
  getAlerts,
  getActiveAlerts as getActiveAdminAlerts,
  getOverdueAlerts as getOverdueAdminAlerts,
  getAlertsByCategory,
  getAlertById,
  getAlertBundles,
  getAlertStats,
  getAdminDashboard,
  generateDigest,
  getDigests,
  syncGateAlerts,
  runAutoResolve,
  seedAdminAlertsDemo,
} from "./admin-alerts";
export type {
  AlertPriority,
  AlertCategory,
  AlertStatus,
  AlertSource,
  AdminAlert,
  AlertBundle,
  AlertDigest,
  AlertFilter,
  AlertStats,
  AdminDashboardView,
} from "./admin-alerts";

// ─── Business Portal Agent ─────────────────────────────────
export {
  generatePortalInviteLink,
  createPortalSession,
  createSessionByEmail,
  validateSession,
  endSession,
  queuePortalInviteEmail,
  queueTeamInviteEmail,
  upsertVenueProfile,
  getVenueProfile,
  addVenuePhoto,
  addMenuItem,
  removeMenuItem,
  pushPortalNotification,
  getPortalNotifications,
  markNotificationsRead,
  getPortalDashboard,
  seedPortalDemo,
} from "./business-portal";
export type {
  PortalSection,
  PortalSession,
  VenueProfile,
  VenueHours,
  DayHours,
  VenuePhoto,
  MenuItem,
  InviteEmail,
  PortalNotification,
  PortalDashboardData,
} from "./business-portal";
