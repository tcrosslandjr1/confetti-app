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

// Slim port — design/new-confetti/project/auth-flow.jsx (AgeGateScreen, line 200)
export const Route = createFileRoute("/new/age-gate")({
  component: AgeGatePage,
});

function AgeGatePage() {
  const navigate = useNavigate();
  const [mm, setMm] = useState("");
  const [dd, setDd] = useState("");
  const [yyyy, setYyyy] = useState("");

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
          <button onClick={() => navigate({ to: "/new/signup" })} style={backBtn()}>
            ←
          </button>
          <BrandMark size={17} />
          <span style={{ width: 36 }} />
        </div>

        <Stamp color={TOKENS.accent2} rotate={-3} style={{ alignSelf: "flex-start" }}>
          quick check
        </Stamp>
        <h1
          style={{
            fontFamily: TOKENS.display,
            fontWeight: 900,
            fontSize: 38,
            lineHeight: 0.92,
            letterSpacing: "-0.04em",
            margin: "10px 0 6px",
          }}
        >
          When were
          <br />
          you born?
        </h1>
        <p
          style={{
            fontFamily: TOKENS.ui,
            fontSize: 13,
            fontWeight: 700,
            opacity: 0.6,
            margin: "0 0 22px",
          }}
        >
          Some venues are 21+. We tailor your night based on age.
        </p>

        <div style={{ display: "flex", gap: 8 }}>
          <DateBox label="month" placeholder="MM" value={mm} onChange={setMm} max={2} />
          <DateBox label="day" placeholder="DD" value={dd} onChange={setDd} max={2} />
          <DateBox
            label="year"
            placeholder="YYYY"
            value={yyyy}
            onChange={setYyyy}
            max={4}
            flex={1.5}
          />
        </div>

        <Ticket color={TOKENS.paper} notch={false} style={{ padding: 12, marginTop: 18 }}>
          <div
            style={{
              fontFamily: TOKENS.mono,
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: ".14em",
              opacity: 0.6,
            }}
          >
            PRIVACY
          </div>
          <div
            style={{
              fontFamily: TOKENS.ui,
              fontSize: 12,
              fontWeight: 700,
              marginTop: 4,
            }}
          >
            We never share your birthday. We use age only for venue eligibility.
          </div>
        </Ticket>

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", gap: 8 }}>
          <ChunkyButton variant="ghost" onClick={() => navigate({ to: "/new/parental-consent" })}>
            under 13
          </ChunkyButton>
          <ChunkyButton
            variant="accent"
            onClick={() => navigate({ to: "/new/hub" })}
            icon={Icons.arrow}
          >
            continue
          </ChunkyButton>
        </div>
      </div>
    </Frame>
  );
}

function DateBox({
  label,
  placeholder,
  value,
  onChange,
  max,
  flex = 1,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  max: number;
  flex?: number;
}) {
  return (
    <div style={{ flex }}>
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
        {label}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        inputMode="numeric"
        maxLength={max}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "14px 12px",
          boxSizing: "border-box",
          border: `2.5px solid ${TOKENS.ink}`,
          borderRadius: 12,
          background: TOKENS.paper,
          textAlign: "center",
          fontFamily: TOKENS.display,
          fontWeight: 900,
          fontSize: 22,
          outline: "none",
        }}
      />
    </div>
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
