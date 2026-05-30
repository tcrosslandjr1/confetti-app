/**
 * Orchestrator Agent — The Gear Train
 *
 * Central nervous system that chains all Confetti agents into interlocking
 * workflows. Think of each agent as a gear — the orchestrator is the axle
 * that connects them and keeps them spinning in sequence.
 *
 * Architecture:
 *  1. WORKFLOWS define step-by-step pipelines (e.g., user signup → verify → welcome)
 *  2. Each step is either "auto" (AI runs it) or "human_gate" (pauses for Tyrone)
 *  3. When a human gate is hit, an alert drops onto the admin dashboard
 *  4. When Tyrone acknowledges, the orchestrator kicks the next gear
 *  5. Events from any agent can trigger a workflow (event bus pattern)
 *
 * This is the backbone: email, investor, user issues, tax, compliance —
 * everything flows through here. Tyrone oils the gears; the system runs 24/7.
 *
 * Key concepts:
 *  - WorkflowDefinition: the blueprint (reusable template)
 *  - WorkflowInstance: a running copy of that blueprint
 *  - WorkflowStep: one gear in the chain (auto or human_gate)
 *  - Event: the signal that starts or advances a workflow
 */

import { supabase } from "../supabase";

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export type StepMode = "auto" | "human_gate";
export type StepStatus =
  | "pending"
  | "running"
  | "awaiting_human"
  | "completed"
  | "failed"
  | "skipped";
export type WorkflowStatus = "running" | "paused_at_gate" | "completed" | "failed" | "cancelled";
export type EventSource =
  | "support_queue"
  | "content_cms"
  | "feature_flags"
  | "feedback_pipeline"
  | "seo_aso"
  | "automated_reports"
  | "finance"
  | "legal_compliance"
  | "partnerships"
  | "pricing"
  | "emergency_controls"
  | "identity_verification"
  | "boost_credits"
  | "community"
  | "user_intelligence"
  | "chat_agent"
  | "system"
  | "manual"
  | "cron"
  | "email_inbound";

