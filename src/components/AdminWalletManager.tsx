/**
 * AdminWalletManager — Wallet pass management for admin view.
 * Shows pass stats, lists all passes, supports revoking.
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Smartphone, Wallet, Users, CreditCard, XCircle, RefreshCw } from "lucide-react";
import {
  getAllPasses,
  getPassStats,
  revokePasses,
  type WalletPass,
} from "../lib/agents";

function ScrollReveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function AdminWalletManager() {
  const [passes, setPasses] = useState<WalletPass[]>([]);
  const stats = getPassStats();

  useEffect(() => {
    setPasses(getAllPasses());
  }, []);

  const refresh = () => setPasses(getAllPasses());

  const handleRevoke = (userId: string) => {
    revokePasses(userId);
    refresh();
  };

  const statusColor = (s: string) =>
    s === "active" ? "#22c55e" : s === "revoked" ? "#ef4444" : "#a1a1aa";

  return (
    <>
      {/* Stats overview */}
      <div className="admin-kpi-grid" style={{ marginBottom: 16 }}>
        <div className="admin-kpi">
          <Wallet />
          <b>{stats.total}</b>
          <span>Total passes</span>
        </div>
        <div className="admin-kpi">
          <Smartphone />
          <b>{stats.active}</b>
          <span>Active</span>
        </div>
        <div className="admin-kpi">
          <Users />
          <b>{stats.uniqueUsers}</b>
          <span>Unique users</span>
        </div>
        <div className="admin-kpi">
          <CreditCard />
          <b>${stats.totalCreditRemaining.toFixed(0)}</b>
          <span>Credit remaining</span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <button
          onClick={refresh}
          style={{
            background: "none",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 8,
            padding: "6px 14px",
            color: "inherit",
            fontSize: 13,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {passes.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, opacity: 0.5 }}>
          <Wallet size={48} />
          <p style={{ marginTop: 12 }}>No wallet passes issued yet</p>
        </div>
      ) : (
        <div className="admin-list">
          {passes.map((pass, index) => (
            <ScrollReveal key={pass.id} delay={index * 0.04} className="admin-user-card">
              <div
                className="admin-avatar"
                style={{ background: pass.platform === "apple" ? "#333" : "#1a73e8" }}
              >
                <Smartphone size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="admin-card-title">
                  <b>{pass.platform === "apple" ? "Apple Wallet" : "Google Pay"}</b>
                  <span
                    className={`status-pill ${pass.status}`}
                    style={{ color: statusColor(pass.status) }}
                  >
                    {pass.status}
                  </span>
                </div>
                <small style={{ opacity: 0.7 }}>User: {pass.userId}</small>
                <div className="admin-meta-row">
                  <span>Balance: ${pass.creditBalance}</span>
                  <span>SN: {pass.serialNumber.slice(0, 12)}...</span>
                  <span>Created: {new Date(pass.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              {pass.status === "active" && (
                <button
                  className="admin-more"
                  aria-label="Revoke pass"
                  onClick={() => handleRevoke(pass.userId)}
                  title="Revoke all passes for this user"
                  style={{ color: "#ef4444" }}
                >
                  <XCircle size={18} />
                </button>
              )}
            </ScrollReveal>
          ))}
        </div>
      )}
    </>
  );
}
