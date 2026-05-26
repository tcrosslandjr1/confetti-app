import { Globe, MapPin, Music2, Instagram } from "lucide-react";

type Props = {
  website?: string | null;
  address?: string | null;
  city?: string | null;
  name?: string | null;
  tiktokUrl?: string | null;
  instagramUrl?: string | null;
};

function googleMapsUrl(
  name?: string | null,
  address?: string | null,
  city?: string | null,
): string {
  const q = [name, address, city].filter(Boolean).join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q || "")}`;
}

/** Pill row: Website · Maps · TikTok · Instagram. Hidden buttons collapse silently. */
export function VenueSocialButtons({
  website,
  address,
  city,
  name,
  tiktokUrl,
  instagramUrl,
}: Props) {
  const mapsHref = googleMapsUrl(name, address, city);
  const items = [
    { href: website || null, label: "Website", icon: Globe },
    { href: mapsHref, label: "Maps", icon: MapPin },
    { href: tiktokUrl || null, label: "TikTok", icon: Music2 },
    { href: instagramUrl || null, label: "Instagram", icon: Instagram },
  ].filter((it): it is { href: string; label: string; icon: typeof Globe } => !!it.href);

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Venue links"
      className="flex flex-wrap items-center gap-2 rounded-2xl border-2 border-ink bg-white p-2 shadow-brut"
    >
      {items.map(({ href, label, icon: Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
          className="group inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-cream px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-widest text-cream shadow-brut transition-pop hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          <Icon className="h-3.5 w-3.5 text-coral" />
          <span>{label}</span>
        </a>
      ))}
    </nav>
  );
}
