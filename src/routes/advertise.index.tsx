import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { createAdvertiser, getMyAdvertiser, PACKAGES, type PackageTier } from "@/lib/ads";
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Megaphone,
  Target,
  BarChart3,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/advertise/")({
  component: AdvertiseLanding,
});

function AdvertiseLanding() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [tier, setTier] = useState<PackageTier>("featured");
  const [busy, setBusy] = useState(false);
  const [hasAccount, setHasAccount] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setHasAccount(false);
      return;
    }
    let cancelled = false;
    getMyAdvertiser(user.id).then((a) => {
      if (!cancelled) setHasAccount(!!a);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const [form, setForm] = useState({
    business_name: "",
    contact_email: user?.email ?? "",
    website: "",
    contact_phone: "",
    category: "",
    city: "",
    notes: "",
  });

  useEffect(() => {
    if (user?.email && !form.contact_email) setForm((f) => ({ ...f, contact_email: user.email! }));
  }, [user, form.contact_email]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast("Create a free account to continue", {
        description: "We'll bring you right back to the form.",
      });
      nav({ to: "/auth" });
      return;
    }
    setBusy(true);
    try {
      await createAdvertiser({
        owner_id: user.id,
        business_name: form.business_name,
        contact_email: form.contact_email,
        website: form.website || undefined,
        contact_phone: form.contact_phone || undefined,
        category: form.category || undefined,
        city: form.city || undefined,
        notes: `Tier interest: ${tier}\n${form.notes}`.trim(),
      });
      toast.success("You're in — welcome aboard");
      nav({ to: "/advertise/portal" });
    } catch (err) {
      toast.error((err as Error).message ?? "Could not submit");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-mono font-semibold uppercase tracking-widest text-muted-foreground">
            <Megaphone className="h-3.5 w-3.5 text-primary" /> For businesses
          </span>
          <h1 className="mt-4 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">
            Be the plan, <span className="text-gradient">not an afterthought.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Confetti is where people decide what to do tonight. Get your venue in front of planners the
            moment they're choosing — with promoted rails, itinerary boosts, and home-page spotlight
            slots.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#packages"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-bold text-background hover:opacity-90"
            >
              See packages <ArrowRight className="h-4 w-4" />
            </a>
            {hasAccount && (
              <Link
                to="/advertise/portal"
                className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-bold hover:bg-muted"
              >
                Go to advertiser portal
              </Link>
            )}
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-pop">
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat label="Active planners / wk" value="12k+" />
            <Stat label="Avg. session" value="6m 40s" />
            <Stat label="Booking intent" value="78%" />
          </div>
          <ul className="mt-5 space-y-3 text-sm">
            <Bullet icon={Target} text="Reach users at decision time, not just discovery." />
            <Bullet
              icon={Sparkles}
              text="The AI planner can suggest your venue inside live itineraries."
            />
            <Bullet icon={BarChart3} text="Real impressions and clicks, not vanity metrics." />
          </ul>
        </div>
      </section>

      {/* Packages */}
      <section id="packages" className="mt-20">
        <h2 className="font-display text-3xl font-bold">Pick a package</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Capture intent now — billing handled by our team. No card required.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {(Object.keys(PACKAGES) as PackageTier[]).map((k) => {
            const p = PACKAGES[k];
            const active = tier === k;
            return (
              <button
                key={k}
                onClick={() => setTier(k)}
                className={`group rounded-3xl border-2 p-6 text-left transition ${
                  active
                    ? "border-primary bg-card shadow-pop"
                    : "border-border bg-card hover:border-foreground/40"
                }`}
                aria-pressed={active}
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-2xl font-bold">{p.label}</h3>
                  <span className="font-mono text-sm text-muted-foreground">{p.price}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{p.blurb}</p>
                <ul className="mt-4 space-y-2 text-sm">
                  {p.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
                {active && (
                  <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                    Selected
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Signup */}
      <section
        id="signup"
        className="mt-16 rounded-3xl border border-border bg-card p-6 shadow-card sm:p-10"
      >
        <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <h2 className="font-display text-3xl font-bold">Tell us about your business</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We'll set you up with the <strong>{PACKAGES[tier].label}</strong> package and reach
              out within 1 business day.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li>✓ Verification keeps Confetti recommendations trustworthy.</li>
              <li>✓ You stay in control — pause or edit campaigns anytime.</li>
              <li>✓ No long-term contract.</li>
            </ul>
          </div>
          {hasAccount ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
              <p className="font-display text-xl font-bold">You're already an advertiser ✨</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage campaigns and stats in your portal.
              </p>
              <Link
                to="/advertise/portal"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
              >
                Open portal <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Business name *"
                value={form.business_name}
                onChange={(v) => setForm({ ...form, business_name: v })}
                required
              />
              <Field
                label="Contact email *"
                type="email"
                value={form.contact_email}
                onChange={(v) => setForm({ ...form, contact_email: v })}
                required
              />
              <Field
                label="Website"
                value={form.website}
                onChange={(v) => setForm({ ...form, website: v })}
                placeholder="https://"
              />
              <Field
                label="Phone"
                value={form.contact_phone}
                onChange={(v) => setForm({ ...form, contact_phone: v })}
              />
              <Field
                label="Category"
                value={form.category}
                onChange={(v) => setForm({ ...form, category: v })}
                placeholder="Cocktail bar, restaurant, …"
              />
              <Field
                label="City"
                value={form.city}
                onChange={(v) => setForm({ ...form, city: v })}
              />
              <div className="sm:col-span-2">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                  Anything else?
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Goals, peak nights, the vibe…"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background transition hover:opacity-90 disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {user ? `Submit — request ${PACKAGES[tier].label}` : `Continue — sign in to submit`}
              </button>
              <p className="sm:col-span-2 text-center text-xs text-muted-foreground">
                Already advertise with us?{" "}
                <Link to="/advertise/portal" className="underline">
                  Open your portal
                </Link>
              </p>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/40 p-3">
      <div className="font-display text-2xl font-bold">{value}</div>
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function Bullet({ icon: Icon, text }: { icon: typeof Target; text: string }) {
  return (
    <li className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 text-primary" />
      <span>{text}</span>
    </li>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
      />
    </label>
  );
}
