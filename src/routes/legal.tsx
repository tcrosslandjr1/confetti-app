import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, FileText, Accessibility, Cookie, Mail, Building2 } from "lucide-react";

export const Route = createFileRoute("/legal")({
  head: () => ({
    meta: [
      { title: "Legal Center — Confettiplan" },
      {
        name: "description",
        content:
          "Confettiplan's legal hub: privacy policy, terms of service, accessibility statement, cookie policy, and venue verification disclosure.",
      },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Legal Center — Confettiplan" },
      {
        property: "og:description",
        content:
          "Everything legal in one place — privacy, terms, accessibility, cookies, and venue verification.",
      },
    ],
  }),
  component: LegalHub,
});

const docs = [
  {
    to: "/privacy",
    icon: ShieldCheck,
    title: "Privacy Policy",
    desc: "What we collect, how we use it, and your rights (GDPR, CCPA, LGPD, PIPEDA).",
  },
  {
    to: "/privacy",
    icon: FileText,
    title: "Terms of Service",
    desc: "The rules for using Confettiplan — accounts, plans, Confetti points, and venue features.",
  },
  {
    to: "/accessibility",
    icon: Accessibility,
    title: "Accessibility Statement",
    desc: "Our WCAG 2.2 AA commitments and how to report a barrier.",
  },
  {
    to: "/privacy",
    icon: Cookie,
    title: "Cookie & Analytics",
    desc: "Cookies, SDKs, and your opt-out controls.",
  },
] as const;

function LegalHub() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <header className="mb-10 space-y-3">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Legal Center
        </p>
        <h1 className="font-display text-4xl font-bold leading-tight">
          Plain-language legal, in one place
        </h1>
        <p className="text-sm text-muted-foreground">
          Confettiplan is a curated city-experience platform. These documents explain how the
          service works, what you agree to when you use it, and how we protect your data.
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {docs.map(({ to, icon: Icon, title, desc }) => (
          <li key={title}>
            <Link
              to={to}
              className="group block h-full rounded-2xl border border-border bg-card p-5 transition hover:border-coral hover:shadow-sm"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-coral/10 text-coral">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="font-display text-lg font-semibold group-hover:text-coral">
                {title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-10 rounded-2xl border border-border bg-muted/30 p-5">
        <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal/10 text-teal">
          <Building2 className="h-5 w-5" />
        </div>
        <h2 className="font-display text-lg font-semibold">Venue verification disclosure</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Venues marked <strong>Verified</strong> have confirmed their listing with us and unlocked
          features like order-ahead, direct RSVP, and Confetti-point redemption. Unverified venues
          appear for discovery only — hours, menus, and order-ahead may not be live yet, and points
          earned at unverified venues may take longer to post.
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-border p-5">
        <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-pink/10 text-pink">
          <Mail className="h-5 w-5" />
        </div>
        <h2 className="font-display text-lg font-semibold">Contact our legal team</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Questions, takedown requests, or data-subject requests:{" "}
          <a className="underline" href="mailto:legal@confettiplan.com">
            legal@confettiplan.com
          </a>
        </p>
      </section>

      <p className="mt-8 text-xs text-muted-foreground">
        Last reviewed: May 24, 2026 · Confettiplan is operated by Confetti Labs.
      </p>
    </main>
  );
}
