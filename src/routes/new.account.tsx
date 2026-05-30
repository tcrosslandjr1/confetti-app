import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DotsBg, Frame, TOKENS } from "@/components/new-confetti/shell";

// Port of AccountEditScreen — design/new-confetti/project/new-screens-4.jsx

export const Route = createFileRoute("/new/account")({
  component: AccountPage,
});

function AccountPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("Jess S.");
  const [handle, setHandle] = useState("jess.s");
  const [email, setEmail] = useState("jess@brooklyn.com");
  const [phone, setPhone] = useState("(347) 555-0182");
  const [bio, setBio] = useState("foodie who walks everywhere · brooklyn · 18 nights printed");
  const [dirty, setDirty] = useState(false);

  const track =
    <T,>(set: React.Dispatch<React.SetStateAction<T>>) =>
    (v: T) => {
      set(v);
      setDirty(true);
    };

  return (
    <Frame>
      <div
        style={{
          position: "relative",
          height: "100dvh",
          background: TOKENS.bg,
          display: "flex",
          flexDirection: "column",
          padding: "56px 0 24px",
          overflow: "hidden",
        }}
      >
        <DotsBg opacity={0.05} />

        {/* Header */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            padding: "0 22px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button onClick={() => navigate({ to: "/new/profile" })} style={backBtn}>←</button>
          <h2 style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22, letterSpacing: "-0.035em", margin: 0 }}>edit profile</h2>
          <button
            disabled={!dirty}
            style={{
              appearance: "none",
              cursor: dirty ? "pointer" : "not-allowed",
              padding: "6px 14px",
              border: `2px solid ${TOKENS.ink}`,
              borderRadius: 999,
              background: dirty ? TOKENS.accent1 : "rgba(19,11,13,0.1)",
              color: TOKENS.ink,
              opacity: dirty ? 1 : 0.5,
              fontFamily: TOKENS.mono,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: ".1em",
            }}
          >
            SAVE
          </button>
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 2,
            flex: 1,
            overflowY: "auto",
            padding: "0 22px 12px",
            scrollbarWidth: "none",
          }}
        >
          {/* Avatar */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
            <div
              style={{
                position: "relative",
                width: 80,
                height: 80,
                borderRadius: 999,
                border: `3px solid ${TOKENS.ink}`,
                background: TOKENS.accent2,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: TOKENS.display,
                fontWeight: 900,
                fontSize: 32,
                color: TOKENS.ink,
                boxShadow: `4px 4px 0 ${TOKENS.ink}`,
                flexShrink: 0,
              }}
            >
              JS
              <button
                style={{
                  position: "absolute",
                  bottom: -4,
                  right: -4,
                  appearance: "none",
                  cursor: "pointer",
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: `2px solid ${TOKENS.ink}`,
                  background: TOKENS.ink,
                  color: TOKENS.paper,
                  fontSize: 12,
                }}
              >
                📷
              </button>
            </div>
            <div>
              <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 18, letterSpacing: "-0.025em" }}>{name}</div>
              <div style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, color: TOKENS.inkHint, letterSpacing: ".06em" }}>@{handle}</div>
              <button
                style={{
                  appearance: "none",
                  cursor: "pointer",
                  marginTop: 6,
                  padding: "4px 10px",
                  border: `1.5px solid ${TOKENS.ink}`,
                  borderRadius: 999,
                  background: TOKENS.paper,
                  color: TOKENS.ink,
                  fontFamily: TOKENS.mono,
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: ".08em",
                }}
              >
                UPLOAD NEW PHOTO
              </button>
            </div>
          </div>

          {/* Fields */}
          <EditField label="display name" value={name} onChange={track(setName)} />
          <EditField label="handle" value={handle} onChange={track(setHandle)} prefix="@" />
          <EditField label="email" value={email} onChange={track(setEmail)} verified />
          <EditField label="phone" value={phone} onChange={track(setPhone)} verified />
          <EditField label="bio · public" value={bio} onChange={track(setBio)} multi />

          {/* Security */}
          <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".14em", color: TOKENS.inkHint, marginBottom: 8, textTransform: "uppercase", marginTop: 6 }}>
            security
          </div>
          {[
            ["🔑 change password", "last changed 4 months ago"],
            ["🔐 2-factor auth", "on · sms + authenticator"],
            ["🌐 connected accounts", "Apple · Google · TikTok"],
            ["📥 export your data", "gdpr-ready zip · email link"],
          ].map(([l, sub], i) => (
            <button
              key={i}
              style={{
                appearance: "none",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                marginBottom: 6,
                border: `2px solid ${TOKENS.ink}`,
                borderRadius: 10,
                background: TOKENS.paper,
                boxShadow: `2px 2px 0 ${TOKENS.ink}`,
              }}
            >
              <div>
                <div style={{ fontFamily: TOKENS.ui, fontSize: 12.5, fontWeight: 800, color: TOKENS.ink }}>{l}</div>
                <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700, color: TOKENS.inkHint, marginTop: 2, letterSpacing: ".04em" }}>{sub}</div>
              </div>
              <span style={{ color: TOKENS.inkHint, fontSize: 16, fontWeight: 900 }}>›</span>
            </button>
          ))}

          {/* Danger zone */}
          <div
            style={{
              marginTop: 14,
              padding: 12,
              background: "rgba(211,35,35,0.08)",
              border: `1.5px dashed ${TOKENS.ink}`,
              borderRadius: 10,
            }}
          >
            <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".14em", color: TOKENS.inkHint, marginBottom: 6 }}>DANGER ZONE</div>
            <button
              style={{
                appearance: "none",
                cursor: "pointer",
                width: "100%",
                padding: "10px 12px",
                border: `2px solid ${TOKENS.ink}`,
                borderRadius: 8,
                background: "transparent",
                color: "#d32323",
                fontFamily: TOKENS.ui,
                fontSize: 11.5,
                fontWeight: 800,
              }}
            >
              delete account permanently
            </button>
          </div>
        </div>
      </div>
    </Frame>
  );
}

function EditField({
  label,
  value,
  onChange,
  verified,
  multi,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  verified?: boolean;
  multi?: boolean;
  prefix?: string;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontFamily: TOKENS.mono, fontSize: 9.5, fontWeight: 800, letterSpacing: ".14em", color: TOKENS.inkHint, textTransform: "uppercase" }}>{label}</span>
        {verified && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 7px", background: TOKENS.accent4, border: `1.5px solid ${TOKENS.ink}`, borderRadius: 999, fontFamily: TOKENS.mono, fontSize: 8.5, fontWeight: 800, letterSpacing: ".06em" }}>
            ✓ VERIFIED
          </span>
        )}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          border: `2.5px solid ${TOKENS.ink}`,
          borderRadius: 12,
          background: TOKENS.paper,
          boxShadow: `3px 3px 0 ${TOKENS.ink}`,
          padding: multi ? "10px 14px" : "0 14px",
        }}
      >
        {prefix && (
          <span style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 16, color: TOKENS.inkHint, marginRight: 4 }}>{prefix}</span>
        )}
        {multi ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={2}
            style={{ flex: 1, appearance: "none", border: "none", outline: "none", background: "transparent", resize: "none", fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 700, color: TOKENS.ink, lineHeight: 1.4 }}
          />
        ) : (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ flex: 1, padding: "12px 0", appearance: "none", border: "none", outline: "none", background: "transparent", fontFamily: TOKENS.ui, fontSize: 14, fontWeight: 700, color: TOKENS.ink }}
          />
        )}
      </div>
    </div>
  );
}

const backBtn: React.CSSProperties = {
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
