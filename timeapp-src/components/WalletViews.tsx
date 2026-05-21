/**
 * Wallet Pass & Confetti Fund UI Components
 * WalletPassCard, AddToWalletButtons, FundAdminDashboard, BarcodeScanView
 */
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  QrCode,
  DollarSign,
  TrendingDown,
  TrendingUp,
  ArrowDown,
  ArrowUp,
  CreditCard,
  Smartphone,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Plus,
} from "lucide-react";
import {
  createWalletPasses,
  getUserPasses,
  getFundDashboard,
  depositFund,
  redeemViaBarcode,
  seedWalletDemo,
  getUserSubscription,
  type WalletPass,
  type FundDashboard,
  type FundTransaction,
  type ConfettiFund,
} from "../lib/agents";

/* ─── Shared layout wrappers ──────────────────────────────── */
function Page({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`page ${className || ""}`}>{children}</div>;
}

function Header({ eyebrow, title }: { eyebrow: string; title: string }) {
  const navigate = useNavigate();
  return (
    <header className="page-header">
      <button className="back-btn" onClick={() => navigate(-1)} aria-label="Back">
        ←
      </button>
      <div>
        <p style={{ fontSize: 12, opacity: 0.5, textTransform: "uppercase", letterSpacing: 1 }}>
          {eyebrow}
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>{title}</h1>
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════
   Wallet Pass Card — shows a single Apple or Google pass
   ═══════════════════════════════════════════════════════════ */
export function WalletPassCard({ pass }: { pass: WalletPass }) {
  const isApple = pass.platform === "apple";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "linear-gradient(145deg, #2C1B69 0%, #1a1145 60%, #0d0a24 100%)",
        borderRadius: 16,
        padding: 20,
        position: "relative",
        overflow: "hidden",
        border: "1px solid rgba(167, 139, 250, 0.2)",
      }}
    >
      {/* Subtle shine effect */}
      <div
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 120,
          height: 120,
          background: "radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />

      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: "#a78bfa", fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" }}>
            Confetti Black
          </div>
          <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>
            {isApple ? "Apple Wallet" : "Google Wallet"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {isApple ? (
            <Smartphone size={16} color="#a78bfa" />
          ) : (
            <Wallet size={16} color="#a78bfa" />
          )}
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: pass.status === "active" ? "#34d399" : "#ef4444",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {pass.status}
          </span>
        </div>
      </div>

      {/* Credit balance — big number */}
      <div style={{ textAlign: "center", margin: "12px 0 16px" }}>
        <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>OUTING CREDIT</div>
        <div style={{ fontSize: 36, fontWeight: 800, color: "#fff" }}>
          ${pass.creditBalance.toFixed(2)}
        </div>
      </div>

      {/* Barcode display */}
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          padding: 12,
          textAlign: "center",
          margin: "0 auto",
          maxWidth: 160,
        }}
      >
        <QrCode size={80} color="#000" style={{ margin: "0 auto" }} />
        <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginTop: 6, letterSpacing: 2, fontFamily: "monospace" }}>
          {pass.barcode}
        </div>
      </div>

      {/* Footer info */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, fontSize: 10, color: "#666" }}>
        <span>SN: {pass.serialNumber}</span>
        <span>Updated {new Date(pass.lastUpdated).toLocaleDateString()}</span>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Add to Wallet Buttons — Apple Wallet + Google Wallet
   ═══════════════════════════════════════════════════════════ */