export interface WorkflowStepDef {
  id: string;
  name: string;
  description: string;
  mode: StepMode;
  agent: string; // which agent handles this step
  action: string; // function name to call on that agent
  autoParams?: Record<string, unknown>; // default params for auto steps
  timeoutMinutes?: number; // how long before a gate becomes overdue
  skipCondition?: string; // expression that skips this step (e.g., "score >= 85")
  onFailure?: "halt" | "skip" | "retry"; // default: halt
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  triggerEvent: string; // event type that starts this workflow
  triggerSource?: EventSource; // optional: only trigger from this source
  steps: WorkflowStepDef[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStepInstance {
  stepId: string;
  name: string;
  mode: StepMode;
  agent: string;
  action: string;
  status: StepStatus;
  startedAt?: string;
  completedAt?: string;
  result?: Record<string, unknown>;
  error?: string;
  acknowledgedBy?: string; // who approved a human_gate
  acknowledgedAt?: string;
}

export interface WorkflowInstance {
  id: string;
  definitionId: string;
  definitionName: string;
  status: WorkflowStatus;
  currentStepIndex: number;
  steps: WorkflowStepInstance[];
  triggerEvent: OrchestratorEvent;
  context: Record<string, unknown>; // data passed between steps
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  error?: string;
}

export interface OrchestratorEvent {
  id: string;
  type: string; // e.g., "user.signup", "refund.requested", "claim.submitted"
  source: EventSource;
  payload: Record<string, unknown>;
  timestamp: string;
  workflowsTriggered: string[]; // instance IDs that this event kicked off
}

export interface GateAlert {
  id: string;
  workflowInstanceId: string;
  workflowName: string;
  stepId: string;
  stepName: string;
  agent: string;
  action: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  category:
    | "finance"
    | "legal"
    | "security"
    | "user_issue"
    | "content"
    | "partnership"
    | "tax"
    | "system"
    | "general";
  payload: Record<string, unknown>;
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  status: "pending" | "acknowledged" | "dismissed" | "expired";
  deadlineAt?: string; // when this becomes overdue
}

export interface OrchestratorDashboard {
  activeWorkflows: number;
  pausedAtGate: number;
  completedToday: number;
  failedToday: number;
  pendingGates: GateAlert[];
  overdueGates: GateAlert[];
  recentCompletions: WorkflowInstance[];
  workflowDefinitions: number;
  eventsTodayCount: number;
}

// ═══════════════════════════════════════════════════════════
// In-Memory Stores (Supabase fallback)
// ═══════════════════════════════════════════════════════════

const definitions = new Map<string, WorkflowDefinition>();
const instances = new Map<string, WorkflowInstance>();
const events = new Map<string, OrchestratorEvent>();
const gates = new Map<string, GateAlert>();

// ═══════════════════════════════════════════════════════════
// Workflow Definition Management
// ═══════════════════════════════════════════════════════════

/** Register a new workflow definition (the blueprint). */
export async function defineWorkflow(
  def: Omit<WorkflowDefinition, "id" | "createdAt" | "updatedAt">,
): Promise<WorkflowDefinition> {
  const workflow: WorkflowDefinition = {
    ...def,
    id: `wf_def_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Supabase persistence
  const { error } = await supabase.from("workflow_definitions").insert(workflow).select().single();

  if (error) {
    console.log("[Orchestrator] Supabase unavailable, using local store");
  }

  definitions.set(workflow.id, workflow);
  return workflow;
}

/** Get all workflow definitions. */
export async function getWorkflowDefinitions(): Promise<WorkflowDefinition[]> {
  return Array.from(definitions.values());
}

/** Enable or disable a workflow definition. */
export async function toggleWorkflow(
  definitionId: string,
  enabled: boolean,
): Promise<WorkflowDefinition> {
  const def = definitions.get(definitionId);
  if (!def) throw new Error(`Workflow definition ${definitionId} not found`);

  def.enabled = enabled;
  def.updatedAt = new Date().toISOString();

  await supabase
    .from("workflow_definitions")
    .update({ enabled, updatedAt: def.updatedAt })
    .eq("id", definitionId);

  return def;
}

// ═══════════════════════════════════════════════════════════
// Event Bus — Fire Events, Trigger Workflows
// ═══════════════════════════════════════════════════════════

/** Fire an event into the system. Any matching workflow definitions will spin up. */
export async function fireEvent(
  type: string,
  source: EventSource,
  payload: Record<string, unknown>,
): Promise<{ event: OrchestratorEvent; triggered: WorkflowInstance[] }> {
  const event: OrchestratorEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    source,
    payload,
    timestamp: new Date().toISOString(),
    workflowsTriggered: [],
  };

  // Find all matching definitions
  const matching = Array.from(definitions.values()).filter((d) => {
    if (!d.enabled) return false;
    if (d.triggerEvent !== type) return false;
    if (d.triggerSource && d.triggerSource !== source) return false;
    return true;
  });

  const triggered: WorkflowInstance[] = [];

  for (const def of matching) {
    const instance = await startWorkflow(def, event);
    event.workflowsTriggered.push(instance.id);
    triggered.push(instance);
  }

  events.set(event.id, event);

  // Persist event
  await supabase.from("orchestrator_events").insert(event).select().single();

  return { event, triggered };
}

// ═══════════════════════════════════════════════════════════
// Workflow Execution Engine
// ═══════════════════════════════════════════════════════════

/** Start a new workflow instance from a definition. */
async function startWorkflow(
  def: WorkflowDefinition,
  triggerEvent: OrchestratorEvent,
): Promise<WorkflowInstance> {
  const instance: WorkflowInstance = {
    id: `wf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    definitionId: def.id,
    definitionName: def.name,
    status: "running",
    currentStepIndex: 0,
    steps: def.steps.map((s) => ({
      stepId: s.id,
      name: s.name,
      mode: s.mode,
      agent: s.agent,
      action: s.action,
      status: "pending" as StepStatus,
    })),
    triggerEvent,
    context: { ...triggerEvent.payload },
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  instances.set(instance.id, instance);

  // Persist
  await supabase.from("workflow_instances").insert(instance).select().single();

  // Start executing from step 0
  await executeCurrentStep(instance);

  return instance;
}

/** Execute the current step in a workflow instance. */
async function executeCurrentStep(instance: WorkflowInstance): Promise<void> {
  const step = instance.steps[instance.currentStepIndex];
  if (!step) {
    // All steps done
    instance.status = "completed";
    instance.completedAt = new Date().toISOString();
    instance.updatedAt = new Date().toISOString();
    await persistInstance(instance);
    return;
  }

  step.status = "running";
  step.startedAt = new Date().toISOString();
  instance.updatedAt = new Date().toISOString();

  if (step.mode === "auto") {
    // Auto step — execute immediately
    try {
      const result = await executeAgentAction(step.agent, step.action, instance.context);
      step.status = "completed";
      step.completedAt = new Date().toISOString();
      step.result = result;

      // Merge result into context for next steps
      if (result) {
        Object.assign(instance.context, result);
      }

      // Advance to next step
      instance.currentStepIndex++;
      instance.updatedAt = new Date().toISOString();
      await persistInstance(instance);

      // Continue chain
      await executeCurrentStep(instance);
    } catch (err) {
      step.status = "failed";
      step.error = err instanceof Error ? err.message : String(err);
      instance.status = "failed";
      instance.error = `Step "${step.name}" failed: ${step.error}`;
      instance.updatedAt = new Date().toISOString();
      await persistInstance(instance);
    }
  } else {
    // Human gate — pause and create alert
    step.status = "awaiting_human";
    instance.status = "paused_at_gate";
    instance.updatedAt = new Date().toISOString();

    await createGateAlert(instance, step);
    await persistInstance(instance);
  }
}

/** Create an alert for a human gate. This shows up on the admin dashboard. */
async function createGateAlert(
  instance: WorkflowInstance,
  step: WorkflowStepInstance,
): Promise<GateAlert> {
  const defStep = getDefinitionStep(instance.definitionId, step.stepId);

  const alert: GateAlert = {
    id: `gate_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    workflowInstanceId: instance.id,
    workflowName: instance.definitionName,
    stepId: step.stepId,
    stepName: step.name,
    agent: step.agent,
    action: step.action,
    description: `${instance.definitionName}: "${step.name}" needs your approval`,
    priority: inferPriority(step.agent, instance.context),
    category: inferCategory(step.agent),
    payload: instance.context,
    createdAt: new Date().toISOString(),
    status: "pending",
    deadlineAt: defStep?.timeoutMinutes
      ? new Date(Date.now() + defStep.timeoutMinutes * 60 * 1000).toISOString()
      : undefined,
  };

  gates.set(alert.id, alert);
  await supabase.from("gate_alerts").insert(alert).select().single();

  return alert;
}

/** Tyrone acknowledges a gate — this is the "oil the gear" moment. */
export async function acknowledgeGate(
  gateId: string,
  acknowledgedBy: string = "tyrone",
  approvalData?: Record<string, unknown>,
): Promise<{ gate: GateAlert; nextStep?: WorkflowStepInstance }> {
  const gate = gates.get(gateId);
  if (!gate) throw new Error(`Gate alert ${gateId} not found`);
  if (gate.status !== "pending") throw new Error(`Gate already ${gate.status}`);

  // Mark gate as acknowledged
  gate.status = "acknowledged";
  gate.acknowledgedAt = new Date().toISOString();
  gate.acknowledgedBy = acknowledgedBy;

  await supabase
    .from("gate_alerts")
    .update({
      status: "acknowledged",
      acknowledgedAt: gate.acknowledgedAt,
      acknowledgedBy,
    })
    .eq("id", gateId);

  // Resume the workflow
  const instance = instances.get(gate.workflowInstanceId);
  if (!instance) throw new Error(`Workflow instance ${gate.workflowInstanceId} not found`);

  const step = instance.steps[instance.currentStepIndex];
  step.status = "completed";
  step.completedAt = new Date().toISOString();
  step.acknowledgedBy = acknowledgedBy;
  step.acknowledgedAt = gate.acknowledgedAt;

  // Merge any approval data into context
  if (approvalData) {
    Object.assign(instance.context, approvalData);
  }

  // Advance to next step
  instance.currentStepIndex++;
  instance.status = "running";
  instance.updatedAt = new Date().toISOString();
  await persistInstance(instance);

  // Continue the chain — next gear starts spinning
  await executeCurrentStep(instance);

  const nextStep = instance.steps[instance.currentStepIndex] || undefined;
  return { gate, nextStep };
}

/** Dismiss a gate alert (skip the step, continue workflow). */
export async function dismissGate(gateId: string, reason?: string): Promise<GateAlert> {
  const gate = gates.get(gateId);
  if (!gate) throw new Error(`Gate alert ${gateId} not found`);

  gate.status = "dismissed";
  gate.acknowledgedAt = new Date().toISOString();

  const instance = instances.get(gate.workflowInstanceId);
  if (instance) {
    const step = instance.steps[instance.currentStepIndex];
    step.status = "skipped";
    step.completedAt = new Date().toISOString();
    step.error = reason || "Dismissed by admin";

    instance.currentStepIndex++;
    instance.status = "running";
    instance.updatedAt = new Date().toISOString();

    await executeCurrentStep(instance);
    await persistInstance(instance);
  }

  await supabase
    .from("gate_alerts")
    .update({ status: "dismissed", acknowledgedAt: gate.acknowledgedAt })
    .eq("id", gateId);
  return gate;
}

// ═══════════════════════════════════════════════════════════
// Query & Dashboard
// ═══════════════════════════════════════════════════════════

/** Get all pending gate alerts — the items Tyrone needs to act on. */
export async function getPendingGates(): Promise<GateAlert[]> {
  return Array.from(gates.values())
    .filter((g) => g.status === "pending")
    .sort((a, b) => {
      const p = { critical: 0, high: 1, medium: 2, low: 3 };
      return (
        p[a.priority] - p[b.priority] ||
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });
}

/** Get overdue gates (past their deadline). */
export async function getOverdueGates(): Promise<GateAlert[]> {
  const now = new Date().toISOString();
  return Array.from(gates.values()).filter(
    (g) => g.status === "pending" && g.deadlineAt && g.deadlineAt < now,
  );
}

/** Get a specific workflow instance. */
export async function getWorkflowInstance(
  instanceId: string,
): Promise<WorkflowInstance | undefined> {
  return instances.get(instanceId);
}

/** Get all active (non-completed) workflow instances. */
export async function getActiveWorkflows(): Promise<WorkflowInstance[]> {
  return Array.from(instances.values()).filter(
    (i) => i.status === "running" || i.status === "paused_at_gate",
  );
}

/** Get workflow history for a date range. */
export async function getWorkflowHistory(days: number = 7): Promise<WorkflowInstance[]> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  return Array.from(instances.values())
    .filter((i) => i.startedAt >= cutoff)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

/** Get recent events. */
export async function getRecentEvents(limit: number = 50): Promise<OrchestratorEvent[]> {
  return Array.from(events.values())
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

/** Full orchestrator dashboard. */
export async function getOrchestratorDashboard(): Promise<OrchestratorDashboard> {
  const today = new Date().toISOString().slice(0, 10);
  const allInstances = Array.from(instances.values());
  const todayInstances = allInstances.filter((i) => i.startedAt.startsWith(today));
  const todayEvents = Array.from(events.values()).filter((e) => e.timestamp.startsWith(today));

  const pendingGates = await getPendingGates();
  const overdueGates = await getOverdueGates();

  const recentCompletions = allInstances
    .filter((i) => i.status === "completed")
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
    .slice(0, 10);

  return {
    activeWorkflows: allInstances.filter((i) => i.status === "running").length,
    pausedAtGate: allInstances.filter((i) => i.status === "paused_at_gate").length,
    completedToday: todayInstances.filter((i) => i.status === "completed").length,
    failedToday: todayInstances.filter((i) => i.status === "failed").length,
    pendingGates,
    overdueGates,
    recentCompletions,
    workflowDefinitions: definitions.size,
    eventsTodayCount: todayEvents.length,
  };
}

// ═══════════════════════════════════════════════════════════
// Agent Action Executor (the gear-to-gear connector)
// ═══════════════════════════════════════════════════════════

/**
 * Execute an agent's action by name.
 * In production this dynamically imports and calls the agent function.
 * In dev mode it returns a mock result to keep the chain moving.
 */
async function executeAgentAction(
  agent: string,
  action: string,
  context: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  console.log(`[Orchestrator] Executing: ${agent}.${action}`, Object.keys(context));

  // Dynamic dispatch — in production, this would import the agent module
  // and call the function. For now, simulate with a result passthrough.
  try {
    // Try dynamic import of the agent
    const mod = await import(`./${agent}`);
    if (typeof mod[action] === "function") {
      const result = await mod[action](context);
      return typeof result === "object" && result !== null ? result : { result };
    }
    console.log(`[Orchestrator] Action ${agent}.${action} not found, using passthrough`);
    return { _passthrough: true, agent, action };
  } catch {
    // If import fails (dev mode), return passthrough
    console.log(`[Orchestrator] Agent ${agent} not importable, mock passthrough`);
    return { _passthrough: true, agent, action, timestamp: new Date().toISOString() };
  }
}

// ═══════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════

function getDefinitionStep(defId: string, stepId: string): WorkflowStepDef | undefined {
  const def = definitions.get(defId);
  return def?.steps.find((s) => s.id === stepId);
}

function inferPriority(agent: string, context: Record<string, unknown>): GateAlert["priority"] {
  if (agent === "emergency-controls") return "critical";
  if (agent === "finance" && context.amount && Number(context.amount) > 10000) return "critical";
  if (agent === "legal-compliance") return "high";
  if (agent === "finance") return "high";
  if (agent === "identity-verification") return "medium";
  if (agent === "partnerships") return "medium";
  if (agent === "pricing") return "low";
  return "medium";
}

function inferCategory(agent: string): GateAlert["category"] {
  const map: Record<string, GateAlert["category"]> = {
    finance: "finance",
    "legal-compliance": "legal",
    "emergency-controls": "security",
    "identity-verification": "security",
    "support-queue": "user_issue",
    "content-cms": "content",
    partnerships: "partnership",
    pricing: "finance",
  };
  return map[agent] || "general";
}

async function persistInstance(instance: WorkflowInstance): Promise<void> {
  instances.set(instance.id, instance);
  await supabase.from("workflow_instances").upsert(instance).select().single();
}

// ═══════════════════════════════════════════════════════════
// Seed Demo — Default Workflow Pipelines
// ═══════════════════════════════════════════════════════════

export async function seedOrchestratorDemo(): Promise<{
  definitions: number;
  instances: number;
  gates: number;
}> {
  // ── Pipeline 1: New User Signup ──
  await defineWorkflow({
    name: "New User Onboarding",
    description: "User signs up → send welcome content → track in intelligence",
    triggerEvent: "user.signup",
    steps: [
      {
        id: "s1",
        name: "Create user profile",
        description: "Initialize taste profile",
        mode: "auto",
        agent: "user-intelligence",
        action: "applyOnboardingPreferences",
      },
      {
        id: "s2",
        name: "Generate welcome push",
        description: "Send welcome notification",
        mode: "auto",
        agent: "content-cms",
        action: "generateContent",
      },
      {
        id: "s3",
        name: "Track signup event",
        description: "Record in analytics",
        mode: "auto",
        agent: "automated-reports",
        action: "getMetricSnapshot",
      },
    ],
    enabled: true,
  });

  // ── Pipeline 2: Refund Request ──
  await defineWorkflow({
    name: "Refund Processing",
    description: "User requests refund → fraud check → Tyrone approves → process",
    triggerEvent: "refund.requested",
    steps: [
      {
        id: "s1",
        name: "Fraud scan",
        description: "Check for fraud signals",
        mode: "auto",
        agent: "finance",
        action: "detectFraudSignals",
      },
      {
        id: "s2",
        name: "Tyrone approves refund",
        description: "Review refund request and fraud results",
        mode: "human_gate",
        agent: "finance",
        action: "approveRefund",
        timeoutMinutes: 1440,
      },
      {
        id: "s3",
        name: "Process refund",
        description: "Execute the refund via Stripe",
        mode: "auto",
        agent: "finance",
        action: "processRefund",
      },
      {
        id: "s4",
        name: "Notify user",
        description: "Send refund confirmation",
        mode: "auto",
        agent: "content-cms",
        action: "generateContent",
      },
    ],
    enabled: true,
  });

  // ── Pipeline 3: Business Claim Verification ──
  await defineWorkflow({
    name: "Business Claim Verification",
    description: "Business submits claim → AI scores → human review if needed → onboard",
    triggerEvent: "claim.submitted",
    steps: [
      {
        id: "s1",
        name: "AI document review",
        description: "Score verification 0-100",
        mode: "auto",
        agent: "identity-verification",
        action: "runAIReview",
      },
      {
        id: "s2",
        name: "Tyrone reviews claim",
        description: "Manual review for edge cases",
        mode: "human_gate",
        agent: "identity-verification",
        action: "approveVerification",
        timeoutMinutes: 4320,
      },
      {
        id: "s3",
        name: "Create partner record",
        description: "Add to partnership pipeline",
        mode: "auto",
        agent: "partnerships",
        action: "addPartner",
      },
      {
        id: "s4",
        name: "Send welcome kit",
        description: "Onboarding email to business",
        mode: "auto",
        agent: "content-cms",
        action: "generateContent",
      },
    ],
    enabled: true,
  });

  // ── Pipeline 4: DMCA Takedown ──
  await defineWorkflow({
    name: "DMCA Takedown",
    description: "DMCA filed → AI legitimacy check → Tyrone reviews → execute",
    triggerEvent: "dmca.filed",
    steps: [
      {
        id: "s1",
        name: "AI legitimacy analysis",
        description: "Score DMCA claim",
        mode: "auto",
        agent: "legal-compliance",
        action: "analyzeDMCA",
      },
      {
        id: "s2",
        name: "Tyrone reviews DMCA",
        description: "Approve or reject takedown",
        mode: "human_gate",
        agent: "legal-compliance",
        action: "approveDataRequest",
        timeoutMinutes: 2880,
      },
      {
        id: "s3",
        name: "Execute takedown",
        description: "Remove content if approved",
        mode: "auto",
        agent: "legal-compliance",
        action: "executeDataDeletion",
      },
    ],
    enabled: true,
  });

  // ── Pipeline 5: Tax Quarter End ──
  await defineWorkflow({
    name: "Quarterly Tax Review",
    description: "Quarter ends → finance snapshot → Tyrone reviews → file prep",
    triggerEvent: "tax.quarter_end",
    steps: [
      {
        id: "s1",
        name: "Generate tax summary",
        description: "Pull quarterly revenue and tax data",
        mode: "auto",
        agent: "finance",
        action: "getTaxSummary",
      },
      {
        id: "s2",
        name: "Generate finance report",
        description: "Full quarterly breakdown",
        mode: "auto",
        agent: "automated-reports",
        action: "generateReport",
      },
      {
        id: "s3",
        name: "Tyrone reviews tax filing",
        description: "Review numbers before filing",
        mode: "human_gate",
        agent: "finance",
        action: "getFinanceDashboard",
        timeoutMinutes: 10080,
      },
    ],
    enabled: true,
  });

  // ── Pipeline 6: Partner Outreach ──
  await defineWorkflow({
    name: "Partner Outreach Campaign",
    description: "New prospect → AI drafts outreach → Tyrone sends → track response",
    triggerEvent: "partner.prospect_added",
    steps: [
      {
        id: "s1",
        name: "AI draft outreach email",
        description: "Generate personalized outreach",
        mode: "auto",
        agent: "partnerships",
        action: "generateOutreach",
      },
      {
        id: "s2",
        name: "Tyrone reviews & sends",
        description: "Review AI draft, tweak if needed, send",
        mode: "human_gate",
        agent: "partnerships",
        action: "addActivity",
        timeoutMinutes: 4320,
      },
      {
        id: "s3",
        name: "Schedule follow-up",
        description: "Set 7-day follow-up reminder",
        mode: "auto",
        agent: "partnerships",
        action: "setFollowUp",
      },
    ],
    enabled: true,
  });

  // ── Pipeline 7: Emergency Incident ──
  await defineWorkflow({
    name: "Emergency Response",
    description: "Critical alert → kill switch → Tyrone reviews → resolve incident",
    triggerEvent: "emergency.critical_alert",
    steps: [
      {
        id: "s1",
        name: "Auto-activate kill switch",
        description: "Immediately protect users",
        mode: "auto",
        agent: "emergency-controls",
        action: "activateKillSwitch",
      },
      {
        id: "s2",
        name: "Start incident log",
        description: "Begin incident tracking",
        mode: "auto",
        agent: "emergency-controls",
        action: "startIncident",
      },
      {
        id: "s3",
        name: "Tyrone assesses situation",
        description: "Review incident, decide next steps",
        mode: "human_gate",
        agent: "emergency-controls",
        action: "updateIncident",
        timeoutMinutes: 60,
      },
      {
        id: "s4",
        name: "Resolve incident",
        description: "Close incident and restore service",
        mode: "auto",
        agent: "emergency-controls",
        action: "resolveIncident",
      },
    ],
    enabled: true,
  });

  // ── Pipeline 8: Support Escalation ──
  await defineWorkflow({
    name: "Support Escalation",
    description: "Ticket escalated → Tyrone reviews → respond → close",
    triggerEvent: "support.escalated",
    steps: [
      {
        id: "s1",
        name: "AI generates context summary",
        description: "Summarize ticket history",
        mode: "auto",
        agent: "support-queue",
        action: "generateAIResponse",
      },
      {
        id: "s2",
        name: "Tyrone handles escalation",
        description: "Personal response needed",
        mode: "human_gate",
        agent: "support-queue",
        action: "addMessage",
        timeoutMinutes: 1440,
      },
      {
        id: "s3",
        name: "Resolve ticket",
        description: "Mark as resolved",
        mode: "auto",
        agent: "support-queue",
        action: "resolveTicket",
      },
    ],
    enabled: true,
  });

  // ── Pipeline 9: Pricing Experiment ──
  await defineWorkflow({
    name: "Launch Pricing Experiment",
    description: "AI suggests pricing change → Tyrone approves → run A/B → report",
    triggerEvent: "pricing.suggestion_ready",
    steps: [
      {
        id: "s1",
        name: "AI generates pricing suggestions",
        description: "Analyze performance, suggest changes",
        mode: "auto",
        agent: "pricing",
        action: "generatePricingSuggestions",
      },
      {
        id: "s2",
        name: "Tyrone approves experiment",
        description: "Review suggestions, approve A/B test",
        mode: "human_gate",
        agent: "pricing",
        action: "startExperiment",
        timeoutMinutes: 4320,
      },
      {
        id: "s3",
        name: "Monitor experiment",
        description: "Track conversions",
        mode: "auto",
        agent: "automated-reports",
        action: "generateReport",
      },
    ],
    enabled: true,
  });

  // ── Pipeline 10: GDPR Data Request ──
  await defineWorkflow({
    name: "GDPR Data Request",
    description: "User requests data → compile → Tyrone reviews → export → deliver",
    triggerEvent: "gdpr.data_request",
    steps: [
      {
        id: "s1",
        name: "Compile user data",
        description: "Gather all user data across systems",
        mode: "auto",
        agent: "legal-compliance",
        action: "exportUserData",
      },
      {
        id: "s2",
        name: "Tyrone reviews data package",
        description: "Ensure completeness and no sensitive leaks",
        mode: "human_gate",
        agent: "legal-compliance",
        action: "approveDataRequest",
        timeoutMinutes: 2880,
      },
      {
        id: "s3",
        name: "Deliver to user",
        description: "Send data export package",
        mode: "auto",
        agent: "content-cms",
        action: "generateContent",
      },
    ],
    enabled: true,
  });

  // ── Seed a running instance with a pending gate ──
  const sampleEvent: OrchestratorEvent = {
    id: "evt_seed_001",
    type: "refund.requested",
    source: "finance",
    payload: {
      userId: "user_42",
      amount: 4999,
      reason: "Double charged",
      email: "customer@example.com",
    },
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    workflowsTriggered: ["wf_seed_001"],
  };
  events.set(sampleEvent.id, sampleEvent);

  const sampleInstance: WorkflowInstance = {
    id: "wf_seed_001",
    definitionId:
      Array.from(definitions.values()).find((d) => d.triggerEvent === "refund.requested")?.id || "",
    definitionName: "Refund Processing",
    status: "paused_at_gate",
    currentStepIndex: 1,
    steps: [
      {
        stepId: "s1",
        name: "Fraud scan",
        mode: "auto",
        agent: "finance",
        action: "detectFraudSignals",
        status: "completed",
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 500).toISOString(),
        result: { fraudSignals: [], riskLevel: "low" },
      },
      {
        stepId: "s2",
        name: "Tyrone approves refund",
        mode: "human_gate",
        agent: "finance",
        action: "approveRefund",
        status: "awaiting_human",
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 500).toISOString(),
      },
      {
        stepId: "s3",
        name: "Process refund",
        mode: "auto",
        agent: "finance",
        action: "processRefund",
        status: "pending",
      },
      {
        stepId: "s4",
        name: "Notify user",
        mode: "auto",
        agent: "content-cms",
        action: "generateContent",
        status: "pending",
      },
    ],
    triggerEvent: sampleEvent,
    context: {
      userId: "user_42",
      amount: 4999,
      reason: "Double charged",
      email: "customer@example.com",
      fraudSignals: [],
      riskLevel: "low",
    },
    startedAt: sampleEvent.timestamp,
    updatedAt: new Date().toISOString(),
  };
  instances.set(sampleInstance.id, sampleInstance);

  // Sample gate alert waiting for Tyrone
  const sampleGate: GateAlert = {
    id: "gate_seed_001",
    workflowInstanceId: sampleInstance.id,
    workflowName: "Refund Processing",
    stepId: "s2",
    stepName: "Tyrone approves refund",
    agent: "finance",
    action: "approveRefund",
    description: 'Refund Processing: "Tyrone approves refund" needs your approval',
    priority: "high",
    category: "finance",
    payload: sampleInstance.context,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: "pending",
    deadlineAt: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
  };
  gates.set(sampleGate.id, sampleGate);

  return {
    definitions: definitions.size,
    instances: instances.size,
    gates: gates.size,
  };
}
