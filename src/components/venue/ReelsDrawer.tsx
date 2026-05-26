import { useState } from "react";
import { Film, X, ExternalLink, Music2, Instagram } from "lucide-react";

type Props = {
  venueName: string;
  tiktokUrl?: string | null;
  tiktokHandle?: string | null;
  instagramUrl?: string | null;
  instagramHandle?: string | null;
};

/**
 * "Reels" bottom-sheet drawer. Tap the trigger button to slide up a panel
 * showing TikTok + Instagram profile cards. Each card deep-links to the
 * native app (the social URLs we store are intercepted by the mobile apps).
 */
export function ReelsDrawer({
  venueName,
  tiktokUrl,
  tiktokHandle,
  instagramUrl,
  instagramHandle,
}: Props) {
  const [open, setOpen] = useState(false);
  const hasAny = !!(tiktokUrl || instagramUrl);
  if (!hasAny) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-coral px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-cream shadow-brut transition-pop hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
      >
        <Film className="h-4 w-4" />
        See the vibe
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Reels"
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-t-3xl border-t-2 border-ink bg-cream p-5 shadow-brut animate-[slide-up_.28s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-ink/30" />
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-cream/60">
                  The vibe
                </p>
                <h3 className="font-display text-lg font-bold leading-tight">{venueName}</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-full border-2 border-ink bg-white text-cream shadow-brut active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {tiktokUrl && (
                <SocialCard
                  href={tiktokUrl}
                  handle={tiktokHandle}
                  platform="TikTok"
                  icon={Music2}
                  tint="bg-[oklch(0.2_0_0)] text-cream"
                />
              )}
              {instagramUrl && (
                <SocialCard
                  href={instagramUrl}
                  handle={instagramHandle}
                  platform="Instagram"
                  icon={Instagram}
                  tint="bg-gradient-to-br from-[oklch(0.65_0.18_30)] via-[oklch(0.65_0.21_355)] to-[oklch(0.55_0.18_290)] text-cream"
                />
              )}
            </div>

            <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-widest text-cream/50">
              Tap to open in app
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function SocialCard({
  href,
  handle,
  platform,
  icon: Icon,
  tint,
}: {
  href: string;
  handle?: string | null;
  platform: string;
  icon: typeof Music2;
  tint: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-ink p-4 shadow-brut transition-pop hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${tint}`}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5" />
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest opacity-80">
          {platform}
        </span>
      </div>
      <div className="mt-6">
        <p className="font-display text-xl font-bold leading-none">
          {handle ? `@${handle}` : "Open profile"}
        </p>
        <p className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest opacity-70">
          Open <ExternalLink className="h-3 w-3" />
        </p>
      </div>
    </a>
  );
}