export function AddToWalletButtons({
  userId,
  onPassesCreated,
}: {
  userId: string;
  onPassesCreated?: (passes: { apple: WalletPass; google: WalletPass }) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const passes = createWalletPasses(userId);
      setCreated(true);
      onPassesCreated?.(passes);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [userId, onPassesCreated]);

  if (created) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 16px",
          background: "rgba(52, 211, 153, 0.1)",
          borderRadius: 12,
          border: "1px solid rgba(52, 211, 153, 0.3)",
        }}
      >
        <CheckCircle size={18} color="#34d399" />
        <span style={{ fontSize: 13, color: "#34d399", fontWeight: 600 }}>
          Wallet passes created! Check your wallet app.
        </span>
      </motion.div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {error && (
        <div style={{ fontSize: 12, color: "#ef4444", padding: "8px 12px", background: "rgba(239,68,68,0.1)", borderRadius: 8 }}>
          {error}
        </div>
      )}

      {/* Apple Wallet button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleCreate}
        disabled={loading}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          padding: "14px 20px",
          background: "#000",
          color: "#fff",
          border: "none",
          borderRadius: 12,
          fontSize: 15,
          fontWeight: 600,
          cursor: loading ? "wait" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        <Smartphone size={20} />
        Add to Apple Wallet
      </motion.button>

      {/* Google Wallet button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleCreate}
        disabled={loading}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          padding: "14px 20px",
          background: "linear-gradient(135deg, #4285F4, #34A853)",
          color: "#fff",
          border: "none",
          borderRadius: 12,
          fontSize: 15,
          fontWeight: 600,
          cursor: loading ? "wait" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        <Wallet size={20} />
        Add to Google Wallet
      </motion.button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   My Wallet Page — user-facing wallet pass view
   ═══════════════════════════════════════════════════════════ */
export function MyWallet({ userId }: { userId: string }) {
  const [passes, setPasses] = useState<WalletPass[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    const p = getUserPasses(userId);
    setPasses(p);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const sub = getUserSubscription(userId);
  const isBlack = sub.tier === "black";

  return (
    <Page>
      <Header eyebrow="Confetti Black" title="My Wallet" />

      {!isBlack ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            textAlign: "center",
            padding: 40,
            background: "rgba(167, 139, 250, 0.05)",
            borderRadius: 16,
            border: "1px solid rgba(167, 139, 250, 0.15)",
          }}
        >
          <CreditCard size={40} color="#a78bfa" style={{ marginBottom: 12 }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Upgrade to Confetti Black</h3>
          <p style={{ fontSize: 13, color: "#888", lineHeight: 1.5 }}>
            Get a branded wallet pass with $10/month outing credit.
            Just show the QR code at any venue to apply your credit.
          </p>
        </motion.div>
      ) : passes.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              textAlign: "center",
              padding: 24,
              background: "rgba(167, 139, 250, 0.05)",
              borderRadius: 16,
              border: "1px solid rgba(167, 139, 250, 0.15)",
            }}
          >
            <Shield size={32} color="#a78bfa" style={{ marginBottom: 8 }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Your Confetti Black Pass</h3>
            <p style={{ fontSize: 12, color: "#888", lineHeight: 1.5, marginBottom: 16 }}>
              Add your pass to Apple or Google Wallet. Show the QR code at any venue to redeem your outing credit.
            </p>
            <AddToWalletButtons userId={userId} onPassesCreated={() => load()} />
          </motion.div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {passes.map((pass) => (
            <WalletPassCard key={pass.id} pass={pass} />
          ))}

          <div
            style={{
              padding: 16,
              background: "rgba(255,255,255,0.03)",
              borderRadius: 12,
              border: "1px solid #222",
            }}
          >
            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#aaa" }}>How to use</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { step: "1", text: "Open Apple or Google Wallet on your phone" },
                { step: "2", text: "Show the QR code to your server or bartender" },
                { step: "3", text: "They scan it — credit applied to your bill" },
                { step: "4", text: "Your pass balance updates in real time" },
              ].map((s) => (
                <div key={s.step} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "#2C1B69",
                      color: "#a78bfa",
                      fontSize: 11,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {s.step}
                  </div>
                  <span style={{ fontSize: 12, color: "#888", lineHeight: 1.4 }}>{s.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}

/* ═══════════════════════════════════════════════════════════
   Fund Admin Dashboard — Tyrone's admin view
   ═══════════════════════════════════════════════════════════ */
export function FundAdminDashboard() {
  const [dashboard, setDashboard] = useState<FundDashboard | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositNote, setDepositNote] = useState("");
  const [showDeposit, setShowDeposit] = useState(false);

  const load = useCallback(() => {
    setDashboard(getFundDashboard());
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) return;
    depositFund(amount, depositNote || undefined);
    setDepositAmount("");
    setDepositNote("");
    setShowDeposit(false);
    load();
  };

  const handleSeedDemo = () => {
    seedWalletDemo();
    load();
  };

  if (!dashboard) return null;

  const { fund, recentTransactions, activePassCount, monthlyDisbursementRate, estimatedRunway } = dashboard;

  const runwayColor =
    estimatedRunway === Infinity ? "#34d399" :
    estimatedRunway > 3 ? "#34d399" :
    estimatedRunway > 1 ? "#f59e0b" :
    "#ef4444";

  return (
    <Page>
      <Header eyebrow="Admin" title="Confetti Fund" />

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        {/* Fund Balance */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "linear-gradient(135deg, #065f46 0%, #064e3b 100%)",
            borderRadius: 14,
            padding: 16,
          }}
        >
          <DollarSign size={18} color="#34d399" />
          <div style={{ fontSize: 10, color: "#6ee7b7", marginTop: 8, textTransform: "uppercase", letterSpacing: 1 }}>
            Fund Balance
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>
            ${fund.balance.toFixed(2)}
          </div>
        </motion.div>

        {/* Active Passes */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{
            background: "linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)",
            borderRadius: 14,
            padding: 16,
          }}
        >
          <CreditCard size={18} color="#a78bfa" />
          <div style={{ fontSize: 10, color: "#c4b5fd", marginTop: 8, textTransform: "uppercase", letterSpacing: 1 }}>
            Active Passes
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>
            {activePassCount}
          </div>
        </motion.div>

        {/* Monthly Burn */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: "linear-gradient(135deg, #78350f 0%, #451a03 100%)",
            borderRadius: 14,
            padding: 16,
          }}
        >
          <TrendingDown size={18} color="#fbbf24" />
          <div style={{ fontSize: 10, color: "#fcd34d", marginTop: 8, textTransform: "uppercase", letterSpacing: 1 }}>
            Monthly Burn
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>
            ${monthlyDisbursementRate.toFixed(0)}
          </div>
        </motion.div>

        {/* Runway */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            background: "linear-gradient(135deg, #1a1a1a 0%, #111 100%)",
            borderRadius: 14,
            padding: 16,
            border: `1px solid ${runwayColor}33`,
          }}
        >
          <Clock size={18} color={runwayColor} />
          <div style={{ fontSize: 10, color: "#888", marginTop: 8, textTransform: "uppercase", letterSpacing: 1 }}>
            Runway
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: runwayColor }}>
            {estimatedRunway === Infinity ? "∞" : `${estimatedRunway.toFixed(1)}mo`}
          </div>
        </motion.div>
      </div>

      {/* Totals strip */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "12px 16px",
          background: "rgba(255,255,255,0.03)",
          borderRadius: 10,
          marginBottom: 20,
          fontSize: 12,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#34d399", fontWeight: 700 }}>${fund.totalDeposited.toFixed(2)}</div>
          <div style={{ color: "#666", fontSize: 10 }}>Deposited</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#f59e0b", fontWeight: 700 }}>${fund.totalDisbursed.toFixed(2)}</div>
          <div style={{ color: "#666", fontSize: 10 }}>Disbursed</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#a78bfa", fontWeight: 700 }}>{fund.totalTransactions}</div>
          <div style={{ color: "#666", fontSize: 10 }}>Transactions</div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowDeposit(!showDeposit)}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "12px 16px",
            background: "linear-gradient(135deg, #065f46, #047857)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Plus size={18} />
          Deposit Funds
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSeedDemo}
          style={{
            padding: "12px 16px",
            background: "rgba(255,255,255,0.05)",
            color: "#888",
            border: "1px solid #333",
            borderRadius: 10,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          <RefreshCw size={16} />
        </motion.button>
      </div>

      {/* Deposit form */}
      <AnimatePresence>
        {showDeposit && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{
              overflow: "hidden",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                padding: 16,
                background: "rgba(52, 211, 153, 0.05)",
                borderRadius: 12,
                border: "1px solid rgba(52, 211, 153, 0.2)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <input
                type="number"
                placeholder="Amount ($)"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                style={{
                  padding: "10px 14px",
                  background: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: 8,
                  color: "#fff",
                  fontSize: 14,
                }}
              />
              <input
                type="text"
                placeholder="Note (optional)"
                value={depositNote}
                onChange={(e) => setDepositNote(e.target.value)}
                style={{
                  padding: "10px 14px",
                  background: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: 8,
                  color: "#fff",
                  fontSize: 14,
                }}
              />
              <button
                onClick={handleDeposit}
                style={{
                  padding: "10px 16px",
                  background: "#059669",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Confirm Deposit
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction history */}
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#aaa" }}>
          Recent Transactions
        </h3>

        {recentTransactions.length === 0 ? (
          <div style={{ textAlign: "center", padding: 24, color: "#555", fontSize: 13 }}>
            No transactions yet. Deposit funds to get started.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recentTransactions.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}

function TransactionRow({ tx }: { tx: FundTransaction }) {
  const isDeposit = tx.type === "deposit";
  const isRefund = tx.type === "refund";
  const isPositive = isDeposit || isRefund;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 14px",
        background: "rgba(255,255,255,0.02)",
        borderRadius: 10,
        border: "1px solid #1a1a1a",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: isPositive ? "rgba(52,211,153,0.1)" : "rgba(249,115,22,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isPositive ? (
            <ArrowDown size={16} color="#34d399" />
          ) : (
            <ArrowUp size={16} color="#f97316" />
          )}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#ddd" }}>
            {tx.description}
          </div>
          <div style={{ fontSize: 10, color: "#555" }}>
            {new Date(tx.createdAt).toLocaleDateString()} · {tx.type}
          </div>
        </div>
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: isPositive ? "#34d399" : "#f97316",
        }}
      >
        {isPositive ? "+" : "-"}${tx.amount.toFixed(2)}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Barcode Scan View — venue staff scans a barcode to redeem
   ═══════════════════════════════════════════════════════════ */
export function BarcodeScanView() {
  const [barcode, setBarcode] = useState("");
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    remaining?: number;
  } | null>(null);

  const handleScan = () => {
    const amt = parseFloat(amount);
    if (!barcode.trim() || isNaN(amt) || amt <= 0) return;

    const res = redeemViaBarcode(barcode.trim().toUpperCase(), amt);
    if (res.success) {
      setResult({
        success: true,
        message: `Redeemed $${amt.toFixed(2)} — pass balance: $${res.pass!.creditBalance.toFixed(2)}`,
        remaining: res.fundRemaining,
      });
    } else {
      setResult({ success: false, message: res.reason || "Redemption failed" });
    }
    setBarcode("");
    setAmount("");
  };

  return (
    <Page>
      <Header eyebrow="Venue Staff" title="Scan Confetti Pass" />

      <div
        style={{
          padding: 20,
          background: "rgba(255,255,255,0.03)",
          borderRadius: 14,
          border: "1px solid #222",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <QrCode size={40} color="#a78bfa" />
          <p style={{ fontSize: 13, color: "#888", marginTop: 8 }}>
            Enter the barcode from the customer's Confetti pass
          </p>
        </div>

        <input
          type="text"
          placeholder="Barcode (e.g. ABCD1234)"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          maxLength={8}
          style={{
            padding: "12px 14px",
            background: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: 10,
            color: "#fff",
            fontSize: 16,
            fontFamily: "monospace",
            textAlign: "center",
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        />

        <input
          type="number"
          placeholder="Amount to redeem ($)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{
            padding: "12px 14px",
            background: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: 10,
            color: "#fff",
            fontSize: 14,
            textAlign: "center",
          }}
        />

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleScan}
          disabled={!barcode.trim() || !amount}
          style={{
            padding: "14px 20px",
            background: barcode.trim() && amount ? "#059669" : "#333",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            cursor: barcode.trim() && amount ? "pointer" : "not-allowed",
          }}
        >
          Redeem Credit
        </motion.button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 12,
              background: result.success ? "rgba(52,211,153,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${result.success ? "rgba(52,211,153,0.3)" : "rgba(239,68,68,0.3)"}`,
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            {result.success ? (
              <CheckCircle size={20} color="#34d399" style={{ flexShrink: 0, marginTop: 1 }} />
            ) : (
              <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
            )}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: result.success ? "#34d399" : "#ef4444" }}>
                {result.success ? "Success" : "Failed"}
              </div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                {result.message}
              </div>
              {result.remaining !== undefined && (
                <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>
                  Fund remaining: ${result.remaining.toFixed(2)}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Page>
  );
}
