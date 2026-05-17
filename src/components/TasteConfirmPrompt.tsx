import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Heart, X, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  getTasteCandidates,
  confirmTasteUpdate,
  type TasteCandidate,
} from "@/lib/pick-signals.functions";
import { supabase } from "@/integrations/supabase/client";

const SHOWN_KEY = "confetti.taste.lastShownAt";
const SKIP_KEY = "confetti.taste.skipUntil";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

type Picked = "love" | "avoid" | "skip";

/**
 * Once a week, surfaces a low-friction prompt asking the user to confirm
 * what their passive engagement (linger / save / swipe_away / reopen)
 * suggests they love or want to avoid. Confirmed terms are merged into
 * user_preferences.taste_profile so the planner can use them.
 */
export function TasteConfirmPrompt() {
  const fetchCandidates = useServerFn(getTasteCandidates);
  const submit = useServerFn(confirmTasteUpdate);

  const [open, setOpen] = useState(false);
  const [candidates, setCandidates] = useState<TasteCandidate[]>([]);
  const [picks, setPicks] = useState<Record<string, Picked>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!alive || !u.user) return;
      const now = Date.now();
      const skipUntil = Number(localStorage.getItem(SKIP_KEY) || 0);
      if (skipUntil && now < skipUntil) return;
      const lastShown = Number(localStorage.getItem(SHOWN_KEY) || 0);
      if (lastShown && now - lastShown < WEEK_MS) return;
      try {
        const { candidates } = await fetchCandidates();
        if (!alive || candidates.length < 2) return;
        const init: Record<string, Picked> = {};
        for (const c of candidates) init[c.value] = c.suggestion;
        setCandidates(candidates);
        setPicks(init);
        setOpen(true);
        localStorage.setItem(SHOWN_KEY, String(now));
      } catch {
        /* silent */
      }
    })();
    return () => {
      alive = false;
    };
  }, [fetchCandidates]);

  function setPick(value: string, p: Picked) {
    setPicks((prev) => ({ ...prev, [value]: prev[value] === p ? "skip" : p }));
  }

  async function save() {
    setSubmitting(true);
    try {
      const loves = Object.entries(picks)
        .filter(([, p]) => p === "love")
        .map(([v]) => v);
      const avoids = Object.entries(picks)
        .filter(([, p]) => p === "avoid")
        .map(([v]) => v);
      await submit({ data: { loves, avoids } });
      toast.success("Taste profile updated ✨");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save");
    } finally {
      setSubmitting(false);
    }
  }

  function skip() {
    localStorage.setItem(SKIP_KEY, String(Date.now() + WEEK_MS));
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-ink/40 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-t-3xl border-2 border-ink bg-cream shadow-brut sm:rounded-3xl">
        <div className="flex items-center gap-2 border-b-2 border-ink bg-gold px-4 py-3">
          <Sparkles className="h-4 w-4 text-coral" />
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/70">
              Weekly check-in
            </div>
            <div className="font-display text-base font-extrabold text-ink">
              Confirm what you actually like
            </div>
          </div>
          <button
            aria-label="Skip for now"
            onClick={skip}
            className="ml-auto grid h-8 w-8 place-items-center rounded-full hover:bg-ink/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto px-4 py-4">
          <p className="mb-3 text-xs text-muted-foreground">
            We noticed how you scrolled this week. Tap to confirm — your picks teach Confetti what
            to suggest (and what to skip).
          </p>
          <ul className="space-y-2">
            {candidates.map((c) => {
              const picked = picks[c.value] ?? "skip";
              const totalPos = c.signals.linger + c.signals.save + c.signals.reopen;
              const hint =
                c.suggestion === "love"
                  ? `Lingered ${c.signals.linger}× · saved ${c.signals.save}× · reopened ${c.signals.reopen}×`
                  : `Swiped past ${c.signals.swipe_away}× · barely engaged (${totalPos})`;
              return (
                <li key={c.value} className="rounded-2xl border-2 border-ink bg-card p-3">
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display text-sm font-bold capitalize">
                        {c.value}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{hint}</div>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    <PillButton
                      active={picked === "love"}
                      tone="love"
                      onClick={() => setPick(c.value, "love")}
                    >
                      <Heart className="h-3 w-3" /> Love
                    </PillButton>
                    <PillButton
                      active={picked === "avoid"}
                      tone="avoid"
                      onClick={() => setPick(c.value, "avoid")}
                    >
                      <X className="h-3 w-3" /> Avoid
                    </PillButton>
                    <PillButton
                      active={picked === "skip"}
                      tone="skip"
                      onClick={() => setPick(c.value, "skip")}
                    >
                      Not sure
                    </PillButton>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex items-center gap-2 border-t-2 border-ink bg-cream p-3">
          <button
            onClick={skip}
            className="flex-1 rounded-xl border-2 border-ink bg-cream px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-ink hover:bg-ink/5"
          >
            Ask later
          </button>
          <button
            onClick={save}
            disabled={submitting}
            className="flex-[2] inline-flex items-center justify-center gap-2 rounded-xl border-2 border-ink bg-coral px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-cream shadow-brut transition-pop active:scale-95 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Update my taste
          </button>
        </div>
      </div>
    </div>
  );
}

function PillButton({
  active,
  tone,
  onClick,
  children,
}: {
  active: boolean;
  tone: "love" | "avoid" | "skip";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const activeCls =
    tone === "love"
      ? "border-ink bg-coral text-cream"
      : tone === "avoid"
        ? "border-ink bg-ink text-cream"
        : "border-ink bg-gold text-ink";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1 rounded-lg border-2 px-2 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors ${
        active ? activeCls : "border-ink bg-cream text-ink hover:bg-ink/5"
      }`}
    >
      {children}
    </button>
  );
}
