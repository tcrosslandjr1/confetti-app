// ============================================================================
// Confetti App — Consent Agent Service (Layer 0)
// The gatekeeper for all user data processing.
// No downstream agent touches user data without consent clearance.
// ============================================================================

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConsentCategory =
  | "core_service"
  | "taste_profiling"
  | "location_services"
  | "dietary_health"
  | "marketing_comms"
  | "sms_push"
  | "cookies_tracking"
  | "group_taste"
  | "third_party_sharing";

export type ConsentMethod =
  | "clickwrap_onboarding"
  | "toggle_onboarding"
  | "toggle_settings"
  | "api_request"
  | "automated_expiry"
  | "admin_reset"
  | "breach_reset";

export type DataRequestType =
  | "access"
  | "rectification"
  | "erasure"
  | "restrict_processing"
  | "portability"
  | "object_profiling"
  | "automated_decision_review"
  | "ccpa_do_not_sell"
  | "ccpa_delete";

export type AuditEventType =
  | "consent_granted"
  | "consent_withdrawn"
  | "consent_expired"
  | "reconsent_prompted"
  | "reconsent_completed"
  | "reconsent_declined"
  | "data_request_received"
  | "data_request_completed"
  | "data_request_denied"
  | "data_export_generated"
  | "data_deletion_executed"
  | "breach_notification_sent"
  | "breach_consent_reset"
  | "document_version_published"
  | "consent_check_passed"
  | "consent_check_blocked"
  | "agent_access_granted"
  | "agent_access_denied";

export interface ConsentCheckResult {
  allowed: boolean;
  granted_categories: ConsentCategory[];
  denied_categories: ConsentCategory[];
  pending_reconsent: boolean;
  has_core_consent: boolean;
  restrictions: string[];
}

export interface AgentConsentGate {
  agent: string;
  required: ConsentCategory[];
  degraded_mode: string;
}

export interface DeviceContext {
  device_id?: string;
  ip_hash?: string;
  user_agent?: string;
  app_version?: string;
  os_info?: string;
  session_id?: string;
}

export interface ReconsentItem {
  category_key: string;
  current_version: string;
  latest_version: string;
  document_key: string;
}

export interface DataSubjectRequest {
  id: string;
  user_id: string;
  request_type: DataRequestType;
  status: string;
  received_at: string;
  acknowledged_at: string | null;
  deadline_at: string;
  completed_at: string | null;
}

export interface ConsentRecord {
  category_key: ConsentCategory;
  granted: boolean;
  version: string;
  method: ConsentMethod;
  granted_at: string | null;
  withdrawn_at: string | null;
}

// ---------------------------------------------------------------------------
// Agent-Specific Consent Gates
// Defines what each downstream agent needs to operate.
// ---------------------------------------------------------------------------

const AGENT_GATES: AgentConsentGate[] = [
  {
    agent: "taste_agent",
    required: ["core_service", "taste_profiling"],
    degraded_mode:
      "Does not activate; no Taste Graph built. User sees generic recommendations.",
  },
  {
    agent: "recommendation_agent_basic",
    required: ["core_service"],
    degraded_mode:
      "Generic venue list only. No personalization, no contextual awareness.",
  },
  {
    agent: "recommendation_agent_full",
    required: ["core_service", "taste_profiling", "location_services"],
    degraded_mode:
      "Full personalized, contextual recommendations unavailable. Falls back to basic mode.",
  },
  {
    agent: "group_taste_graph",
    required: ["core_service", "group_taste"],
    degraded_mode:
      "User excluded from group merge; sees generic group picks in Party Room.",
  },
  {
    agent: "dietary_filter",
    required: ["core_service", "dietary_health"],
    degraded_mode:
      "No allergen filtering applied; user sees all venues without dietary warnings.",
  },
];

// ---------------------------------------------------------------------------
// Consent Agent
// ---------------------------------------------------------------------------

export class ConsentAgent {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    // Uses SERVICE ROLE key — this agent operates at system level,
    // bypassing RLS to manage consent across all users.
    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  // =========================================================================
  // CORE: Consent Check — called by every downstream agent
  // =========================================================================

