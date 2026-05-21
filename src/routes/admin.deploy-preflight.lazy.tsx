import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  GitBranch,
  Github,
  RefreshCw,
  Rocket,
  ShieldAlert,
} from "lucide-react";

export const Route = createLazyFileRoute("/admin/deploy-preflight")({
  component: DeployPreflightPage,
});

/* ------------------------------------------------------------------ */
/*  Expected repo configuration                                        */
/* ------------------------------------------------------------------ */
// Single source of truth — keep in sync with the GitHub connection.
const EXPECTED = {
  owner: "tcrosslandjr1",
  // Current canonical repo (will be renamed to "confetti-app").
  repo: "confettiplan",
  // Repos that were merged in and must NEVER be pushed to again.
  retiredRepos: ["TimeApp", "confetti-app", "confetti-influencer-kit"],
  branch: "main",
  lovableProjectId: "f4bae350-0f3c-459c-a8b3-17702408f503",
} as const;

const ACK_KEY = "admin:deploy-preflight:ack";

type Ack = {
  repoConfirmed: boolean;
  branchConfirmed: boolean;
  noNewRepos: boolean;
  at?: string;
  by?: string;
};

function loadAck(): Ack {
  if (typeof window === "undefined") {
    return { repoConfirmed: false, branchConfirmed: false, noNewRepos: false };
  }
  try {
    const raw = window.localStorage.getItem(ACK_KEY);
    if (!raw) return { repoConfirmed: false, branchConfirmed: false, noNewRepos: false };
    return JSON.parse(raw) as Ack;
  } catch {
    return { repoConfirmed: false, branchConfirmed: false, noNewRepos: false };
  }
}

function saveAck(ack: Ack) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACK_KEY, JSON.stringify(ack));
}

