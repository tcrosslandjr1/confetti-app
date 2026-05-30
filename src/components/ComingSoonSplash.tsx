// Coming Soon splash — shown to users outside the DMV metro area.
// Full-screen gate with email waitlist signup + city vote.

import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { COMING_SOON_CITIES, overrideCityGate } from "@/lib/city-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { City } from "@/lib/cities";

// ─── City card ───────────────────────────────────────────────────

function CityCard({
  city,
  votes,
  selected,
  onVote,
}: {
  city: City;
  votes: number;
  selected: boolean;
  onVote: (slug: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onVote(city.slug)}
      className={[
        "group relative flex flex-col items-center gap-1.5 rounded-2xl border-2 px-4 py-4 transition-all duration-200",
        selected
          ? "border-coral bg-coral/10 shadow-brut -translate-x-0.5 -translate-y-0.5"
          : "border-ink/15 bg-cream/5 hover:border-ink/30 hover:bg-cream/8",
      ].join(" ")}
    >
      <span className="text-3xl" aria-hidden>
        {city.emoji}
      </span>
      <span className="font-display text-sm font-bold text-cream">{city.name}</span>
      <span className="text-xs text-cream/50">{city.region}</span>
      {votes > 0 && (
        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-coral/20 px-2 py-0.5 text-[11px] font-bold text-coral">
          {votes.toLocaleString()} vote{votes !== 1 ? "s" : ""}
        </span>
      )}
      {selected && (
        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-ink bg-coral text-[10px] text-cream">
          ✓
        </span>
      )}
    </button>
  );
}

// ─── Confetti burst animation (decorative) ───────────────────────

function ConfettiBurst() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: 24 }).map((_, i) => {
        const colors = ["bg-coral", "bg-gold", "bg-cream/40", "bg-coral/60", "bg-gold/60"];
        const color = colors[i % colors.length];
        const size = 4 + Math.random() * 8;
        const left = Math.random() * 100;
        const delay = Math.random() * 5;
        const duration = 6 + Math.random() * 8;
        return (
          <div
            key={i}
            className={`absolute rounded-sm ${color}`}
            style={{
              width: size,
              height: size * (0.4 + Math.random() * 0.8),
              left: `${left}%`,
              top: -20,
              opacity: 0.6 + Math.random() * 0.4,
              animation: `confetti-fall ${duration}s ${delay}s linear infinite`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Main splash ─────────────────────────────────────────────────

export function ComingSoonSplash() {
  const [email, setEmail] = useState("");
  const [votedCity, setVotedCity] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [cityVotes, setCityVotes] = useState<Record<string, number>>({});
  const formRef = useRef<HTMLFormElement>(null);

  // Fetch live vote counts on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("city_waitlist")
          .select("voted_city")
          .not("voted_city", "is", null);
        if (cancelled || !data) return;
        const counts: Record<string, number> = {};
        for (const row of data) {
          if (row.voted_city) {
            counts[row.voted_city] = (counts[row.voted_city] || 0) + 1;
          }
        }
        setCityVotes(counts);
      } catch {
        // Non-critical — votes just won't show counts
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleVote = useCallback((slug: string) => {
    setVotedCity((prev) => (prev === slug ? null : slug));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = email.trim().toLowerCase();
      if (!trimmed) return;

      // Basic email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        toast.error("Please enter a valid email address.");
        return;
      }

      setSubmitting(true);
      try {
        const { error } = await supabase.from("city_waitlist").upsert(
          {
            email: trimmed,
            voted_city: votedCity,
            source: "coming_soon_splash",
          },
          { onConflict: "email" },
        );

        if (error) throw error;

        setSubmitted(true);

        // Update local vote count optimistically
        if (votedCity) {
          setCityVotes((prev) => ({
            ...prev,
            [votedCity]: (prev[votedCity] || 0) + 1,
          }));
        }

        toast.success("You're on the list! We'll notify you when Confetti launches in your city.");
      } catch (err) {
        console.error("[city-waitlist] submit error:", err);
        toast.error("Something went wrong. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [email, votedCity],
  );

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-ink overflow-y-auto">
      {/* Confetti CSS animation */}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 0.6; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>

      <ConfettiBurst />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12">
        {/* Logo / brand */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-5xl font-extrabold tracking-tight text-cream sm:text-6xl md:text-7xl">
            Confetti
          </h1>
          <p className="mt-1 font-serif text-lg italic text-cream/60 sm:text-xl">
            Your city, curated
          </p>
        </div>

        {/* Status badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border-2 border-coral/30 bg-coral/10 px-4 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-coral opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-coral" />
          </span>
          <span className="text-sm font-bold text-coral">Live in Washington DC</span>
        </div>

        {/* Main copy */}
        <div className="mb-10 max-w-lg text-center">
          <h2 className="font-display text-2xl font-bold text-cream sm:text-3xl">
            Coming to your city soon
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-cream/60 sm:text-base">
            Confetti curates the best dining, nightlife, and experiences into ready-to-go
            itineraries. We're live in the DMV — sign up below to get notified when we launch in
            your city.
          </p>
        </div>

        {/* City vote grid */}
        <div className="mb-8 w-full max-w-lg">
          <p className="mb-3 text-center text-sm font-bold text-cream/70">Vote for the next city</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
            {COMING_SOON_CITIES.map((city) => (
              <CityCard
                key={city.slug}
                city={city}
                votes={cityVotes[city.slug] || 0}
                selected={votedCity === city.slug}
                onVote={handleVote}
              />
            ))}
          </div>
        </div>

        {/* Email form */}
        {!submitted ? (
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="flex w-full max-w-md flex-col gap-3 sm:flex-row"
          >
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
              className="flex-1 border-cream/20 bg-cream/5 text-cream placeholder:text-cream/30"
            />
            <Button type="submit" disabled={submitting || !email.trim()} className="shrink-0">
              {submitting ? "Joining…" : "Notify me"}
            </Button>
          </form>
        ) : (
          <div className="flex w-full max-w-md flex-col items-center gap-3 rounded-2xl border-2 border-coral/30 bg-coral/10 p-6 text-center">
            <span className="text-3xl">🎉</span>
            <p className="font-display text-lg font-bold text-cream">You're on the list!</p>
            <p className="text-sm text-cream/60">
              We'll send you an email the moment Confetti goes live
              {votedCity
                ? ` in ${COMING_SOON_CITIES.find((c) => c.slug === votedCity)?.name ?? "your city"}`
                : ""}
              .
            </p>
          </div>
        )}

        {/* DMV override link — for people who ARE in DMV but geo failed */}
        <div className="mt-8 text-center">
          <p className="text-xs text-cream/30">
            Already in the DC / MD / VA area?{" "}
            <button
              type="button"
              onClick={() => {
                overrideCityGate();
                window.location.reload();
              }}
              className="text-coral/70 underline underline-offset-2 hover:text-coral"
            >
              Enter Confetti
            </button>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 pb-8 text-center">
        <p className="text-xs text-cream/20">
          © {new Date().getFullYear()} Confetti. All rights reserved.
        </p>
      </div>
    </div>
  );
}
