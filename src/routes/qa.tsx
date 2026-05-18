import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SUITES, type TestResult } from "@/lib/qa/test-definitions";

export const Route = createFileRoute("/qa")({
  component: QAPage,
  head: () => ({
    meta: [{ title: "Confetti QA Harness" }, { name: "robots", content: "noindex" }],
  }),
});

type RunRow = { suiteId: string; suiteName: string; result: TestResult };

function runAll(): RunRow[] {
  const rows: RunRow[] = [];
  for (const s of SUITES) {
    try {
      for (const r of s.run()) rows.push({ suiteId: s.id, suiteName: s.name, result: r });
    } catch (e) {
      rows.push({
        suiteId: s.id,
        suiteName: s.name,
        result: {
          id: `${s.id}.ERR`,
          name: "Suite threw",
          status: "fail",
          notes: e instanceof Error ? e.message : String(e),
        },
      });
    }
  }
  return rows;
}

function QAPage() {
  const [rows, setRows] = useState<RunRow[] | null>(null);
  const [filter, setFilter] = useState<"all" | "pass" | "fail" | "skip">("all");

  const summary = useMemo(() => {
    if (!rows) return { pass: 0, fail: 0, skip: 0, total: 0 };
    return rows.reduce(
      (acc, r) => {
        acc.total++;
        acc[r.result.status]++;
        return acc;
      },
      { pass: 0, fail: 0, skip: 0, total: 0 },
    );
  }, [rows]);

  const grouped = useMemo(() => {
    if (!rows) return [];
    const map = new Map<string, { id: string; name: string; results: TestResult[] }>();
    for (const r of rows) {
      if (filter !== "all" && r.result.status !== filter) continue;
      const k = `${r.suiteId}:${r.suiteName}`;
      if (!map.has(k)) map.set(k, { id: r.suiteId, name: r.suiteName, results: [] });
      map.get(k)!.results.push(r.result);
    }
    return [...map.values()];
  }, [rows, filter]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Confetti QA Harness</h1>
      <p className="text-muted-foreground mb-6">
        Deterministic checks for vibes, cities, weather, safety, time-of-day, trip engine, promos,
        personalization, and multi-agent orchestration. AI/booking/group/share/recap flows are
        marked SKIP and exercised via their own UIs.
      </p>

      <div className="flex flex-wrap gap-3 items-center mb-6">
        <button
          className="px-4 py-2 rounded bg-primary text-primary-foreground font-semibold"
          onClick={() => setRows(runAll())}
        >
          Run all suites
        </button>
        {rows && (
          <>
            <span className="text-sm">
              <strong>{summary.pass}</strong> pass · <strong>{summary.fail}</strong> fail ·{" "}
              <strong>{summary.skip}</strong> skip · {summary.total} total
            </span>
            {(["all", "pass", "fail", "skip"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs rounded border ${
                  filter === f ? "bg-foreground text-background" : ""
                }`}
              >
                {f}
              </button>
            ))}
          </>
        )}
      </div>

      {!rows && <p className="text-sm text-muted-foreground">Click “Run all suites” to begin.</p>}

      {grouped.map((g) => (
        <section key={g.id} className="mb-6 border rounded-lg overflow-hidden">
          <header className="px-4 py-2 bg-muted font-semibold flex justify-between">
            <span>
              {g.id} — {g.name}
            </span>
            <span className="text-xs">
              {g.results.filter((r) => r.status === "pass").length}/{g.results.length} pass
            </span>
          </header>
          <ul className="divide-y">
            {g.results.map((r) => (
              <li key={r.id} className="px-4 py-2 flex gap-3 items-start text-sm">
                <span
                  className={`shrink-0 inline-block w-14 text-center rounded text-xs font-bold py-0.5 ${
                    r.status === "pass"
                      ? "bg-green-100 text-green-800"
                      : r.status === "fail"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {r.status.toUpperCase()}
                </span>
                <div className="flex-1">
                  <div className="font-medium">
                    <code className="text-xs text-muted-foreground mr-2">{r.id}</code>
                    {r.name}
                  </div>
                  {r.notes && <div className="text-xs text-muted-foreground mt-0.5">{r.notes}</div>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