  /**
   * Check whether a user has the required consent for an agent to process
   * their data. This is the single gate that ALL downstream agents must call.
   *
   * Returns { allowed, granted_categories, denied_categories, restrictions }
   */
  async checkConsent(
    userId: string,
    requiredCategories: ConsentCategory[],
    agentName?: string,
    context?: DeviceContext
  ): Promise<ConsentCheckResult> {
    // Call the database function for full consent status
    const { data, error } = await this.supabase.rpc("get_consent_status", {
      p_user_id: userId,
    });

    if (error) {
      // On error, deny by default — fail closed
      await this.logAudit("consent_check_blocked", userId, undefined, agentName, {
        error: error.message,
        required: requiredCategories,
      }, context);

      return {
        allowed: false,
        granted_categories: [],
        denied_categories: requiredCategories,
        pending_reconsent: false,
        has_core_consent: false,
        restrictions: [`System error: ${error.message}`],
      };
    }

    const status = data as {
      user_id: string;
      granted_categories: ConsentCategory[];
      denied_categories: ConsentCategory[];
      pending_reconsent: boolean;
      has_core_consent: boolean;
    };

    // Check if ALL required categories are granted
    const granted = status.granted_categories || [];
    const missing = requiredCategories.filter((c) => !granted.includes(c));
    const allowed = missing.length === 0 && !status.pending_reconsent;

    const restrictions: string[] = [];
    if (missing.length > 0) {
      restrictions.push(`Missing consent: ${missing.join(", ")}`);
    }
    if (status.pending_reconsent) {
      restrictions.push("Re-consent required for updated documents");
    }

    // Audit the check
    await this.logAudit(
      allowed ? "consent_check_passed" : "consent_check_blocked",
      userId,
      undefined,
      agentName,
      {
        required: requiredCategories,
        granted: granted,
        missing: missing,
        pending_reconsent: status.pending_reconsent,
      },
      context
    );

    return {
      allowed,
      granted_categories: granted,
      denied_categories: status.denied_categories || [],
      pending_reconsent: status.pending_reconsent,
      has_core_consent: status.has_core_consent,
      restrictions,
    };
  }

  /**
   * Convenience: check consent for a named agent using the predefined gates.
   */
  async checkAgentAccess(
    userId: string,
    agentName: string,
    context?: DeviceContext
  ): Promise<ConsentCheckResult & { degraded_mode: string }> {
    const gate = AGENT_GATES.find((g) => g.agent === agentName);
    if (!gate) {
      return {
        allowed: false,
        granted_categories: [],
        denied_categories: [],
        pending_reconsent: false,
        has_core_consent: false,
        restrictions: [`Unknown agent: ${agentName}`],
        degraded_mode: "Agent not recognized by consent system.",
      };
    }

    const result = await this.checkConsent(
      userId,
      gate.required,
      agentName,
      context
    );

    await this.logAudit(
      result.allowed ? "agent_access_granted" : "agent_access_denied",
      userId,
      undefined,
      agentName,
      { gate: gate.required, result: result.allowed },
      context
    );

    return { ...result, degraded_mode: gate.degraded_mode };
  }

  // =========================================================================
  // GRANT / WITHDRAW Consent
  // =========================================================================

