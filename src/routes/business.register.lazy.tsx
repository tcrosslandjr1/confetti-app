import { createLazyFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Building2, CheckCircle2, ArrowRight } from "lucide-react";

export const Route = createLazyFileRoute("/business/register")({
  component: BusinessRegisterPage,
});

const STEPS = [
  "Create a free Confetti business account",
  "Search for and claim your venue",
  "Verify ownership (takes ~24 hours)",
  "Manage your listing, menu, and bookings",
];

function BusinessRegisterPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="text-center">
          <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Register Your Business
          </h1>
          <p className="mt-3 text-muted-foreground">
            Join the Confetti network and reach guests who are already looking for
            your vibe.
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-muted/30 p-6">
          <h2 className="mb-4 font-semibold">How it works</h2>
          <ol className="space-y-3">
            {STEPS.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <span className="text-sm">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-8 space-y-3">
          <Link
            to="/business/signup"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-bold text-cream transition hover:opacity-90"
          >
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/business"
            className="block text-center text-sm text-muted-foreground hover:text-foreground"
          >
            Already have an account? Sign in
          </Link>
        </div>

        <div className="mt-12 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <h3 className="text-sm font-semibold text-emerald-900">Free to get started</h3>
              <p className="mt-1 text-xs text-emerald-700">
                Basic listings are always free. Upgrade anytime for promoted
                placement, AI content refresh, and pre-order management.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
