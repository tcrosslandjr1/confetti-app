import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Apple,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Link as LinkIcon,
  Mail,
  MapPin,
  PartyPopper,
  Plus,
  Send,
  Sparkles,
  Timer,
  Upload,
  UserPlus,
  Users,
  Video,
  X,
  Zap,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { toast } from "sonner";
import { usePageview, useScrollDepth, useTimeToInteraction, trackCta } from "@/lib/analytics";

export const Route = createFileRoute("/plan/ready")({
  head: () => ({
    meta: [
      { title: "You're ready to roll — Confetti" },
      {
        name: "description",
        content: "Your day is saved. Share it, add it to your calendar, or rally the crew.",
      },
    ],
  }),
  component: ReadyPage,
});

const STOPS = [
  {
    time: "11:30 AM",
    durationMin: 75,
    name: "Bluebird Coffee Social",
    neighborhood: "East Side",
    note: "Slow brews, sunlit corner table.",
  },
  {
    time: "1:15 PM",
    durationMin: 90,
    name: "The Marigold Rooftop",
    neighborhood: "Warehouse District",
    note: "Aperitivo with skyline views.",
  },
  {
    time: "3:15 PM",
    durationMin: 90,
    name: "Lantern Hill Overlook",
    neighborhood: "Riverbend",
    note: "Golden-hour walk + photos.",
  },
  {
    time: "5:30 PM",
    durationMin: 120,
    name: "Osteria di Pesca",
    neighborhood: "Old Market",
    note: "Hand-rolled pasta, cozy booth.",
  },
];

const TRIP = {
  id: "PLN-A7K2",
  title: "Confetti — Date Night Day",
  description: "A little romance, end-to-end. 4 stops curated by Confetti.",
  // Saturday 11:30 AM – 7:30 PM (next Saturday)
  start: nextSaturdayAt(11, 30),
  end: nextSaturdayAt(19, 30),
  location: "Old Market & East Side",
};

function nextSaturdayAt(h: number, m: number) {
  const d = new Date();
  const delta = (6 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + delta);
  d.setHours(h, m, 0, 0);
  return d;
}

function fmtUTC(d: Date) {
  // YYYYMMDDTHHmmssZ
  return d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

// RFC 5545 text escaping: backslash, semicolon, comma, newline.
function icsEscape(v: string) {
  return v
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// RFC 5545 line folding at 75 octets (CRLF + single space continuation).
function foldLine(line: string) {
  if (line.length <= 75) return line;
  const out: string[] = [];
  let i = 0;
  while (i < line.length) {
    const chunk = line.slice(i, i + (i === 0 ? 75 : 74));
    out.push((i === 0 ? "" : " ") + chunk);
    i += i === 0 ? 75 : 74;
  }
  return out.join("\r\n");
}

// Parse "11:30 AM" into hours/minutes on the trip's start date.
function stopDate(label: string, base: Date) {
  const m = label.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return new Date(base);
  let h = parseInt(m[1], 10) % 12;
  if (m[3].toUpperCase() === "PM") h += 12;
  const d = new Date(base);
  d.setHours(h, parseInt(m[2], 10), 0, 0);
  return d;
}

function buildIcs() {
  const stamp = fmtUTC(new Date());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Loop//Plan//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${icsEscape(TRIP.title)}`,
  ];

  // Umbrella event covering the full day
  const summaryLines = STOPS.map((s) => `${s.time} — ${s.name} (${s.neighborhood})`).join("\n");
  lines.push(
    "BEGIN:VEVENT",
    `UID:${TRIP.id}@confetti.app`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${fmtUTC(TRIP.start)}`,
    `DTEND:${fmtUTC(TRIP.end)}`,
    `SUMMARY:${icsEscape(TRIP.title)}`,
    `DESCRIPTION:${icsEscape(`${TRIP.description}\n\nItinerary:\n${summaryLines}`)}`,
    `LOCATION:${icsEscape(TRIP.location)}`,
    "END:VEVENT",
  );

  // One sub-event per stop so each shows up on the calendar
  STOPS.forEach((s, i) => {
    const start = stopDate(s.time, TRIP.start);
    const end = new Date(start.getTime() + s.durationMin * 60_000);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${TRIP.id}-${i + 1}@confetti.app`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${fmtUTC(start)}`,
      `DTEND:${fmtUTC(end)}`,
      `SUMMARY:${icsEscape(`${i + 1}. ${s.name}`)}`,
      `DESCRIPTION:${icsEscape(`${s.note}\n\nPart of ${TRIP.title}.`)}`,
      `LOCATION:${icsEscape(`${s.name}, ${s.neighborhood}`)}`,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${icsEscape(`Heads up — ${s.name} in 15 min`)}`,
      "TRIGGER:-PT15M",
      "END:VALARM",
      "END:VEVENT",
    );
  });

  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n");
}

