// ============================================================================
// Confetti App — Boarding Pass Consent Onboarding
// 5-step consent flow woven into the Boarding Pass onboarding experience.
// Anti-dark-pattern compliant: all toggles default OFF, no pre-checked boxes,
// no consent walls (only core_service is required), no nag screens.
// ============================================================================

import React, { useState, useCallback } from "react";
import { useConsentAgent } from "./useConsentAgent";
import type { OnboardingStep, OnboardingConsentPayload } from "./ConsentTypes";

// ---------------------------------------------------------------------------
// Legal document URLs — replace with actual hosted URLs
// ---------------------------------------------------------------------------

const LEGAL_DOCS = {
  terms_of_service: {
    title: "Terms of Service",
    version: "1.0.0",
    url: "/legal/terms-of-service",
  },
  privacy_policy: {
    title: "Privacy Policy",
    version: "1.0.0",
    url: "/legal/privacy-policy",
  },
  eula: {
    title: "End User License Agreement",
    version: "1.0.0",
    url: "/legal/eula",
  },
};

// ---------------------------------------------------------------------------
// Component Props
// ---------------------------------------------------------------------------

interface BoardingPassConsentProps {
  onComplete: (payload: OnboardingConsentPayload) => void;
  onSkip?: () => void;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function BoardingPassConsent({
  onComplete,
  onSkip,
}: BoardingPassConsentProps) {
  const [step, setStep] = useState<OnboardingStep>(1);
  const { submitOnboardingConsent, loading, error } = useConsentAgent();

  // --- Consent state (all optional toggles default OFF) ---
  const [coreAgreed, setCoreAgreed] = useState(false);
  const [tasteProfiling, setTasteProfiling] = useState(false);
  const [locationServices, setLocationServices] = useState(false);
  const [dietaryHealth, setDietaryHealth] = useState(false);
  const [marketingComms, setMarketingComms] = useState(false);
  const [smsPush, setSmsPush] = useState(false);
  const [cookiesTracking, setCookiesTracking] = useState(false);

  // --- Navigation ---
  const next = useCallback(() => {
    setStep((s) => Math.min(s + 1, 5) as OnboardingStep);
  }, []);

  const back = useCallback(() => {
    setStep((s) => Math.max(s - 1, 1) as OnboardingStep);
  }, []);

  // --- Submit ---
  const handleComplete = useCallback(async () => {
    const payload: OnboardingConsentPayload = {
      core_service: true,
      taste_profiling: tasteProfiling,
      location_services: locationServices,
      dietary_health: dietaryHealth,
      marketing_comms: marketingComms,
      sms_push: smsPush,
      cookies_tracking: cookiesTracking,
      document_versions: {
        terms_of_service: LEGAL_DOCS.terms_of_service.version,
        privacy_policy: LEGAL_DOCS.privacy_policy.version,
        eula: LEGAL_DOCS.eula.version,
      },
    };

    const result = await submitOnboardingConsent(payload);
    if (!result.error) {
      onComplete(payload);
    }
  }, [
    tasteProfiling,
    locationServices,
    dietaryHealth,
    marketingComms,
    smsPush,
    cookiesTracking,
    submitOnboardingConsent,
    onComplete,
  ]);

  return (
    <div className="boarding-pass-consent">
      {/* Progress indicator */}
      <div className="consent-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
        <span className="progress-text">Step {step} of 5</span>
      </div>

      {/* Step content */}
      <div className="consent-step-content">
        {step === 1 && <StepWelcome onNext={next} />}
        {step === 2 && (
          <StepCoreAgreements
            agreed={coreAgreed}
            onAgree={setCoreAgreed}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 3 && (
          <StepTasteDiscovery
            enabled={tasteProfiling}
            onToggle={setTasteProfiling}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 4 && (
          <StepLocationDietary
            locationEnabled={locationServices}
            dietaryEnabled={dietaryHealth}
            onToggleLocation={setLocationServices}
            onToggleDietary={setDietaryHealth}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 5 && (
          <StepCommunications
            emailEnabled={marketingComms}
            smsEnabled={smsPush}
            cookiesEnabled={cookiesTracking}
            onToggleEmail={setMarketingComms}
            onToggleSms={setSmsPush}
            onToggleCookies={setCookiesTracking}
            onComplete={handleComplete}
            onBack={back}
            loading={loading}
          />
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="consent-error" role="alert">
          <p>Something went wrong: {error}</p>
          <button onClick={handleComplete}>Try Again</button>
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// Step 1: Welcome
// Informational only — no consent logged yet.
// ===========================================================================

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="consent-card">
      <div className="consent-card-icon">
        <span role="img" aria-label="confetti">
          🎉
        </span>
      </div>
      <h1>Welcome to Confetti</h1>
      <p className="consent-subtitle">
        Your AI-powered dining and nightlife concierge. We'll get you set up in
        just a few steps.
      </p>
      <p className="consent-body">
        Before we start, we need to go over a few things about how Confetti
        works and what data we use. You're in control — you can change any of
        these choices later in Settings.
      </p>
      <div className="consent-actions">
        <button className="btn-primary" onClick={onNext}>
          Let's Go
        </button>
      </div>
    </div>
  );
}

// ===========================================================================
// Step 2: Core Agreements
// HARD BLOCK — cannot proceed without agreeing to TOS + Privacy + EULA.
// This is the only consent wall; it's legally necessary (contract performance).
// ===========================================================================

function StepCoreAgreements({
  agreed,
  onAgree,
  onNext,
  onBack,
}: {
  agreed: boolean;
  onAgree: (v: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="consent-card">
      <h2>The Fine Print</h2>
      <p className="consent-body">
        To use Confetti, you need to agree to our core agreements. Take a moment
        to review them — they cover how the app works, how we handle your data,
        and your rights.
      </p>

      <div className="legal-doc-links">
        {Object.entries(LEGAL_DOCS).map(([key, doc]) => (
          <a
            key={key}
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="legal-doc-link"
          >
            {doc.title}
            <span className="doc-version">v{doc.version}</span>
          </a>
        ))}
      </div>

      <label className="consent-checkbox">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => onAgree(e.target.checked)}
        />
        <span>
          I have read and agree to the Terms of Service, Privacy Policy, and
          End User License Agreement.
        </span>
      </label>

      <div className="consent-actions">
        <button className="btn-secondary" onClick={onBack}>
          Back
        </button>
        <button className="btn-primary" onClick={onNext} disabled={!agreed}>
          Continue
        </button>
      </div>

      {!agreed && (
        <p className="consent-hint">
          You must agree to the core terms to use Confetti. This is the only
          required agreement — everything else is optional.
        </p>
      )}
    </div>
  );
}

// ===========================================================================
// Step 3: Taste Discovery
// Optional — toggle defaults to OFF. App works with generic recs if declined.
// ===========================================================================

function StepTasteDiscovery({
  enabled,
  onToggle,
  onNext,
  onBack,
}: {
  enabled: boolean;
  onToggle: (v: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="consent-card">
      <h2>Can Confetti learn your taste?</h2>
      <p className="consent-body">
        When this is on, Confetti builds a personal Taste Graph by learning from
        your activity — the places you save, the vibes you pick, and how you
        rate your experiences. This powers personalized recommendations that get
        better over time.
      </p>

      <div className="consent-detail-box">
        <h4>What we collect:</h4>
        <p>
          Venue interactions, vibe preferences, ratings, cuisine preferences,
          and browsing patterns within the app.
        </p>
        <h4>What we do with it:</h4>
        <p>
          Build your personal Taste Graph to recommend restaurants, bars, and
          experiences you'll actually love.
        </p>
        <h4>If you skip this:</h4>
        <p>
          Confetti still works — you'll see popular picks and trending spots
          instead of personalized recommendations.
        </p>
      </div>

      <ConsentToggle
        id="taste-profiling"
        label="Enable Taste Profiling"
        checked={enabled}
        onChange={onToggle}
      />

      <div className="consent-actions">
        <button className="btn-secondary" onClick={onBack}>
          Back
        </button>
        <button className="btn-primary" onClick={onNext}>
          Continue
        </button>
      </div>
    </div>
  );
}

// ===========================================================================
// Step 4: Location & Dietary
// Both optional, independent toggles, default OFF.
// Dietary is GDPR Art. 9 special category data — explicit consent with banner.
// ===========================================================================

function StepLocationDietary({
  locationEnabled,
  dietaryEnabled,
  onToggleLocation,
  onToggleDietary,
  onNext,
  onBack,
}: {
  locationEnabled: boolean;
  dietaryEnabled: boolean;
  onToggleLocation: (v: boolean) => void;
  onToggleDietary: (v: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="consent-card">
      <h2>Location & Dietary Needs</h2>

      {/* Location */}
      <div className="consent-section">
        <h3>Share your location for nearby picks?</h3>
        <p className="consent-body">
          When enabled, Confetti uses your location to surface restaurants and
          venues near you — no more scrolling through places across town.
        </p>
        <p className="consent-body-light">
          If you skip this, you can always set your city manually.
        </p>
        <ConsentToggle
          id="location-services"
          label="Enable Location Services"
          checked={locationEnabled}
          onChange={onToggleLocation}
        />
      </div>

      {/* Dietary — special category data */}
      <div className="consent-section">
        <h3>Any dietary needs?</h3>
        <p className="consent-body">
          If you share dietary restrictions or allergies, Confetti can filter out
          venues and dishes that don't work for you — so every recommendation is
          safe.
        </p>

        {/* GDPR Art. 9 explicit consent banner */}
        <div className="special-category-notice" role="alert">
          <strong>Heads up:</strong> Dietary and allergen information may reveal
          health or religious information. This is considered sensitive data
          under privacy laws. You can remove this anytime in Settings &gt;
          Privacy.
        </div>

        <ConsentToggle
          id="dietary-health"
          label="Enable Dietary Filtering"
          checked={dietaryEnabled}
          onChange={onToggleDietary}
        />
      </div>

      <div className="consent-actions">
        <button className="btn-secondary" onClick={onBack}>
          Back
        </button>
        <button className="btn-primary" onClick={onNext}>
          Continue
        </button>
      </div>
    </div>
  );
}

// ===========================================================================
// Step 5: Communications
// Optional toggles for email, SMS/push, and analytics cookies.
// SMS includes TCPA-compliant language.
// ===========================================================================

function StepCommunications({
  emailEnabled,
  smsEnabled,
  cookiesEnabled,
  onToggleEmail,
  onToggleSms,
  onToggleCookies,
  onComplete,
  onBack,
  loading,
}: {
  emailEnabled: boolean;
  smsEnabled: boolean;
  cookiesEnabled: boolean;
  onToggleEmail: (v: boolean) => void;
  onToggleSms: (v: boolean) => void;
  onToggleCookies: (v: boolean) => void;
  onComplete: () => void;
  onBack: () => void;
  loading: boolean;
}) {
  return (
    <div className="consent-card">
      <h2>Stay in the loop?</h2>
      <p className="consent-body">
        Choose how you'd like to hear from us. These are all optional — you
        won't miss any core app features by skipping them.
      </p>

      {/* Email */}
      <div className="consent-section">
        <ConsentToggle
          id="marketing-comms"
          label="Email newsletters & promotions"
          description="Weekly picks, new venue spotlights, and seasonal guides."
          checked={emailEnabled}
          onChange={onToggleEmail}
        />
      </div>

      {/* SMS/Push — TCPA compliance */}
      <div className="consent-section">
        <ConsentToggle
          id="sms-push"
          label="SMS & push notifications"
          description="Real-time alerts for reservations, flash deals, and group activity."
          checked={smsEnabled}
          onChange={onToggleSms}
        />
        {smsEnabled && (
          <p className="tcpa-notice">
            By enabling, you consent to receive automated text messages at the
            phone number associated with your account. Message and data rates
            may apply. Message frequency varies. Reply STOP to cancel at any
            time. Reply HELP for help.
          </p>
        )}
      </div>

      {/* Cookies/Analytics */}
      <div className="consent-section">
        <ConsentToggle
          id="cookies-tracking"
          label="Analytics & performance cookies"
          description="Help us improve Confetti by understanding how people use the app. Essential cookies are always active regardless of this setting."
          checked={cookiesEnabled}
          onChange={onToggleCookies}
        />
      </div>

      <div className="consent-actions">
        <button className="btn-secondary" onClick={onBack}>
          Back
        </button>
        <button
          className="btn-primary"
          onClick={onComplete}
          disabled={loading}
        >
          {loading ? "Setting up..." : "Start Exploring"}
        </button>
      </div>

      <p className="consent-footer-note">
        You can change any of these choices at any time in Settings &gt;
        Privacy. Withdrawing consent is always as easy as granting it.
      </p>
    </div>
  );
}

// ===========================================================================
// Shared: Consent Toggle
// Accessible, defaults OFF, equal prominence for on/off states.
// ===========================================================================

function ConsentToggle({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="consent-toggle-row">
      <div className="consent-toggle-text">
        <label htmlFor={id} className="consent-toggle-label">
          {label}
        </label>
        {description && (
          <p className="consent-toggle-description">{description}</p>
        )}
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`consent-toggle ${checked ? "consent-toggle-on" : "consent-toggle-off"}`}
        onClick={() => onChange(!checked)}
      >
        <span className="consent-toggle-thumb" />
      </button>
    </div>
  );
}

export default BoardingPassConsent;
