import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Briefcase, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  createCorporateEvent,
  parseAttendeeList,
  PURPOSE_LABELS,
  dayCount,
  type CorporatePurpose,
} from "@/lib/corporate";

export const Route = createFileRoute("/teams/new")({
  head: () => ({
    meta: [
      { title: "Plan a team event — Loop" },
      { name: "description", content: "Build a multi-day team event in minutes — venues, RSVPs, and budgets handled." },
    ],
  }),
  component: NewTeamEventPage,
});

function NewTeamEventPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);

  const [orgName, setOrgName] = useState("");
  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState<CorporatePurpose>("team-outing");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [headcount, setHeadcount] = useState(8);
  const [budget, setBudget] = useState(150);
  const [notes, setNotes] = useState("");
  const [attendeesRaw, setAttendeesRaw] = useState("");

  const parsed = parseAttendeeList(attendeesRaw);
  const days = startDate ? dayCount(startDate, endDate || startDate) : 1;

  const submit = async () => {
    if (!user) {
      toast.error("Sign in first to save your event");
      nav({ to: "/auth" });
      return;
    }
    if (!orgName.trim() || !title.trim() || !startDate) {
      toast.error("Add an organization, a title, and a start date");
      return;
    }
    setBusy(true);
    try {
      const ev = await createCorporateEvent({
        org_name: orgName.trim(),
        title: title.trim(),
        purpose,
        starts_at: new Date(startDate + "T18:00:00").toISOString(),
        ends_at: endDate ? new Date(endDate + "T23:00:00").toISOString() : null,
        headcount,
        budget_per_person_cents: Math.round(budget * 100),
        notes: notes.trim() || undefined,
        attendees: parsed,
      });
      toast.success("Event created");
      nav({ to: "/teams/$id", params: { id: ev.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create event");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <SiteHeader />
      <main className="bg-cream">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <Link to="/teams" className="font-mono text-[11px] uppercase tracking-widest text-ink/60 hover:text-ink">
            ← For Teams
          </Link>
          <h1 className="mt-3 flex items-center gap-3 font-display text-4xl font-extrabold sm:text-5xl">
            <Briefcase className="h-8 w-8" /> Plan a team event
          </h1>
          <p className="mt-2 text-ink/70">Tell us the basics — we'll generate the night and let you tune from there.</p>

          {!user && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border-2 border-ink bg-gold/40 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5" />
              <div className="text-sm">
                You'll need a free account to save your event and send invites.
                <Link to="/auth" className="ml-2 font-bold underline">Sign in →</Link>
              </div>
            </div>
          )}

          <div className="mt-8 space-y-6 rounded-3xl border-2 border-ink bg-cream p-6 shadow-brut">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Organization">
                <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Acme Inc." maxLength={100} />
              </Field>
              <Field label="Event title">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Q3 client dinner" maxLength={120} />
              </Field>
            </div>

            <Field label="What is it?">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {(Object.keys(PURPOSE_LABELS) as CorporatePurpose[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPurpose(p)}
                    className={`rounded-xl border-2 px-3 py-3 text-left text-sm font-bold transition-pop ${purpose === p ? "border-ink bg-ink text-cream shadow-brut" : "border-ink/30 bg-cream hover:border-ink"}`}
                  >
                    {PURPOSE_LABELS[p]}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Start date">
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </Field>
              <Field label="End date (leave blank for single day)">
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} />
              </Field>
            </div>
            {startDate && (
              <div className="rounded-xl bg-ink/5 px-4 py-3 font-mono text-xs uppercase tracking-widest text-ink/70">
                {days} {days === 1 ? "day" : "days"} of programming
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={`Headcount: ${headcount}`}>
                <input type="range" min={2} max={100} value={headcount} onChange={(e) => setHeadcount(parseInt(e.target.value))} className="w-full accent-ink" />
              </Field>
              <Field label={`Budget per person: $${budget}`}>
                <input type="range" min={25} max={500} step={5} value={budget} onChange={(e) => setBudget(parseInt(e.target.value))} className="w-full accent-ink" />
              </Field>
            </div>

            <Field label="Attendees (optional — paste emails, one per line)">
              <Textarea
                value={attendeesRaw}
                onChange={(e) => setAttendeesRaw(e.target.value)}
                rows={5}
                placeholder={"alex@acme.com\nJane Doe <jane@acme.com>\nsam@acme.com"}
                className="font-mono text-xs"
              />
              <div className="mt-1 font-mono text-[11px] uppercase tracking-widest text-ink/60">
                {parsed.length} valid {parsed.length === 1 ? "address" : "addresses"} detected
              </div>
            </Field>

            <Field label="Anything we should know? (optional)">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={1000} placeholder="2 vegetarians, one wheelchair accessible venue, no late nights." />
            </Field>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t-2 border-dashed border-ink/30 pt-5">
              <div className="mr-auto font-mono text-xs uppercase tracking-widest text-ink/60">
                Estimated total: <span className="font-bold text-ink">${(headcount * budget).toLocaleString()}</span>
              </div>
              <Button onClick={submit} disabled={busy} size="lg" className="gap-2">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                Create event
              </Button>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block font-mono text-[11px] uppercase tracking-widest text-ink/70">{label}</Label>
      {children}
    </div>
  );
}
