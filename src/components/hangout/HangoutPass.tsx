import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Utensils,
  Wine,
  ShoppingBag,
  Boxes,
  Calendar,
  Clock,
  Music,
  Gamepad2,
  MapPin,
  CloudRain,
  Sparkles,
  Trash2,
  XCircle,
  Users,
  DollarSign,
  Share2,
} from "lucide-react";
import { clearActiveHangout, type ActiveHangout } from "@/lib/hangout-store";
import {
  combinedPickupLinks,
  downloadHangoutIcs,
  fetchHangoutWeather,
  type HangoutForecast,
} from "@/lib/hangout-helpers";
import { createSharedHangout, getClaimerName, setClaimerName } from "@/lib/hangout-collab";

interface HangoutPassProps {
  hangout: ActiveHangout;
}

export function HangoutPass({ hangout }: HangoutPassProps) {
  const navigate = useNavigate();
  const { plan } = hangout;
  const pickupLinks = combinedPickupLinks(plan);
  const [weather, setWeather] = useState<HangoutForecast | null>(null);
  const [sharing, setSharing] = useState(false);
  const [crewLink, setCrewLink] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchHangoutWeather(hangout).then((w) => {
      if (!cancelled) setWeather(w);
    });
    return () => {
      cancelled = true;
    };
  }, [hangout]);

  function handleCancel() {
    if (!confirm("Cancel this hangout plan? You can build a new one anytime.")) return;
    clearActiveHangout();
    toast.success("Plan cancelled");
    navigate({ to: "/new/hub" });
  }

  async function handleShareWithCrew() {
    if (sharing) return;
    setSharing(true);
    try {
      const hostName = getClaimerName("");
      const name = hostName || prompt("What's your name?")?.trim() || "Host";
      if (!hostName) setClaimerName(name);
      const { token } = await createSharedHangout(hangout, name);
      const link = `${window.location.origin}/hangout/${token}`;
      setCrewLink(link);
      try {
        if (navigator.share) {
          await navigator.share({
            title: plan.title,
            text: `${plan.title} — help me prep:`,
            url: link,
          });
        } else {
          await navigator.clipboard.writeText(link);
          toast.success("Crew link copied — paste it in the group chat");
        }
      } catch {
        /* user cancelled share */
      }
    } catch (e) {
      toast.error("Couldn't create crew link", { description: (e as Error).message });
    } finally {
      setSharing(false);
    }
  }

  async function handleShare() {
    const text = formatPlanForShare(hangout);
    try {
      if (navigator.share) {
        await navigator.share({ title: plan.title, text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Plan copied to clipboard");
      }
    } catch {
      /* user cancelled — silent */
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleShareWithCrew}
          disabled={sharing}
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-coral px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-cream shadow-brut hover:-translate-y-0.5 transition-pop disabled:opacity-50"
        >
          <Users className="h-3.5 w-3.5" /> {sharing ? "Linking…" : "Share with crew"}
        </button>
        <button
          type="button"
          onClick={() => downloadHangoutIcs(hangout)}
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-cream px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest shadow-brut hover:-translate-y-0.5 transition-pop"
        >
          <Calendar className="h-3.5 w-3.5" /> Add to calendar
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-cream px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest shadow-brut hover:-translate-y-0.5 transition-pop"
        >
          <Share2 className="h-3.5 w-3.5" /> Share
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink/40 bg-cream px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-cream/70 hover:border-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <XCircle className="h-3.5 w-3.5" /> Cancel
        </button>
      </div>

      {/* Crew link confirmation strip */}
      {crewLink && (
        <div className="mb-3 rounded-2xl border-2 border-coral bg-coral/10 px-4 py-3">
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-coral">
            Crew link · share it
          </div>
          <div className="mt-1 flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-cream/80 px-2 py-1 font-mono text-[11px]">
              {crewLink}
            </code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(crewLink);
                toast.success("Copied");
              }}
              className="shrink-0 rounded-full border-2 border-ink bg-cream px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-gold"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {/* Live weather banner — pulls from Open-Meteo (free) for the
          hangout's city + time. Nudges users toward the weather_backup
          section when rain / heat / cold is forecast. */}
      {weather && (
        <div
          className={`mb-3 flex items-center gap-2 rounded-2xl border-2 px-4 py-2.5 text-[12px] font-bold ${
            weather.backupRecommended
              ? "border-amber-500 bg-amber-100 text-amber-900"
              : "border-emerald-500/30 bg-emerald-100/50 text-emerald-900"
          }`}
        >
          <CloudRain className="h-4 w-4 shrink-0" />
          <span>{weather.summary}</span>
        </div>
      )}

      {/* Title card */}
      <div className="rounded-3xl border-2 border-ink bg-cream p-6 shadow-brut">
        <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-coral">
          {hangout.occasion}
          {hangout.city ? ` · ${hangout.city}` : ""}
        </div>
        <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight tracking-tight">
          {plan.title}
        </h1>
        <p className="mt-2 text-sm text-cream/70">{plan.summary}</p>
        <div className="mt-4 flex flex-wrap gap-3 text-[12px] font-bold text-cream/80">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {plan.guest_count} guests
          </span>
          <span className="inline-flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5" /> {plan.budget_estimate}
          </span>
          {plan.setting && (
            <span className="rounded-full border-2 border-cream/20 bg-cream px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest">
              {plan.setting}
            </span>
          )}
          {hangout.startTime && (
            <span className="rounded-full bg-gold/40 px-2 py-0.5 font-mono text-[10px]">
              starts {hangout.startTime}
            </span>
          )}
        </div>
      </div>

      {/* Menu */}
      <Section icon={Utensils} title="Menu" accent="coral">
        <ul className="grid gap-1 sm:grid-cols-2">
          {plan.menu.map((m, i) => (
            <li key={i} className="text-[13px]">
              <span className="font-bold">{m.quantity}</span>{" "}
              <span className="text-cream/80">{m.item}</span>
              {m.notes && <span className="ml-1 text-cream/50"> — {m.notes}</span>}
            </li>
          ))}
        </ul>
      </Section>

      {/* Drinks */}
      {plan.drinks && plan.drinks.length > 0 && (
        <Section icon={Wine} title="Drinks" accent="gold">
          <ul className="grid gap-1 sm:grid-cols-2">
            {plan.drinks.map((d, i) => (
              <li key={i} className="text-[13px]">
                <span className="font-bold">{d.quantity}</span>{" "}
                <span className="text-cream/80">{d.item}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Grocery list */}
      {plan.grocery_list && plan.grocery_list.length > 0 && (
        <Section icon={ShoppingBag} title="Grocery list" accent="emerald">
          <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-[12px] sm:grid-cols-3">
            {plan.grocery_list.map((g, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="mt-1 inline-block size-1.5 shrink-0 rounded-full bg-ink/30" />
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Supplies */}
      <Section icon={Boxes} title="Supplies" accent="purple">
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-[12px] sm:grid-cols-3">
          {plan.supplies.map((s, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span className="mt-1 inline-block size-1.5 shrink-0 rounded-full bg-ink/30" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Setup timeline */}
      <Section icon={Clock} title="Setup timeline" accent="coral">
        <ol className="space-y-2">
          {plan.setup_timeline.map((t, i) => (
            <li key={i} className="flex gap-3 text-[13px]">
              <span className="w-14 shrink-0 rounded-full bg-ink px-2 py-0.5 text-center font-mono text-[10px] font-bold uppercase tracking-widest text-cream">
                {t.when}
              </span>
              <span className="text-cream/80">{t.task}</span>
            </li>
          ))}
        </ol>
      </Section>

      {/* Music */}
      {plan.music &&
        (plan.music.vibe ||
          (plan.music.playlist_hints && plan.music.playlist_hints.length > 0)) && (
          <Section icon={Music} title="Music vibe" accent="purple">
            {plan.music.vibe && <p className="text-[13px] text-cream/80">{plan.music.vibe}</p>}
            {plan.music.playlist_hints && plan.music.playlist_hints.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {plan.music.playlist_hints.map((p, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-purple/30 bg-purple/10 px-2 py-0.5 font-mono text-[10px] font-bold text-purple"
                  >
                    {p}
                  </span>
                ))}
              </div>
            )}
          </Section>
        )}

      {/* Games / activities */}
      {plan.games_activities && plan.games_activities.length > 0 && (
        <Section icon={Gamepad2} title="Games & activities" accent="gold">
          <ul className="space-y-2">
            {plan.games_activities.map((g, i) => (
              <li key={i} className="text-[13px]">
                <span className="font-bold">{g.name}</span>
                {g.why && <span className="ml-1 text-cream/60"> — {g.why}</span>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Nearby stores */}
      {plan.nearby_stores && plan.nearby_stores.length > 0 && (
        <Section icon={MapPin} title="Where to get it" accent="emerald">
          <ul className="space-y-2">
            {plan.nearby_stores.map((s, i) => (
              <li key={i} className="text-[13px]">
                <div className="font-bold">{s.name}</div>
                <div className="text-cream/60">
                  for {s.purpose}
                  {s.neighborhood ? ` · ${s.neighborhood}` : ""}
                  {s.address ? ` · ${s.address}` : ""}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Weather backup */}
      {plan.weather_backup &&
        (plan.weather_backup.if_rain ||
          plan.weather_backup.if_hot ||
          plan.weather_backup.if_cold) && (
          <Section icon={CloudRain} title="Weather backup" accent="coral">
            {plan.weather_backup.if_rain && (
              <p className="text-[13px]">
                <span className="font-bold">If it rains:</span> {plan.weather_backup.if_rain}
              </p>
            )}
            {plan.weather_backup.if_hot && (
              <p className="mt-1 text-[13px]">
                <span className="font-bold">If it's hot:</span> {plan.weather_backup.if_hot}
              </p>
            )}
            {plan.weather_backup.if_cold && (
              <p className="mt-1 text-[13px]">
                <span className="font-bold">If it's cold:</span> {plan.weather_backup.if_cold}
              </p>
            )}
          </Section>
        )}

      {/* Pickup links — merges Claude's links with auto-derived
          Instacart / Maps deeplinks. */}
      {pickupLinks.length > 0 && (
        <Section icon={Sparkles} title="Quick pickups" accent="purple">
          <ul className="grid gap-2 sm:grid-cols-2">
            {pickupLinks.map((l, i) => (
              <li key={i}>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl border-2 border-cream/15 bg-cream p-3 text-[13px] font-bold hover:border-ink hover:bg-gold/40"
                >
                  {l.label}
                  {l.notes && (
                    <span className="ml-1 block text-[11px] font-normal text-cream/60">
                      {l.notes}
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Cleanup */}
      <Section icon={Trash2} title="Cleanup checklist" accent="emerald">
        <ul className="space-y-1.5">
          {plan.cleanup_checklist.map((c, i) => (
            <li key={i} className="flex items-start gap-2 text-[13px]">
              <span className="mt-1 inline-block size-3.5 shrink-0 rounded-sm border-2 border-ink/40" />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

const accentClass = {
  coral: "border-coral/20 bg-coral/5",
  gold: "border-gold/30 bg-gold/10",
  emerald: "border-emerald-500/20 bg-emerald-500/5",
  purple: "border-purple/20 bg-purple/5",
} as const;
const iconAccentClass = {
  coral: "text-coral",
  gold: "text-amber-600",
  emerald: "text-emerald-700",
  purple: "text-purple",
} as const;

function Section({
  icon: Icon,
  title,
  accent,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  accent: keyof typeof accentClass;
  children: React.ReactNode;
}) {
  return (
    <section className={`mt-4 rounded-2xl border-2 p-4 ${accentClass[accent]}`}>
      <div className="mb-2 flex items-center gap-2">
        <Icon className={`size-4 ${iconAccentClass[accent]}`} />
        <h2 className="font-display text-base font-extrabold tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function formatPlanForShare(h: ActiveHangout): string {
  const p = h.plan;
  const lines: string[] = [
    `🎉 ${p.title}`,
    p.summary,
    "",
    `${p.guest_count} guests · ${p.budget_estimate}${h.city ? ` · ${h.city}` : ""}`,
    "",
    "MENU:",
    ...p.menu.map((m) => `  - ${m.quantity} ${m.item}`),
  ];
  if (p.drinks && p.drinks.length > 0) {
    lines.push("", "DRINKS:", ...p.drinks.map((d) => `  - ${d.quantity} ${d.item}`));
  }
  lines.push("", "TIMELINE:", ...p.setup_timeline.map((t) => `  ${t.when}  ${t.task}`));
  if (p.nearby_stores && p.nearby_stores.length > 0) {
    lines.push(
      "",
      "WHERE TO GET IT:",
      ...p.nearby_stores.map((s) => `  - ${s.name} for ${s.purpose}`),
    );
  }
  return lines.join("\n");
}
