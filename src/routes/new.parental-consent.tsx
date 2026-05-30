import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  BrandMark,
  ChunkyButton,
  Frame,
  Icons,
  Stamp,
  Ticket,
  TOKENS,
} from "@/components/new-confetti/shell";

// Slim port — design/new-confetti/project/auth-flow.jsx (ParentalConsentScreen, line 306)
export const Route = createFileRoute("/new/parental-consent")({
  component: ParentalConsentPage,
});

function ParentalConsentPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  return (
    <Frame>
      <div
        style={{
          position: "relative",
          height: "100%",
          background: TOKENS.bg,
          display: "flex",
          flexDirection: "column",
          padding: "56px 20px 22px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <button onClick={() => navigate({ to: "/new/age-gate" })} style={backBtn()}>
            ←
          </button>
          <BrandMark size={17} />
          <span style={{ width: 36 }} />
        </div>

        <Stamp color={TOKENS.accent3} rotate={-3} style={{ alignSelf: "flex-start" }}>
          parent / guardian
        </Stamp>
        <h1
          style={{
            fontFamily: TOKENS.display,
            fontWeight: 900,
            fontSize: 36,
            lineHeight: 0.92,
            letterSpacing: "-0.04em",
            margin: "10px 0 6px",
          }}
        >
          We need a<br />
          grown-up.
        </h1>
        <p
          style={{
            fontFamily: TOKENS.ui,
            fontSize: 13,
            fontWeight: 700,
            opacity: 0.6,
            margin: "0 0 18px",
          }}
        >
          For under 13, we email your parent to set things up safely.
        </p>

        <div
          style={{
            fontFamily: TOKENS.mono,
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: ".14em",
            opacity: 0.55,
            marginBottom: 4,
            textTransform: "uppercase",
          }}
        >
          parent's email
        </div>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="parent@email.com"
          type="email"
          style={{
            width: "100%",
            padding: "14px 16px",
            boxSizing: "border-box",
            border: `2.5px solid ${TOKENS.ink}`,
            borderRadius: 12,
            background: TOKENS.paper,
            fontFamily: TOKENS.ui,
            fontSize: 15,
            fontWeight: 700,
            outline: "none",
            marginBottom: 14,
          }}
        />

        <Ticket color={TOKENS.paper} notch={false} style={{ padding: 12 }}>
          <div
            style={{
              fontFamily: TOKENS.mono,
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: ".14em",
              opacity: 0.6,
            }}
          >
            WHAT HAPPENS NEXT
          </div>
          <ul
            style={{
              margin: "6px 0 0",
              paddingLeft: 16,
              fontFamily: TOKENS.ui,
              fontSize: 12,
              fontWeight: 700,
              lineHeight: 1.6,
            }}
          >
            <li>We email them a one-tap consent link.</li>
            <li>They pick what features you can use.</li>
            <li>We email you when they finish.</li>
          </ul>
        </Ticket>

        <div style={{ flex: 1 }} />

        <ChunkyButton
          variant="accent"
          onClick={() => navigate({ to: "/new/email-verify" })}
          icon={Icons.arrow}
        >
          email my parent
        </ChunkyButton>
      </div>
    </Frame>
  );
}

function backBtn(): React.CSSProperties {
  return {
    appearance: "none",
    cursor: "pointer",
    width: 36,
    height: 36,
    borderRadius: 999,
    border: `2.5px solid ${TOKENS.ink}`,
    background: TOKENS.paper,
    fontSize: 14,
    fontWeight: 900,
    boxShadow: `3px 3px 0 ${TOKENS.ink}`,
  };
}
