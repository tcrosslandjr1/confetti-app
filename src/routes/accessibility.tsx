import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/accessibility")({
  head: () => ({
    meta: [
      { title: "Accessibility Statement — Confettiplan" },
      {
        name: "description",
        content:
          "Confettiplan's commitment to accessibility, the standards we follow (WCAG 2.2 AA), known limitations, and how to report barriers.",
      },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Accessibility Statement — Confettiplan" },
      {
        property: "og:description",
        content:
          "Our commitment to making Confettiplan usable for everyone, including people with disabilities.",
      },
    ],
  }),
  component: AccessibilityPage,
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

function AccessibilityPage() {
  const updated = "May 11, 2026";
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <header className="mb-8 space-y-3">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Legal · Plain language
        </p>
        <h1 className="font-display text-4xl font-bold leading-tight">Accessibility Statement</h1>
        <p className="text-sm text-muted-foreground">Last updated: {updated}.</p>
      </header>

      <div className="space-y-10">
        <Section id="commitment" title="1. Our commitment">
          <p>
            Confettiplan is committed to making our product usable for everyone, including people
            with disabilities. We design and build with accessibility in mind and continuously
            improve based on user feedback and audits.
          </p>
        </Section>

        <Section id="standard" title="2. Standards we follow">
          <p>
            We aim to conform to the{" "}
            <a
              className="text-foreground underline"
              href="https://www.w3.org/TR/WCAG22/"
              target="_blank"
              rel="noreferrer"
            >
              Web Content Accessibility Guidelines (WCAG) 2.2, Level AA
            </a>
            . We also consider EN 301 549 (EU), Section 508 (US), and the European Accessibility Act
            (EAA, effective June 2025).
          </p>
        </Section>

        <Section id="features" title="3. Accessibility features">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Semantic HTML, ARIA where needed, and visible focus states.</li>
            <li>Keyboard navigation for all interactive elements.</li>
            <li>Color contrast that meets or exceeds WCAG AA.</li>
            <li>Respect for "prefers-reduced-motion" — animations are minimized when set.</li>
            <li>Screen-reader friendly labels on icons, buttons, and form fields.</li>
            <li>Resizable text up to 200% without loss of functionality.</li>
          </ul>
        </Section>

        <Section id="limitations" title="4. Known limitations">
          <p>
            Some areas are still being improved. Known issues include older marketing pages, some
            complex data tables, and embedded third-party content (maps, video) that we don't fully
            control. We're actively working on these.
          </p>
        </Section>

        <Section id="feedback" title="5. Reporting accessibility barriers">
          <p>
            If you encounter a barrier or have feedback, please contact us at{" "}
            <a className="text-foreground underline" href="mailto:accessibility@confettiplan.app">
              accessibility@confettiplan.app
            </a>
            . We aim to respond within 5 business days. Please include the page URL, the issue, and
            any assistive technology you're using.
          </p>
        </Section>

        <Section id="alt" title="6. Alternative access">
          <p>
            If you can't complete a task in the product because of an accessibility barrier, email
            us and we'll help you complete it directly while we work on a fix.
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
