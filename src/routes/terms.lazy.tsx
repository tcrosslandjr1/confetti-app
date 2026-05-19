import { createLazyFileRoute, Link } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/terms")({
  component: TermsPage,
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

function TermsPage() {
    const updated = "May 11, 2026";
    return (<main className="mx-auto max-w-3xl px-5 py-12">
      <header className="mb-8 space-y-3">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Legal · Plain language
        </p>
        <h1 className="font-display text-4xl font-bold leading-tight">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: {updated}. By using Confettiplan you agree to these terms.
        </p>
      </header>

      <div className="space-y-10">
        <Section id="accounts" title="1. Your account">
          <p>
            You must be at least 13 (16 in the EEA/UK) to use Confettiplan. Keep your login
            credentials secure; you're responsible for activity on your account.
          </p>
        </Section>

        <Section id="use" title="2. Acceptable use">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>No illegal, harassing, hateful, or sexually exploitative content.</li>
            <li>No scraping, reverse engineering, or interfering with the service.</li>
            <li>No uploading content you don't have rights to share.</li>
            <li>No spam or unsolicited commercial messages to other users.</li>
          </ul>
        </Section>

        <Section id="content" title="3. Your content">
          <p>
            You keep ownership of content you create on Confettiplan. You grant us a worldwide,
            royalty-free license to host, display, and process that content solely to operate and
            improve the service.
          </p>
        </Section>

        <Section id="ai" title="4. AI outputs">
          <p>
            Confettiplan uses AI to generate plans, suggestions, and summaries. AI output can be
            inaccurate, incomplete, or out of date. Always verify important details (prices,
            availability, addresses) before acting. You're responsible for how you use AI output.
          </p>
        </Section>

        <Section id="payments" title="5. Payments & subscriptions">
          <p>
            Paid plans renew automatically until cancelled. Fees are non-refundable except where
            required by law. Taxes may apply based on your location.
          </p>
        </Section>

        <Section id="termination" title="6. Suspension & termination">
          <p>
            We may suspend or terminate accounts that violate these terms or harm other users. You
            may delete your account at any time from settings.
          </p>
        </Section>

        <Section id="warranty" title="7. Disclaimer of warranties">
          <p>
            The service is provided "as is" without warranties of any kind, express or implied,
            including merchantability, fitness for a particular purpose, and non-infringement.
          </p>
        </Section>

        <Section id="liability" title="8. Limitation of liability">
          <p>
            To the fullest extent permitted by law, Confettiplan and its affiliates will not be
            liable for indirect, incidental, special, consequential, or punitive damages, or for any
            loss of profits, data, or goodwill. Our total liability for any claim is capped at the
            greater of (a) the amount you paid us in the 12 months before the claim, or (b) USD 100.
          </p>
        </Section>

        <Section id="indemnity" title="9. Indemnification">
          <p>
            You agree to indemnify Confettiplan against claims arising from your content or your
            misuse of the service.
          </p>
        </Section>

        <Section id="law" title="10. Governing law & disputes">
          <p>
            These terms are governed by the laws of the State of Delaware, USA, excluding its
            conflict-of-laws rules. Disputes will be resolved in the state or federal courts located
            in Delaware, unless your local consumer law gives you the right to your local forum.
          </p>
        </Section>

        <Section id="changes" title="11. Changes to these terms">
          <p>
            We may update these terms from time to time. We'll notify you of material changes;
            continued use after the effective date constitutes acceptance.
          </p>
        </Section>

        <Section id="contact" title="12. Contact">
          <p>
            Questions:{" "}
            <a className="text-foreground underline" href="mailto:legal@confettiplan.app">
              legal@confettiplan.app
            </a>
            . See also our{" "}
            <Link to="/privacy" className="text-foreground underline">
              Privacy Policy
            </Link>
            .
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
