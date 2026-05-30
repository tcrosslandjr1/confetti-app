/**
 * Finance Agent
 *
 * Revenue tracking, refund queue, and payout management for Confetti.
 * AI surfaces data and drafts actions; Tyrone approves all money movement.
 *
 * Revenue streams:
 *   - Subscription fees (Confetti Black $4.99/mo)
 *   - Boost credit purchases (business tiers: $99-$2500/mo)
 *   - Confetti Fund deposits (group wallets)
 *   - Booking fees (venue reservations)
 *
 * Safety:
 *   - All refunds require admin approval before processing
 *   - All payouts require admin approval before release
 *   - Fraud detection flags suspicious patterns for review
 */

import { supabase } from "../supabase";

// ─── Types ─────────────────────────────────────────────────────

export type TransactionType =
  | "subscription"
  | "boost_purchase"
  | "fund_deposit"
  | "booking_fee"
  | "refund"
  | "payout"
  | "adjustment";

export type TransactionStatus =
  | "pending"
  | "completed"
  | "failed"
  | "refunded"
  | "pending_approval";

export type PayoutStatus = "pending" | "approved" | "processing" | "completed" | "rejected";

export type RefundReason =
  | "duplicate_charge"
  | "service_issue"
  | "venue_closed"
  | "user_request"
  | "fraud"
  | "other";

