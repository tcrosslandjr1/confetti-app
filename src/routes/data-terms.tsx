import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/data-terms")({
  head: () => ({
    meta: [
      { title: "Data sharing terms — Confettiplan" },
      {
        name: "description",
        content:
          "How Confettiplan's AI agents use the social, photo, and engagement signals you share to learn what you love and plan better nights out.",
      },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Data sharing terms — Confettiplan" },
      {
        property: "og:description",
        content:
          "Plain-language terms for connecting your social media, photos, and engagement signals to Confettiplan's AI.",
      },
    ],
  }),
  component: DataTermsPage,
});

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3">
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function DataTermsPage() {
  const updated = "May 9, 2026";

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <header className="mb-8 space-y-3">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Legal · Plain language
        </p>
        <h1 className="font-display text-4xl font-bold leading-tight">
          Data sharing terms for AI personalization
        </h1>
        <p className="text-sm text-muted-foreground">
          Last updated: {updated}. These terms apply when you connect a social account, paste social
          signals, upload photos, or otherwise share signals our AI agents use to understand your taste.
        </p>
      </header>

      <nav aria-label="Sections" className="mb-10 rounded-2xl border border-border bg-muted/30 p-4 text-sm">
        <p className="mb-2 font-semibold">On this page</p>
        <ul className="grid gap-1 sm:grid-cols-2">
          {[
            ["scope", "What this covers"],
            ["what-we-collect", "What we collect"],
            ["how-we-use", "How the AI uses it"],
            ["photos-places", "Photos & places"],
            ["engagement", "Engaged followers & social graph"],
            ["sharing", "Who we share with"],
            ["retention", "Storage & retention"],
            ["your-controls", "Your controls"],
            ["children", "Age requirement"],
            ["changes", "Changes to these terms"],
            ["contact", "Contact"],
          ].map(([id, label]) => (
            <li key={id}>
              <a className="text-foreground underline-offset-4 hover:underline" href={`#${id}`}>
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-10">
        <Section id="scope" title="1. What these terms cover">
          <p>
            Confettiplan uses AI agents to plan outings that match your real-life taste. To do this
            well, the agents learn from signals you choose to share — including your social handles,
            pasted bios, hashtags, favorite creators, photos of places you've been or want to go,
            and which followers you most engage with. These terms describe what we collect, how the
            AI uses it, and the controls you have.
          </p>
          <p>
            By checking the consent box on the social-connect screen, you agree to these terms in
            addition to our general Terms of Service and Privacy Policy.
          </p>
        </Section>

        <Section id="what-we-collect" title="2. What we collect when you connect socials">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Public handles you enter (Instagram, TikTok, YouTube, Pinterest, Spotify, X).</li>
            <li>Text you paste: bios, hashtags, captions, creator lists, recent posts.</li>
            <li>Photos you upload of places you've been or want to go, including any embedded location/EXIF metadata if present.</li>
            <li>
              When you opt in, a derived list of your <em>most-engaged followers</em> (people you
              like, comment on, or DM most) so the AI can infer how you spend quality time outside of work.
            </li>
            <li>Inferred taste attributes the AI generates from those signals (e.g. "loves natural wine bars," "weekend hiker").</li>
          </ul>
          <p>
            We do <strong>not</strong> scrape private accounts, private messages, or anything you
            haven't explicitly given us. We do not buy social data from third parties.
          </p>
        </Section>

        <Section id="how-we-use" title="3. How the AI uses your signals">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>To build a private taste profile that personalizes plans, picks, and recommendations.</li>
            <li>To match you with venues, occasions, and friends with similar vibes.</li>
            <li>To improve quality of suggestions over time as you interact (likes, saves, plans completed).</li>
          </ul>
          <p>
            We do not use your social signals to train foundation models for third parties. Prompts
            sent to AI providers (e.g. via the Lovable AI Gateway) are processed transiently to
            generate your output and are not retained for cross-customer model training.
          </p>
        </Section>

        <Section id="photos-places" title="4. Photos of places (been & want-to-go)">
          <p>
            When you upload a photo tied to a place you've visited or want to visit, we may:
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Read EXIF location/time metadata you chose to keep on the file.</li>
            <li>Run image recognition to identify the venue, cuisine, scene, or aesthetic.</li>
            <li>Add the resulting tags (not the raw image) to your taste profile.</li>
          </ul>
          <p>
            You can strip EXIF before upload, delete a photo, or disable photo learning at any time
            in your profile settings.
          </p>
        </Section>

        <Section id="engagement" title="5. Most-engaged followers & quality-time inference">
          <p>
            If you opt in to "learn from my most-engaged followers," we analyze the public profiles
            of the people you interact with most to infer the kinds of activities you do for fun
            outside of work — e.g., concerts, dinners, weekend trips. We store only the
            <em> aggregated inferences</em> ("you spend weekends on outdoor brunches and live music"),
            not a list of individuals or their personal data.
          </p>
          <p>
            We never contact your followers, never publish that you analyzed them, and never sell or
            share this graph. You can disable this signal from your profile and we will delete the
            derived inferences within 30 days.
          </p>
        </Section>

        <Section id="sharing" title="6. Who we share data with">
          <ul className="list-disc space-y-1.5 pl-5">
            <li><strong>AI providers</strong> (e.g. OpenAI, Google Gemini via the Lovable AI Gateway) — only the prompt needed to generate a result; not retained for training.</li>
            <li><strong>Infrastructure providers</strong> (Lovable Cloud / Supabase, Cloudflare) — for storage and delivery, under data-processing agreements.</li>
            <li><strong>Venues, brands, advertisers</strong> — only aggregated, non-identifying audience signals (e.g. "rooftop fans, ages 25–34"). Never your handle, photo, or follower list.</li>
          </ul>
          <p>We do not sell your personal data.</p>
        </Section>

        <Section id="retention" title="7. Storage & retention">
          <p>
            Signals are stored in our backend tied to your account. You can delete any individual
            signal (a handle, a photo, a pasted bio) at any time. Deleting your account removes all
            associated taste-profile data within 30 days, except where we are legally required to retain logs.
          </p>
        </Section>

        <Section id="your-controls" title="8. Your controls">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Disconnect any social handle from your <Link to="/me" className="text-foreground underline">profile</Link>.</li>
            <li>Pause AI learning entirely without losing your account.</li>
            <li>Export your taste profile as JSON.</li>
            <li>Request full deletion via <a className="text-foreground underline" href="mailto:privacy@confettiplan.app">privacy@confettiplan.app</a>.</li>
          </ul>
        </Section>

        <Section id="children" title="9. Age requirement">
          <p>You must be 16 or older to connect social accounts or upload photos for AI learning.</p>
        </Section>

        <Section id="changes" title="10. Changes to these terms">
          <p>
            We'll post material updates here and notify you in-app before they take effect. Continued
            use after the effective date constitutes acceptance.
          </p>
        </Section>

        <Section id="contact" title="11. Contact">
          <p>
            Questions or requests: <a className="text-foreground underline" href="mailto:privacy@confettiplan.app">privacy@confettiplan.app</a>.
          </p>
        </Section>
      </div>

      <footer className="mt-12 border-t border-border pt-6 text-xs text-muted-foreground">
        <Link to="/" className="underline">← Back to Confettiplan</Link>
      </footer>
    </main>
  );
}