  /**
   * Grant consent for a specific category. Calls the database function
   * which atomically upserts the record + logs history + writes audit.
   */
  async grantConsent(
    userId: string,
    categoryKey: ConsentCategory,
    version: string,
    method: ConsentMethod,
    context?: DeviceContext
  ): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase.rpc("grant_consent", {
      p_user_id: userId,
      p_category_key: categoryKey,
      p_version: version,
      p_method: method,
      p_device_id: context?.device_id ?? null,
      p_ip_hash: context?.ip_hash ?? null,
      p_user_agent: context?.user_agent ?? null,
      p_session_id: context?.session_id ?? null,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  /**
   * Grant multiple consent categories at once (e.g., during onboarding).
   * Each category is granted independently — partial success is possible.
   */
  async grantBulkConsent(
    userId: string,
    grants: Array<{
      category: ConsentCategory;
      version: string;
      method: ConsentMethod;
    }>,
    context?: DeviceContext
  ): Promise<{ results: Array<{ category: string; success: boolean; error?: string }> }> {
    const results = await Promise.all(
      grants.map(async (g) => {
        const res = await this.grantConsent(
          userId,
          g.category,
          g.version,
          g.method,
          context
        );
        return { category: g.category, ...res };
      })
    );
    return { results };
  }

  /**
   * Withdraw consent for a category. Cannot withdraw core_service —
   * that requires the full account deletion flow.
   */
  async withdrawConsent(
    userId: string,
    categoryKey: ConsentCategory,
    method: ConsentMethod = "toggle_settings",
    context?: DeviceContext
  ): Promise<{ success: boolean; error?: string; consequence?: string }> {
    // Look up consequence text
    const { data: cat } = await this.supabase
      .from("consent_categories")
      .select("withdrawal_consequence, is_required")
      .eq("category_key", categoryKey)
      .single();

    if (cat?.is_required) {
      return {
        success: false,
        error:
          "Core service consent cannot be withdrawn directly. Use the account deletion flow.",
        consequence: cat.withdrawal_consequence,
      };
    }

    const { error } = await this.supabase.rpc("withdraw_consent", {
      p_user_id: userId,
      p_category_key: categoryKey,
      p_method: method,
      p_device_id: context?.device_id ?? null,
      p_ip_hash: context?.ip_hash ?? null,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      consequence: cat?.withdrawal_consequence ?? undefined,
    };
  }

  // =========================================================================
  // RE-CONSENT
  // =========================================================================

  /**
   * Check if a user needs to re-consent to any categories because
   * document versions have changed since they last consented.
   */
  async checkReconsent(userId: string): Promise<ReconsentItem[]> {
    const { data, error } = await this.supabase.rpc("check_reconsent_needed", {
      p_user_id: userId,
    });

    if (error || !data) return [];
    return data as ReconsentItem[];
  }

  /**
   * Complete re-consent: user acknowledged the updated document
   * and re-granted consent at the new version.
   */
  async completeReconsent(
    userId: string,
    categoryKey: ConsentCategory,
    newVersion: string,
    context?: DeviceContext
  ): Promise<{ success: boolean; error?: string }> {
    const result = await this.grantConsent(
      userId,
      categoryKey,
      newVersion,
      "toggle_settings",
      context
    );

    if (result.success) {
      await this.logAudit(
        "reconsent_completed",
        userId,
        categoryKey,
        undefined,
        { new_version: newVersion },
        context
      );
    }

    return result;
  }

  /**
   * User declined re-consent — revoke the affected category.
   */
  async declineReconsent(
    userId: string,
    categoryKey: ConsentCategory,
    context?: DeviceContext
  ): Promise<{ success: boolean; error?: string; consequence?: string }> {
    await this.logAudit(
      "reconsent_declined",
      userId,
      categoryKey,
      undefined,
      {},
      context
    );

    return this.withdrawConsent(userId, categoryKey, "toggle_settings", context);
  }

  // =========================================================================
  // DATA SUBJECT REQUESTS (GDPR Art. 15-22 / CCPA)
  // =========================================================================

  /**
   * Submit a new data subject request. Automatically sets 30-day deadline
   * and logs receipt in audit trail.
   */
  async submitDataRequest(
    userId: string,
    requestType: DataRequestType,
    context?: DeviceContext
  ): Promise<{ success: boolean; request_id?: string; error?: string }> {
    const deadlineAt = new Date();
    deadlineAt.setDate(deadlineAt.getDate() + 30);

    const { data, error } = await this.supabase
      .from("data_subject_requests")
      .insert({
        user_id: userId,
        request_type: requestType,
        deadline_at: deadlineAt.toISOString(),
        metadata: {
          device_id: context?.device_id,
          ip_hash: context?.ip_hash,
          app_version: context?.app_version,
        },
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await this.logAudit(
      "data_request_received",
      userId,
      undefined,
      undefined,
      { request_id: data.id, request_type: requestType },
      context
    );

    return { success: true, request_id: data.id };
  }

  /**
   * Acknowledge a data request (must happen within 72 hours of receipt).
   */
  async acknowledgeDataRequest(
    requestId: string
  ): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase
      .from("data_subject_requests")
      .update({
        status: "identity_verified",
        acknowledged_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  /**
   * Complete a data request. For erasure, also withdraws all non-core
   * consent and logs deletion.
   */
  async completeDataRequest(
    requestId: string,
    exportUrl?: string,
    context?: DeviceContext
  ): Promise<{ success: boolean; error?: string }> {
    // Get the request details
    const { data: req, error: fetchError } = await this.supabase
      .from("data_subject_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError || !req) {
      return { success: false, error: fetchError?.message ?? "Request not found" };
    }

    // Update request status
    const { error: updateError } = await this.supabase
      .from("data_subject_requests")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        export_url: exportUrl ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // For erasure requests, handle consent withdrawal
    if (
      req.request_type === "erasure" ||
      req.request_type === "ccpa_delete"
    ) {
      const optionalCategories: ConsentCategory[] = [
        "taste_profiling",
        "location_services",
        "dietary_health",
        "marketing_comms",
        "sms_push",
        "cookies_tracking",
        "group_taste",
        "third_party_sharing",
      ];

      for (const cat of optionalCategories) {
        await this.withdrawConsent(req.user_id, cat, "api_request", context);
      }

      await this.logAudit(
        "data_deletion_executed",
        req.user_id,
        undefined,
        undefined,
        { request_id: requestId, request_type: req.request_type },
        context
      );
    }

    // For object_profiling, withdraw taste_profiling
    if (req.request_type === "object_profiling") {
      await this.withdrawConsent(
        req.user_id,
        "taste_profiling",
        "api_request",
        context
      );
    }

    // For restrict_processing, withdraw taste_profiling (freeze graph)
    if (req.request_type === "restrict_processing") {
      await this.withdrawConsent(
        req.user_id,
        "taste_profiling",
        "api_request",
        context
      );
    }

    await this.logAudit(
      "data_request_completed",
      req.user_id,
      undefined,
      undefined,
      {
        request_id: requestId,
        request_type: req.request_type,
        export_url: exportUrl ?? null,
      },
      context
    );

    return { success: true };
  }

  /**
   * Get all data requests for a user.
   */
  async getDataRequests(userId: string): Promise<DataSubjectRequest[]> {
    const { data, error } = await this.supabase
      .from("data_subject_requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as DataSubjectRequest[];
  }

  // =========================================================================
  // CONSENT STATUS & RECORDS
  // =========================================================================

  /**
   * Get all consent records for a user — used by the settings/privacy page.
   */
  async getUserConsent(userId: string): Promise<ConsentRecord[]> {
    const { data, error } = await this.supabase
      .from("consent_records")
      .select("category_key, granted, version, method, granted_at, withdrawn_at")
      .eq("user_id", userId);

    if (error || !data) return [];
    return data as ConsentRecord[];
  }

  /**
   * Get all consent categories with their metadata — used to render
   * the consent UI with descriptions and legal basis.
   */
  async getConsentCategories(): Promise<
    Array<{
      category_key: string;
      display_name: string;
      description: string;
      is_required: boolean;
      is_special_category: boolean;
      withdrawal_consequence: string;
      sort_order: number;
    }>
  > {
    const { data, error } = await this.supabase
      .from("consent_categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error || !data) return [];
    return data;
  }

  /**
   * Get current document versions — used during onboarding and re-consent.
   */
  async getCurrentDocumentVersions(): Promise<
    Array<{
      document_key: string;
      document_name: string;
      version: string;
      document_url: string | null;
    }>
  > {
    const { data, error } = await this.supabase
      .from("document_versions")
      .select("document_key, document_name, version, document_url")
      .eq("is_current", true);

    if (error || !data) return [];
    return data;
  }

  // =========================================================================
  // CONSENT HISTORY & AUDIT
  // =========================================================================

  /**
   * Get consent change history for a user — for transparency / export.
   */
  async getConsentHistory(
    userId: string,
    limit: number = 50
  ): Promise<
    Array<{
      category_key: string;
      event_type: string;
      old_version: string | null;
      new_version: string | null;
      method: string;
      created_at: string;
    }>
  > {
    const { data, error } = await this.supabase
      .from("consent_history")
      .select("category_key, event_type, old_version, new_version, method, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data;
  }

  /**
   * Get audit log entries for a user — admin/compliance use.
   */
  async getAuditLog(
    userId: string,
    limit: number = 100
  ): Promise<
    Array<{
      event_type: string;
      category_key: string | null;
      agent_name: string | null;
      details: Record<string, unknown>;
      created_at: string;
    }>
  > {
    const { data, error } = await this.supabase
      .from("consent_audit_log")
      .select("event_type, category_key, agent_name, details, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data;
  }

  // =========================================================================
  // BREACH PROTOCOL
  // =========================================================================

  /**
   * Initiate breach protocol:
   * 1. Reset all consent for affected categories
   * 2. Flag users for re-consent on next app open
   * 3. Log breach events in audit trail
   */
  async initiateBreachProtocol(
    affectedUserIds: string[],
    affectedCategories: ConsentCategory[],
    breachDetails: {
      description: string;
      severity: "low" | "medium" | "high" | "critical";
      data_types_affected: string[];
    }
  ): Promise<{ affected_count: number; errors: string[] }> {
    const errors: string[] = [];
    let affected = 0;

    for (const userId of affectedUserIds) {
      for (const category of affectedCategories) {
        // Reset consent — user must re-consent on next open
        const { error } = await this.supabase.rpc("withdraw_consent", {
          p_user_id: userId,
          p_category_key: category,
          p_method: "breach_reset",
          p_device_id: null,
          p_ip_hash: null,
        });

        if (error) {
          // core_service can't be withdrawn via rpc — handle separately
          if (category !== "core_service") {
            errors.push(`Failed to reset ${category} for ${userId}: ${error.message}`);
          }
          continue;
        }
        affected++;
      }

      // Log breach notification for user
      await this.logAudit(
        "breach_notification_sent",
        userId,
        undefined,
        undefined,
        {
          affected_categories: affectedCategories,
          ...breachDetails,
        }
      );

      await this.logAudit(
        "breach_consent_reset",
        userId,
        undefined,
        undefined,
        {
          categories_reset: affectedCategories,
          ...breachDetails,
        }
      );
    }

    return { affected_count: affected, errors };
  }

  // =========================================================================
  // GROUP CONSENT (Party Room)
  // =========================================================================

  /**
   * Grant per-session consent for Party Room group taste merging.
   * Consent expires when session ends (or after 7 days max).
   */
  async grantGroupConsent(
    userId: string,
    sessionId: string,
    context?: DeviceContext
  ): Promise<{ success: boolean; error?: string }> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Max 7-day expiry

    const { error } = await this.supabase.from("consent_records").upsert(
      {
        user_id: userId,
        category_key: "group_taste",
        granted: true,
        version: "session",
        method: "toggle_onboarding" as ConsentMethod,
        granted_at: new Date().toISOString(),
        withdrawn_at: null,
        expires_at: expiresAt.toISOString(),
        session_id: sessionId,
        device_id: context?.device_id ?? null,
        ip_hash: context?.ip_hash ?? null,
        user_agent: context?.user_agent ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,category_key" }
    );

    if (error) return { success: false, error: error.message };

    await this.logAudit(
      "consent_granted",
      userId,
      "group_taste",
      "group_taste_graph",
      { session_id: sessionId, expires_at: expiresAt.toISOString() },
      context
    );

    return { success: true };
  }

  /**
   * Revoke group consent — user leaves Party Room.
   */
  async revokeGroupConsent(
    userId: string,
    sessionId: string,
    context?: DeviceContext
  ): Promise<{ success: boolean; error?: string }> {
    return this.withdrawConsent(userId, "group_taste", "toggle_settings", {
      ...context,
      session_id: sessionId,
    });
  }

  // =========================================================================
  // ONBOARDING: Full boarding-pass consent flow
  // =========================================================================

  /**
   * Process the complete onboarding consent submission.
   * Maps to Steps 2-5 of the Boarding Pass flow.
   */
  async processOnboardingConsent(
    userId: string,
    consent: {
      core_service: true; // Always true — required to proceed
      taste_profiling: boolean;
      location_services: boolean;
      dietary_health: boolean;
      marketing_comms: boolean;
      sms_push: boolean;
    },
    documentVersions: Record<string, string>,
    context?: DeviceContext
  ): Promise<{
    success: boolean;
    results: Array<{ category: string; success: boolean; error?: string }>;
  }> {
    const grants: Array<{
      category: ConsentCategory;
      version: string;
      method: ConsentMethod;
    }> = [];

    // Core service is always granted (Step 2)
    grants.push({
      category: "core_service",
      version: documentVersions.terms_of_service || "1.0.0",
      method: "clickwrap_onboarding",
    });

    // Optional categories (Steps 3-5)
    const optionalMap: Array<{
      key: keyof typeof consent;
      category: ConsentCategory;
      docKey: string;
    }> = [
      { key: "taste_profiling", category: "taste_profiling", docKey: "data_profiling" },
      { key: "location_services", category: "location_services", docKey: "privacy_policy" },
      { key: "dietary_health", category: "dietary_health", docKey: "data_profiling" },
      { key: "marketing_comms", category: "marketing_comms", docKey: "privacy_policy" },
      { key: "sms_push", category: "sms_push", docKey: "sms_consent" },
    ];

    for (const item of optionalMap) {
      if (consent[item.key]) {
        grants.push({
          category: item.category,
          version: documentVersions[item.docKey] || "1.0.0",
          method: "toggle_onboarding",
        });
      }
    }

    return this.grantBulkConsent(userId, grants, context);
  }

  // =========================================================================
  // EXPORT: Data portability (GDPR Art. 20)
  // =========================================================================

  /**
   * Export all consent data for a user in machine-readable JSON.
   * Used for data access requests (Art. 15) and portability (Art. 20).
   */
  async exportUserConsentData(userId: string): Promise<{
    user_id: string;
    exported_at: string;
    consent_records: ConsentRecord[];
    consent_history: Array<Record<string, unknown>>;
    data_requests: DataSubjectRequest[];
  }> {
    const [records, history, requests] = await Promise.all([
      this.getUserConsent(userId),
      this.getConsentHistory(userId, 1000),
      this.getDataRequests(userId),
    ]);

    await this.logAudit("data_export_generated", userId, undefined, undefined, {
      record_count: records.length,
      history_count: history.length,
      request_count: requests.length,
    });

    return {
      user_id: userId,
      exported_at: new Date().toISOString(),
      consent_records: records,
      consent_history: history,
      data_requests: requests,
    };
  }

  // =========================================================================
  // INTERNAL: Audit Logging
  // =========================================================================

  private async logAudit(
    eventType: AuditEventType,
    userId?: string,
    categoryKey?: string,
    agentName?: string,
    details: Record<string, unknown> = {},
    context?: DeviceContext
  ): Promise<void> {
    await this.supabase.from("consent_audit_log").insert({
      event_type: eventType,
      user_id: userId ?? null,
      category_key: categoryKey ?? null,
      agent_name: agentName ?? null,
      details,
      device_id: context?.device_id ?? null,
      ip_hash: context?.ip_hash ?? null,
      user_agent: context?.user_agent ?? null,
      app_version: context?.app_version ?? null,
      os_info: context?.os_info ?? null,
      session_id: context?.session_id ?? null,
    });
    // Fire-and-forget: audit failures must not block consent operations.
    // In production, add dead-letter queue for failed audit writes.
  }
}

// ---------------------------------------------------------------------------
// Factory: Create a Consent Agent instance from environment variables
// ---------------------------------------------------------------------------

export function createConsentAgent(): ConsentAgent {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
    );
  }

  return new ConsentAgent(url, key);
}
