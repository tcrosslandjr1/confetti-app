import { useAuth, type ViewAs } from "@/lib/auth-context";
import { useNavigate } from "@tanstack/react-router";
import {
  Shield,
  User as UserIcon,
  Eye,
  X,
  ChevronUp,
  ChevronDown,
  Repeat,
  Briefcase,
} from "lucide-react";
import { useState } from "react";
import { logSecurityTrace } from "@/lib/security-trace";

type Option = {
  value: ViewAs;
  label: string;
  Icon: typeof Shield;
  blurb: string;
  home: "/" | "/portal" | "/admin" | "/advertise/portal";
  tone: string; // tailwind classes for active chip
};

const OPTIONS: Option[] = [
  {
    value: "admin",
    label: "Admin",
    Icon: Shield,
    blurb: "Full console + moderation",
    home: "/admin",
    tone: "bg-ink text-cream",
  },
  {
    value: "business",
    label: "Business",
    Icon: Briefcase,
    blurb: "Advertiser portal & venues",
    home: "/advertise/portal",
    tone: "bg-purple text-cream",
  },
  {
    value: "customer",
    label: "Customer",
    Icon: UserIcon,
    blurb: "Portal, planning & bookings",
    home: "/portal",
    tone: "bg-coral text-cream",
  },
  {
    value: "visitor",
    label: "Visitor",
    Icon: Eye,
    blurb: "Marketing pages only",
    home: "/",
    tone: "bg-gold text-ink",
  },
];

/**
 * Floating role-impersonation switcher for real admins.
 *
 * Two pieces:
 *  1) A persistent top banner whenever the admin is viewing as customer/visitor
 *     — surfaces the impersonated role, the real admin identity, and a quick
 *     way to swap roles or exit back to admin.
 *  2) A bottom-right dock with one-tap chips for each role.
 *
 * UI-only: RLS still enforces real permissions on the server.
 */
export function RoleSwitcher() {
  const { isAdmin, viewAs, setViewAs, isImpersonating, exitImpersonation, user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // UI-only switcher — visible in every view so you can preview each role.
  // Real permissions are still enforced server-side by RLS.

  const goToRole = (value: ViewAs) => {
    const opt = OPTIONS.find((o) => o.value === value)!;
    const previous = viewAs;
    setViewAs(value);
    logSecurityTrace({
      kind: "view-switch",
      outcome: "info",
      actorRole: value,
      realRole: "admin",
      userId: user?.id ?? null,
      userEmail: user?.email ?? null,
      fromRole: previous,
      toRole: value,
      path: opt.home,
      note: `Admin switched viewAs ${previous} → ${value}`,
    });
    navigate({ to: opt.home });
  };

  const exitAndReturn = () => {
    const previous = viewAs;
    exitImpersonation();
    logSecurityTrace({
      kind: "view-exit",
      outcome: "info",
      actorRole: "admin",
      realRole: "admin",
      userId: user?.id ?? null,
      userEmail: user?.email ?? null,
      fromRole: previous,
      toRole: "admin",
      path: "/admin",
      note: `Exited impersonation (${previous})`,
    });
    navigate({ to: "/admin" });
  };

  const current = OPTIONS.find((o) => o.value === viewAs)!;

  return (
    <>
      {isImpersonating && (
        <div
          role="status"
          aria-live="polite"
          className="relative z-[70] border-b border-amber-600/40 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-amber-950 shadow-md"
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 text-xs sm:text-sm">
            <div className="flex items-center gap-2 font-semibold">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-950/15">
                <current.Icon className="h-3.5 w-3.5" />
              </span>
              <span>
                Viewing as <span className="uppercase tracking-wide">{current.label}</span>
              </span>
              <span className="hidden text-amber-950/70 sm:inline">— {current.blurb}</span>
              {user?.email && (
                <span className="hidden rounded-full bg-amber-950/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider md:inline">
                  signed in as {user.email}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden text-[11px] uppercase tracking-wider text-amber-950/70 sm:inline">
                Switch:
              </span>
              <div className="flex items-center gap-1 rounded-full bg-amber-950/10 p-1">
                {OPTIONS.map(({ value, label, Icon }) => {
                  const active = viewAs === value;
                  return (
                    <button
                      key={value}
                      onClick={() => goToRole(value)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                        active
                          ? "bg-amber-950 text-amber-50 shadow"
                          : "text-amber-950 hover:bg-amber-950/15"
                      }`}
                      aria-pressed={active}
                    >
                      <Icon className="h-3 w-3" />
                      {label}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={exitAndReturn}
                className="inline-flex items-center gap-1 rounded-full bg-amber-950 px-3 py-1 text-[11px] font-bold text-amber-50 transition hover:bg-amber-950/90"
                title="Return to your real admin view"
              >
                <X className="h-3 w-3" /> Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom-right dock */}
      <div
        className={`fixed bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] left-4 right-4 z-[90] rounded-2xl border-2 bg-cream/95 shadow-brut backdrop-blur transition sm:left-auto sm:max-w-[26rem] lg:bottom-4 ${
          isImpersonating ? "border-coral ring-2 ring-coral/40" : "border-ink"
        }`}
      >
        {open ? (
          <div className="space-y-2 p-2">
            <div className="flex items-center justify-between gap-3 px-2 pt-1">
              <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/70">
                <Repeat className="h-3 w-3" /> View as
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-ink/60 transition hover:text-ink"
                aria-label="Hide switcher"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
              {OPTIONS.map(({ value, label, Icon, blurb, tone }) => {
                const active = viewAs === value;
                return (
                  <button
                    key={value}
                    onClick={() => goToRole(value)}
                    className={`group flex flex-col items-start gap-0.5 rounded-xl border-2 px-3 py-2 text-left text-xs font-bold transition-pop ${
                      active
                        ? `${tone} border-ink shadow-brut`
                        : "border-transparent text-ink/70 hover:-translate-y-0.5 hover:border-ink hover:bg-cream hover:text-ink"
                    }`}
                    aria-pressed={active}
                    title={blurb}
                  >
                    <span className="flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </span>
                    <span
                      className={`font-mono text-[9px] font-normal uppercase tracking-wider leading-tight ${
                        active ? "opacity-90" : "opacity-70"
                      }`}
                    >
                      {blurb}
                    </span>
                  </button>
                );
              })}
            </div>

            {isImpersonating && (
              <button
                onClick={exitAndReturn}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-ink bg-ink px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-cream transition-pop hover:-translate-y-0.5 hover:shadow-brut"
              >
                <X className="h-3 w-3" /> Exit impersonation
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold ${
              isImpersonating ? "text-coral" : "text-ink"
            }`}
            title={`Currently viewing as ${current.label}`}
          >
            <span
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${current.tone}`}
              aria-hidden
            >
              <current.Icon className="h-3 w-3" />
            </span>
            <span className="hidden sm:inline text-ink/60 font-mono text-[10px] uppercase tracking-widest">
              View as
            </span>
            <span className="font-mono text-[11px] uppercase tracking-widest">{current.label}</span>
            <ChevronUp className="h-3 w-3 opacity-60" />
          </button>
        )}
      </div>
    </>
  );
}
