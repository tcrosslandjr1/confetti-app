// ============================================================================
// Confetti App — Settings > Privacy Page
// Post-onboarding consent management. Withdrawing consent is as easy as
// granting it — same toggle, same location, same number of clicks.
// ============================================================================

import React, { useState, useEffect, useCallback } from "react";
import { useConsentAgent } from "./useConsentAgent";
import type { ConsentCategory, ConsentSettingsData } from "./ConsentTypes";

// ---------------------------------------------------------------------------
// Category display metadata
// ---------------------------------------------------------------------------

const CATEGORY_META: Record<
  ConsentCategory,
  {
    label: string;
    description: string;
    section: "data" | "communications" | "sharing";
    specialNotice?: string;
  }
> = {
  core_service: {
    label: "Core Service",
    description:
      "Account functionality and basic app features. Required to use Confetti.",
    section: "data",
  },
  taste_profiling: {
    label: "Taste Profiling",
    description:
      "Confetti learns your preferences from your activity to build personalized recommendations via your Taste Graph.",
    section: "data",
  },
  location_services: {
    label: "Location Services",
    description:
      "Real-time location for nearby venue recommendations. Without this, you can set your city manually.",
    section: "data",
  },
  dietary_health: {
    label: "Dietary & Allergen Filtering",
    description:
      "Filters recommendations based on your dietary restrictions and allergies.",
    section: "data",
    specialNotice:
      "This may reveal health or religious information. This is considered sensitive data under privacy laws.",
  },
  marketing_comms: {
    label: "Email Newsletters",
    description: "Weekly picks, new venue spotlights, and seasonal guides.",
    section: "communications",
  },
  sms_push: {
    label: "SMS & Push Notifications",
    description:
      "Real-time alerts for reservations, flash deals, and group activity.",
    section: "communications",
  },
  cookies_tracking: {
    label: "Analytics Cookies",
    description:
      "Performance and analytics cookies that help us improve the app. Essential cookies remain active regardless.",
    section: "sharing",
  },
  group_taste: {
    label: "Party Room (Group Taste)",
    description:
      "Per-session consent for group recommendation merging. Managed automatically when you join a Party Room.",
    section: "data",
  },
  third_party_sharing: {
    label: "Anonymized Venue Insights",
    description:
      "Aggregate, anonymized trends shared with venue partners to improve their offerings. No personal data is shared.",
    section: "sharing",
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PrivacySettings() {
  const {
    getConsentStatus,
    grantConsent,
    withdrawConsent,
    submitDataRequest,
    exportData,
    requestAccountDeletion,
    loading,
    error,
  } = useConsentAgent();

  const [consents, setConsents] = useState<ConsentSettingsData[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState<ConsentCategory | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // --- Load current consent state ---
  useEffect(() => {
    (async () => {
      const result = await getConsentStatus();
      if (result.data?.consents) {
        setConsents(result.data.consents);
      }
      setLoaded(true);
    })();
  }, [getConsentStatus]);

  // --- Toggle handler ---
  const handleToggle = useCallback(
    async (category: ConsentCategory, currentlyGranted: boolean) => {
      if (category === "core_service") return; // Cannot toggle — requires account deletion
      if (category === "group_taste") return; // Per-session only

      if (currentlyGranted) {
        // Show confirmation before withdrawing
        setConfirmWithdraw(category);
      } else {
        // Grant immediately
        const result = await grantConsent(category, "1.0.0");
        if (!result.error) {
          setConsents((prev) =>
            prev.map((c) =>
              c.category === category ? { ...c, granted: true } : c
            )
          );
          setActionMessage(`${CATEGORY_META[category].label} enabled.`);
          setTimeout(() => setActionMessage(null), 3000);
        }
      }
    },
    [grantConsent]
  );

  // --- Confirm withdrawal ---
  const handleConfirmWithdraw = useCallback(async () => {
    if (!confirmWithdraw) return;
    const result = await withdrawConsent(confirmWithdraw);
    if (!result.error) {
      setConsents((prev) =>
        prev.map((c) =>
          c.category === confirmWithdraw ? { ...c, granted: false } : c
        )
      );
      setActionMessage(
        `${CATEGORY_META[confirmWithdraw].label} disabled. Your choice has been recorded.`
      );
      setTimeout(() => setActionMessage(null), 4000);
    }
    setConfirmWithdraw(null);
  }, [confirmWithdraw, withdrawConsent]);

  // --- Data requests ---
  const handleExportData = useCallback(async () => {
    const result = await exportData();
    if (result.data?.download_url) {
      setActionMessage(
        "Your data export is being prepared. You'll receive a download link shortly."
      );
      setTimeout(() => setActionMessage(null), 5000);
    }
  }, [exportData]);

  const handleDeleteAccount = useCallback(async () => {
    const result = await requestAccountDeletion();
    if (!result.error) {
      setActionMessage(
        "Your deletion request has been received. We'll confirm within 72 hours and complete within 30 days."
      );
      setConfirmDelete(false);
      setTimeout(() => setActionMessage(null), 8000);
    }
  }, [requestAccountDeletion]);

  // --- Group by section ---
  const dataConsents = consents.filter(
    (c) => CATEGORY_META[c.category]?.section === "data"
  );
  const commsConsents = consents.filter(
    (c) => CATEGORY_META[c.category]?.section === "communications"
  );
  const sharingConsents = consents.filter(
    (c) => CATEGORY_META[c.category]?.section === "sharing"
  );

  if (!loaded) {
    return (
      <div className="privacy-settings">
        <p className="loading-text">Loading your privacy settings...</p>
      </div>
    );
  }

  return (
    <div className="privacy-settings">
      <h1>Privacy Settings</h1>
      <p className="settings-intro">
        You're in control of your data. Toggle any setting on or off — turning
        something off is always as simple as turning it on.
      </p>

      {/* Status message */}
      {actionMessage && (
        <div className="action-message" role="status">
          {actionMessage}
        </div>
      )}

      {error && (
        <div className="consent-error" role="alert">
          {error}
        </div>
      )}

      {/* Data & Personalization */}
      <section className="settings-section">
        <h2>Data & Personalization</h2>
        {dataConsents.map((consent) => (
          <ConsentSettingRow
            key={consent.category}
            consent={consent}
            meta={CATEGORY_META[consent.category]}
            onToggle={handleToggle}
            loading={loading}
          />
        ))}
      </section>

      {/* Communications */}
      <section className="settings-section">
        <h2>Communications</h2>
        {commsConsents.map((consent) => (
          <ConsentSettingRow
            key={consent.category}
            consent={consent}
            meta={CATEGORY_META[consent.category]}
            onToggle={handleToggle}
            loading={loading}
          />
        ))}
      </section>

      {/* Sharing & Cookies */}
      <section className="settings-section">
        <h2>Sharing & Cookies</h2>
        {sharingConsents.map((consent) => (
          <ConsentSettingRow
            key={consent.category}
            consent={consent}
            meta={CATEGORY_META[consent.category]}
            onToggle={handleToggle}
            loading={loading}
          />
        ))}
      </section>

      {/* Your Data Rights (GDPR Art. 15-22) */}
      <section className="settings-section data-rights-section">
        <h2>Your Data Rights</h2>
        <p className="settings-body">
          Under GDPR, CCPA, and other privacy laws, you have rights over your
          personal data.
        </p>

        <div className="data-rights-grid">
          <button
            className="data-right-btn"
            onClick={handleExportData}
            disabled={loading}
          >
            <strong>Export My Data</strong>
            <span>Download a copy of all your Confetti data (JSON format)</span>
          </button>

          <button
            className="data-right-btn"
            onClick={() => submitDataRequest("access")}
            disabled={loading}
          >
            <strong>Request Data Access</strong>
            <span>Get a full report of what data we hold about you</span>
          </button>

          <button
            className="data-right-btn"
            onClick={() => submitDataRequest("object_profiling")}
            disabled={loading}
          >
            <strong>Object to Profiling</strong>
            <span>
              Stop all AI-based taste profiling and switch to generic
              recommendations
            </span>
          </button>

          <button
            className="data-right-btn"
            onClick={() => submitDataRequest("restrict_processing")}
            disabled={loading}
          >
            <strong>Restrict Processing</strong>
            <span>
              Freeze your Taste Graph — we keep it but stop updating it
            </span>
          </button>

          <button
            className="data-right-btn"
            onClick={() => submitDataRequest("automated_decision_review")}
            disabled={loading}
          >
            <strong>Request Human Review</strong>
            <span>
              Ask for a human review of how our AI makes recommendations for you
            </span>
          </button>

          <button
            className="data-right-btn data-right-btn-danger"
            onClick={() => setConfirmDelete(true)}
            disabled={loading}
          >
            <strong>Delete My Account</strong>
            <span>
              Permanently delete your account and all associated data
            </span>
          </button>
        </div>
      </section>

      {/* Contact */}
      <section className="settings-section">
        <h2>Questions?</h2>
        <p className="settings-body">
          Reach our privacy team at{" "}
          <a href="mailto:privacy@confetti.app">privacy@confetti.app</a> or our
          Data Protection Officer at{" "}
          <a href="mailto:dpo@confetti.app">dpo@confetti.app</a>.
        </p>
      </section>

      {/* Withdrawal confirmation modal */}
      {confirmWithdraw && (
        <WithdrawConfirmModal
          category={confirmWithdraw}
          consequence={
            consents.find((c) => c.category === confirmWithdraw)
              ?.withdrawal_consequence || ""
          }
          onConfirm={handleConfirmWithdraw}
          onCancel={() => setConfirmWithdraw(null)}
          loading={loading}
        />
      )}

      {/* Account deletion confirmation modal */}
      {confirmDelete && (
        <DeleteConfirmModal
          onConfirm={handleDeleteAccount}
          onCancel={() => setConfirmDelete(false)}
          loading={loading}
        />
      )}
    </div>
  );
}

// ===========================================================================
// Consent Setting Row
// ===========================================================================

function ConsentSettingRow({
  consent,
  meta,
  onToggle,
  loading,
}: {
  consent: ConsentSettingsData;
  meta: (typeof CATEGORY_META)[ConsentCategory];
  onToggle: (category: ConsentCategory, granted: boolean) => void;
  loading: boolean;
}) {
  const isLocked =
    consent.category === "core_service" || consent.category === "group_taste";

  return (
    <div className="consent-setting-row">
      <div className="consent-setting-info">
        <h3>{meta.label}</h3>
        <p>{meta.description}</p>
        {meta.specialNotice && consent.granted && (
          <p className="special-notice">{meta.specialNotice}</p>
        )}
        {consent.category === "core_service" && (
          <p className="locked-notice">
            Required to use Confetti. To withdraw, use "Delete My Account"
            below.
          </p>
        )}
        {consent.category === "group_taste" && (
          <p className="locked-notice">
            Managed per session when you join a Party Room.
          </p>
        )}
      </div>
      <button
        role="switch"
        aria-checked={consent.granted}
        aria-label={`${meta.label}: ${consent.granted ? "enabled" : "disabled"}`}
        className={`consent-toggle ${consent.granted ? "consent-toggle-on" : "consent-toggle-off"} ${isLocked ? "consent-toggle-locked" : ""}`}
        onClick={() => !isLocked && onToggle(consent.category, consent.granted)}
        disabled={loading || isLocked}
      >
        <span className="consent-toggle-thumb" />
      </button>
    </div>
  );
}

// ===========================================================================
// Withdrawal Confirmation Modal
// Anti-dark-pattern: "No thanks" has equal prominence to "Yes, disable".
// ===========================================================================

function WithdrawConfirmModal({
  category,
  consequence,
  onConfirm,
  onCancel,
  loading,
}: {
  category: ConsentCategory;
  consequence: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const meta = CATEGORY_META[category];

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Disable {meta.label}?</h3>
        <p>
          If you turn this off, here's what changes:
        </p>
        <p className="consequence-text">
          {consequence || "This feature will be disabled. You can re-enable it at any time."}
        </p>
        <div className="modal-actions">
          {/* Equal prominence — neither is visually dominant */}
          <button className="btn-secondary" onClick={onCancel} disabled={loading}>
            Keep Enabled
          </button>
          <button className="btn-secondary" onClick={onConfirm} disabled={loading}>
            {loading ? "Disabling..." : "Yes, Disable"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// Account Deletion Confirmation Modal
// ===========================================================================

function DeleteConfirmModal({
  onConfirm,
  onCancel,
  loading,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [typed, setTyped] = useState("");

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Delete Your Account?</h3>
        <p>
          This will permanently delete your Confetti account and all associated
          data, including your Taste Graph, consent records, and activity
          history. This action cannot be undone.
        </p>
        <p>
          We'll confirm receipt within 72 hours and complete the deletion within
          30 days, as required by law.
        </p>
        <label className="delete-confirm-label">
          Type <strong>DELETE</strong> to confirm:
          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="DELETE"
            className="delete-confirm-input"
          />
        </label>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button
            className="btn-danger"
            onClick={onConfirm}
            disabled={loading || typed !== "DELETE"}
          >
            {loading ? "Submitting..." : "Permanently Delete Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PrivacySettings;
