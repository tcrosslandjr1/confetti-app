import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getMyAdvertiser, type Advertiser } from "@/lib/ads";
import { Loader2, Clock, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/business/pending")({
  component: BusinessPendingPage,
  head: () => ({
    meta: [
      { title: "We're reviewing your business — Confetti" },
      { name: "description", content: "Your Confetti business application is under review." },
    ],
  }),
});

function BusinessPendingPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [adv, setAdv] = useState<Advertiser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      nav({ to: "/auth" });
      return;
    }
    let cancelled = false;
    getMyAdvertiser(user.id).then((a) => {
      if (cancelled) return;
      setAdv(a);
      setLoading(false);
      if (a?.status === "active" || a?.status === "approved") {
        nav({ to: "/advertise/portal" });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user, nav]);

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!adv) {
    return (
      <main className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">No application found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Start your business signup to get on Confetti.
        </p>
        <Link
          to="/advertise"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
        >
          Begin signup <ArrowRight className="h-4 w-4" />
        </Link>
      </main>
    );
  }

  const rejected = adv.status === "rejected";

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <div className="rounded-3xl border border-border bg-card p-8 shadow-card">
        <div className="flex items-center gap-3">
          {rejected ? (
            <XCircle className="h-8 w-8 text-destructive" />
          ) : (
            <Clock className="h-8 w-8 text-primary" />
          )}
          <h1 className="font-display text-2xl font-bold">
            {rejected ? "Application not approved" : "We're reviewing your business"}
          </h1>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          {rejected
            ? "Unfortunately we couldn't approve your application at this time."
            : "Thanks for joining Confetti — our team reviews new businesses within 1 business day. You'll get an email and an in-app notification as soon as you're activated."}
        </p>

        <dl className="mt-6 space-y-2 rounded-2xl bg-muted/40 p-4 text-sm">
          <Row label="Business" value={adv.business_name} />
          {adv.package_selected && <Row label="Package" value={adv.package_selected} />}
          {adv.category && <Row label="Category" value={adv.category} />}
          {adv.city && <Row label="City" value={adv.city} />}
          <Row label="Submitted" value={new Date(adv.submitted_at).toLocaleString()} />
          <Row label="Status" value={adv.status} />
        </dl>

        {rejected && adv.review_note && (
          <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <strong className="font-bold">Reason:</strong> {adv.review_note}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {rejected ? (
            <Link
              to="/advertise"
              hash="signup"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
            >
              Edit and resubmit <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" /> Review in progress
            </span>
          )}
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-bold hover:bg-muted"
          >
            Back to Confetti
          </Link>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}
