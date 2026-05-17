import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookie Policy — Confettiplan" },
      {
        name: "description",
        content:
          "What cookies and similar technologies Confettiplan uses, why we use them, and how you can control them.",
      },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Cookie Policy — Confettiplan" },
      {
        property: "og:description",
        content: "Plain-language explanation of cookies on Confettiplan.",
      },
    ],
  }),
  component: CookiesPage,
});

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3">
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function CookiesPage() {
  const updated = "May 11, 2026";
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <header className="mb-8 space-y-3">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Legal · Plain language
        </p>
        <h1 className="font-display text-4xl font-bold leading-tight">Cookie Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: {updated}.</p>
      </header>

      <div className="space-y-10">
        <Section id="what" title="1. What are cookies?">
          <p>
            Cookies are small text files stored on your device when you visit a website. We also use
            similar technologies like local storage and pixels. Together we call these "cookies" in
            this policy.
          </p>
        </Section>

        <Section id="types" title="2. Types of cookies we use">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Strictly necessary</strong> — keep you signed in, remember your consent
              choices, secure the service. Always on.
            </li>
            <li>
              <strong>Functional</strong> — remember preferences (theme, language, recent plans).
            </li>
            <li>
              <strong>Analytics</strong> — help us understand how the product is used in aggregate.
              Only set with your consent in regions that require it.
            </li>
            <li>
              <strong>Advertising</strong> — we currently do not set third-party advertising
              cookies. If that ever changes, we'll update this policy and ask for consent.
            </li>
          </ul>
        </Section>

        <Section id="third-parties" title="3. Third-party cookies">
          <p>
            Some pages may load services from trusted partners (e.g. embedded maps, video, payment
            forms) that set their own cookies. We list active partners and their purposes here as we
            add them.
          </p>
        </Section>

        <Section id="control" title="4. Controlling cookies">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Use the cookie banner to accept or reject non-essential cookies.</li>
            <li>Update your choice anytime from the "Cookie settings" link in the footer.</li>
            <li>
              Block or delete cookies in your browser settings. Note: blocking strictly necessary
              cookies will break sign-in.
            </li>
            <li>Send a Global Privacy Control (GPC) signal — we honor it for opt-out requests.</li>
          </ul>
        </Section>

        <Section id="changes" title="5. Changes">
          <p>
            We'll update this policy when our use of cookies changes. The "last updated" date at the
            top will reflect the most recent change.
          </p>
        </Section>

        <Section id="contact" title="6. Contact">
          <p>
            Questions:{" "}
            <a className="text-foreground underline" href="mailto:privacy@confettiplan.app">
              privacy@confettiplan.app
            </a>
            . See our{" "}
            <Link to="/privacy" className="text-foreground underline">
              Privacy Policy
            </Link>{" "}
            for the bigger picture.
          </p>
        </Section>
      </div>

      <footer className="mt-12 border-t border-border pt-6 text-xs text-muted-foreground">
        <Link to="/" className="underline">
          ← Back to Confettiplan
        </Link>
      </footer>
    </main>
  );
}
