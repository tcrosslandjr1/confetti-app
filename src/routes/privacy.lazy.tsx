import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { PickAnalyticsToggle } from "@/components/PickAnalyticsToggle";

export const Route = createLazyFileRoute("/privacy")({
  component: PrivacyPage,
});

function Section({ id, title, children, }: {
    id: string;
    title: string;
    children: React.ReactNode;
}) {
    return (<section id={id} className="scroll-mt-24 space-y-3">
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>);
}

function PrivacyPage() {
    const updated = "May 11, 2026";
    return (<main className="mx-auto max-w-3xl px-5 py-12">
      <header className="mb-8 space-y-3">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Legal · Plain language
        </p>
        <h1 className="font-display text-4xl font-bold leading-tight">Global Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: {updated}. This policy applies to everyone who uses Confettiplan, anywhere
          in the world.
        </p>
      </header>

      <nav aria-label="Sections" className="mb-10 rounded-2xl border border-border bg-muted/30 p-4 text-sm">
        <p className="mb-2 font-semibold">On this page</p>
        <ul className="grid gap-1 sm:grid-cols-2">
          {[
            ["who", "Who we are"],
            ["what", "Data we collect"],
            ["how", "How we use it"],
            ["legal", "Legal bases"],
            ["sharing", "Sharing & processors"],
            ["transfers", "International transfers"],
            ["retention", "Retention"],
            ["rights", "Your rights"],
            ["security", "Security"],
            ["children", "Children"],
            ["changes", "Changes"],
            ["contact", "Contact"],
        ].map(([id, label]) => (<li key={id}>
              <a className="text-foreground underline-offset-4 hover:underline" href={`#${id}`}>
                {label}
              </a>
            </li>))}
        </ul>
      </nav>

      <div className="mb-10 space-y-3">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Your controls
        </p>
        <PickAnalyticsToggle />
      </div>

      <div className="space-y-10">
        <Section id="who" title="1. Who we are">
          <p>
            Confettiplan ("we", "us") provides AI-powered planning tools for friends, teams, and
            events. We are the data controller for personal data processed through our app and
            website.
          </p>
        </Section>

        <Section id="what" title="2. Data we collect">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Account data: name, email, password hash, profile photo.</li>
            <li>Plan data: trips, RSVPs, messages, preferences, locations you share.</li>
            <li>Device & usage data: IP address, device, browser, pages viewed, referrers.</li>
            <li>
              Optional signals: social handles, photos, and taste signals you choose to share.
            </li>
            <li>
              Payment data (processed by our payment providers; we never store full card numbers).
            </li>
          </ul>
        </Section>

        <Section id="how" title="3. How we use it">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>To create and operate your account and the plans you build.</li>
            <li>To personalize recommendations using AI.</li>
            <li>To communicate with you about your plans, security, and product updates.</li>
            <li>To prevent fraud, abuse, and to comply with the law.</li>
            <li>To measure product performance in aggregate.</li>
          </ul>
        </Section>

        <Section id="legal" title="4. Legal bases (EEA / UK)">
          <p>
            We rely on contract (to deliver the service you signed up for), legitimate interests (to
            improve and secure the product), consent (for optional signals, marketing emails, and
            non-essential cookies), and legal obligation (tax, security, law enforcement requests).
          </p>
        </Section>

        <Section id="sharing" title="5. Sharing & processors">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Infrastructure: Lovable Cloud (Supabase), Cloudflare.</li>
            <li>
              AI providers: OpenAI, Google, Anthropic via the Lovable AI Gateway. Prompts are
              processed transiently and not used for cross-customer training.
            </li>
            <li>Payments: Stripe / Paddle (where applicable).</li>
            <li>
              Analytics & error monitoring: privacy-preserving providers under data-processing
              agreements.
            </li>
          </ul>
          <p>We do not sell your personal data.</p>
        </Section>

        <Section id="transfers" title="6. International transfers">
          <p>
            Personal data may be processed in the United States and other countries. Where required,
            we rely on Standard Contractual Clauses, the UK IDTA, or equivalent safeguards.
          </p>
        </Section>

        <Section id="retention" title="7. Retention">
          <p>
            We keep personal data only as long as needed to provide the service or to meet legal
            obligations. Deleting your account removes associated personal data within 30 days,
            except where logs must be retained for security or legal reasons.
          </p>
        </Section>

        <Section id="rights" title="8. Your rights">
          <p>
            Depending on where you live, you may have the right to access, correct, delete, port,
            object to, or restrict processing of your personal data, and to withdraw consent at any
            time. California residents have additional CCPA/CPRA rights including the right to opt
            out of "sharing" for cross-context behavioral advertising — we do not engage in such
            sharing today. Brazilian (LGPD) and Canadian (PIPEDA) users have equivalent rights.
            Contact{" "}
            <a className="text-foreground underline" href="mailto:privacy@confettiplan.app">
              privacy@confettiplan.app
            </a>
            .
          </p>
        </Section>

        <Section id="security" title="9. Security">
          <p>
            We use encryption in transit, hashed passwords, role-based access, and audit logging. No
            system is perfectly secure; we'll notify you and regulators of any breach as required by
            law.
          </p>
        </Section>

        <Section id="children" title="10. Children">
          <p>Confettiplan is not directed to children under 13 (or 16 in the EEA/UK).</p>
        </Section>

        <Section id="changes" title="11. Changes">
          <p>
            We'll post material updates here and notify you in-app or by email before they take
            effect.
          </p>
        </Section>

        <Section id="contact" title="12. Contact">
          <p>
            Privacy questions:{" "}
            <a className="text-foreground underline" href="mailto:privacy@confettiplan.app">
              privacy@confettiplan.app
            </a>
            . See also our{" "}
            <a href="#cookies-note" className="text-foreground underline">
              Cookie Policy
            </a>
            ,{" "}
            <a href="#terms-note" className="text-foreground underline">
              Terms of Service
            </a>
            , and{" "}
            <Link to="/accessibility" className="text-foreground underline">
              Accessibility Statement
            </Link>
            .
          </p>
        </Section>
      </div>

      <div className="mt-10 space-y-10">
        <Section id="cookies-note" title="Cookie Policy">
          <p>
            Confettiplan uses only essential cookies required for authentication and session
            management. We do not use third-party advertising cookies. If we add optional analytics
            cookies in the future you will be prompted for consent before they are set. You can
            manage your analytics preference using the toggle at the top of this page.
          </p>
        </Section>

        <Section id="terms-note" title="Terms of Service (Summary)">
          <p>
            By using Confettiplan you agree to use the service lawfully and respect other users. We
            provide the platform "as is" and are not liable for venue availability, pricing, or
            third-party content. You retain ownership of content you create; we need a limited
            licence to display it within the app. Full terms will be published at a dedicated URL
            before public launch — contact{" "}
            <a className="text-foreground underline" href="mailto:legal@confettiplan.app">
              legal@confettiplan.app
            </a>{" "}
            with questions.
          </p>
        </Section>
      </div>

      <footer className="mt-12 border-t border-border pt-6 text-xs text-muted-foreground">
        <Link to="/" className="underline">
          ← Back to Confettiplan
        </Link>
      </footer>
    </main>);
}
