import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Copy, Download, FileDown, Printer, Share2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  EVENT_TEMPLATES,
  LIABILITY_FORM,
  DAY_OF_ROLE_CHECKLIST,
  SIGNUP_CSV_HEADER,
  SIGNUP_CSV_SAMPLES,
  buildChatAnnouncement,
  buildFlyerCopy,
  buildFullPlanText,
  buildSignupCsv,
  type EventTemplate,
  type EventTemplateId,
} from "@/lib/event-pack-data";

export const Route = createFileRoute("/event-pack")({
  head: () => ({
    meta: [
      { title: "Printable Event Pack — Confetti" },
      {
        name: "description",
        content:
          "Ready-to-run group event plans with itinerary, budget, safety, signup sheet, liability form, and printable layout.",
      },
      { property: "og:title", content: "Printable Event Pack — Confetti" },
      {
        property: "og:description",
        content:
          "Five polished, printable group event packs for fraternities, sororities, AKA, line sisters, church friends, and corporate teams.",
      },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    template: typeof s.template === "string" ? (s.template as EventTemplateId) : undefined,
  }),
  component: EventPackPage,
});

function EventPackPage() {
  const search = Route.useSearch();
  const initialId: EventTemplateId =
    (search.template && EVENT_TEMPLATES.find((t) => t.id === search.template)?.id) ||
    EVENT_TEMPLATES[0].id;
  const [activeId, setActiveId] = useState<EventTemplateId>(initialId);
  const active = useMemo(
    () => EVENT_TEMPLATES.find((t) => t.id === activeId) ?? EVENT_TEMPLATES[0],
    [activeId],
  );

  const [liabilityValues, setLiabilityValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(LIABILITY_FORM.fields.map((f) => [f, ""])),
  );

  // ---- Export actions -----------------------------------------------------
  function copyText(text: string, label = "Copied") {
    navigator.clipboard.writeText(text).then(
      () => toast.success(label),
      () => toast.error("Copy failed"),
    );
  }

  function downloadBlob(name: string, body: BlobPart, mime: string) {
    const blob = new Blob([body], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function handleCopyPlan() {
    copyText(buildFullPlanText(active), "Full plan copied");
  }
  function handleExportCsv() {
    downloadBlob(`${active.id}-signup.csv`, buildSignupCsv(), "text/csv");
    toast.success("Signup CSV downloaded");
  }
  function handleShareLink() {
    const url = `${window.location.origin}/event-pack?template=${active.id}`;
    copyText(url, "Share link copied");
  }
  function handlePrintOrPdf() {
    window.print();
  }

  return (
    <main className="min-h-screen bg-cream text-ink">
      {/* ============================== HEADER ============================== */}
      <header className="no-print sticky top-0 z-30 border-b-2 border-ink bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink/60">
            <Sparkles className="h-3.5 w-3.5" /> Printable Event Pack
          </div>
        </div>
      </header>

      {/* ============================== HERO + PICKER ============================== */}
      <section className="border-b-2 border-ink">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <span className="font-mono text-xs uppercase tracking-[0.25em] text-ink/60">
            / Event Pack
          </span>
          <h1 className="mt-3 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">
            Pick a plan.
            <br />
            <span className="font-serif italic font-normal">Print, share, run it.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base text-ink/80 sm:text-lg">
            Five polished, ready-to-run group event packs. Itinerary, budget, safety, signup sheet,
            liability form, and chat copy — all in one printable view.
          </p>

          {/* Template chips */}
          <div className="no-print mt-8 flex flex-wrap gap-2">
            {EVENT_TEMPLATES.map((t) => {
              const isActive = t.id === activeId;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveId(t.id)}
                  className={[
                    "rounded-full border-2 border-ink px-4 py-2 text-sm font-bold transition-pop",
                    isActive
                      ? "bg-ink text-cream shadow-brut"
                      : "bg-cream hover:-translate-y-0.5 hover:bg-gold hover:shadow-brut",
                  ].join(" ")}
                >
                  {t.audience}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================== ACTION BAR ============================== */}
      <section className="no-print border-b-2 border-ink bg-gold">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="font-mono text-xs font-bold uppercase tracking-widest">
            {active.title}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleCopyPlan}
              variant="outline"
              className="border-2 border-ink bg-cream font-bold shadow-brut hover:-translate-y-0.5"
            >
              <Copy className="mr-1.5 h-4 w-4" /> Copy Plan
            </Button>
            <Button
              onClick={handlePrintOrPdf}
              variant="outline"
              className="border-2 border-ink bg-cream font-bold shadow-brut hover:-translate-y-0.5"
            >
              <FileDown className="mr-1.5 h-4 w-4" /> Export PDF
            </Button>
            <Button
              onClick={handleExportCsv}
              variant="outline"
              className="border-2 border-ink bg-cream font-bold shadow-brut hover:-translate-y-0.5"
            >
              <Download className="mr-1.5 h-4 w-4" /> Signup CSV
            </Button>
            <Button
              onClick={handleShareLink}
              variant="outline"
              className="border-2 border-ink bg-cream font-bold shadow-brut hover:-translate-y-0.5"
            >
              <Share2 className="mr-1.5 h-4 w-4" /> Share Link
            </Button>
            <Button
              onClick={handlePrintOrPdf}
              className="border-2 border-ink bg-coral font-bold text-cream shadow-brut hover:-translate-y-0.5"
            >
              <Printer className="mr-1.5 h-4 w-4" /> Print
            </Button>
          </div>
        </div>
      </section>

      {/* ============================== TABS / SECTIONS ============================== */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="no-print mb-6 flex h-auto flex-wrap justify-start gap-1 rounded-2xl border-2 border-ink bg-cream p-1.5 shadow-brut">
            {[
              ["overview", "Overview"],
              ["itinerary", "Itinerary"],
              ["budget", "Budget"],
              ["logistics", "Logistics"],
              ["safety", "Safety"],
              ["roles", "Roles"],
              ["signup", "Signup"],
              ["promo", "Promo"],
              ["packing", "Packing"],
              ["liability", "Liability"],
            ].map(([v, l]) => (
              <TabsTrigger
                key={v}
                value={v}
                className="rounded-xl px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider data-[state=active]:bg-ink data-[state=active]:text-cream"
              >
                {l}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* When printing, show all sections; on screen, tabs drive visibility */}
          <div className="print-all">
            <TabsContent value="overview" className="print-show">
              <SectionCard title="Event Overview" eyebrow={active.audience}>
                <h2 className="font-display text-3xl font-extrabold sm:text-4xl">{active.title}</h2>
                <p className="mt-3 text-base leading-relaxed text-ink/80 sm:text-lg">
                  {active.summary}
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <Stat label="Budget / person" value={active.budget.range} />
                  <Stat label="Roles" value={`${active.roles.length} assigned`} />
                  <Stat label="Day-of stops" value={`${active.dayOf.length}`} />
                </div>
              </SectionCard>
            </TabsContent>

            <TabsContent value="itinerary" className="print-show">
              <SectionCard title="Full Itinerary" eyebrow="Run of show">
                <Timeline items={active.itinerary} />
              </SectionCard>
            </TabsContent>

            <TabsContent value="budget" className="print-show">
              <SectionCard title="Budget per Person" eyebrow={active.budget.range}>
                <ul className="space-y-2 text-base">
                  {active.budget.lines.map((l) => (
                    <Bullet key={l}>{l}</Bullet>
                  ))}
                </ul>
              </SectionCard>
            </TabsContent>

            <TabsContent value="logistics" className="print-show">
              <SectionCard title="Logistics Checklist" eyebrow="Before the day">
                <ChecklistList items={active.logistics} />
              </SectionCard>
            </TabsContent>

            <TabsContent value="safety" className="print-show">
              <SectionCard title="Safety Plan" eyebrow="Required">
                <ChecklistList items={active.safety} />
              </SectionCard>
            </TabsContent>

            <TabsContent value="roles" className="print-show">
              <SectionCard title="Roles & Assignments" eyebrow="Who does what">
                <div className="grid gap-2 sm:grid-cols-2">
                  {active.roles.map((r) => (
                    <div
                      key={r}
                      className="flex items-center justify-between rounded-xl border-2 border-ink bg-cream px-4 py-3 shadow-brut"
                    >
                      <span className="font-bold">{r}</span>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-ink/50">
                        assign
                      </span>
                    </div>
                  ))}
                </div>
                <h3 className="mt-8 font-display text-2xl font-extrabold">Day-of Timeline</h3>
                <div className="mt-3">
                  <Timeline items={active.dayOf} />
                </div>
                <h3 className="mt-8 font-display text-2xl font-extrabold">Day-of Role Checklist</h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {DAY_OF_ROLE_CHECKLIST.map((rc) => (
                    <div
                      key={rc.role}
                      className="rounded-2xl border-2 border-ink bg-cream p-4 shadow-brut"
                    >
                      <div className="font-display text-lg font-extrabold">{rc.role}</div>
                      <ul className="mt-2 space-y-1.5 text-sm">
                        {rc.tasks.map((t) => (
                          <li key={t} className="flex items-start gap-2">
                            <span className="mt-1 inline-block h-3 w-3 shrink-0 rounded-sm border-2 border-ink" />
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </TabsContent>

            <TabsContent value="signup" className="print-show">
              <SectionCard title="Signup Sheet" eyebrow="Reusable fields">
                <div className="overflow-x-auto rounded-xl border-2 border-ink shadow-brut">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-ink text-cream">
                      <tr>
                        {SIGNUP_CSV_HEADER.map((h) => (
                          <th
                            key={h}
                            className="border-r border-cream/30 px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {SIGNUP_CSV_SAMPLES.map((row, i) => (
                        <tr key={i} className={i % 2 ? "bg-cream" : "bg-gold/40"}>
                          {row.map((cell, j) => (
                            <td key={j} className="border-t-2 border-ink px-3 py-2 align-top">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="no-print mt-4">
                  <Button
                    onClick={handleExportCsv}
                    className="border-2 border-ink bg-coral font-bold text-cream shadow-brut hover:-translate-y-0.5"
                  >
                    <Download className="mr-1.5 h-4 w-4" /> Download Signup CSV
                  </Button>
                </div>
              </SectionCard>
            </TabsContent>

            <TabsContent value="promo" className="print-show">
              <SectionCard title="Promo Copy" eyebrow="Ready to paste">
                <CopyBlock
                  label="Promo blurb"
                  text={active.promo}
                  onCopy={() => copyText(active.promo, "Promo copied")}
                />
                <CopyBlock
                  label="Chat announcement"
                  text={buildChatAnnouncement(active)}
                  onCopy={() => copyText(buildChatAnnouncement(active), "Chat copy copied")}
                />
                <CopyBlock
                  label="Flyer copy"
                  text={buildFlyerCopy(active)}
                  onCopy={() => copyText(buildFlyerCopy(active), "Flyer copied")}
                />
              </SectionCard>
            </TabsContent>

            <TabsContent value="packing" className="print-show">
              <SectionCard title="Packing List" eyebrow="Tell guests">
                <ChecklistList items={active.packing} />
              </SectionCard>
            </TabsContent>

            <TabsContent value="liability" className="print-show">
              <SectionCard title={LIABILITY_FORM.title} eyebrow="Editable form">
                <p className="text-base leading-relaxed text-ink/85">{LIABILITY_FORM.body}</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {LIABILITY_FORM.fields.map((f) => (
                    <label key={f} className="block">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
                        {f}
                      </span>
                      {f === "Allergies / Medical Notes" ? (
                        <Textarea
                          value={liabilityValues[f] ?? ""}
                          onChange={(e) =>
                            setLiabilityValues((v) => ({ ...v, [f]: e.target.value }))
                          }
                          className="mt-1 border-2 border-ink bg-cream"
                          rows={3}
                        />
                      ) : (
                        <input
                          type="text"
                          value={liabilityValues[f] ?? ""}
                          onChange={(e) =>
                            setLiabilityValues((v) => ({ ...v, [f]: e.target.value }))
                          }
                          className="mt-1 w-full rounded-lg border-2 border-ink bg-cream px-3 py-2 text-base"
                        />
                      )}
                    </label>
                  ))}
                </div>
                <p className="mt-6 font-mono text-[11px] italic text-ink/60">
                  {LIABILITY_FORM.disclaimer}
                </p>
              </SectionCard>
            </TabsContent>
          </div>
        </Tabs>
      </section>

      {/* Print-only stylesheet: when printing, show every TabsContent and hide controls */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          [data-state="inactive"].print-show { display: block !important; }
          [role="tabpanel"] { display: block !important; }
          .print-all > * { page-break-inside: avoid; margin-bottom: 1.5rem; }
          body { background: white !important; }
        }
      `}</style>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Small presentation helpers
// ---------------------------------------------------------------------------

function SectionCard({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border-2 border-ink bg-cream p-6 shadow-brut sm:p-8">
      {eyebrow && (
        <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-ink/60">
          / {eyebrow}
        </div>
      )}
      <h2 className="font-display text-2xl font-extrabold sm:text-3xl">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border-2 border-ink bg-gold/50 p-4 shadow-brut">
      <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
        {label}
      </div>
      <div className="mt-1 font-display text-xl font-extrabold">{value}</div>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="font-bold text-coral">✦</span>
      <span>{children}</span>
    </li>
  );
}

function ChecklistList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5 text-base">
      {items.map((i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="mt-1 inline-block h-4 w-4 shrink-0 rounded-sm border-2 border-ink bg-cream" />
          <span>{i}</span>
        </li>
      ))}
    </ul>
  );
}

function Timeline({ items }: { items: { time: string; label: string }[] }) {
  return (
    <ol className="relative space-y-3 border-l-2 border-ink/20 pl-5">
      {items.map((i, idx) => (
        <li key={idx} className="relative">
          <span className="absolute -left-[27px] top-1 grid h-5 w-5 place-items-center rounded-full border-2 border-ink bg-coral text-[10px] font-bold text-cream">
            {idx + 1}
          </span>
          <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-ink/60">
            {i.time}
          </div>
          <div className="text-base font-medium">{i.label}</div>
        </li>
      ))}
    </ol>
  );
}

function CopyBlock({ label, text, onCopy }: { label: string; text: string; onCopy: () => void }) {
  return (
    <div className="mb-5 rounded-2xl border-2 border-ink bg-gold/30 p-4 shadow-brut">
      <div className="flex items-center justify-between gap-3">
        <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
          {label}
        </div>
        <Button
          onClick={onCopy}
          size="sm"
          variant="outline"
          className="no-print h-8 border-2 border-ink bg-cream text-xs font-bold"
        >
          <Copy className="mr-1 h-3 w-3" /> Copy
        </Button>
      </div>
      <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink/90">
        {text}
      </pre>
    </div>
  );
}

// Silence unused warnings for re-exported type used only by Route generics
export type _Internal = EventTemplate;
