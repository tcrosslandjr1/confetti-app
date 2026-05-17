import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import {
  PassportShareCard,
  decodePassport,
} from "@/components/passport/PassportShareCard";

export const Route = createFileRoute("/p/$code")({
  head: () => ({ meta: [{ title: "Shared Passport — Confetti" }] }),
  component: SharedPassportPage,
});

function SharedPassportPage() {
  const { code } = useParams({ from: "/p/$code" });
  const data = decodePassport(code);

  const shareUrl =
    typeof window !== "undefined" ? window.location.href : `https://confettiplan.com/p/${code}`;

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="mx-auto max-w-md px-4 pt-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-widest text-ink/70 hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Confetti
        </Link>

        <div className="mt-6">
          {data ? (
            <PassportShareCard data={data} shareUrl={shareUrl} />
          ) : (
            <div className="rounded-2xl border-2 border-ink bg-card p-6 text-center">
              <h1 className="font-display text-2xl font-extrabold">Passport unavailable</h1>
              <p className="mt-2 text-sm text-ink/70">
                This share link looks invalid or expired.
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="font-serif italic text-ink/70">Plan your own unforgettable night.</p>
          <Link
            to="/"
            className="mt-3 inline-block rounded-full border-2 border-ink bg-coral px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-cream shadow-brut hover:-translate-y-0.5 transition-transform"
          >
            Get my Passport
          </Link>
        </div>
      </div>
    </div>
  );
}
