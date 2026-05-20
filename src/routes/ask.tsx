import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  Sparkles,
  UserCircle,
  Map,
  Compass,
} from "lucide-react";
import { orchestratePlan } from "@/lib/orchestrator.functions";

export const Route = createFileRoute("/ask")({
  component: AskPage,
  head: () => ({
    meta: [
      { title: "Ask Confetti — One smooth AI outing brain" },
      {
        name: "description",
        content:
          "Tell Confetti what you want. One sentence becomes a fully named, personalized itinerary or multi-day trip.",
      },
    ],
  }),
});

function AskPage() {
  const navigate = useNavigate();
  const orchestrate = useServerFn(orchestratePlan);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof orchestrate>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const quickPrompts = [
    {
      id: "plan",
      label: "Plan my night",
      text: "Plan a fun evening for me tonight",
      icon: Sparkles,
      tone: "bg-coral text-cream border-coral",
    },
    {
      id: "personalize",
      label: "Personalize",
      text: "What do you think I'd love this weekend?",
      icon: UserCircle,
      tone: "bg-gold text-ink border-ink",
    },
    {
      id: "trip",
      label: "Plan a trip",
      text: "Plan a 3-day trip somewhere exciting",
      icon: Map,
      tone: "bg-ink text-cream border-ink",
    },
    {
      id: "intent",
      label: "What can I do?",
      text: "What kind of experiences do you offer?",
      icon: Compass,
      tone: "bg-cream text-ink border-ink",
    },
  ];

  async function handleSubmit(text: string) {
    setLoading(true);
    setError(null);
    try {
      const r = await orchestrate({ data: { rawRequest: text } });
      setResult(r);
      if (r.mode === "trip") {
        void navigate({ to: "/trips/$id", params: { id: r.tripId } });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12 md:py-20">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          Ask Confetti
        </h1>
        <p className="mt-3 text-muted-foreground">
          One sentence. One smooth AI brain. A fully named, personalized plan or trip.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) void handleSubmit(input.trim());
          }}
          className="mt-8 flex flex-col gap-3"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="3 days in Miami with the boys…"
            rows={3}
            className="w-full rounded-2xl border border-border bg-card p-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground disabled:opacity-50"
          >
            {loading ? "Confetti is thinking…" : "Plan it"}
          </button>
        </form>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickPrompts.map((q) => {
            const Icon = q.icon;
            return (
              <button
                key={q.id}
                onClick={() => {
                  setInput(q.text);
                  void handleSubmit(q.text);
                }}
                disabled={loading}
                className={`flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-4 text-sm font-semibold shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 ${q.tone}`}
              >
                <Icon className="h-5 w-5" />
                <span>{q.label}</span>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mt-6 rounded-xl bg-destructive/10 p-4 text-destructive">{error}</div>
        )}

        {result && result.mode === "single" && (
          <div className="mt-10 rounded-2xl border border-border bg-card p-6">
            <h2 className="text-2xl font-bold text-foreground">{result.plan.experienceName}</h2>
            <p className="mt-1 text-muted-foreground">{result.plan.experienceTagline}</p>
            <ol className="mt-4 space-y-3">
              {result.plan.stops.map(
                (s: {
                  id: string;
                  slot: string;
                  time: string;
                  name: string;
                  rationale: string;
                }) => (
                  <li key={s.id} className="rounded-xl bg-background p-3">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {s.slot} · {s.time}
                    </div>
                    <div className="mt-1 font-semibold text-foreground">{s.name}</div>
                    <div className="text-sm text-muted-foreground">{s.rationale}</div>
                  </li>
                ),
              )}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