function DeployPreflightPage() {
  const [ack, setAck] = useState<Ack>(() => loadAck());
  const [now, setNow] = useState(() => Date.now());

  // Re-evaluate freshness every minute so the "ack expired" badge stays accurate.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const ackFresh = useMemo(() => {
    if (!ack.at) return false;
    const ageMs = now - new Date(ack.at).getTime();
    return ageMs < 1000 * 60 * 60 * 24; // valid for 24h
  }, [ack.at, now]);

  const allChecked = ack.repoConfirmed && ack.branchConfirmed && ack.noNewRepos;
  const cleared = allChecked && ackFresh;

  const update = (patch: Partial<Ack>) => {
    const next = { ...ack, ...patch };
    setAck(next);
    saveAck(next);
  };

  const confirmAll = () => {
    const next: Ack = {
      repoConfirmed: true,
      branchConfirmed: true,
      noNewRepos: true,
      at: new Date().toISOString(),
      by: "admin",
    };
    setAck(next);
    saveAck(next);
  };

  const reset = () => {
    const next: Ack = {
      repoConfirmed: false,
      branchConfirmed: false,
      noNewRepos: false,
    };
    setAck(next);
    saveAck(next);
  };

  const repoUrl = `https://github.com/${EXPECTED.owner}/${EXPECTED.repo}`;
  const branchUrl = `${repoUrl}/tree/${EXPECTED.branch}`;

  return (
    <div className="space-y-8 text-ink">
      {/* Header */}
      <header className="rounded-2xl border-2 border-ink bg-cream p-6 shadow-brut-lg">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-ink/60">
              / deploy preflight
            </span>
            <h1 className="mt-2 font-display text-5xl font-extrabold leading-[0.9] tracking-tight sm:text-6xl">
              Deploy <span className="font-serif italic font-normal text-coral">preflight.</span>
            </h1>
            <p className="mt-3 max-w-xl text-base leading-snug">
              Confirm the connected GitHub repo and branch before running any deploy actions.
              Required every <span className="font-display font-extrabold">24h</span>.
            </p>
          </div>
          <div
            className={`inline-flex items-center gap-2 rounded-full border-2 border-ink px-3 py-1.5 text-xs font-bold uppercase tracking-wider shadow-brut ${
              cleared ? "bg-emerald-200 text-ink" : "bg-amber-200 text-ink"
            }`}
          >
            {cleared ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" /> Cleared for deploy
              </>
            ) : (
              <>
                <ShieldAlert className="h-3.5 w-3.5" /> Not cleared
              </>
            )}
          </div>
        </div>
      </header>

      {/* Expected repo card */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h2 className="mb-4 inline-flex items-center gap-2 font-display text-lg font-bold">
          <Github className="h-4 w-4" /> Expected GitHub target
        </h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          <Field label="Owner" value={EXPECTED.owner} />
          <Field
            label="Repository"
            value={
              <a
                href={repoUrl}
                target="_blank"
                rel="noreferrer"
                className="font-mono font-semibold text-coral hover:underline"
              >
                {EXPECTED.repo}
              </a>
            }
          />
          <Field
            label="Branch"
            value={
              <a
                href={branchUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-mono font-semibold text-coral hover:underline"
              >
                <GitBranch className="h-3.5 w-3.5" /> {EXPECTED.branch}
              </a>
            }
          />
          <Field label="Lovable project" value={<code className="text-xs">{EXPECTED.lovableProjectId}</code>} />
        </dl>

        <div className="mt-5 rounded-xl border-2 border-dashed border-destructive/50 bg-destructive/5 p-4">
          <p className="inline-flex items-center gap-2 text-sm font-bold text-destructive">
            <AlertTriangle className="h-4 w-4" /> Retired repos — never push here
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {EXPECTED.retiredRepos.map((r) => (
              <li
                key={r}
                className="rounded-full border border-destructive/40 bg-background px-2.5 py-0.5 text-xs font-mono line-through text-destructive"
              >
                {EXPECTED.owner}/{r}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Checklist */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h2 className="mb-4 font-display text-lg font-bold">Confirm before deploying</h2>
        <ul className="space-y-3">
          <CheckRow
            checked={ack.repoConfirmed}
            onToggle={(v) => update({ repoConfirmed: v, at: undefined })}
            title={`I verified GitHub is connected to ${EXPECTED.owner}/${EXPECTED.repo}`}
            hint="Open the (+) menu → GitHub and confirm the repo name matches exactly."
          />
          <CheckRow
            checked={ack.branchConfirmed}
            onToggle={(v) => update({ branchConfirmed: v, at: undefined })}
            title={`Pushes target the "${EXPECTED.branch}" branch`}
            hint="If branch switching is enabled in Labs, confirm the active branch."
          />
          <CheckRow
            checked={ack.noNewRepos}
            onToggle={(v) => update({ noNewRepos: v, at: undefined })}
            title="No new repositories were created"
            hint="All code lives in the single canonical repo above."
          />
        </ul>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={confirmAll}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-coral px-4 py-2 text-sm font-bold text-ink shadow-brut transition hover:-translate-y-0.5"
          >
            <CheckCircle2 className="h-4 w-4" /> Confirm all & clear preflight
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-cream px-4 py-2 text-sm font-bold text-ink shadow-brut transition hover:-translate-y-0.5"
          >
            <RefreshCw className="h-4 w-4" /> Reset
          </button>
          {ack.at && (
            <span className="text-xs text-muted-foreground">
              Last ack: {new Date(ack.at).toLocaleString()}
              {!ackFresh && <span className="ml-1 font-semibold text-destructive">(expired)</span>}
            </span>
          )}
        </div>
      </section>

      {/* Deploy gate */}
      <section
        className={`rounded-2xl border-2 p-6 shadow-brut ${
          cleared ? "border-emerald-600 bg-emerald-50" : "border-ink bg-muted/40"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold">Deploy actions</h2>
            <p className="text-sm text-muted-foreground">
              {cleared
                ? "Preflight cleared — you may proceed with publish or deploy."
                : "Complete the checklist above to unlock deploy actions."}
            </p>
          </div>
          <button
            type="button"
            disabled={!cleared}
            onClick={() => {
              if (!cleared) return;
              window.open("https://lovable.dev/", "_blank", "noopener,noreferrer");
            }}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-ink px-5 py-2.5 text-sm font-bold text-cream shadow-brut transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
          >
            <Rocket className="h-4 w-4" /> Proceed to publish
          </button>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Small bits                                                         */
/* ------------------------------------------------------------------ */
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3">
      <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold">{value}</dd>
    </div>
  );
}

function CheckRow({
  checked,
  onToggle,
  title,
  hint,
}: {
  checked: boolean;
  onToggle: (v: boolean) => void;
  title: string;
  hint?: string;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onToggle(!checked)}
        className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition hover:border-ink ${
          checked ? "border-emerald-600 bg-emerald-50" : "border-border bg-background/60"
        }`}
      >
        {checked ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        ) : (
          <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{title}</p>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
      </button>
    </li>
  );
}
