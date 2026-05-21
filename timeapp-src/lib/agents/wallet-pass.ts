/**
 * Wallet Pass Agent
 *
 * Generates Apple Wallet (.pkpass) and Google Wallet passes for Confetti
 * Black subscribers. Manages the Confetti Fund — a self-funded credit pool
 * that Tyrone loads with real dollars, which get disbursed as outing
 * credits to Black members via branded wallet passes.
 *
 * Flow:
 *  1. Admin (Tyrone) deposits funds into the Confetti Fund
 *  2. User upgrades to Confetti Black → wallet pass auto-generated
 *  3. Pass appears in Apple/Google Wallet with $10 balance + barcode
 *  4. User checks in at a venue → presents pass → staff scans barcode
 *  5. Credit deducted from user's pass AND from the Confetti Fund pool
 *  6. Pass balance updates in real time via push notification
 *
 * Economics:
 *  - Fund is finite — when it's empty, credits pause until reloaded
 *  - Admin dashboard shows fund balance, disbursement rate, runway
 *  - No venue contracts needed — Confetti eats the cost from the fund
 */

import { getUserSubscription } from "./boost-credits";

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export type PassPlatform = "apple" | "google";
export type PassStatus = "active" | "expired" | "revoked";
export type FundTransactionType = "deposit" | "disbursement" | "refund" | "adjustment";

export interface WalletPass {
  id: string;
  userId: string;
  platform: PassPlatform;
  status: PassStatus;
  serialNumber: string;
  barcode: string; // scannable code for venue redemption
  barcodeFormat: "qr" | "code128" | "pdf417";
  creditBalance: number; // mirrors UserSubscription.outingCreditBalance
  tier: "black";
  // Apple PassKit / Google Wallet metadata
  passUrl: string; // download URL or Google Wallet save link
  lastUpdated: string;
  createdAt: string;
}

export interface ConfettiFund {
  id: string;
  balance: number; // current pool balance
  totalDeposited: number;
  totalDisbursed: number;
  totalTransactions: number;
  createdAt: string;
  lastDepositAt?: string;
}

export interface FundTransaction {
  id: string;
  fundId: string;
  type: FundTransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  userId?: string; // which user received the disbursement
  createdAt: string;
}

export interface FundDashboard {
  fund: ConfettiFund;
  recentTransactions: FundTransaction[];
  activePassCount: number;
  monthlyDisbursementRate: number; // avg $/month going out
  estimatedRunway: number; // months until fund empties at current rate
}

// ═══════════════════════════════════════════════════════════
// In-memory stores (mock-first, same pattern as boost-credits)
// ═══════════════════════════════════════════════════════════

const passStore = new Map<string, WalletPass>();
const fundStore = new Map<string, ConfettiFund>();
const transactionStore = new Map<string, FundTransaction>();

let passCounter = 0;
let txCounter = 0;

// ═══════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateSerialNumber(): string {
  passCounter++;
  return `CNFT-BLK-${String(passCounter).padStart(6, "0")}`;
}

