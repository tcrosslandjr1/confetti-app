import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, HelpCircle, Loader2, Briefcase } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { PURPOSE_LABELS, type CorporatePurpose, type RsvpStatus } from "@/lib/corporate";

export const Route = createFileRoute("/rsvp/$token")({
  head: () => ({ meta: [{ title: "RSVP — Loop" }] }),
  component: RsvpPage,
});

type AttendeeRow = {
  attendee_id: string;
  attendee_email: string;
  attendee_name: string | null;
  rsvp_status: RsvpStatus;
  dietary: string | null;
  event_id: string;
  event_title: string;
  org_name: string;
  starts_at: string;
  ends_at: string | null;
  purpose: CorporatePurpose;
};

function RsvpPage() {
  const { token } = useParams({ from: "/rsvp/$token" });
  const [row, setRow] = useState<AttendeeRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [dietary, setDietary] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<RsvpStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("get_attendee_by_token", { _token: token });
      if (cancelled) return;
      const r = (data as AttendeeRow[] | null)?.[0] ?? null;
      if (error || !r) {
        setRow(null);
        setLoading(false);
        return;
      }
      setRow(r);
      setDietary(r.dietary ?? "");
      if (r.rsvp_status !== "invited") setDone(r.rsvp_status);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const respond = async (status: "yes" | "no" | "maybe") => {
    setBusy(true);
    const { data, error } = await supabase.rpc("record_rsvp_by_token", {
      _token: token,
      _status: status,
      _dietary: dietary.trim() || "",
    });
    setBusy(false);
    if (error || !data) {
      toast.error("Couldn't save your RSVP");
      return;
    }
    setDone(status);
    toast.success("Thanks — your RSVP is in");
  };

  if (loading)
    return (
      <>
        <SiteHeader />
        <main className="grid min-h-[60vh] place-items-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </main>
        <SiteFooter />
      </>
    );
  if (!row)
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="font-display text-3xl font-bold">Invite not found</h1>
          <p className="mt-2 text-ink/70">This link may have expired or been revoked.</p>
        </main>
        <SiteFooter />
      </>
    );

  return (
    <>
      <SiteHeader />
      <main className="bg-cream">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
          <div className="rounded-3xl border-2 border-ink bg-cream p-8 shadow-brut">
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-gold px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest">
              <Briefcase className="h-3 w-3" /> {PURPOSE_LABELS[row.purpose]}
            </span>
            <h1 className="mt-4 font-display text-4xl font-extrabold">You're invited</h1>
            <p className="mt-1 font-mono text-xs uppercase tracking-widest text-ink/60">
              {row.org_name} ·{" "}
              {new Date(row.starts_at).toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            <h2 className="mt-3 font-display text-2xl font-bold text-coral">{row.event_title}</h2>
            <p className="mt-2 text-sm text-ink/70">
              For {row.attendee_name || row.attendee_email}
            </p>

            {done ? (
              <div className="mt-8 rounded-2xl border-2 border-ink bg-ink/5 p-5 text-center">
                <div className="font-display text-2xl font-bold">
                  Got it — you said <span className="text-coral">{done.toUpperCase()}</span>
                </div>
                <p className="mt-1 text-sm text-ink/70">
                  You can update your response anytime by reopening this link.
                </p>
                <button
                  onClick={() => setDone(null)}
                  className="mt-3 font-mono text-[11px] uppercase tracking-widest text-ink/60 underline"
                >
                  Change response
                </button>
              </div>
            ) : (
              <>
                <div className="mt-8">
                  <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-widest text-ink/70">
                    Dietary needs (optional)
                  </label>
                  <Textarea
                    value={dietary}
                    onChange={(e) => setDietary(e.target.value)}
                    rows={2}
                    maxLength={300}
                    placeholder="Vegetarian, gluten-free, allergies…"
                  />
                </div>
                <div className="mt-6 grid gap-2 sm:grid-cols-3">
                  <Button
                    onClick={() => respond("yes")}
                    disabled={busy}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="h-4 w-4" /> I'm in
                  </Button>
                  <Button
                    onClick={() => respond("maybe")}
                    disabled={busy}
                    variant="outline"
                    className="gap-2"
                  >
                    <HelpCircle className="h-4 w-4" /> Maybe
                  </Button>
                  <Button
                    onClick={() => respond("no")}
                    disabled={busy}
                    variant="outline"
                    className="gap-2 border-coral text-coral hover:bg-coral/10"
                  >
                    <XCircle className="h-4 w-4" /> Can't make it
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
