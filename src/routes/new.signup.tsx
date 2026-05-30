import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  BrandMark,
  Chip,
  ChunkyButton,
  DotsBg,
  FloatingTickets,
  Frame,
  Icons,
  Stamp,
  TOKENS,
} from "@/components/new-confetti/shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/new/signup")({
  component: SignUpPage,
});

function SignUpPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [vibes, setVibes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (v: string) =>
    setVibes((vs) => (vs.includes(v) ? vs.filter((x) => x !== v) : [...vs, v]));
  const valid = name.trim().length > 0 && email.trim().length > 0;

  const handleSignUp = async () => {
    if (!valid) return;
    setLoading(true);
    setError(null);

    // Sign up with magic link — Supabase creates the user on first OTP send
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          display_name: name.trim(),
          city: city.trim(),
          vibes,
        },
      },
    });

    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    // Navigate to a confirmation / explainer screen
    navigate({ to: "/new/explainer" });
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
          padding: "70px 28px 36px",
          overflow: "hidden",
        }}
      >
        <DotsBg opacity={0.06} />
        <FloatingTickets density={4} />

        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <BrandMark size={20} spin />
          <button
            onClick={() => navigate({ to: "/new/signin" })}
            style={{
              appearance: "none",
              cursor: "pointer",
              background: "transparent",
              border: "none",
              padding: 6,
              fontFamily: TOKENS.ui,
              fontSize: 13,
              fontWeight: 800,
              color: TOKENS.ink,
              opacity: 0.55,
            }}
          >
            ← sign in
          </button>
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 2,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 18,
          }}
        >
          <Stamp color={TOKENS.accent1} rotate={-3} style={{ alignSelf: "flex-start" }}>
            print night 01
          </Stamp>
          <h1
            style={{
              fontFamily: TOKENS.display,
              fontWeight: 900,
              fontSize: 44,
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
              color: TOKENS.ink,
              margin: 0,
            }}
          >
            Tell us
            <br />
            about you.
          </h1>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: "#fee2e2",
                border: "2px solid #ef4444",
                fontFamily: TOKENS.ui,
                fontSize: 13,
                fontWeight: 600,
                color: "#991b1b",
              }}
            >
              {error}
            </div>
          )}

          <Input label="Your name" value={name} onChange={setName} placeholder="Jess" icon="✣" />
          <Input
            label="Email"
            value={email}
            onChange={setEmail}
            placeholder="you@email.com"
            icon="✉"
          />
          <Input
            label="City"
            value={city}
            onChange={setCity}
            placeholder="Brooklyn, NY"
            icon="📍"
          />

          <div>
            <div
              style={{
                fontFamily: TOKENS.mono,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: ".14em",
                opacity: 0.55,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              your usual vibe · pick a few
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {[
                ["foodie", "🍜"],
                ["chill", "🌿"],
                ["hype", "⚡"],
                ["romantic", "🍷"],
                ["outdoorsy", "🌳"],
                ["culture", "🎭"],
                ["low-key", "☕"],
                ["weird", "👁"],
              ].map(([id, emoji]) => (
                <Chip
                  key={id}
                  dense
                  selected={vibes.includes(id)}
                  icon={emoji}
                  color={TOKENS.accent1}
                  onClick={() => toggle(id)}
                >
                  {id}
                </Chip>
              ))}
            </div>
          </div>

          <ChunkyButton
            variant="accent"
            disabled={!valid || loading}
            icon={Icons.arrow}
            onClick={handleSignUp}
          >
            {loading ? "sending link..." : valid ? "Start printing" : "Add your name & email"}
          </ChunkyButton>
        </div>
      </div>
    </Frame>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  icon,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
  icon?: string;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: TOKENS.mono,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: ".14em",
          opacity: 0.55,
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "14px 16px",
          border: `2.5px solid ${TOKENS.ink}`,
          borderRadius: 14,
          background: TOKENS.paper,
          boxShadow: `4px 4px 0 ${TOKENS.ink}`,
        }}
      >
        {icon && (
          <span style={{ color: TOKENS.accent1, fontSize: 16, fontWeight: 900 }}>{icon}</span>
        )}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            appearance: "none",
            border: "none",
            outline: "none",
            background: "transparent",
            flex: 1,
            fontFamily: TOKENS.ui,
            fontSize: 16,
            fontWeight: 700,
            color: TOKENS.ink,
          }}
        />
      </div>
    </div>
  );
}
