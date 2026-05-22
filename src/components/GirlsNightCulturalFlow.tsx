import { useState } from "react";
import { Sparkles, Users, Globe2, ChevronDown } from "lucide-react";

/**
 * Girls Night planning framework — surfaces the two-branch decision tree
 * (shared cultural vibe vs. multicultural group) as a guided callout on
 * /ideas/girls-night. Mirrors the agent prompt in
 * src/lib/agents/girls-night-presets.ts → buildGirlsNightCulturalPrompt().
 */
export function GirlsNightCulturalFlow() {
  const [branch, setBranch] = useState<"shared" | "mixed" | null>(null);
  const [open, setOpen] = useState(true);

  return (
    <section className="border-b border-border bg-muted/30">
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-display text-sm font-bold">
              Plan the night by the group's vibe
            </span>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => setBranch("shared")}
                className={`rounded-xl border-2 p-4 text-left transition-pop hover:-translate-y-0.5 ${
                  branch === "shared"
                    ? "border-primary bg-card shadow-card"
                    : "border-border bg-card/50"
                }`}
              >
                <Users className="mb-2 h-5 w-5 text-primary" />
                <p className="text-sm font-bold">One shared cultural vibe</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Group shares a culture, music taste, or scene.
                </p>
              </button>
              <button
                onClick={() => setBranch("mixed")}
                className={`rounded-xl border-2 p-4 text-left transition-pop hover:-translate-y-0.5 ${
                  branch === "mixed"
                    ? "border-primary bg-card shadow-card"
                    : "border-border bg-card/50"
                }`}
              >
                <Globe2 className="mb-2 h-5 w-5 text-primary" />
                <p className="text-sm font-bold">Multiracial / mixed group</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Multiple cultures — keep it shared, not tokenized.
                </p>
              </button>
            </div>

            {branch === "shared" && (
              <div className="rounded-xl bg-card p-4 text-sm">
                <p className="font-bold">Pick a cultural anchor, then layer the formula.</p>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Food:</strong> KBBQ · tacos · soul food ·
                    mezze · Indian street food · Caribbean · hot pot
                  </li>
                  <li>
                    <strong className="text-foreground">Music / activity:</strong> karaoke · salsa ·
                    Afrobeats · Bollywood · R&amp;B lounge · K-pop · reggaeton
                  </li>
                </ul>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Formula
                </p>
                <p className="text-foreground">
                  Dinner → fit check / photos → one fun activity → dessert or late-night bites
                </p>
                <p className="mt-2 rounded-md bg-primary/10 px-3 py-2 text-xs font-bold text-primary">
                  Best plan: cultural dinner + music/dance/karaoke + dessert
                </p>
              </div>
            )}

            {branch === "mixed" && (
              <div className="rounded-xl bg-card p-4 text-sm">
                <p className="font-bold">
                  Don't make one girl represent a whole culture. Pick a shared format.
                </p>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Culture-swap dinner:</strong> everyone
                    brings one food, song, drink, outfit, or tradition
                  </li>
                  <li>
                    <strong className="text-foreground">Passport playlist:</strong> each girl adds 5
                    songs from her taste
                  </li>
                  <li>
                    <strong className="text-foreground">Group-vote activity:</strong> karaoke,
                    bowling, rooftop, dance class, paint-and-sip, comedy, spa
                  </li>
                </ul>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Formula
                </p>
                <p className="text-foreground">
                  Shareable dinner → glam moment → one interactive activity → playlist rotation →
                  dessert / late-night bites
                </p>
                <p className="mt-2 rounded-md bg-primary/10 px-3 py-2 text-xs font-bold text-primary">
                  Best plan: culture-swap dinner + passport playlist + karaoke/dancing
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
