import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Briefcase, Users2, Wallet, Share2, Loader2, Mail, Trash2, Copy, CheckCircle2, XCircle, HelpCircle, Clock } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { PURPOSE_LABELS, dayCount, type CorporateEvent, type CorporateAttendee, type RsvpStatus } from "@/lib/corporate";
import { TonightAtAGlance, ConciergeQuickAsk, NextBookingCountdown, SpendBudgetTracker } from "@/components/widgets/AppWidgets";

export const Route = createFileRoute("/teams/$id")({
  component: TeamEventPage,
});

type Tab = "overview" | "attendees" | "budget" | "share";

function TeamEventPage() {
  const { id } = useParams({ from: "/teams/$id" });
  const { user } = useAuth();
  const [event, setEvent] = useState<CorporateEvent | null>(null);
  const [attendees, setAttendees] = useState<CorporateAttendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [evRes, atRes] = await Promise.all([
        supabase.from("corporate_events").select("*").eq("id", id).maybeSingle(),
        supabase.from("corporate_attendees").select("*").eq("event_id", id).order("created_at"),
      ]);
      if (cancelled) return;
      setEvent((evRes.data as CorporateEvent) ?? null);
      setAttendees((atRes.data as CorporateAttendee[]) ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  const days = useMemo(() => (event ? dayCount(event.starts_at, event.ends_at) : 1), [event]);
  const responded = attendees.filter((a) => a.rsvp_status !== "invited");
  const yesCount = attendees.filter((a) => a.rsvp_status === "yes").length;
  const dietary = attendees.filter((a) => a.dietary?.trim()).map((a) => `${a.name || a.email}: ${a.dietary}`);

  const refresh = async () => {
    const { data } = await supabase.from("corporate_attendees").select("*").eq("event_id", id).order("created_at");
    setAttendees((data as CorporateAttendee[]) ?? []);
  };

  const addAttendee = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!/^[^\s<>]+@[^\s<>]+\.[^\s<>]+$/.test(email)) { toast.error("Enter a valid email"); return; }
    const { error } = await supabase.from("corporate_attendees").insert({ event_id: id, email, role: "attendee" });
    if (error) { toast.error(error.message); return; }
    setNewEmail("");
    refresh();
  };

  const removeAttendee = async (aid: string) => {
    const { error } = await supabase.from("corporate_attendees").delete().eq("id", aid);
    if (error) { toast.error(error.message); return; }
    refresh();
  };

  if (loading) return (<><SiteHeader /><main className="grid min-h-[60vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></main><SiteFooter /></>);
  if (!event) return (<><SiteHeader /><main className="mx-auto max-w-3xl px-4 py-16 text-center"><h1 className="font-display text-3xl font-bold">Event not found</h1><Link to="/teams" className="mt-4 inline-block underline">Back to For Teams</Link></main><SiteFooter /></>);
  if (user && event.owner_id !== user.id) {
    return (<><SiteHeader /><main className="mx-auto max-w-3xl px-4 py-16 text-center"><h1 className="font-display text-3xl font-bold">You don't have access to this event</h1></main><SiteFooter /></>);
  }

  return (
    <>
      <SiteHeader />
      <main className="bg-cream">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <Link to="/teams" className="font-mono text-[11px] uppercase tracking-widest text-ink/60 hover:text-ink">← For Teams</Link>
          <header className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-gold px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest">
                <Briefcase className="h-3 w-3" /> {PURPOSE_LABELS[event.purpose]}
              </span>
              <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">{event.title}</h1>
              <p className="mt-1 font-mono text-xs uppercase tracking-widest text-ink/60">
                {event.org_name} · {new Date(event.starts_at).toLocaleDateString()} · {days} {days === 1 ? "day" : "days"} · {event.headcount} guests
              </p>
            </div>
            <div className="rounded-2xl border-2 border-ink bg-cream px-4 py-2 font-mono text-[11px] uppercase tracking-widest shadow-brut">
              Status: <span className="font-bold text-coral">{event.status}</span>
            </div>
          </header>

          <section aria-label="Quick widgets" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <TonightAtAGlance />
            <NextBookingCountdown />
            <ConciergeQuickAsk />
            <SpendBudgetTracker />
          </section>

          <nav className="mt-8 flex gap-1 border-b-2 border-ink">
            {(["overview","attendees","budget","share"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`-mb-[2px] border-b-2 px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest ${tab === t ? "border-ink text-ink" : "border-transparent text-ink/50 hover:text-ink"}`}
              >{t}</button>
            ))}
          </nav>

          <div className="mt-8">
            {tab === "overview" && (
              <div className="grid gap-4 lg:grid-cols-3">
                <Stat icon={Users2} label="Headcount" value={event.headcount.toString()} />
                <Stat icon={CheckCircle2} label="RSVPs in" value={`${responded.length}/${attendees.length || event.headcount}`} hint={`${yesCount} yes`} />
                <Stat icon={Wallet} label="Per person" value={`$${(event.budget_per_person_cents / 100).toFixed(0)}`} hint={`Cap: $${((event.budget_per_person_cents * event.headcount) / 100).toLocaleString()}`} />
                <div className="rounded-2xl border-2 border-ink bg-cream p-5 shadow-brut lg:col-span-3">
                  <h2 className="font-display text-xl font-bold">Itinerary</h2>
                  <p className="mt-2 text-sm text-ink/70">
                    {event.itinerary_id
                      ? "Your multi-day plan is ready below."
                      : "We'll generate a curated multi-day plan once you confirm details. Use the Concierge to draft it now, or kick off invites first."}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Link to="/concierge/chat" className="inline-flex h-10 items-center rounded-full border-2 border-ink bg-ink px-4 font-mono text-xs font-bold uppercase tracking-widest text-cream shadow-brut">
                      Draft with Concierge
                    </Link>
                    <Button variant="outline" onClick={() => setTab("attendees")}>Manage attendees</Button>
                  </div>
                </div>
                {dietary.length > 0 && (
                  <div className="rounded-2xl border-2 border-ink bg-gold/30 p-5 shadow-brut lg:col-span-3">
                    <h2 className="font-display text-lg font-bold">Dietary roll-up for the venue</h2>
                    <ul className="mt-2 space-y-1 text-sm">
                      {dietary.map((d, i) => <li key={i}>· {d}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {tab === "attendees" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-end gap-2 rounded-2xl border-2 border-ink bg-cream p-4 shadow-brut">
                  <div className="min-w-[240px] flex-1">
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-ink/60">Add attendee</label>
                    <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@company.com" />
                  </div>
                  <Button onClick={addAttendee}><Mail className="mr-2 h-4 w-4" /> Add</Button>
                </div>
                <div className="overflow-hidden rounded-2xl border-2 border-ink bg-cream shadow-brut">
                  <table className="w-full text-sm">
                    <thead className="border-b-2 border-ink bg-ink/5 font-mono text-[10px] uppercase tracking-widest text-ink/60">
                      <tr><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">RSVP link</th><th className="px-4 py-3"></th></tr>
                    </thead>
                    <tbody>
                      {attendees.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-ink/60">No attendees yet — add some above.</td></tr>}
                      {attendees.map((a) => (
                        <tr key={a.id} className="border-b border-ink/10 last:border-0">
                          <td className="px-4 py-3"><div className="font-bold">{a.name || a.email}</div><div className="text-xs text-ink/60">{a.email}</div></td>
                          <td className="px-4 py-3"><RsvpBadge status={a.rsvp_status} /></td>
                          <td className="px-4 py-3"><RsvpLink token={a.rsvp_token} /></td>
                          <td className="px-4 py-3 text-right"><button onClick={() => removeAttendee(a.id)} className="text-ink/40 hover:text-coral"><Trash2 className="h-4 w-4" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === "budget" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Stat icon={Wallet} label="Per person cap" value={`$${(event.budget_per_person_cents / 100).toFixed(0)}`} />
                <Stat icon={Wallet} label="Estimated total" value={`$${((event.budget_per_person_cents * event.headcount) / 100).toLocaleString()}`} hint={`${event.headcount} × cap`} />
                <div className="rounded-2xl border-2 border-ink bg-cream p-5 shadow-brut sm:col-span-2">
                  <p className="text-sm text-ink/70">Once stops are booked we'll show actual spend vs. cap here.</p>
                </div>
              </div>
            )}

            {tab === "share" && (
              <div className="rounded-2xl border-2 border-ink bg-cream p-6 shadow-brut">
                <Share2 className="h-6 w-6" />
                <h2 className="mt-3 font-display text-2xl font-bold">Share with attendees</h2>
                <p className="mt-1 text-sm text-ink/70">Each attendee has a unique RSVP link in the Attendees tab. They don't need an account to respond.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Stat({ icon: Icon, label, value, hint }: { icon: typeof Users2; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border-2 border-ink bg-cream p-5 shadow-brut">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ink/60"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <div className="mt-2 font-display text-3xl font-extrabold">{value}</div>
      {hint && <div className="mt-1 text-xs text-ink/60">{hint}</div>}
    </div>
  );
}

function RsvpBadge({ status }: { status: RsvpStatus }) {
  const map = {
    invited: { label: "Invited", icon: Clock, cls: "bg-ink/10 text-ink/60" },
    yes: { label: "Yes", icon: CheckCircle2, cls: "bg-emerald-500/15 text-emerald-700" },
    no: { label: "No", icon: XCircle, cls: "bg-coral/15 text-coral" },
    maybe: { label: "Maybe", icon: HelpCircle, cls: "bg-gold/30 text-ink" },
  } as const;
  const m = map[status];
  const Icon = m.icon;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest ${m.cls}`}><Icon className="h-3 w-3" /> {m.label}</span>;
}

function RsvpLink({ token }: { token: string }) {
  const url = typeof window !== "undefined" ? `${window.location.origin}/rsvp/${token}` : `/rsvp/${token}`;
  const copy = () => { navigator.clipboard?.writeText(url); toast.success("RSVP link copied"); };
  return (
    <button onClick={copy} className="inline-flex items-center gap-1 font-mono text-[11px] text-ink/70 hover:text-ink">
      <Copy className="h-3 w-3" /> copy link
    </button>
  );
}