function buildGoogleUrl() {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: TRIP.title,
    dates: `${fmtUTC(TRIP.start)}/${fmtUTC(TRIP.end)}`,
    details:
      `${TRIP.description}\n\n` +
      STOPS.map((s) => `${s.time} — ${s.name} (${s.neighborhood})`).join("\n"),
    location: TRIP.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

import {
  loadInvites,
  loadInviteVideo,
  saveInvites,
  saveInviteVideo,
  subscribeInvites,
  type Invite,
} from "@/lib/invites";
import { loadVotes, subscribeVotes, tallyStop, type TripVotes } from "@/lib/votes";
import { supabase } from "@/integrations/supabase/client";

import { checkStopFits, dayKeyFromDate } from "@/lib/hours";
import {
  clearStatus,
  formatUpdatedAt,
  loadStatus,
  setMinutesLate,
  shiftTimeLabel,
  subscribeStatus,
  type TripStatus,
} from "@/lib/trip-status";
import { LiveElapsed } from "@/components/LiveElapsed";

function makeToken() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 10);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ReadyPage() {
  const [showLoop, setShowLoop] = useState(true);
  usePageview("plan_ready", "/plan/ready");
  useScrollDepth("/plan/ready");
  useTimeToInteraction("/plan/ready");
  const [copied, setCopied] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [invites, setInvitesState] = useState<Invite[]>([]);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);
  const [votes, setVotes] = useState<TripVotes>({});
  const [collabCopied, setCollabCopied] = useState(false);
  const [status, setStatus] = useState<TripStatus | null>(null);
  const [customLate, setCustomLate] = useState("");

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return `https://confetti.app/trips/${TRIP.id}`;
    return `${window.location.origin}/trips/${TRIP.id}`;
  }, []);

  const rsvpOrigin = useMemo(() => {
    if (typeof window === "undefined") return "https://confetti.app";
    return window.location.origin;
  }, []);

  const collabUrl = useMemo(() => `${rsvpOrigin}/collab/${TRIP.id}`, [rsvpOrigin]);

  function inviteUrl(token: string) {
    const base = `${rsvpOrigin}/rsvp/${TRIP.id}?invite=${token}`;
    return videoUrl ? `${base}&v=${encodeURIComponent(videoUrl)}` : base;
  }

  // Hydrate from localStorage + subscribe to RSVP updates from the rsvp route.
  useEffect(() => {
    setInvitesState(loadInvites(TRIP.id));
    setVideoUrl(loadInviteVideo(TRIP.id));
    setVotes(loadVotes(TRIP.id));
    setStatus(loadStatus(TRIP.id));

    const unsub = subscribeInvites(TRIP.id, () => {
      setInvitesState(loadInvites(TRIP.id));
      setVideoUrl(loadInviteVideo(TRIP.id));
    });
    const unsubVotes = subscribeVotes(TRIP.id, () => setVotes(loadVotes(TRIP.id)));
    const unsubStatus = subscribeStatus(TRIP.id, () => setStatus(loadStatus(TRIP.id)));
    return () => {
      unsub();
      unsubVotes();
      unsubStatus();
    };
  }, []);

  function applyLate(minutes: number) {
    const next = setMinutesLate(TRIP.id, minutes);
    setStatus(next);
    if (minutes === 0) toast.success("Marked back on time ✓");
    else
      toast.success(`Running ~${minutes} min late ✓`, {
        description: "Guests will see the updated status on their invite.",
      });
  }

  function applyCustomLate() {
    const n = parseInt(customLate, 10);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Enter a number of minutes.");
      return;
    }
    applyLate(n);
    setCustomLate("");
  }

  function resetStatus() {
    clearStatus(TRIP.id);
    setStatus(null);
    toast.success("Status cleared");
  }

  async function copyCollabLink() {
    try {
      await navigator.clipboard.writeText(collabUrl);
      setCollabCopied(true);
      toast.success("Collab link copied", {
        description: "Anyone with the link can vote on each stop.",
      });
      setTimeout(() => setCollabCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — long-press the link instead.");
    }
  }

  async function handleVideoUpload(file: File) {
    if (!file.type.startsWith("video/")) {
      toast.error("That's not a video file.");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error("Video too large", { description: "Max 100 MB." });
      return;
    }
    setVideoUploading(true);
    setVideoProgress(5);
    try {
      const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
      const path = `${TRIP.id}/${crypto.randomUUID()}.${ext}`;
      // Fake-progress ticker for UX (Supabase JS SDK doesn't expose upload progress yet)
      const ticker = setInterval(
        () => setVideoProgress((p) => (p === null ? p : Math.min(p + 7, 90))),
        250,
      );
      const { error } = await supabase.storage.from("invite-videos").upload(path, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });
      clearInterval(ticker);
      if (error) throw error;
      const { data } = supabase.storage.from("invite-videos").getPublicUrl(path);
      setVideoUrl(data.publicUrl);
      saveInviteVideo(TRIP.id, data.publicUrl);
      setVideoProgress(100);
      toast.success("Video added", { description: "Guests will see it on their invite link." });
    } catch (err) {
      console.error("Video upload failed", err);
      toast.error("Couldn't upload video. Try again.");
    } finally {
      setVideoUploading(false);
      setTimeout(() => setVideoProgress(null), 800);
    }
  }

  function removeVideo() {
    setVideoUrl(null);
    saveInviteVideo(TRIP.id, null);
    toast.success("Video removed");
  }

  function persist(next: Invite[]) {
    setInvitesState(next);
    saveInvites(TRIP.id, next);
  }

  useEffect(() => {
    const t = setTimeout(() => setShowLoop(false), 2500);
    return () => clearTimeout(t);
  }, []);

  function addInvite(e?: React.FormEvent) {
    e?.preventDefault();
    const value = emailInput.trim().toLowerCase();
    if (!value) return;
    if (!EMAIL_RE.test(value)) {
      setEmailError("That doesn't look like a valid email.");
      return;
    }
    if (invites.some((i) => i.email === value)) {
      setEmailError("Already on the list.");
      return;
    }
    persist([
      ...invites,
      { id: crypto.randomUUID(), email: value, token: makeToken(), status: "pending" },
    ]);
    setEmailInput("");
    setEmailError(null);
  }

  function removeInvite(id: string) {
    persist(invites.filter((i) => i.id !== id));
  }

  async function copyInvite(token: string) {
    try {
      await navigator.clipboard.writeText(inviteUrl(token));
      toast.success("Invite link copied");
    } catch {
      toast.error("Couldn't copy. Long-press the link instead.");
    }
  }

  async function copyAllInvites() {
    if (!invites.length) return;
    const lines = invites.map((i) => `${i.email} → ${inviteUrl(i.token)}`).join("\n");
    try {
      await navigator.clipboard.writeText(lines);
      toast.success(`Copied ${invites.length} invite link${invites.length > 1 ? "s" : ""}`);
    } catch {
      toast.error("Couldn't copy the list.");
    }
  }

  function sendInvites() {
    if (!invites.length) return;
    const subject = `You're invited: ${TRIP.title}`;
    const intro = `Hey — I just locked in plans and want you in.\n\n${TRIP.title}\n${TRIP.description}\n`;
    const to = invites.map((i) => i.email).join(",");
    const body = invites.map((i) => `• ${i.email}\n  ${inviteUrl(i.token)}`).join("\n\n");
    const url = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(intro + "\n" + body)}`;
    window.location.href = url;
    persist(invites.map((i) => (i.status === "pending" ? { ...i, status: "sent" as const } : i)));
    toast.success("Opening your email app…", {
      description: `${invites.length} invite${invites.length > 1 ? "s" : ""} ready to send.`,
    });
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied", { description: "Send it to whoever's coming along." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — long-press the link instead.");
    }
  }

  function downloadIcs() {
    try {
      const ics = buildIcs();
      const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `confetti-${TRIP.id}.ics`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      toast.success("Calendar file downloaded", {
        description: "Open confetti-" + TRIP.id + ".ics to add all 4 stops.",
      });
    } catch (err) {
      console.error("ICS export failed", err);
      toast.error("Couldn't build the calendar file. Try again.");
    }
  }

  function openGoogle() {
    window.open(buildGoogleUrl(), "_blank", "noopener,noreferrer");
    toast.success("Opening Google Calendar…");
  }

  async function appleInvites() {
    const text = `${TRIP.title}\n${TRIP.description}\n\n${shareUrl}`;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share({
          title: TRIP.title,
          text,
          url: shareUrl,
        });
        return;
      } catch {
        // user cancelled or unsupported — fall through
      }
    }
    await navigator.clipboard?.writeText(text);
    toast.success("Invite text copied", {
      description: "Paste it into Apple Invites or Messages.",
    });
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <SiteHeader />

      {/* Soft glow background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[420px] bg-gradient-to-b from-primary/15 via-coral/10 to-transparent blur-2xl"
      />

      {/* Confetti burst */}
      {showLoop && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-24 z-0 mx-auto h-64 max-w-3xl"
        >
          {Array.from({ length: 28 }).map((_, i) => {
            const left = (i * 37) % 100;
            const delay = (i % 8) * 0.08;
            const colors = [
              "bg-primary",
              "bg-coral",
              "bg-purple",
              "bg-amber-400",
              "bg-emerald-500",
            ];
            const color = colors[i % colors.length];
            return (
              <span
                key={i}
                className={`absolute top-0 h-2.5 w-2.5 rounded-sm ${color} animate-confetti-fall`}
                style={{
                  left: `${left}%`,
                  animationDelay: `${delay}s`,
                  transform: `rotate(${(i * 23) % 360}deg)`,
                }}
              />
            );
          })}
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-12 pb-28 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-coral text-primary-foreground shadow-pop">
            <CheckCircle2 className="h-8 w-8" strokeWidth={2.5} />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" /> Plan saved · {TRIP.id}
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            You're <span className="text-gradient">ready to roll.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Your day is locked in. Share it with the crew, drop it in your calendar, then just show
            up.
          </p>

          {/* Primary next-step row */}
          <div className="mx-auto mt-6 flex max-w-md flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                trackCta("share_with_crew", { path: "/plan/ready" });
                const url = typeof window !== "undefined" ? window.location.href : "";
                if (typeof navigator !== "undefined" && navigator.share) {
                  navigator
                    .share({ title: TRIP.title, text: TRIP.description, url })
                    .catch(() => {});
                } else {
                  navigator.clipboard?.writeText(url);
                  toast.success("Link copied — send it to the crew.");
                }
              }}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-cream shadow-pop transition-transform hover:-translate-y-0.5"
            >
              <Send className="h-4 w-4" /> Share with the crew
            </button>
            <Link
              to="/passport"
              onClick={() => trackCta("earn_confetti", { path: "/plan/ready" })}
              className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-ink bg-cream px-5 text-sm font-bold text-ink transition-transform hover:-translate-y-0.5 hover:bg-gold"
            >
              <Sparkles className="h-4 w-4" /> Earn Confetti
            </Link>
          </div>
        </div>

        {/* Running late / reschedule */}
        <section className="mt-8 overflow-hidden rounded-3xl border border-border bg-card shadow-card">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-gradient-to-r from-amber-500/10 to-coral/10 p-4 sm:px-5">
            <div className="flex items-center gap-2">
              <span
                className={`relative grid h-9 w-9 place-items-center rounded-xl ${status && status.minutesLate > 0 ? "bg-amber-500/20 text-amber-700" : "bg-emerald-500/15 text-emerald-700"}`}
              >
                {status && status.minutesLate > 0 ? (
                  <Timer className="h-4 w-4" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                {status && status.minutesLate > 0 && (
                  <>
                    <span
                      aria-hidden
                      className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-500"
                    />
                    <span
                      aria-hidden
                      className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-ping rounded-full bg-amber-500/70"
                    />
                  </>
                )}
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Day-of status
                </p>
                <p className="mt-0.5 text-sm font-semibold">
                  {status && status.minutesLate > 0
                    ? `Running ~${status.minutesLate} min late`
                    : "On time — everything is on schedule"}
                </p>
              </div>
            </div>
            {status && (
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span>
                  {formatUpdatedAt(status.updatedAt)} · <LiveElapsed since={status.updatedAt} />
                </span>
                <button
                  type="button"
                  onClick={resetStatus}
                  className="rounded-full border border-border bg-card px-2.5 py-1 font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  Clear
                </button>
              </div>
            )}
          </header>

          <div className="space-y-3 p-4 sm:p-5">
            <p className="text-xs text-muted-foreground">
              Tap a delay — guests on the shareable link see a live status badge and the times shift
              automatically.
            </p>
            <div className="flex flex-wrap gap-2">
              {[0, 15, 30, 45, 60].map((m) => {
                const active = (status?.minutesLate ?? 0) === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => applyLate(m)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all hover:-translate-y-0.5 ${
                      active
                        ? "border-transparent bg-gradient-to-br from-amber-500 to-coral text-primary-foreground shadow-pop"
                        : "border-border bg-card text-foreground hover:border-primary"
                    }`}
                  >
                    {m === 0 ? "On time" : `+${m} min`}
                    {active && <Check className="h-3 w-3" />}
                  </button>
                );
              })}
              <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-1">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={240}
                  placeholder="Custom"
                  value={customLate}
                  onChange={(e) => setCustomLate(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applyCustomLate();
                    }
                  }}
                  className="w-16 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                />
                <span className="text-[10px] text-muted-foreground">min</span>
                <button
                  type="button"
                  onClick={applyCustomLate}
                  className="rounded-full bg-foreground px-2.5 py-1 text-[11px] font-semibold text-background transition-colors hover:opacity-90"
                >
                  Set
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Recap card */}
        <section className="relative mt-8 overflow-hidden rounded-3xl border border-border bg-card shadow-card">
          {status?.cancelled && (
            <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-rose-500/15 backdrop-blur-[1px]">
              <span className="-rotate-6 rounded-2xl border-[3px] border-rose-700 bg-rose-100 px-6 py-2 text-2xl font-black uppercase tracking-widest text-rose-700 shadow-[6px_6px_0_0_hsl(var(--foreground))]">
                Cancelled
              </span>
            </div>
          )}
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-gradient-to-r from-primary/5 to-coral/5 p-5 sm:p-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Saturday · Date night
              </p>
              <p className="mt-0.5 font-display text-xl font-semibold">
                A little romance, end-to-end
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {status?.cancelled && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-2.5 py-1 font-semibold text-rose-700">
                  <X className="h-3 w-3" /> Cancelled · {formatUpdatedAt(status.updatedAt)}
                </span>
              )}
              {status?.rescheduledAt && !status.cancelled && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/15 px-2.5 py-1 font-semibold text-sky-700">
                  <Calendar className="h-3 w-3" /> Rescheduled ·{" "}
                  {new Date(status.rescheduledAt).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
              {status && status.minutesLate > 0 && !status.cancelled && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 font-semibold text-amber-700">
                  <span className="relative inline-flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                  </span>
                  Running ~{status.minutesLate} min late · {formatUpdatedAt(status.updatedAt)} ·{" "}
                  <LiveElapsed since={status.updatedAt} />
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> 11:30 AM – 7:30 PM
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> 4 stops · ~6.5 mi
              </span>
            </div>
          </header>
          <ol className="divide-y divide-border">
            {STOPS.map((s, i) => {
              const fit = checkStopFits(s.name, s.time, s.durationMin, dayKeyFromDate(TRIP.start));
              return (
                <li key={i} className="flex items-center gap-4 p-4 sm:px-6">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{s.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.neighborhood}
                      {fit.state !== "unknown" && (
                        <>
                          {" "}
                          · <span className="font-medium">{fit.hoursLabel}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {status && status.minutesLate > 0 ? (
                      <span className="flex items-baseline gap-1.5">
                        <span className="text-xs text-muted-foreground line-through">{s.time}</span>
                        <span className="text-sm font-semibold text-amber-700">
                          {shiftTimeLabel(s.time, status.minutesLate)}
                        </span>
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-muted-foreground">{s.time}</span>
                    )}
                    {fit.state === "open" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                        <Check className="h-3 w-3" /> Open
                      </span>
                    )}
                    {fit.state === "tight" && (
                      <span
                        title={`Runs ${fit.minutesAfterClose} min past close`}
                        className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700"
                      >
                        <AlertTriangle className="h-3 w-3" /> Tight
                      </span>
                    )}
                    {fit.state === "closed" && (
                      <span
                        title={fit.reason}
                        className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive"
                      >
                        <AlertTriangle className="h-3 w-3" /> {fit.reason}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Shareable link */}
        <section className="mt-6 rounded-3xl border border-border bg-card p-4 shadow-card sm:p-5">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <LinkIcon className="h-3.5 w-3.5 text-primary" /> Shareable trip link
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
              <span className="truncate font-mono text-xs text-foreground">{shareUrl}</span>
            </div>
            <button
              onClick={copyLink}
              className={`inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary hover:shadow-pop ${copied ? "border-primary text-primary" : ""}`}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Anyone with the link can view the plan. They don't need an account.
          </p>
        </section>

        {/* Calendar + invites */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <button
            onClick={downloadIcs}
            className="group inline-flex flex-col items-start gap-1.5 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-pop"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background">
              <Apple className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold">Apple Calendar</span>
            <span className="text-[11px] text-muted-foreground">Downloads a .ics file</span>
          </button>
          <button
            onClick={openGoogle}
            className="group inline-flex flex-col items-start gap-1.5 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-pop"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-emerald-500 to-amber-500 text-white">
              <Calendar className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold">Google Calendar</span>
            <span className="text-[11px] text-muted-foreground">Opens a pre-filled event</span>
          </button>
          <button
            onClick={appleInvites}
            className="group inline-flex flex-col items-start gap-1.5 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-pop"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 text-white">
              <Send className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold">Apple Invites</span>
            <span className="text-[11px] text-muted-foreground">Share via system sheet</span>
          </button>
        </div>

        {/* Build the night together — collaborative voting */}
        <section className="mt-6 rounded-3xl border border-border bg-card p-4 shadow-card sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Users className="h-3.5 w-3.5 text-primary" /> Build the night together
            </div>
            {(() => {
              const ids = new Set<string>();
              Object.values(votes).forEach((s) => Object.keys(s).forEach((id) => ids.add(id)));
              return ids.size > 0 ? (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  {ids.size} {ids.size === 1 ? "voter" : "voters"}
                </span>
              ) : null;
            })()}
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
              <span className="truncate font-mono text-xs text-foreground">{collabUrl}</span>
            </div>
            <button
              onClick={copyCollabLink}
              className={`inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary hover:shadow-pop ${collabCopied ? "border-primary text-primary" : ""}`}
            >
              {collabCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {collabCopied ? "Copied" : "Copy collab link"}
            </button>
          </div>

          <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border">
            {STOPS.map((s, i) => {
              const t = tallyStop(votes, i);
              const total = t.in + t.maybe + t.out;
              const inPct = total ? (t.in / total) * 100 : 0;
              const maybePct = total ? (t.maybe / total) * 100 : 0;
              const outPct = total ? (t.out / total) * 100 : 0;
              return (
                <li key={i} className="space-y-2 bg-muted/20 p-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{s.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{s.neighborhood}</p>
                    </div>
                    <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">
                      {total} vote{total === 1 ? "" : "s"}
                    </span>
                  </div>
                  {total > 0 ? (
                    <>
                      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${inPct}%` }}
                        />
                        <div
                          className="h-full bg-amber-400 transition-all duration-300"
                          style={{ width: `${maybePct}%` }}
                        />
                        <div
                          className="h-full bg-muted-foreground transition-all duration-300"
                          style={{ width: `${outPct}%` }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {t.in} in
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> {t.maybe} maybe
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" /> {t.out}{" "}
                          out
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      No votes yet — share the link to get the crew involved.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>

          <p className="mt-3 text-[11px] text-muted-foreground">
            Anyone with the link can weigh in on each stop. Tallies update live so you can swap
            what's not landing.
          </p>
        </section>

        {/* Personal invite video */}
        <section className="mt-6 rounded-3xl border border-border bg-card p-4 shadow-card sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Video className="h-3.5 w-3.5 text-primary" /> Personal invite video
            </div>
            {videoUrl && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                <Check className="h-3 w-3" /> Attached
              </span>
            )}
          </div>

          {!videoUrl && !videoUploading && (
            <label className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/30 px-4 py-6 text-center transition-colors hover:border-primary hover:bg-primary/5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Upload className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold">Upload a short video</span>
              <span className="text-[11px] text-muted-foreground">
                MP4, MOV or WebM · up to 100 MB
              </span>
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/webm,video/ogg"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleVideoUpload(f);
                  e.currentTarget.value = "";
                }}
              />
            </label>
          )}

          {videoUploading && (
            <div className="mt-3 rounded-2xl border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-primary" />
                Uploading your invite video…
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full bg-gradient-to-r from-primary to-coral transition-[width] duration-200"
                  style={{ width: `${videoProgress ?? 0}%` }}
                />
              </div>
            </div>
          )}

          {videoUrl && !videoUploading && (
            <div className="mt-3 space-y-2">
              <video
                src={videoUrl}
                controls
                playsInline
                className="aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black object-cover"
              />
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary hover:shadow-pop">
                  <Upload className="h-3.5 w-3.5" /> Replace video
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm,video/ogg"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleVideoUpload(f);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={removeVideo}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-destructive hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
            </div>
          )}

          <p className="mt-2 text-[11px] text-muted-foreground">
            Plays at the top of every invite link, before the animated walkthrough of your day.
          </p>
        </section>

        {/* Invite the crew */}
        <section className="mt-6 rounded-3xl border border-border bg-card p-4 shadow-card sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <UserPlus className="h-3.5 w-3.5 text-primary" /> Invite the crew
            </div>
            {invites.length > 0 &&
              (() => {
                const going = invites.filter((i) => i.status === "accepted").length;
                return (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    {going > 0
                      ? `${going} going · ${invites.length} invited`
                      : `${invites.length} invited`}
                  </span>
                );
              })()}
          </div>

          <form onSubmit={addInvite} className="mt-3 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="friend@email.com"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "invite-email-error" : undefined}
                className={`w-full rounded-xl border bg-background py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary ${emailError ? "border-destructive" : "border-border"}`}
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-all hover:-translate-y-0.5 hover:shadow-pop"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </form>
          {emailError && (
            <p id="invite-email-error" className="mt-1.5 text-[11px] font-medium text-destructive">
              {emailError}
            </p>
          )}

          {invites.length > 0 ? (
            <>
              <ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border">
                {invites.map((i) => (
                  <li key={i.id} className="flex items-center gap-3 bg-muted/30 px-3 py-2.5">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold uppercase text-primary">
                      {i.email[0]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{i.email}</p>
                      <p className="truncate font-mono text-[11px] text-muted-foreground">
                        {inviteUrl(i.token)}
                      </p>
                    </div>
                    {i.status === "accepted" ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                        <Check className="h-3 w-3" /> Going
                      </span>
                    ) : i.status === "declined" ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
                        <X className="h-3 w-3" /> Can't make it
                      </span>
                    ) : i.status === "sent" ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        <Check className="h-3 w-3" /> Sent
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600">
                        Pending
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => copyInvite(i.token)}
                      title="Copy this invite link"
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-primary"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeInvite(i.id)}
                      title="Remove"
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={sendInvites}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-pop transition-all hover:-translate-y-0.5"
                >
                  <Send className="h-4 w-4" /> Send {invites.length} invite
                  {invites.length > 1 ? "s" : ""}
                </button>
                <button
                  type="button"
                  onClick={copyAllInvites}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary hover:shadow-pop"
                >
                  <Copy className="h-4 w-4" /> Copy all links
                </button>
              </div>
            </>
          ) : (
            <p className="mt-3 text-[11px] text-muted-foreground">
              Add anyone you want to invite. Each gets a unique link they can RSVP with — no account
              needed.
            </p>
          )}
        </section>

        {/* Primary CTAs */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/trips"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-pop transition-pop hover:scale-[1.02] sm:w-auto"
          >
            <PartyPopper className="h-4 w-4" /> View in my trips
          </Link>
          <Link
            to="/create"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary sm:w-auto"
          >
            Plan another day
          </Link>
        </div>
      </div>

      {/* Sticky next-step bar — keeps Share + Earn one tap away as the page scrolls. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => {
              trackCta("share_with_crew_sticky", { path: "/plan/ready" });
              const url = typeof window !== "undefined" ? window.location.href : "";
              if (typeof navigator !== "undefined" && navigator.share) {
                navigator.share({ title: TRIP.title, text: TRIP.description, url }).catch(() => {});
              } else {
                navigator.clipboard?.writeText(url);
                toast.success("Link copied — send it to the crew.");
              }
            }}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-ink text-sm font-bold text-cream shadow-pop transition-transform hover:-translate-y-0.5"
          >
            <Send className="h-4 w-4" /> Share
          </button>
          <Link
            to="/passport"
            onClick={() => trackCta("earn_confetti_sticky", { path: "/plan/ready" })}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border-2 border-ink bg-cream text-sm font-bold text-ink transition-transform hover:-translate-y-0.5 hover:bg-gold"
          >
            <Sparkles className="h-4 w-4" /> Earn Confetti
          </Link>
        </div>
      </div>
    </div>
  );
}
