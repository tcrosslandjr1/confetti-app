import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-context";
import { getMyAdvertiser, type Advertiser } from "@/lib/ads";
import { resubmitAdvertiserFn } from "@/lib/business-onboarding.functions";
import { Loader2, Clock, CheckCircle2, XCircle, ArrowRight, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

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
            ? "Unfortunately we couldn't approve your application at this time. Update your details below and resubmit for another review."
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
            <strong className="font-bold">Reviewer note:</strong> {adv.review_note}
          </p>
        )}

        {rejected ? (
          <ResubmitForm
            adv={adv}
            onSuccess={(updated) => {
              setAdv(updated);
              toast.success("Application resubmitted — we'll review it shortly.");
            }}
          />
        ) : (
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" /> Review in progress
            </span>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-bold hover:bg-muted"
            >
              Back to Confetti
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

function ResubmitForm({ adv, onSuccess }: { adv: Advertiser; onSuccess: (a: Advertiser) => void }) {
  const resubmit = useServerFn(resubmitAdvertiserFn);
  const [form, setForm] = useState({
    business_name: adv.business_name ?? "",
    website: adv.website ?? "",
    contact_email: adv.contact_email ?? "",
    contact_phone: adv.contact_phone ?? "",
    category: adv.category ?? "",
    city: adv.city ?? "",
    owner_name: adv.owner_name ?? "",
    package_selected: adv.package_selected ?? "",
    notes: adv.notes ?? "",
  });
  const [submitting, setSubmitting] = useState(false);

  const update =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await resubmit({ data: form });
      onSuccess(res.advertiser as Advertiser);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resubmit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <h2 className="font-display text-lg font-bold">Update & resubmit</h2>

      <Field label="Business name" required>
        <Input value={form.business_name} onChange={update("business_name")} required />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Contact email" required>
          <Input
            type="email"
            value={form.contact_email}
            onChange={update("contact_email")}
            required
          />
        </Field>
        <Field label="Contact phone">
          <Input value={form.contact_phone} onChange={update("contact_phone")} />
        </Field>
      </div>

      <Field label="Website">
        <Input
          type="url"
          placeholder="https://"
          value={form.website}
          onChange={update("website")}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City">
          <Input value={form.city} onChange={update("city")} />
        </Field>
        <Field label="Category">
          <Input value={form.category} onChange={update("category")} />
        </Field>
      </div>

      <Field label="Owner name">
        <Input value={form.owner_name} onChange={update("owner_name")} />
      </Field>

      <Field label="Notes for reviewer">
        <Textarea
          rows={4}
          placeholder="Address any feedback above and add anything that helps us approve faster."
          value={form.notes}
          onChange={update("notes")}
        />
      </Field>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Resubmit for review
        </button>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-bold hover:bg-muted"
        >
          Back to Confetti
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
    </div>
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
