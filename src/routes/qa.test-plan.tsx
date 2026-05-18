import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/qa/test-plan")({
  component: TestPlanPage,
  head: () => ({
    meta: [{ title: "Confetti Test Plan & QA Docs" }, { name: "robots", content: "noindex" }],
  }),
});

function TestPlanPage() {
  const [tab, setTab] = useState<"plan" | "bug" | "automation">("plan");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Confetti QA Documents</h1>
      <p className="text-muted-foreground mb-6">
        Full-system test plan, bug report template, and automation suite tiers.
      </p>

      <div className="flex gap-2 mb-6 border-b pb-2">
        {(["plan", "bug", "automation"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-t ${
              tab === t ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            {t === "plan" ? "Test Plan v1" : t === "bug" ? "Bug Report Template" : "Automation Suite"}
          </button>
        ))}
      </div>

      {tab === "plan" && <PlanTab />}
      {tab === "bug" && <BugTab />}
      {tab === "automation" && <AutomationTab />}
    </main>
  );
}

function PlanTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <a
          href="/confetti-test-plan-v1.docx"
          download
          className="px-4 py-2 rounded bg-primary text-primary-foreground font-semibold text-sm"
        >
          Download Test Plan (DOCX)
        </a>
        <span className="text-sm text-muted-foreground">19 suites + Final E2E test</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        {SUITE_LIST.map((s) => (
          <div key={s.id} className="border rounded p-3">
            <div className="font-semibold">
              {s.id}. {s.name}
            </div>
            <div className="text-muted-foreground mt-1">{s.count} tests</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BugTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <a
          href="/confetti-bug-report-template.docx"
          download
          className="px-4 py-2 rounded bg-primary text-primary-foreground font-semibold text-sm"
        >
          Download Bug Report Template (DOCX)
        </a>
      </div>
      <div className="border rounded p-4 text-sm space-y-2">
        <p className="font-semibold">Fields included:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-muted-foreground">
          {BUG_FIELDS.map((f) => (
            <div key={f}>• {f}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AutomationTab() {
  const [running, setRunning] = useState<null | string>(null);
  const [results, setResults] = useState<Record<string, { pass: number; fail: number; skip: number; total: number }>>({});

  const run = async (tier: string) => {
    setRunning(tier);
    try {
      const res = await fetch(`/api/qa/run?tier=${tier}`);
      const data = await res.json();
      setResults((prev) => ({ ...prev, [tier]: data.summary }));
    } finally {
      setRunning(null);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Prioritized tiers: smoke (fast determinism), booking (partner flow), personalization (learned profile).
        Run from this page or via <code>/api/qa/run?tier=smoke</code>.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {TIERS.map((t) => {
          const r = results[t.id];
          return (
            <div key={t.id} className="border rounded p-4">
              <div className="font-semibold mb-1">{t.label}</div>
              <div className="text-xs text-muted-foreground mb-3">{t.suites.join(" · ")}</div>
              <button
                onClick={() => run(t.id)}
                disabled={running === t.id}
                className="px-3 py-1.5 rounded bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
              >
                {running === t.id ? "Running…" : "Run tier"}
              </button>
              {r && (
                <div className="mt-2 text-xs space-y-0.5">
                  <div className="text-green-700 font-medium">{r.pass} pass</div>
                  <div className="text-red-700 font-medium">{r.fail} fail</div>
                  <div className="text-yellow-700 font-medium">{r.skip} skip</div>
                  <div className="text-muted-foreground">{r.total} total</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex gap-3">
        <Link to="/qa" className="text-sm text-primary underline">
          Go to full QA harness →
        </Link>
      </div>
    </div>
  );
}

const SUITE_LIST = [
  { id: "1", name: "Onboarding Flow", count: 2 },
  { id: "2", name: "Vibe Engine", count: 15 },
  { id: "3", name: "Category Engine", count: 16 },
  { id: "4", name: "City Engine", count: 11 },
  { id: "5", name: "Itinerary Generation", count: 9 },
  { id: "6", name: "Name Generator", count: 5 },
  { id: "7", name: "Booking & Partner Tiers", count: 4 },
  { id: "8", name: "Order-Ahead Flow", count: 8 },
  { id: "9", name: "Group Flow", count: 7 },
  { id: "10", name: "Weather Engine", count: 6 },
  { id: "11", name: "Safety Engine", count: 7 },
  { id: "12", name: "Time-of-Day Engine", count: 8 },
  { id: "13", name: "Swap Engine", count: 11 },
  { id: "14", name: "Save & Share", count: 7 },
  { id: "15", name: "Recap & Feedback", count: 7 },
  { id: "16", name: "Personalization Engine", count: 6 },
  { id: "17", name: "Multi-Day Trip Engine", count: 8 },
  { id: "18", name: "Promo Engine", count: 7 },
  { id: "19", name: "Multi-Agent Orchestration", count: 7 },
  { id: "20", name: "Final End-to-End Test", count: 1 },
];

const BUG_FIELDS = [
  "Bug ID",
  "Reported By",
  "Date",
  "Environment",
  "Device / OS / Browser",
  "App Version / Commit",
  "Severity",
  "Area",
  "Test ID",
  "Summary",
  "Description",
  "Steps to Reproduce",
  "Expected Result",
  "Actual Result",
  "Screenshots / Video / Logs",
  "Repro Rate",
  "Workaround",
  "Related Issues / PRs",
  "Assignee",
  "Status",
  "Notes",
];

const TIERS = [
  {
    id: "smoke",
    label: "Smoke Tests",
    suites: ["Onboarding", "Vibes", "Categories", "Cities", "Itinerary", "Weather", "Safety", "Time", "Orchestration", "E2E"],
  },
  {
    id: "booking",
    label: "Booking & Commerce",
    suites: ["Booking Tiers", "Order-Ahead", "Swaps", "Save & Share", "Promo"],
  },
  {
    id: "personalization",
    label: "Personalization & Social",
    suites: ["Naming", "Recap", "Personalization", "Multi-Day", "Group"],
  },
];