function generateBarcode(): string {
  // 8-char alphanumeric code for venue scanning
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ═══════════════════════════════════════════════════════════
// Confetti Fund Management
// ═══════════════════════════════════════════════════════════

const PRIMARY_FUND_ID = "fund_primary";

function getOrCreateFund(): ConfettiFund {
  let fund = fundStore.get(PRIMARY_FUND_ID);
  if (!fund) {
    fund = {
      id: PRIMARY_FUND_ID,
      balance: 0,
      totalDeposited: 0,
      totalDisbursed: 0,
      totalTransactions: 0,
      createdAt: new Date().toISOString(),
    };
    fundStore.set(PRIMARY_FUND_ID, fund);
  }
  return fund;
}

/** Admin deposits money into the Confetti Fund */
export function depositFund(amount: number, description?: string): ConfettiFund {
  if (amount <= 0) throw new Error("Deposit amount must be positive");

  const fund = getOrCreateFund();
  fund.balance = round2(fund.balance + amount);
  fund.totalDeposited = round2(fund.totalDeposited + amount);
  fund.totalTransactions++;
  fund.lastDepositAt = new Date().toISOString();

  const tx: FundTransaction = {
    id: generateId("tx"),
    fundId: fund.id,
    type: "deposit",
    amount,
    balanceAfter: fund.balance,
    description: description || `Deposit of $${amount.toFixed(2)}`,
    createdAt: new Date().toISOString(),
  };
  transactionStore.set(tx.id, tx);

  return fund;
}

/** Get current fund status */
export function getFund(): ConfettiFund {
  return getOrCreateFund();
}

/** Disburse credit from fund to a user (called when outing credit is redeemed) */
export function disburseFund(
  userId: string,
  amount: number,
  description?: string
): { success: boolean; remaining: number; reason?: string } {
  const fund = getOrCreateFund();

  if (amount <= 0) return { success: false, remaining: fund.balance, reason: "Amount must be positive" };
  if (amount > fund.balance)
    return {
      success: false,
      remaining: fund.balance,
      reason: `Confetti Fund only has $${fund.balance.toFixed(2)} remaining. Ask admin to reload.`,
    };

  fund.balance = round2(fund.balance - amount);
  fund.totalDisbursed = round2(fund.totalDisbursed + amount);
  fund.totalTransactions++;

  const tx: FundTransaction = {
    id: generateId("tx"),
    fundId: fund.id,
    type: "disbursement",
    amount,
    balanceAfter: fund.balance,
    description: description || `Outing credit redeemed`,
    userId,
    createdAt: new Date().toISOString(),
  };
  transactionStore.set(tx.id, tx);

  return { success: true, remaining: fund.balance };
}

/** Get fund dashboard with analytics */
export function getFundDashboard(): FundDashboard {
  const fund = getOrCreateFund();
  const allTx = Array.from(transactionStore.values())
    .filter((t) => t.fundId === fund.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const recentTransactions = allTx.slice(0, 20);

  // Calculate monthly disbursement rate
  const disbursements = allTx.filter((t) => t.type === "disbursement");
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const recentDisbursements = disbursements.filter(
    (t) => new Date(t.createdAt).getTime() > thirtyDaysAgo
  );
  const monthlyDisbursementRate = round2(
    recentDisbursements.reduce((sum, t) => sum + t.amount, 0)
  );

  const activePassCount = Array.from(passStore.values()).filter(
    (p) => p.status === "active"
  ).length;

  const estimatedRunway =
    monthlyDisbursementRate > 0
      ? round2(fund.balance / monthlyDisbursementRate)
      : Infinity;

  return {
    fund,
    recentTransactions,
    activePassCount,
    monthlyDisbursementRate,
    estimatedRunway,
  };
}

// ═══════════════════════════════════════════════════════════
// Wallet Pass Generation
// ═══════════════════════════════════════════════════════════

/** Generate an Apple Wallet pass (.pkpass) for a Black subscriber */
function generateApplePass(userId: string, creditBalance: number): WalletPass {
  const serial = generateSerialNumber();
  const barcode = generateBarcode();

  const pass: WalletPass = {
    id: generateId("pass"),
    userId,
    platform: "apple",
    status: "active",
    serialNumber: serial,
    barcode,
    barcodeFormat: "qr",
    creditBalance,
    tier: "black",
    passUrl: `https://confetti.app/wallet/apple/${serial}`, // would be a real .pkpass download URL
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  /*
   * In production, this would call Apple's PassKit framework to create a
   * .pkpass bundle containing:
   *
   * pass.json:
   * {
   *   "formatVersion": 1,
   *   "passTypeIdentifier": "pass.app.confetti.black",
   *   "teamIdentifier": "CONFETTI_TEAM_ID",
   *   "serialNumber": serial,
   *   "organizationName": "Confetti",
   *   "description": "Confetti Black — Outing Credit",
   *   "logoText": "Confetti Black",
   *   "foregroundColor": "rgb(255, 255, 255)",
   *   "backgroundColor": "rgb(44, 27, 105)",
   *   "storeCard": {
   *     "headerFields": [
   *       { "key": "balance", "label": "CREDIT", "value": "$10.00",
   *         "changeMessage": "Your Confetti credit is now %@" }
   *     ],
   *     "primaryFields": [
   *       { "key": "member", "label": "MEMBER", "value": "Confetti Black" }
   *     ],
   *     "secondaryFields": [
   *       { "key": "tier", "label": "TIER", "value": "Black ✦" }
   *     ],
   *     "backFields": [
   *       { "key": "info", "label": "HOW TO USE",
   *         "value": "Show this pass to your server. They'll scan the QR code to apply your Confetti credit to your bill." }
   *     ]
   *   },
   *   "barcode": {
   *     "format": "PKBarcodeFormatQR",
   *     "message": barcode,
   *     "messageEncoding": "iso-8859-1"
   *   }
   * }
   *
   * + icon.png, logo.png, strip.png (Confetti branding)
   * + manifest.json (SHA1 hashes)
   * + signature (signed with Apple certificate)
   */

  return pass;
}

/** Generate a Google Wallet pass for a Black subscriber */
function generateGooglePass(userId: string, creditBalance: number): WalletPass {
  const serial = generateSerialNumber();
  const barcode = generateBarcode();

  const pass: WalletPass = {
    id: generateId("pass"),
    userId,
    platform: "google",
    status: "active",
    serialNumber: serial,
    barcode,
    barcodeFormat: "qr",
    creditBalance,
    tier: "black",
    passUrl: `https://pay.google.com/gp/v/save/confetti_black_${serial}`, // would be a real Google Wallet save link
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  /*
   * In production, this would call Google Wallet API to create a
   * LoyaltyObject:
   *
   * {
   *   "id": "CONFETTI_ISSUER_ID.confetti_black_" + serial,
   *   "classId": "CONFETTI_ISSUER_ID.confetti_black_class",
   *   "state": "ACTIVE",
   *   "barcode": {
   *     "type": "QR_CODE",
   *     "value": barcode
   *   },
   *   "loyaltyPoints": {
   *     "label": "Outing Credit",
   *     "balance": { "money": { "currencyCode": "USD", "micros": creditBalance * 1000000 } }
   *   },
   *   "accountName": "Confetti Black Member",
   *   "heroImage": { ... Confetti branding ... },
   *   "hexBackgroundColor": "#2C1B69"
   * }
   */

  return pass;
}

/** Create wallet passes for a user (both platforms) */
export function createWalletPasses(userId: string): {
  apple: WalletPass;
  google: WalletPass;
} {
  const sub = getUserSubscription(userId);
  if (sub.tier !== "black") {
    throw new Error("Wallet passes are only available for Confetti Black members");
  }

  const creditBalance = sub.outingCreditBalance;

  // Revoke any existing passes for this user
  for (const pass of passStore.values()) {
    if (pass.userId === userId && pass.status === "active") {
      pass.status = "revoked";
    }
  }

  const apple = generateApplePass(userId, creditBalance);
  const google = generateGooglePass(userId, creditBalance);

  passStore.set(apple.id, apple);
  passStore.set(google.id, google);

  return { apple, google };
}

/** Get a user's active wallet passes */
export function getUserPasses(userId: string): WalletPass[] {
  return Array.from(passStore.values())
    .filter((p) => p.userId === userId && p.status === "active")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/** Update pass balance after credit use (triggers push update in production) */
export function updatePassBalance(userId: string, newBalance: number): void {
  for (const pass of passStore.values()) {
    if (pass.userId === userId && pass.status === "active") {
      pass.creditBalance = round2(newBalance);
      pass.lastUpdated = new Date().toISOString();

      /*
       * In production:
       * - Apple: send push notification via APNs to trigger pass update
       *   POST https://api.push.apple.com/3/device/{pushToken}
       *   Then serve updated .pkpass at the webServiceURL
       *
       * - Google: PATCH the LoyaltyObject to update loyaltyPoints.balance
       *   PATCH https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/{objectId}
       */
    }
  }
}

/** Redeem outing credit via wallet pass barcode scan */
export function redeemViaBarcode(
  barcode: string,
  amount: number
): {
  success: boolean;
  pass?: WalletPass;
  fundRemaining?: number;
  reason?: string;
} {
  // Find the pass by barcode
  let targetPass: WalletPass | null = null;
  for (const pass of passStore.values()) {
    if (pass.barcode === barcode && pass.status === "active") {
      targetPass = pass;
      break;
    }
  }

  if (!targetPass) return { success: false, reason: "Invalid or expired barcode" };
  if (amount <= 0) return { success: false, reason: "Amount must be positive" };
  if (amount > targetPass.creditBalance)
    return {
      success: false,
      reason: `Only $${targetPass.creditBalance.toFixed(2)} remaining on this pass`,
    };

  // Deduct from Confetti Fund first
  const fundResult = disburseFund(
    targetPass.userId,
    amount,
    `Barcode redemption at venue — pass ${targetPass.serialNumber}`
  );
  if (!fundResult.success) return { success: false, reason: fundResult.reason };

  // Deduct from pass balance
  targetPass.creditBalance = round2(targetPass.creditBalance - amount);
  targetPass.lastUpdated = new Date().toISOString();

  // Also update the user's subscription balance
  const sub = getUserSubscription(targetPass.userId);
  sub.outingCreditBalance = targetPass.creditBalance;
  sub.outingCreditUsedThisMonth = round2(sub.outingCreditUsedThisMonth + amount);

  return {
    success: true,
    pass: targetPass,
    fundRemaining: fundResult.remaining,
  };
}

/** Get ALL passes across all users (admin view) */
export function getAllPasses(): WalletPass[] {
  return Array.from(passStore.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/** Get aggregate wallet pass stats for admin dashboard */
export function getPassStats(): {
  total: number;
  active: number;
  revoked: number;
  expired: number;
  totalCreditRemaining: number;
  uniqueUsers: number;
} {
  const passes = Array.from(passStore.values());
  const active = passes.filter((p) => p.status === "active");
  const uniqueUsers = new Set(passes.map((p) => p.userId)).size;
  return {
    total: passes.length,
    active: active.length,
    revoked: passes.filter((p) => p.status === "revoked").length,
    expired: passes.filter((p) => p.status === "expired").length,
    totalCreditRemaining: active.reduce((sum, p) => sum + p.creditBalance, 0),
    uniqueUsers,
  };
}

/** Revoke passes (e.g., if user downgrades from Black) */
export function revokePasses(userId: string): number {
  let count = 0;
  for (const pass of passStore.values()) {
    if (pass.userId === userId && pass.status === "active") {
      pass.status = "revoked";
      count++;
    }
  }
  return count;
}

// ═══════════════════════════════════════════════════════════
// Demo Seeding
// ═══════════════════════════════════════════════════════════

/** Seed the wallet pass system with demo data */
export function seedWalletDemo(): {
  fund: ConfettiFund;
  passes: { apple: WalletPass; google: WalletPass };
  dashboard: FundDashboard;
} {
  // Admin loads $100 into the Confetti Fund
  depositFund(100, "Initial Confetti Fund deposit");

  // Create passes for demo user (must already be Black)
  const sub = getUserSubscription("demo-user");
  if (sub.tier !== "black") {
    // Make them Black for demo purposes
    sub.tier = "black";
    sub.outingCreditBalance = 10;
    sub.primeReservations = 3;
    sub.confettiLimit = Infinity;
  }

  const passes = createWalletPasses("demo-user");

  // Simulate a past redemption
  disburseFund("demo-user", 5.50, "Demo: coffee + pastry at Compass Coffee");

  const dashboard = getFundDashboard();

  return { fund: getFund(), passes, dashboard };
}
