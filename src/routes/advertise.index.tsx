import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { createAdvertiser, getMyAdvertiser, PACKAGES, type PackageTier } from "@/lib/ads";
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Megaphone,
  Target,
  BarChart3,
  Loader2,
  Building2,
  Mail,
  Rocket,
} from "lucide-react";
import { toast } from "sonner";

const DRAFT_KEY = "advertiser_onboarding_draft_v1";

type Draft = {
  tier: PackageTier;
  business_name: string;
  contact_email: string;
  website: string;
  contact_phone: string;
  category: string;
  city: string;
  notes: string;
  resumeAfterAuth?: boolean;
};

function loadDraft(): Partial<Draft> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Partial<Draft>) : null;
  } catch {
    return null;
  }
}

function saveDraft(d: Partial<Draft>) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  } catch {
    /* ignore */
  }
}

function clearDraft() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

export const Route = createFileRoute("/advertise/")({
  component: AdvertiseLanding,
});

function AdvertiseLanding() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [tier, setTier] = useState<PackageTier>("featured");
  const [busy, setBusy] = useState(false);
  const [hasAccount, setHasAccount] = useState<boolean | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const autoSubmitted = useRef(false);

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

  // Hydrate draft on mount (e.g. after auth round-trip)
  useEffect(() => {
    const d = loadDraft();
    if (!d) return;
    setForm((f) => ({
      business_name: d.business_name ?? f.business_name,
      contact_email: d.contact_email ?? f.contact_email,
      website: d.website ?? f.website,
      contact_phone: d.contact_phone ?? f.contact_phone,
      category: d.category ?? f.category,
      city: d.city ?? f.city,
      notes: d.notes ?? f.notes,
    }));
    if (d.tier) setTier(d.tier);
  }, []);

  useEffect(() => {
    if (user?.email && !form.contact_email) setForm((f) => ({ ...f, contact_email: user.email! }));
  }, [user, form.contact_email]);

  // Persist draft as user types
  useEffect(() => {
    saveDraft({ ...form, tier });
  }, [form, tier]);

  async function doCreate(): Promise<boolean> {
    if (!user) return false;
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
      clearDraft();
      toast.success("You're in — welcome aboard");
      nav({ to: "/advertise/portal" });
      return true;
    } catch (err) {
      toast.error((err as Error).message ?? "Could not submit");
      return false;
    }
  }

  // Resume after auth: if draft was flagged for resume and user is back, auto-create
  useEffect(() => {
    if (autoSubmitted.current) return;
    if (!user || hasAccount !== false) return;
    const d = loadDraft();
    if (!d?.resumeAfterAuth || !d.business_name) return;
    autoSubmitted.current = true;
    setBusy(true);
    saveDraft({ ...d, resumeAfterAuth: false });
    void doCreate().finally(() => setBusy(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, hasAccount]);

  function next() {
    if (step === 1) {
      if (!form.business_name.trim()) {
        toast.error("Business name is required");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!form.contact_email.trim()) {
        toast.error("Contact email is required");
        return;
      }
      setStep(3);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      saveDraft({ ...form, tier, resumeAfterAuth: true });
      toast("Create a free account to finish", {
        description: "Your details are saved — we'll bring you right back.",
      });
      nav({ to: "/auth", search: { redirect: "/advertise#signup" } as never });
      return;
    }
    setBusy(true);
    try {
      await doCreate();
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
            <form onSubmit={submit} className="space-y-5">
              {/* Stepper */}
              <ol className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-wider">
                {[
                  { n: 1, label: "Business", icon: Building2 },
                  { n: 2, label: "Contact", icon: Mail },
                  { n: 3, label: "Launch", icon: Rocket },
                ].map((s, i) => {
                  const active = step === s.n;
                  const done = step > s.n;
                  const Icon = s.icon;
                  return (
                    <li key={s.n} className="flex flex-1 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (s.n < step) setStep(s.n as 1 | 2 | 3);
                        }}
                        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 transition ${
                          active
                            ? "border-primary bg-primary/10 text-primary"
                            : done
                              ? "border-foreground/30 bg-muted text-foreground"
                              : "border-border bg-background text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{s.n}. {s.label}</span>
                      </button>
                      {i < 2 && <span className="h-px flex-1 bg-border" />}
                    </li>
                  );
                })}
              </ol>

              {step === 1 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field
                      label="Business name *"
                      value={form.business_name}
                      onChange={(v) => setForm({ ...form, business_name: v })}
                      required
                    />
                  </div>
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
                    placeholder="Lisbon, NYC, …"
                  />
                </div>
              )}

              {step === 2 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Contact email *"
                    type="email"
                    value={form.contact_email}
                    onChange={(v) => setForm({ ...form, contact_email: v })}
                    required
                  />
                  <Field
                    label="Phone"
                    value={form.contact_phone}
                    onChange={(v) => setForm({ ...form, contact_phone: v })}
                  />
                  <div className="sm:col-span-2">
                    <Field
                      label="Website"
                      value={form.website}
                      onChange={(v) => setForm({ ...form, website: v })}
                      placeholder="https://"
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-border bg-muted/30 p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-base font-bold">
                        {form.business_name || "Your business"}
                      </span>
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-primary">
                        {PACKAGES[tier].label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[form.category, form.city].filter(Boolean).join(" · ") ||
                        "Add details in step 1"}
                      {" — "}
                      {form.contact_email || "no email yet"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                      Anything else? (optional)
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      rows={3}
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                      placeholder="Goals, peak nights, the vibe…"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
                    className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-bold hover:bg-muted"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                ) : (
                  <span />
                )}
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={next}
                    className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-bold text-background hover:opacity-90"
                  >
                    Continue <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                  >
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    {user ? `Create my advertiser account` : `Sign in to finish`}
                  </button>
                )}
              </div>
              <p className="text-center text-xs text-muted-foreground">
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
