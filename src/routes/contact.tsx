import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Mail, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Loop" },
      {
        name: "description",
        content:
          "Get in touch with the Loop team. Feedback, partnerships, press — we read every message.",
      },
      { property: "og:title", content: "Contact — Loop" },
      { property: "og:description", content: "Send us a note. We read every message." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sent, setSent] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 md:grid-cols-2">
          <div>
            <h1 className="font-display text-5xl font-bold tracking-tight sm:text-6xl">
              Say <span className="text-gradient">hi</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              Feedback, partnership ideas, press, or a vibe we should plan for — drop us a line.
            </p>
            <div className="mt-8 space-y-4 text-sm">
              <a
                href="mailto:hello@confetti.app"
                className="flex items-center gap-3 text-foreground hover:text-primary"
              >
                <Mail className="h-4 w-4" /> hello@confetti.app
              </a>
              <div className="flex items-center gap-3 text-muted-foreground">
                <MessageCircle className="h-4 w-4" /> Replies usually within 24 hours
              </div>
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
            className="rounded-3xl border border-border bg-card p-6 shadow-card"
          >
            {sent ? (
              <div className="py-10 text-center">
                <h3 className="font-display text-2xl font-bold">Thanks — got it.</h3>
                <p className="mt-2 text-sm text-muted-foreground">We'll be in touch soon.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Name
                  </label>
                  <input
                    required
                    className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Email
                  </label>
                  <input
                    required
                    type="email"
                    className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Message
                  </label>
                  <textarea
                    required
                    rows={5}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-3 text-sm"
                  />
                </div>
                <button className="h-11 w-full rounded-full bg-foreground text-sm font-semibold text-background transition-pop hover:scale-[1.02]">
                  Send message
                </button>
              </div>
            )}
          </form>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
