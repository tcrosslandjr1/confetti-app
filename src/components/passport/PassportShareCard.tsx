import { forwardRef, useEffect, useState } from "react";
import QRCode from "qrcode";
import { Award, Sparkles, Star, Flame, Crown } from "lucide-react";

export type PassportShareData = {
  name: string;
  level: number;
  tier: "Spark" | "Glow" | "Blaze" | "Legend";
  confetti: number;
  stamps: number;
  badges: number;
  city?: string;
};

const TIER_ICON = {
  Spark: Sparkles,
  Glow: Star,
  Blaze: Flame,
  Legend: Crown,
} as const;

/** Encode passport data into a URL-safe base64 string for sharing. */
export function encodePassport(d: PassportShareData): string {
  const json = JSON.stringify(d);
  const b64 =
    typeof window !== "undefined"
      ? window.btoa(unescape(encodeURIComponent(json)))
      : Buffer.from(json, "utf-8").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodePassport(code: string): PassportShareData | null {
  try {
    const b64 = code.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "==".slice((b64.length + 2) % 4);
    const json =
      typeof window !== "undefined"
        ? decodeURIComponent(escape(window.atob(padded)))
        : Buffer.from(padded, "base64").toString("utf-8");
    return JSON.parse(json) as PassportShareData;
  } catch {
    return null;
  }
}

type Props = {
  data: PassportShareData;
  shareUrl: string;
};

/** Square shareable card used in modal preview and on the public /p/:code page. */
export const PassportShareCard = forwardRef<HTMLDivElement, Props>(function PassportShareCard(
  { data, shareUrl },
  ref,
) {
  const [qr, setQr] = useState<string>("");
  useEffect(() => {
    QRCode.toDataURL(shareUrl, {
      margin: 0,
      width: 256,
      color: { dark: "#1a1a1a", light: "#00000000" },
    }).then(setQr).catch(() => setQr(""));
  }, [shareUrl]);

  const TierIcon = TIER_ICON[data.tier] ?? Sparkles;

  return (
    <div
      ref={ref}
      className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border-2 border-ink bg-gradient-vibe p-6 text-cream shadow-brut-lg"
      style={{ maxWidth: 420 }}
    >
      {/* glows */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-cream/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-ink/30 blur-3xl" />
      {/* dotted grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
      />

      <div className="relative flex h-full flex-col">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-cream/30 bg-cream/15 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest backdrop-blur">
            <Award className="h-3.5 w-3.5" /> Confetti Passport
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-ink/25 px-2.5 py-1 text-[11px] backdrop-blur">
            <TierIcon className="h-3 w-3" />
            <span className="font-mono font-bold uppercase tracking-widest">{data.tier}</span>
          </div>
        </div>

        <div className="mt-4">
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest opacity-80">
            Passenger
          </div>
          <div className="mt-1 truncate font-display text-2xl font-extrabold leading-none">
            {data.name}
          </div>
          {data.city && (
            <div className="mt-1 font-serif text-sm italic opacity-80">{data.city}</div>
          )}
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-2">
              <div className="font-display text-6xl font-extrabold leading-none drop-shadow-[0_3px_0_rgba(0,0,0,0.25)]">
                L{data.level}
              </div>
              <div className="font-serif text-xl italic opacity-80">explorer</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-4xl font-extrabold tabular-nums leading-none drop-shadow-[0_2px_0_rgba(0,0,0,0.2)]">
              {data.confetti.toLocaleString()}
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-widest opacity-90">
              Confetti
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-cream/30 bg-cream/10 px-3 py-2 backdrop-blur">
            <div className="font-mono text-[9px] uppercase tracking-widest opacity-80">Stamps</div>
            <div className="font-display text-xl font-extrabold tabular-nums">{data.stamps}</div>
          </div>
          <div className="rounded-xl border border-cream/30 bg-cream/10 px-3 py-2 backdrop-blur">
            <div className="font-mono text-[9px] uppercase tracking-widest opacity-80">Badges</div>
            <div className="font-display text-xl font-extrabold tabular-nums">{data.badges}</div>
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            <div className="font-mono text-[9px] font-bold uppercase tracking-widest opacity-80">
              Scan to view
            </div>
            <div className="mt-0.5 font-serif text-sm italic opacity-80">confettiplan.com</div>
          </div>
          <div className="rounded-xl border-2 border-cream bg-cream p-1.5 shadow-brut">
            {qr ? (
              <img src={qr} alt="QR code" className="h-20 w-20" />
            ) : (
              <div className="h-20 w-20 animate-pulse rounded bg-ink/20" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
