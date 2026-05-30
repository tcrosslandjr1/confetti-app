import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  BrandMark,
  ChunkyButton,
  Frame,
  Icons,
  Stamp,
  TOKENS,
} from "@/components/new-confetti/shell";

// Slim port — design/new-confetti/project/auth-flow.jsx (PhoneVerifyScreen, line 10)
export const Route = createFileRoute("/new/phone-verify")({
  component: PhoneVerifyPage,
});

function PhoneVerifyPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState(["", "", "", "", "", ""]);

  const set = (i: number, v: string) => {
    if (v.length > 1) v = v.slice(-1);
    setCode((c) => c.map((x, j) => (j === i ? v : x)));
  };

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
          verify · phone
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
          Check your
          <br />
          messages.
        </h1>
        <p
          style={{
            fontFamily: TOKENS.ui,
            fontSize: 13,
            fontWeight: 700,
            opacity: 0.6,
            margin: "0 0 24px",
          }}
        >
          We texted (347) 555-0182 a 6-digit code.
        </p>

        {/* code boxes */}
        <div style={{ display: "flex", gap: 8, justifyContent: "space-between", marginBottom: 20 }}>
          {code.map((v, i) => (
            <input
              key={i}
              value={v}
              onChange={(e) => set(i, e.target.value)}
              inputMode="numeric"
              maxLength={1}
              style={{
                flex: 1,
                height: 56,
                textAlign: "center",
                border: `2.5px solid ${TOKENS.ink}`,
                borderRadius: 12,
                background: TOKENS.paper,
                fontFamily: TOKENS.display,
                fontWeight: 900,
                fontSize: 24,
                outline: "none",
                boxShadow: v ? `3px 3px 0 ${TOKENS.ink}` : "none",
              }}
            />
          ))}
        </div>

        <div
          style={{
            fontFamily: TOKENS.mono,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: ".1em",
            opacity: 0.6,
            textAlign: "center",
          }}
        >
          didn't get it?{" "}
          <button
            onClick={() => navigate({ to: "/new/phone-verify" })}
            style={{
              appearance: "none",
              background: "none",
              border: "none",
              padding: 0,
              fontFamily: TOKENS.mono,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: ".1em",
              textDecoration: "underline",
              cursor: "pointer",
              color: "inherit",
              opacity: 1,
            }}
          >
            resend code
          </button>
        </div>

        <div style={{ flex: 1 }} />

        <ChunkyButton
          variant="accent"
          onClick={() => navigate({ to: "/new/email-verify" })}
          icon={Icons.arrow}
        >
          verify
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