export interface Transaction {
  id: string;
  userId?: string;
  businessId?: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  description: string;
  stripePaymentId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface RefundRequest {
  id: string;
  transactionId: string;
  userId: string;
  amount: number;
  reason: RefundReason;
  description: string;
  status: "pending" | "approved" | "rejected" | "processed";
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface PayoutRecord {
  id: string;
  businessId: string;
  businessName: string;
  amount: number;
  status: PayoutStatus;
  period: string;
  transactionCount: number;
  requestedAt: string;
  approvedAt?: string;
  processedAt?: string;
  approvedBy?: string;
}

export interface RevenueMetrics {
  totalRevenue: number;
  mrr: number;
  arr: number;
  revenueByType: Record<TransactionType, number>;
  refundRate: number;
  avgTransactionValue: number;
  period: string;
}

export interface TaxSummary {
  period: string;
  grossRevenue: number;
  refunds: number;
  netRevenue: number;
  platformFees: number;
  payoutsToVenues: number;
  taxableIncome: number;
}

export interface FinanceDashboard {
  revenue: RevenueMetrics;
  pendingRefunds: number;
  pendingPayouts: number;
  totalPendingAmount: number;
  recentTransactions: Transaction[];
  fraudAlerts: FraudSignal[];
}

export interface FraudSignal {
  userId: string;
  signal: string;
  severity: "low" | "medium" | "high";
  detectedAt: string;
}

// ─── In-memory stores (local-first, syncs to Supabase) ────────

let transactionStore: Transaction[] = [];
let refundStore: RefundRequest[] = [];
let payoutStore: PayoutRecord[] = [];
let fraudAlertStore: FraudSignal[] = [];

// ─── Record transaction ───────────────────────────────────────

export async function recordTransaction(
  type: TransactionType,
  amount: number,
  userId?: string,
  businessId?: string,
  description?: string,
  stripeId?: string,
): Promise<Transaction> {
  const tx: Transaction = {
    id: crypto.randomUUID?.() ?? `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId,
    businessId,
    type,
    amount,
    currency: "usd",
    status: type === "refund" || type === "payout" ? "pending_approval" : "completed",
    description: description ?? `${type} transaction`,
    stripePaymentId: stripeId,
    createdAt: new Date().toISOString(),
  };

  transactionStore.push(tx);

  try {
    await supabase.from("transactions").insert(tx);
  } catch {
    // local-only mode
  }

  return tx;
}

// ─── Request refund ───────────────────────────────────────────

export async function requestRefund(
  transactionId: string,
  userId: string,
  reason: RefundReason,
  description: string,
): Promise<RefundRequest | null> {
  const tx = transactionStore.find((t) => t.id === transactionId);
  if (!tx) return null;

  const refund: RefundRequest = {
    id: crypto.randomUUID?.() ?? `ref-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    transactionId,
    userId,
    amount: tx.amount,
    reason,
    description,
    status: "pending",
    requestedAt: new Date().toISOString(),
  };

  refundStore.push(refund);

  try {
    await supabase.from("refund_requests").insert(refund);
  } catch {
    // local-only mode
  }

  return refund;
}

// ─── Approve refund (REQUIRES ADMIN) ──────────────────────────

export async function approveRefund(
  refundId: string,
  approvedBy: string,
  notes?: string,
): Promise<RefundRequest | null> {
  const refund = refundStore.find((r) => r.id === refundId);
  if (!refund || refund.status !== "pending") return null;

  refund.status = "approved";
  refund.reviewedAt = new Date().toISOString();
  refund.reviewedBy = approvedBy;
  refund.reviewNotes = notes;

  try {
    await supabase.from("refund_requests").upsert(refund);
  } catch {
    // local-only mode
  }

  return refund;
}

// ─── Reject refund (REQUIRES ADMIN) ──────────────────────────

export async function rejectRefund(
  refundId: string,
  rejectedBy: string,
  notes?: string,
): Promise<RefundRequest | null> {
  const refund = refundStore.find((r) => r.id === refundId);
  if (!refund || refund.status !== "pending") return null;

  refund.status = "rejected";
  refund.reviewedAt = new Date().toISOString();
  refund.reviewedBy = rejectedBy;
  refund.reviewNotes = notes;

  try {
    await supabase.from("refund_requests").upsert(refund);
  } catch {
    // local-only mode
  }

  return refund;
}

// ─── Process approved refund ──────────────────────────────────

export async function processRefund(refundId: string): Promise<RefundRequest | null> {
  const refund = refundStore.find((r) => r.id === refundId);
  if (!refund || refund.status !== "approved") return null;

  // Mark the original transaction as refunded
  const tx = transactionStore.find((t) => t.id === refund.transactionId);
  if (tx) {
    tx.status = "refunded";
  }

  // Record the refund as a negative transaction
  await recordTransaction(
    "refund",
    -refund.amount,
    refund.userId,
    undefined,
    `Refund for ${refund.transactionId}: ${refund.reason}`,
  );

  refund.status = "processed";

  try {
    await supabase.from("refund_requests").upsert(refund);
  } catch {
    // local-only mode
  }

  return refund;
}

// ─── Request payout ───────────────────────────────────────────

export async function requestPayout(
  businessId: string,
  amount: number,
  period: string,
): Promise<PayoutRecord> {
  const businessTxs = transactionStore.filter(
    (t) => t.businessId === businessId && t.status === "completed" && t.type !== "payout",
  );

  const payout: PayoutRecord = {
    id: crypto.randomUUID?.() ?? `pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    businessId,
    businessName: `Business ${businessId.slice(0, 6)}`,
    amount,
    status: "pending",
    period,
    transactionCount: businessTxs.length,
    requestedAt: new Date().toISOString(),
  };

  payoutStore.push(payout);

  try {
    await supabase.from("payout_records").insert(payout);
  } catch {
    // local-only mode
  }

  return payout;
}

// ─── Approve payout (REQUIRES ADMIN) ─────────────────────────

export async function approvePayout(
  payoutId: string,
  approvedBy: string,
): Promise<PayoutRecord | null> {
  const payout = payoutStore.find((p) => p.id === payoutId);
  if (!payout || payout.status !== "pending") return null;

  payout.status = "approved";
  payout.approvedAt = new Date().toISOString();
  payout.approvedBy = approvedBy;

  // Record as a completed payout transaction
  await recordTransaction(
    "payout",
    -payout.amount,
    undefined,
    payout.businessId,
    `Payout to ${payout.businessName} for ${payout.period}`,
  );

  payout.status = "processing";

  try {
    await supabase.from("payout_records").upsert(payout);
  } catch {
    // local-only mode
  }

  return payout;
}

// ─── Get refund queue ─────────────────────────────────────────

export function getRefundQueue(): RefundRequest[] {
  return refundStore
    .filter((r) => r.status === "pending")
    .sort((a, b) => new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime());
}

// ─── Get payout queue ─────────────────────────────────────────

export function getPayoutQueue(): PayoutRecord[] {
  return payoutStore
    .filter((p) => p.status === "pending")
    .sort((a, b) => new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime());
}

// ─── Revenue metrics ──────────────────────────────────────────

export function getRevenueMetrics(period?: string): RevenueMetrics {
  const now = new Date();
  const periodLabel =
    period ?? `${now.toLocaleString("en-US", { month: "long", year: "numeric" })}`;

  // Filter transactions for period (default: current month)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const txs = transactionStore.filter(
    (t) => t.status === "completed" && new Date(t.createdAt) >= monthStart && t.amount > 0,
  );

  const revenueByType: Record<TransactionType, number> = {
    subscription: 0,
    boost_purchase: 0,
    fund_deposit: 0,
    booking_fee: 0,
    refund: 0,
    payout: 0,
    adjustment: 0,
  };

  let totalRevenue = 0;
  for (const tx of txs) {
    revenueByType[tx.type] += tx.amount;
    if (tx.type !== "refund" && tx.type !== "payout") {
      totalRevenue += tx.amount;
    }
  }

  const refunds = transactionStore.filter(
    (t) => t.type === "refund" && new Date(t.createdAt) >= monthStart,
  );
  const refundTotal = refunds.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const refundRate = totalRevenue > 0 ? refundTotal / totalRevenue : 0;

  const mrr = revenueByType.subscription + revenueByType.boost_purchase;
  const avgTx = txs.length > 0 ? totalRevenue / txs.length : 0;

  return {
    totalRevenue,
    mrr,
    arr: mrr * 12,
    revenueByType,
    refundRate: Math.round(refundRate * 10000) / 100,
    avgTransactionValue: Math.round(avgTx * 100) / 100,
    period: periodLabel,
  };
}

// ─── Transaction history ──────────────────────────────────────

export function getTransactionHistory(filter?: {
  type?: TransactionType;
  userId?: string;
  businessId?: string;
  dateRange?: { start: string; end: string };
}): Transaction[] {
  let txs = [...transactionStore];

  if (filter?.type) {
    txs = txs.filter((t) => t.type === filter.type);
  }
  if (filter?.userId) {
    txs = txs.filter((t) => t.userId === filter.userId);
  }
  if (filter?.businessId) {
    txs = txs.filter((t) => t.businessId === filter.businessId);
  }
  if (filter?.dateRange) {
    const start = new Date(filter.dateRange.start);
    const end = new Date(filter.dateRange.end);
    txs = txs.filter((t) => {
      const d = new Date(t.createdAt);
      return d >= start && d <= end;
    });
  }

  return txs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// ─── Tax summary ──────────────────────────────────────────────

export function getTaxSummary(year: number, quarter?: number): TaxSummary {
  let startMonth = 0;
  let endMonth = 11;

  if (quarter) {
    startMonth = (quarter - 1) * 3;
    endMonth = startMonth + 2;
  }

  const start = new Date(year, startMonth, 1);
  const end = new Date(year, endMonth + 1, 0, 23, 59, 59);

  const txs = transactionStore.filter((t) => {
    const d = new Date(t.createdAt);
    return d >= start && d <= end;
  });

  const grossRevenue = txs
    .filter((t) => t.amount > 0 && t.type !== "refund" && t.type !== "payout")
    .reduce((sum, t) => sum + t.amount, 0);

  const refunds = txs
    .filter((t) => t.type === "refund")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const payoutsToVenues = txs
    .filter((t) => t.type === "payout")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const netRevenue = grossRevenue - refunds;
  const platformFees = Math.round(grossRevenue * 0.029 * 100) / 100; // ~2.9% Stripe fees
  const taxableIncome = netRevenue - platformFees - payoutsToVenues;

  const periodLabel = quarter ? `Q${quarter} ${year}` : `${year}`;

  return {
    period: periodLabel,
    grossRevenue: Math.round(grossRevenue * 100) / 100,
    refunds: Math.round(refunds * 100) / 100,
    netRevenue: Math.round(netRevenue * 100) / 100,
    platformFees: Math.round(platformFees * 100) / 100,
    payoutsToVenues: Math.round(payoutsToVenues * 100) / 100,
    taxableIncome: Math.round(taxableIncome * 100) / 100,
  };
}

// ─── Finance dashboard ────────────────────────────────────────

export function getFinanceDashboard(): FinanceDashboard {
  const pendingRefunds = getRefundQueue();
  const pendingPayouts = getPayoutQueue();

  return {
    revenue: getRevenueMetrics(),
    pendingRefunds: pendingRefunds.length,
    pendingPayouts: pendingPayouts.length,
    totalPendingAmount:
      pendingRefunds.reduce((s, r) => s + r.amount, 0) +
      pendingPayouts.reduce((s, p) => s + p.amount, 0),
    recentTransactions: transactionStore
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20),
    fraudAlerts: fraudAlertStore.filter(
      (f) => new Date(f.detectedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
    ),
  };
}

// ─── Fraud signal detection ───────────────────────────────────

export function detectFraudSignals(userId: string): FraudSignal[] {
  const signals: FraudSignal[] = [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const userTxs = transactionStore.filter((t) => t.userId === userId);
  const userRefunds = refundStore.filter((r) => r.userId === userId);

  // Multiple refunds in 30 days
  const recentRefunds = userRefunds.filter((r) => new Date(r.requestedAt) >= thirtyDaysAgo);
  if (recentRefunds.length >= 3) {
    signals.push({
      userId,
      signal: `${recentRefunds.length} refund requests in the last 30 days`,
      severity: recentRefunds.length >= 5 ? "high" : "medium",
      detectedAt: now.toISOString(),
    });
  }

  // Rapid purchases (5+ in 1 hour)
  const recentTxs = userTxs.filter((t) => new Date(t.createdAt) >= sevenDaysAgo);
  for (let i = 0; i < recentTxs.length; i++) {
    const txTime = new Date(recentTxs[i].createdAt).getTime();
    const withinHour = recentTxs.filter((t) => {
      const d = new Date(t.createdAt).getTime();
      return d >= txTime && d <= txTime + 60 * 60 * 1000;
    });
    if (withinHour.length >= 5) {
      signals.push({
        userId,
        signal: `${withinHour.length} transactions within a 1-hour window`,
        severity: "high",
        detectedAt: now.toISOString(),
      });
      break;
    }
  }

  // High refund-to-purchase ratio
  const totalPurchases = userTxs.filter((t) => t.amount > 0 && t.status === "completed").length;
  if (totalPurchases > 0 && userRefunds.length / totalPurchases > 0.5) {
    signals.push({
      userId,
      signal: `Refund-to-purchase ratio is ${Math.round((userRefunds.length / totalPurchases) * 100)}%`,
      severity: userRefunds.length / totalPurchases > 0.75 ? "high" : "medium",
      detectedAt: now.toISOString(),
    });
  }

  // Same amount refunds (possible duplicate gaming)
  const refundAmounts = recentRefunds.map((r) => r.amount);
  const duplicateAmounts = refundAmounts.filter((amt, idx) => refundAmounts.indexOf(amt) !== idx);
  if (duplicateAmounts.length > 0) {
    signals.push({
      userId,
      signal: `Multiple refund requests for the same amount ($${duplicateAmounts[0]})`,
      severity: "medium",
      detectedAt: now.toISOString(),
    });
  }

  // Store new alerts
  for (const signal of signals) {
    const alreadyExists = fraudAlertStore.some(
      (f) => f.userId === signal.userId && f.signal === signal.signal,
    );
    if (!alreadyExists) {
      fraudAlertStore.push(signal);
    }
  }

  return signals;
}

// ─── Seed demo data ───────────────────────────────────────────

export async function seedFinanceDemo(): Promise<{
  transactions: number;
  refunds: number;
  payouts: number;
}> {
  transactionStore = [];
  refundStore = [];
  payoutStore = [];
  fraudAlertStore = [];

  const now = new Date();

  // Generate 60 days of transactions
  for (let day = 59; day >= 0; day--) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);

    // Subscriptions (daily batch)
    const subCount = Math.floor(Math.random() * 8) + 3;
    for (let i = 0; i < subCount; i++) {
      const txDate = new Date(date);
      txDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
      const tx: Transaction = {
        id: crypto.randomUUID?.() ?? `tx-sub-${day}-${i}`,
        userId: `user-${Math.floor(Math.random() * 500)}`,
        type: "subscription",
        amount: 4.99,
        currency: "usd",
        status: "completed",
        description: "Confetti Black monthly subscription",
        stripePaymentId: `pi_${Math.random().toString(36).slice(2, 14)}`,
        createdAt: txDate.toISOString(),
      };
      transactionStore.push(tx);
    }

    // Boost purchases
    const boostCount = Math.floor(Math.random() * 3);
    const boostAmounts = [99, 299, 799, 2500];
    for (let i = 0; i < boostCount; i++) {
      const txDate = new Date(date);
      txDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
      const tx: Transaction = {
        id: crypto.randomUUID?.() ?? `tx-boost-${day}-${i}`,
        businessId: `biz-${Math.floor(Math.random() * 50)}`,
        type: "boost_purchase",
        amount: boostAmounts[Math.floor(Math.random() * boostAmounts.length)],
        currency: "usd",
        status: "completed",
        description: "Boost credit purchase",
        stripePaymentId: `pi_${Math.random().toString(36).slice(2, 14)}`,
        createdAt: txDate.toISOString(),
      };
      transactionStore.push(tx);
    }

    // Booking fees
    const bookingCount = Math.floor(Math.random() * 12) + 2;
    for (let i = 0; i < bookingCount; i++) {
      const txDate = new Date(date);
      txDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
      const tx: Transaction = {
        id: crypto.randomUUID?.() ?? `tx-book-${day}-${i}`,
        userId: `user-${Math.floor(Math.random() * 500)}`,
        businessId: `biz-${Math.floor(Math.random() * 50)}`,
        type: "booking_fee",
        amount: Math.round((Math.random() * 15 + 2) * 100) / 100,
        currency: "usd",
        status: "completed",
        description: "Venue booking fee",
        createdAt: txDate.toISOString(),
      };
      transactionStore.push(tx);
    }

    // Fund deposits
    if (Math.random() > 0.5) {
      const txDate = new Date(date);
      txDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
      const tx: Transaction = {
        id: crypto.randomUUID?.() ?? `tx-fund-${day}`,
        userId: `user-${Math.floor(Math.random() * 500)}`,
        type: "fund_deposit",
        amount: Math.round((Math.random() * 100 + 20) * 100) / 100,
        currency: "usd",
        status: "completed",
        description: "Confetti Fund group deposit",
        createdAt: txDate.toISOString(),
      };
      transactionStore.push(tx);
    }
  }

  // Sample refund requests
  const reasons: RefundReason[] = [
    "duplicate_charge",
    "service_issue",
    "venue_closed",
    "user_request",
  ];
  for (let i = 0; i < 8; i++) {
    const txIdx = Math.floor(Math.random() * transactionStore.length);
    const tx = transactionStore[txIdx];
    const refund: RefundRequest = {
      id: crypto.randomUUID?.() ?? `ref-demo-${i}`,
      transactionId: tx.id,
      userId: tx.userId ?? `user-${i}`,
      amount: tx.amount,
      reason: reasons[Math.floor(Math.random() * reasons.length)],
      description: `Refund request for ${tx.description}`,
      status: i < 3 ? "pending" : i < 5 ? "approved" : "processed",
      requestedAt: new Date(now.getTime() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
      reviewedAt:
        i >= 3
          ? new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
          : undefined,
      reviewedBy: i >= 3 ? "admin-tyrone" : undefined,
    };
    refundStore.push(refund);
  }

  // Sample payouts
  for (let i = 0; i < 5; i++) {
    const payout: PayoutRecord = {
      id: crypto.randomUUID?.() ?? `pay-demo-${i}`,
      businessId: `biz-${i}`,
      businessName: [
        "The Velvet Room",
        "Rooftop 21",
        "Sakura Sushi",
        "Moonlight Lounge",
        "The Local",
      ][i],
      amount: Math.round((Math.random() * 2000 + 500) * 100) / 100,
      status: i < 2 ? "pending" : i < 4 ? "completed" : "processing",
      period: "May 2026",
      transactionCount: Math.floor(Math.random() * 80) + 10,
      requestedAt: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      approvedAt:
        i >= 2
          ? new Date(now.getTime() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString()
          : undefined,
      approvedBy: i >= 2 ? "admin-tyrone" : undefined,
    };
    payoutStore.push(payout);
  }

  return {
    transactions: transactionStore.length,
    refunds: refundStore.length,
    payouts: payoutStore.length,
  };
}
