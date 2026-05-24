import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
  Apple,
  Wallet,
  Loader2,
  X,
  Smartphone,
  Navigation,
  Plane,
  Printer,
  Share2,
  Link2,
  Image as ImageIcon,
  FileText,
  Check,
  Mail,
  CalendarPlus,
  MoreVertical,
  ArrowLeftRight,
  Trash2,
  GripVertical,
} from "lucide-react";
import {
  checkInStop,
  removeStop,
  reorderStops,
  replaceStop,
  setActiveLoop,
  type ActiveLoop,
  type LoopStop,
  type StopKind,
} from "@/lib/loop-store";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { VenuePickerModal, venueToStopPayload, type PickedVenue } from "@/components/loop/VenuePickerModal";
import { PartnerPickBadge } from "@/components/PartnerPickBadge";
import { appendNotifications } from "@/lib/trip-status";
import { logActivity } from "@/lib/activity-log";
import { fetchVenueIntel, type VenueIntel, type FetchStatus } from "@/lib/agents/venue-intel";
import { ConfettiMap } from "@/components/maps/ConfettiMap";
import { ParkingPin } from "@/components/loop/ParkingPin";
import { buildDirectionsUrl, type GeocodeResult } from "@/lib/geocode";
import { trackWalletEvent } from "@/lib/wallet-analytics";
import { trackShareEvent } from "@/lib/share-analytics";
import { RerunButtons } from "@/components/loop/RerunButtons";

function isAndroid() {
  if (typeof navigator === "undefined") return false;
  return /android/i.test(navigator.userAgent);
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // iPad on iPadOS 13+ reports as "MacIntel" with touch — include that case.
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" &&
      (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints! > 1)
  );
}

/**
 * Try to open a URL in a new tab. Returns true if the browser appears to have
 * accepted the navigation (popup not blocked). On iOS Safari, window.open
 * called outside a direct user gesture (e.g. after an `await`) usually returns
 * null — that's our signal to fall back to the QR modal.
 */
function tryOpenInNewTab(url: string): boolean {
  try {
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (!win || win.closed || typeof win.closed === "undefined") return false;
    return true;
  } catch {
    return false;
  }
}

// ─── Helpers to derive rich fields from ActiveLoop ─────────────────────
function stopKind(stop: LoopStop, i: number, total: number): StopKind {
  if (stop.kind) return stop.kind;
  if (i === 0) return "departure";
  if (i === total - 1) return "destination";
  return "layover";
}

function defaultEmoji(kind: StopKind) {
  return kind === "departure" ? "🥂" : kind === "destination" ? "🌟" : "⚡";
}

function vibesOf(loop: ActiveLoop): string[] {
  if (loop.vibes?.length) return loop.vibes;
  if (loop.vibe) return [`✨ ${loop.vibe}`];
  return [];
}

// ─── Tone tokens (mapped to design system, no raw colors) ──────────────
const kindStyles: Record<StopKind, { marker: string; label: string; line: string }> = {
  departure: { marker: "bg-coral text-cream", label: "text-coral", line: "border-coral/40" },
  layover: { marker: "bg-gold text-ink", label: "text-ink/70", line: "border-ink/30" },
  destination: { marker: "bg-ink text-cream", label: "text-ink", line: "border-ink/40" },
};

const tagToneClass: Record<NonNullable<LoopStop["tags"]>[number]["variant"], string> = {
  vibe: "bg-coral/10 text-coral border-coral/30",
  ev: "bg-gold/30 text-ink border-ink/30",
  time: "bg-ink/5 text-ink border-ink/20",
};

// ──────────────────────────────────────────────────────────────────────
export function BoardingPass({ loop }: { loop: ActiveLoop }) {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrPending, setQrPending] = useState(false);
  const [routePoints, setRoutePoints] = useState<GeocodeResult[]>([]);
  const [bookingOpen, setBookingOpen] = useState(false);

  // Drag-to-reorder sensors. Use a small activation distance so a tap on
  // any card button still works without accidentally starting a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = loop.stops.map((s) => s.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(ids, oldIndex, newIndex);
    reorderStops(next);
    const stop = loop.stops.find((s) => s.id === active.id);
    if (stop) {
      logActivity({
        tripId: loop.id,
        actor: "You",
        kind: "rescheduled",
        message: `Moved ${stop.name} (${oldIndex + 1} → ${newIndex + 1})`,
      });
    }
  }

  // Selected stop drives the "Get Directions" action. Defaults to the next
  // un-checked-in stop; user can switch by tapping any stop in the legend.
  const defaultSelectedId = useMemo(() => {
    const next = loop.stops.find((s) => !s.done);
    return (next ?? loop.stops[0])?.id ?? null;
  }, [loop.stops]);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(defaultSelectedId);
  useEffect(() => {
    // Re-sync if the active loop changes underneath us, but keep user's pick
    // when it's still a valid stop.
    if (!selectedStopId || !loop.stops.some((s) => s.id === selectedStopId)) {
      setSelectedStopId(defaultSelectedId);
    }
  }, [defaultSelectedId, loop.stops, selectedStopId]);
  const [dirOpen, setDirOpen] = useState(false);

  const selectedStop = loop.stops.find((s) => s.id === selectedStopId) ?? loop.stops[0];
  const selectedAddress =
    selectedStop?.address ??
    selectedStop?.area ??
    `${selectedStop?.name ?? ""} ${loop.to ?? ""}`.trim();
  const appleDirUrl = selectedAddress
    ? `https://maps.apple.com/?daddr=${encodeURIComponent(selectedAddress)}&dirflg=d`
    : null;
  const googleDirUrl = selectedAddress
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedAddress)}`
    : null;
  const preferAppleFirst = isIOS();

  const fullRouteUrl = buildDirectionsUrl(routePoints, "walking");
  const vibes = vibesOf(loop);
  const reward = loop.confettiPoints ?? 250;

  // ─── Share ──────────────────────────────────────────────────────────
  const passRef = useRef<HTMLDivElement>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareBusy, setShareBusy] = useState<null | "image" | "pdf" | "link">(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return `/plan/${loop.id}`;
    return `${window.location.origin}/plan/${encodeURIComponent(loop.id)}`;
  }, [loop.id]);
  const shareTitle = `${loop.passenger ?? "My"} · Confetti Plan ${loop.from} → ${loop.to}`;
  const shareText = `Check out my Confetti plan: ${loop.from} → ${loop.to} (${loop.stops.length} stops). Boarding ${loop.boardingTime}.`;

  async function handleShareLink() {
    setShareBusy("link");
    try {
      const nav = typeof navigator !== "undefined" ? navigator : null;
      if (nav && typeof nav.share === "function") {
        await nav.share({ title: shareTitle, text: shareText, url: shareUrl });
        trackShareEvent("share_link_native", { loopId: loop.id });
        setShareOpen(false);
      } else if (nav?.clipboard) {
        await nav.clipboard.writeText(shareUrl);
        trackShareEvent("share_link_clipboard", {
          loopId: loop.id,
          meta: { reason: "no_native_share" },
        });
        setLinkCopied(true);
        toast.success("Link copied to clipboard");
        setTimeout(() => setLinkCopied(false), 2000);
      } else {
        trackShareEvent("share_error", {
          loopId: loop.id,
          meta: { source: "share_link", reason: "unsupported" },
        });
        toast.error("Sharing isn't supported on this device");
      }
    } catch (err) {
      // User-cancelled share rejects with AbortError — stay silent for that.
      const name = (err as { name?: string })?.name;
      if (name !== "AbortError") {
        trackShareEvent("share_error", {
          loopId: loop.id,
          meta: { source: "share_link", error: name },
        });
        toast.error("Couldn't share this plan");
      } else {
        trackShareEvent("share_error", {
          loopId: loop.id,
          meta: { source: "share_link", reason: "user_cancelled" },
        });
      }
    } finally {
      setShareBusy(null);
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      trackShareEvent("share_copy_link", { loopId: loop.id });
      setLinkCopied(true);
      toast.success("Link copied");
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      trackShareEvent("share_error", { loopId: loop.id, meta: { source: "copy_link" } });
      toast.error("Couldn't copy link");
    }
  }

  async function handleSaveImage() {
    if (!passRef.current) return;
    setShareBusy("image");
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(passRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#FFF7EC",
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `confetti-${loop.id}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      // If the device supports sharing files, also offer a native share sheet.
      let nativeShared = false;
      try {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `confetti-${loop.id}.png`, { type: "image/png" });
        const navAny = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
        if (navAny.canShare && navAny.canShare({ files: [file] })) {
          await navigator.share({ title: shareTitle, text: shareText, files: [file] });
          nativeShared = true;
        }
      } catch {
        /* native share is best-effort */
      }
      trackShareEvent("share_save_image", { loopId: loop.id, meta: { nativeShared } });
      toast.success("Image saved");
      setShareOpen(false);
    } catch {
      trackShareEvent("share_error", { loopId: loop.id, meta: { source: "save_image" } });
      toast.error("Couldn't generate image");
    } finally {
      setShareBusy(null);
    }
  }

  function handleSavePdf() {
    setShareBusy("pdf");
    try {
      trackShareEvent("share_save_pdf", { loopId: loop.id });
      window.print();
      setShareOpen(false);
    } finally {
      setShareBusy(null);
    }
  }

  function handleAddToCalendar() {
    try {
      // Parse loop.date (e.g. "2026-05-11" or freeform) + boardingTime ("7:30 PM")
      const pad = (n: number) => String(n).padStart(2, "0");
      const fmt = (d: Date) =>
        `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(
          d.getUTCHours(),
        )}${pad(d.getUTCMinutes())}00Z`;

      // Build a start Date by combining date + boardingTime when possible.
      let start: Date;
      const baseDate = loop.date ? new Date(loop.date) : new Date();
      if (Number.isNaN(baseDate.getTime())) {
        start = new Date();
      } else {
        start = new Date(baseDate);
        const tm = (loop.boardingTime ?? "").match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (tm) {
          let h = parseInt(tm[1], 10);
          const m = parseInt(tm[2], 10);
          const mer = tm[3]?.toUpperCase();
          if (mer === "PM" && h < 12) h += 12;
          if (mer === "AM" && h === 12) h = 0;
          start.setHours(h, m, 0, 0);
        } else {
          start.setHours(19, 0, 0, 0);
        }
      }
      // Default duration: 3 hours, or longer if many stops.
      const hours = Math.max(2, Math.min(8, loop.stops.length || 3));
      const end = new Date(start.getTime() + hours * 60 * 60 * 1000);

      const summary = `Confetti Plan: ${loop.from} → ${loop.to}`;
      const descLines = [
        `Passenger: ${loop.passenger ?? "—"}`,
        `Boarding: ${loop.boardingTime ?? "—"}  Gate: ${loop.gate ?? "—"}`,
        `Stops (${loop.stops.length}):`,
        ...loop.stops.map(
          (s, i) =>
            `  ${i + 1}. ${s.time ? s.time + " — " : ""}${s.name}${s.area ? " (" + s.area + ")" : ""}`,
        ),
        "",
        `Boarding pass: ${shareUrl}`,
      ];
      const description = descLines.join("\\n");
      const location = loop.to ?? "";
      const uid = `confetti-${loop.id}@confettiplan.app`;
      const dtstamp = fmt(new Date());

      const ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Confetti//Boarding Pass//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART:${fmt(start)}`,
        `DTEND:${fmt(end)}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${location}`,
        `URL:${shareUrl}`,
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        "DESCRIPTION:Confetti Plan starts soon",
        "TRIGGER:-PT30M",
        "END:VALARM",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n");

      const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `confetti-${loop.id}.ics`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      trackShareEvent("share_add_to_calendar", {
        loopId: loop.id,
        meta: { stops: loop.stops.length },
      });
      setShareOpen(false);
      toast.success("Calendar event downloaded");
    } catch {
      trackShareEvent("share_error", { loopId: loop.id, meta: { source: "add_to_calendar" } });
      toast.error("Couldn't create calendar event");
    }
  }

  async function addToGoogleWallet() {
    setGoogleLoading(true);
    try {
      const res = await fetch("/api/public/wallet/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loopId: loop.id,
          passenger: loop.passenger,
          from: loop.from,
          to: loop.to,
          date: loop.date,
          gate: loop.gate,
          boardingTime: loop.boardingTime,
          stops: loop.stops.map((s) => ({
            id: s.id,
            name: s.name,
            type: s.type,
            time: s.time,
            area: s.area,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 503) {
        // Wallet issuer creds aren't wired up yet — surface the QR modal in
        // "pending" mode with a placeholder URL so users still see what the
        // pass-handoff experience will look like.
        const previewUrl =
          data?.saveUrl ||
          `https://pay.google.com/gp/v/save/preview?loop=${encodeURIComponent(loop.id)}`;
        setQrPending(true);
        setQrUrl(previewUrl);
        trackWalletEvent("wallet_qr_modal_open", {
          loopId: loop.id,
          meta: { reason: "missing_credentials_503" },
        });
        toast("Google Wallet launching soon", {
          description: "We're finalizing our Wallet issuer setup before launch.",
        });
        return;
      }
      if (!res.ok) {
        toast.error(data.error || "Could not generate Google Wallet pass");
        return;
      }
      if (isAndroid()) {
        window.open(data.saveUrl, "_blank", "noopener,noreferrer");
        trackWalletEvent("wallet_direct_open_success", { loopId: loop.id });
      } else if (isIOS()) {
        // iOS-specific: try the new-tab handoff first; only fall back to the
        // QR modal if the popup was blocked or refused.
        const opened = tryOpenInNewTab(data.saveUrl);
        if (opened) {
          trackWalletEvent("wallet_direct_open_success", { loopId: loop.id });
        } else {
          trackWalletEvent("wallet_direct_open_blocked", { loopId: loop.id });
          setQrUrl(data.saveUrl);
          trackWalletEvent("wallet_qr_modal_open", {
            loopId: loop.id,
            meta: { reason: "ios_popup_blocked" },
          });
        }
      } else {
        setQrUrl(data.saveUrl);
        trackWalletEvent("wallet_qr_modal_open", { loopId: loop.id, meta: { reason: "desktop" } });
      }
    } catch {
      toast.error("Network error talking to Wallet service");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      {/* Share toolbar — sits above the pass card so it stays out of the captured image */}
      <div className="mb-2 flex items-center justify-end gap-2 print:hidden">
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShareOpen((v) => {
                if (!v) trackShareEvent("share_menu_open", { loopId: loop.id });
                return !v;
              });
            }}
            aria-expanded={shareOpen}
            aria-haspopup="menu"
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-cream px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink shadow-brut transition-pop hover:-translate-y-0.5"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </button>
          {shareOpen && (
            <div
              role="menu"
              className="absolute right-0 z-30 mt-2 w-64 rounded-2xl border-2 border-ink bg-cream p-2 shadow-brut text-ink"
            >
              <button
                type="button"
                onClick={handleShareLink}
                disabled={shareBusy === "link"}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[12px] font-bold hover:bg-gold/40 disabled:opacity-50"
              >
                {shareBusy === "link" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
                Share link…
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[12px] font-bold hover:bg-gold/40"
              >
                {linkCopied ? (
                  <Check className="h-4 w-4 text-coral" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
                {linkCopied ? "Link copied" : "Copy link"}
              </button>
              <button
                type="button"
                onClick={() => {
                  const subject = encodeURIComponent(shareTitle);
                  const lines = [shareText, "", "View the full boarding pass:", shareUrl];
                  const body = encodeURIComponent(lines.join("\n"));
                  trackShareEvent("share_email_link", { loopId: loop.id });
                  // Open the user's default mail client with a prefilled message.
                  window.location.href = `mailto:?subject=${subject}&body=${body}`;
                  setShareOpen(false);
                  toast.success("Opening your email app…");
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[12px] font-bold hover:bg-gold/40"
              >
                <Mail className="h-4 w-4" />
                Email link…
              </button>
              <button
                type="button"
                onClick={handleAddToCalendar}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[12px] font-bold hover:bg-gold/40"
              >
                <CalendarPlus className="h-4 w-4" />
                Add to Calendar (.ics)
              </button>
              <button
                type="button"
                onClick={handleSaveImage}
                disabled={shareBusy === "image"}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[12px] font-bold hover:bg-gold/40 disabled:opacity-50"
              >
                {shareBusy === "image" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImageIcon className="h-4 w-4" />
                )}
                Save as image (PNG)
              </button>
              <button
                type="button"
                onClick={handleSavePdf}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[12px] font-bold hover:bg-gold/40"
              >
                <FileText className="h-4 w-4" />
                Save / Print as PDF
              </button>
              <div className="mt-1 truncate border-t border-ink/15 px-3 py-1.5 font-mono text-[9px] text-ink/50">
                {shareUrl}
              </div>
            </div>
          )}
        </div>
      </div>
      <RerunButtons loop={loop} />
      <div
        ref={passRef}
        className="relative rounded-3xl border-2 border-ink bg-cream shadow-brut-lg overflow-hidden"
      >
        {/* ── Header ── */}
        <div className="bg-ink px-6 py-5 text-cream">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-display text-xl font-extrabold tracking-tight flex items-center gap-1">
                <span>CONFETTI</span>
                <span className="text-coral">.</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest opacity-80">
                <span>{loop.occasionEmoji ?? "✈"}</span>
                <span className="truncate">{loop.occasion ?? "Curated Plan"}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-mono text-[9px] uppercase tracking-widest opacity-60">
                Itinerary
              </div>
              <div className="font-mono text-[11px] font-bold tracking-widest">{loop.id}</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: "Date", value: loop.date },
              { label: "Passengers", value: String(loop.groupSize) },
              { label: "Day", value: loop.day ?? "—" },
            ].map((m) => (
              <div key={m.label}>
                <div className="font-mono text-[9px] uppercase tracking-widest opacity-60">
                  {m.label}
                </div>
                <div className="font-display text-[13px] font-extrabold tracking-tight truncate">
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Route ── */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="font-mono text-[9px] uppercase tracking-widest text-ink/50">
                Departure
              </div>
              <div className="font-display text-3xl font-extrabold leading-none tracking-tight">
                {loop.from}
              </div>
              {loop.fromName && (
                <div className="mt-1 text-[11px] text-ink/60 truncate">{loop.fromName}</div>
              )}
            </div>
            <div className="flex flex-1 items-center justify-center gap-1 px-2 pb-1">
              <div className="h-px flex-1 border-t-2 border-dashed border-ink/30" />
              <Plane className="h-5 w-5 text-coral rotate-90" />
              <div className="h-px flex-1 border-t-2 border-dashed border-ink/30" />
            </div>
            <div className="text-right min-w-0">
              <div className="font-mono text-[9px] uppercase tracking-widest text-ink/50">
                Destination
              </div>
              <div className="font-display text-3xl font-extrabold leading-none tracking-tight">
                {loop.to}
              </div>
              {loop.toName && (
                <div className="mt-1 text-[11px] text-ink/60 truncate">{loop.toName}</div>
              )}
            </div>
          </div>

          {/* Gate / Boarding / Seat */}
          <div className="mt-5 grid grid-cols-3 gap-3 rounded-2xl border-2 border-ink bg-gold/30 p-3">
            <Field label="Gate" value={loop.gate} />
            <Field label="Boarding" value={loop.boardingTime} />
            <Field label="Seat" value={`${loop.groupSize}P`} />
          </div>

          {/* Vibe pills */}
          {vibes.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {vibes.map((v) => (
                <span
                  key={v}
                  className="inline-flex items-center rounded-full border border-ink/20 bg-coral/10 px-2.5 py-1 text-[11px] font-semibold text-ink"
                >
                  {v}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Tear */}
        <TearDivider />

        {/* ── Flight Plan / Stops ── */}
        <div className="px-6 py-5">
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60 mb-3">
            Flight Plan · {loop.stops.length} stops
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={loop.stops.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <div>
                {loop.stops.map((stop, i) => {
                  const kind = stopKind(stop, i, loop.stops.length);
                  return (
                    <div key={stop.id}>
                      <StopCard
                        loopId={loop.id}
                        stop={stop}
                        kind={kind}
                        index={i}
                        isLast={i === loop.stops.length - 1}
                        city={loop.toName ?? loop.to ?? null}
                      />
                      {stop.driveAfter && (
                        <DriveTimeChip
                          minutes={stop.driveAfter.minutes}
                          destination={stop.driveAfter.destination}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Compact map strip with numbered stop markers */}
        <div className="border-t-2 border-dashed border-ink/40">
          <div className="relative h-[150px] w-full overflow-hidden">
            <ConfettiMap
              stops={loop.stops.map((s) => ({
                id: s.id,
                name: s.name,
                area: s.area,
                lat: s.lat,
                lng: s.lng,
                done: s.done,
                time: s.time,
              }))}
              currentIdx={loop.stops.findIndex((s) => !s.done)}
              fallbackCity={loop.stops[0]?.area || "Washington, DC"}
              height="100%"
              interactive={false}
              onPointsReady={setRoutePoints}
              focusStopId={selectedStopId}
              onStopClick={(s) => setSelectedStopId(s.id)}
            />
            <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
              <button
                type="button"
                onClick={() => setDirOpen((v) => !v)}
                aria-expanded={dirOpen}
                aria-haspopup="menu"
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-coral px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-cream shadow-brut transition-pop hover:-translate-y-0.5"
              >
                <Navigation className="h-3 w-3" />
                Get Directions
              </button>
              {dirOpen && selectedStop && (
                <div
                  role="menu"
                  className="w-64 rounded-2xl border-2 border-ink bg-cream p-3 shadow-brut text-ink"
                >
                  <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink/60">
                    Directions to
                  </div>
                  <div className="mt-0.5 font-display text-sm font-extrabold leading-tight">
                    {selectedStop.name}
                  </div>
                  {selectedAddress && (
                    <div className="mt-0.5 text-[11px] text-ink/60 truncate">{selectedAddress}</div>
                  )}
                  <div className="mt-2 flex flex-col gap-1.5">
                    {preferAppleFirst ? (
                      <>
                        {appleDirUrl && (
                          <a
                            href={appleDirUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setDirOpen(false)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-ink bg-ink px-3 py-1.5 text-[11px] font-bold text-cream"
                          >
                            Open in Apple Maps
                          </a>
                        )}
                        {googleDirUrl && (
                          <a
                            href={googleDirUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setDirOpen(false)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-ink bg-cream px-3 py-1.5 text-[11px] font-bold text-ink hover:bg-gold"
                          >
                            📍 Open in Google Maps
                          </a>
                        )}
                      </>
                    ) : (
                      <>
                        {googleDirUrl && (
                          <a
                            href={googleDirUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setDirOpen(false)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-ink bg-ink px-3 py-1.5 text-[11px] font-bold text-cream"
                          >
                            📍 Open in Google Maps
                          </a>
                        )}
                        {appleDirUrl && (
                          <a
                            href={appleDirUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setDirOpen(false)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-ink bg-cream px-3 py-1.5 text-[11px] font-bold text-ink hover:bg-gold"
                          >
                            Open in Apple Maps
                          </a>
                        )}
                      </>
                    )}
                    {fullRouteUrl && (
                      <a
                        href={fullRouteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setDirOpen(false)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-full border border-ink/30 bg-cream px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-ink/70 hover:text-ink"
                      >
                        Or view full route
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Side panel — each stop with ETA + status. Tap to focus the marker. */}
          <div className="border-t border-ink/10 bg-cream/50 px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink/60">
                Stops · ETA · Status
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[8px] font-bold uppercase tracking-wider text-ink/50">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#3FA66B] border border-ink" />
                  Done
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-coral border border-ink" />
                  Now
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-gold border border-ink" />
                  Next
                </span>
              </div>
            </div>
            <ul className="flex flex-col gap-1.5">
              {(() => {
                const currentIdx = loop.stops.findIndex((s) => !s.done);
                return loop.stops.map((s, i) => {
                  const status: "done" | "current" | "next" | "upcoming" = s.done
                    ? "done"
                    : i === currentIdx
                      ? "current"
                      : currentIdx >= 0 && i === currentIdx + 1
                        ? "next"
                        : "upcoming";
                  const active = s.id === selectedStopId;
                  const dotClass =
                    status === "done"
                      ? "bg-[#3FA66B] text-cream"
                      : status === "current"
                        ? "bg-coral text-cream"
                        : status === "next"
                          ? "bg-gold text-ink"
                          : "bg-cream text-ink";
                  const badgeClass =
                    status === "done"
                      ? "border-ink/40 bg-[#3FA66B]/15 text-[#1A1410]"
                      : status === "current"
                        ? "border-coral bg-coral text-cream"
                        : status === "next"
                          ? "border-ink bg-gold text-ink"
                          : "border-ink/30 bg-cream text-ink/70";
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedStopId(s.id)}
                        aria-pressed={active}
                        className={`group flex w-full items-center gap-2.5 rounded-xl border-2 px-2 py-1.5 text-left transition-pop ${
                          active
                            ? "border-ink bg-cream shadow-brut"
                            : "border-transparent hover:border-ink/20 hover:bg-cream/70"
                        }`}
                      >
                        <span
                          className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-ink font-mono text-[10px] font-bold ${dotClass}`}
                        >
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-display text-[13px] font-extrabold leading-tight text-ink">
                            {s.name}
                          </span>
                          <span className="block truncate font-mono text-[10px] text-ink/55">
                            {s.area || s.type}
                          </span>
                        </span>
                        <span className="font-mono text-[11px] font-bold tabular-nums text-ink/80">
                          {s.time || "—"}
                        </span>
                        <span
                          className={`shrink-0 rounded-full border px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest ${badgeClass}`}
                        >
                          {status === "current"
                            ? "Now"
                            : status === "done"
                              ? "Done"
                              : status === "next"
                                ? "Next"
                                : "Up"}
                        </span>
                      </button>
                    </li>
                  );
                });
              })()}
            </ul>
          </div>
        </div>

        {/* Tear */}
        <TearDivider />

        {/* ── Stats ── */}
        <div className="px-6 py-4 grid grid-cols-4 gap-2">
          {[
            { value: String(loop.stops.length), label: "Stops" },
            {
              value: String(
                new Set(loop.stops.map((s) => s.area).filter(Boolean)).size || loop.stops.length,
              ),
              label: "Hoods",
            },
            { value: loop.boardingTime, label: "Start" },
            { value: loop.stops.some((s) => s.ev) ? "⚡" : "✓", label: "EV Ready" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-ink/15 bg-card px-2 py-2 text-center"
            >
              <div className="font-display text-base font-extrabold tracking-tight">{s.value}</div>
              <div className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-ink/60">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Confetti reward ── */}
        <div className="mx-6 mb-4 flex items-center justify-between gap-3 rounded-2xl border-2 border-ink bg-coral/10 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl">🎊</span>
            <div className="min-w-0">
              <div className="font-mono text-[9px] uppercase tracking-widest text-ink/60">
                Complete this plan to earn
              </div>
              <div className="font-display text-sm font-extrabold tracking-tight truncate">
                Confetti Reward
              </div>
            </div>
          </div>
          <div className="font-display text-xl font-extrabold tracking-tight text-coral shrink-0">
            +{reward}
          </div>
        </div>

        {/* ── Book This Plan ── */}
        <div className="px-6 pb-4">
          <button
            onClick={() => setBookingOpen(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-coral px-4 py-3 text-sm font-bold text-cream shadow-brut transition-pop hover:-translate-y-0.5"
          >
            🎯 Book this plan
          </button>
        </div>

        {/* ── Barcode ── */}
        <div className="px-6 pb-5">
          <Barcode code={`${loop.id} · CONFETTI`} />
        </div>
      </div>

      {/* Wallet buttons */}
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <button
          onClick={() => toast.success("Apple Wallet pass coming soon")}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-ink px-4 py-3 text-sm font-bold text-cream shadow-brut transition-pop hover:-translate-y-0.5"
        >
          <Apple className="h-4 w-4" /> Add to Apple Wallet
        </button>
        <button
          onClick={addToGoogleWallet}
          disabled={googleLoading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-cream px-4 py-3 text-sm font-bold text-ink shadow-brut transition-pop hover:-translate-y-0.5 disabled:opacity-60"
        >
          {googleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wallet className="h-4 w-4" />
          )}
          Add to Google Wallet
        </button>
      </div>

      {/* Find my car — drop a pin where you parked, walk back later */}
      <div className="mt-3">
        <ParkingPin />
      </div>

      {qrUrl && (
        <WalletQrModal
          url={qrUrl}
          pending={qrPending}
          onClose={() => {
            setQrUrl(null);
            setQrPending(false);
          }}
        />
      )}
      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        loop={loop}
        reward={reward}
      />
    </div>
  );
}

// ─── Barcode ───────────────────────────────────────────────────────────
// Deterministic Code-128-style faux barcode derived from `code`, so the bars
// are stable across renders/SSR and visually unique per plan id.
function Barcode({ code }: { code: string }) {
  const { bars, label, viewWidth } = useMemo(() => {
    const seed = code || "CONFETTI";
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const rand = () => {
      h ^= h << 13;
      h ^= h >>> 17;
      h ^= h << 5;
      return ((h >>> 0) % 1000) / 1000;
    };
    const COUNT = 64;
    const GAP = 1; // unit gap between bars
    let x = 0;
    const bars: { x: number; width: number; isGap: boolean }[] = [];
    for (let i = 0; i < COUNT; i++) {
      const r = rand();
      const isGap = r < 0.18 && i > 0 && i < COUNT - 1;
      const width = isGap ? 1 : r < 0.55 ? 2 : r < 0.85 ? 3 : 4;
      bars.push({ x, width, isGap });
      x += width + GAP;
    }
    return { bars, label: seed, viewWidth: x - GAP };
  }, [code]);

  const VIEW_HEIGHT = 48;

  return (
    <div className="rounded-xl border-2 border-ink bg-cream p-3 print:border-black print:bg-white">
      {/* Inline SVG with viewBox = bars scale fluidly to container width on
          any screen size and print, never clipping. */}
      <svg
        viewBox={`0 0 ${viewWidth} ${VIEW_HEIGHT}`}
        preserveAspectRatio="none"
        className="block h-12 w-full"
        role="img"
        aria-label={`Barcode for ${label}`}
      >
        {bars.map((b, i) =>
          b.isGap ? null : (
            <rect
              key={i}
              x={b.x}
              y={0}
              width={b.width}
              height={VIEW_HEIGHT}
              className="fill-ink print:fill-black"
            />
          ),
        )}
      </svg>
      <div className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-ink/70 truncate print:text-black">
        {label}
      </div>
    </div>
  );
}

// ─── Tear divider with notches ─────────────────────────────────────────
function TearDivider() {
  return (
    <div className="relative">
      <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background border-2 border-ink" />
      <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background border-2 border-ink" />
      <div className="border-t-2 border-dashed border-ink/40 mx-6" />
    </div>
  );
}

// ─── Stop card ─────────────────────────────────────────────────────────
function StopCard({
  loopId,
  stop,
  kind,
  index,
  isLast,
  city,
}: {
  loopId: string;
  stop: LoopStop;
  kind: StopKind;
  index: number;
  isLast: boolean;
  city?: string | null;
}) {
  const [visible, setVisible] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [intelStatus, setIntelStatus] = useState<FetchStatus>("idle");
  const [intel, setIntel] = useState<VenueIntel | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [swapOpen, setSwapOpen] = useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);

  const sortable = useSortable({ id: stop.id });
  const dragStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
    opacity: sortable.isDragging ? 0.6 : 1,
    zIndex: sortable.isDragging ? 20 : undefined,
  };

  function handlePickSwap(v: PickedVenue) {
    const payload = venueToStopPayload(v, {
      time: stop.time,
      kind: kind,
    });
    const updated = replaceStop(stop.id, payload);
    if (!updated) {
      toast.error("Couldn't swap this stop");
      return;
    }
    logActivity({
      tripId: loopId,
      actor: "You",
      kind: "stop_swapped",
      message: `Swapped stop to ${v.name}${v.source === "ai" ? " (AI pick)" : ""}`,
      detail: v.neighborhood ? `${v.cuisine} · ${v.neighborhood}` : v.cuisine,
    });
    toast.success(`Swapped to ${v.name}`);
    setSwapOpen(false);
    // Reset intel for the new venue
    setIntel(null);
    setIntelStatus("idle");
    setFlipped(false);
  }

  function handleRemove() {
    const updated = removeStop(stop.id);
    setConfirmRemoveOpen(false);
    if (!updated) {
      toast.error("Couldn't remove this stop");
      return;
    }
    logActivity({
      tripId: loopId,
      actor: "You",
      kind: "stop_removed",
      message: `Removed stop: ${stop.name}`,
    });
    toast.success(`Removed ${stop.name}`);
  }

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 120 + index * 90);
    return () => clearTimeout(t);
  }, [index]);

  async function handleFlipToDetails() {
    if (flipped) {
      setFlipped(false);
      return;
    }
    setFlipped(true);
    if (intelStatus === "loading") return;
    if (intel && intel.source !== "none") return;
    setIntelStatus("loading");
    try {
      const result = await fetchVenueIntel(stop.id);
      setIntel(result);
      setIntelStatus(result.source === "none" ? "not-found" : "success");
    } catch {
      setIntelStatus("error");
    }
  }

  const checkInUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/check-in?loop=${encodeURIComponent(loopId)}&stop=${encodeURIComponent(stop.id)}`
      : `/check-in?loop=${loopId}&stop=${stop.id}`;

  function handleTapCheckIn() {
    const result = checkInStop(stop.id);
    if (!result) {
      toast.error("Couldn't find this stop");
      return;
    }
    if (result.alreadyAwarded) {
      toast(`Already checked in at ${stop.name}`, { description: "No double-dipping 🎉" });
      return;
    }
    logActivity({
      tripId: loopId,
      actor: "You",
      kind: "check_in",
      message: `Checked in at ${stop.name}`,
      detail: `+${result.awarded} Confetti`,
    });
    toast.success(`Checked in at ${stop.name}`, {
      description: `+${result.awarded} Confetti added to your balance`,
    });
  }

  const tone = kindStyles[kind];
  const typeLabel =
    kind === "departure" ? "Departure" : kind === "destination" ? "Destination" : "Layover";
  const emoji = stop.emoji ?? defaultEmoji(kind);
  const address = stop.address ?? stop.area ?? "";
  const appleUrl = address
    ? `https://maps.apple.com/?daddr=${encodeURIComponent(address)}&dirflg=d`
    : null;
  const googleUrl = address
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
    : null;

  const titleNode = (
    <div className="font-display text-base font-extrabold tracking-tight leading-snug">
      {stop.name}
    </div>
  );

  return (
    <div
      ref={sortable.setNodeRef}
      style={dragStyle}
      className={`relative flex gap-3 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      {/* Marker column */}
      <div className="relative flex flex-col items-center">
        <span
          className={`grid h-10 w-10 place-items-center rounded-full border-2 border-ink shadow-brut text-base ${tone.marker}`}
        >
          {emoji}
        </span>
        {!isLast && <span className={`mt-1 flex-1 w-px border-l-2 border-dashed ${tone.line}`} />}
      </div>

      {/* Content - 3D flip card */}
      <div className="flex-1 pb-5 min-w-0 [perspective:1200px]">
        <div
          className={`relative transition-transform duration-500 [transform-style:preserve-3d] ${
            flipped ? "[transform:rotateY(180deg)]" : ""
          }`}
        >
        {/* ─── FRONT face ─── */}
        <div className="[backface-visibility:hidden]">
        <div className="flex items-start justify-between gap-2">
          <div className={`font-mono text-[10px] font-bold uppercase tracking-widest ${tone.label}`}>
            {typeLabel} — {stop.time}
          </div>
          <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Drag to reorder"
            {...sortable.attributes}
            {...sortable.listeners}
            className="touch-none cursor-grab active:cursor-grabbing -mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-ink/40 hover:bg-ink/8 hover:text-ink transition-colors"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Stop actions"
                className="-mr-1 -mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-ink/50 hover:bg-ink/8 hover:text-ink transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => setSwapOpen(true)}>
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Swap this stop
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setConfirmRemoveOpen(true)}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove this stop
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
        {stop.venueId ? (
          <Link
            to="/venue/$id"
            params={{ id: stop.venueId }}
            className="mt-0.5 block hover:underline underline-offset-4 decoration-coral"
          >
            {titleNode}
          </Link>
        ) : (
          <div className="mt-0.5">{titleNode}</div>
        )}
        <div className="mt-0.5 text-xs text-ink/70">
          {stop.detail ?? `${stop.type}${stop.area ? ` · ${stop.area}` : ""}`}
        </div>
        {stop.sponsored && (
          <div className="mt-1.5">
            <PartnerPickBadge label={stop.partnerLabel} />
          </div>
        )}

        {/* EV */}
        {stop.ev && (
          <div className="mt-2 rounded-xl border border-ink/20 bg-gold/20 p-2.5">
            <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
              <span>{stop.ev.brand}</span>
              <span className="text-ink/70">{stop.ev.spec}</span>
              <span className="text-coral">{stop.ev.chargeTime}</span>
            </div>
            {stop.ev.sub && <div className="mt-1 text-[10px] text-ink/60">{stop.ev.sub}</div>}
          </div>
        )}

        {/* Parking */}
        {stop.parking && (
          <div className="mt-2 flex gap-2 text-[11px]">
            <span aria-hidden>🅿</span>
            <div className="min-w-0">
              <div className="font-semibold text-ink">{stop.parking.primary}</div>
              {stop.parking.secondary && (
                <div className="text-ink/60">{stop.parking.secondary}</div>
              )}
            </div>
          </div>
        )}

        {/* Sunday parking */}
        {stop.sundayParking && (
          <div className="mt-1.5 flex items-start gap-2 text-[11px]">
            <span className="rounded-md bg-ink px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-widest text-cream">
              SUN
            </span>
            <span className="text-ink/70">{stop.sundayParking}</span>
          </div>
        )}

        {/* Nav buttons */}
        {(appleUrl || googleUrl) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {appleUrl && (
              <a
                href={appleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-ink/30 bg-cream px-2.5 py-1 text-[10px] font-bold text-ink hover:bg-ink hover:text-cream transition-colors"
              >
                🍎 Apple Maps
              </a>
            )}
            {googleUrl && (
              <a
                href={googleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-ink/30 bg-cream px-2.5 py-1 text-[10px] font-bold text-ink hover:bg-ink hover:text-cream transition-colors"
              >
                📍 Google Maps
              </a>
            )}
          </div>
        )}

        {/* Tags */}
        {stop.tags && stop.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {stop.tags.map((tag, i) => (
              <span
                key={i}
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${tagToneClass[tag.variant]}`}
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}

        {/* Flip-to-details button */}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={handleFlipToDetails}
            aria-pressed={flipped}
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-cream px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-gold transition-colors"
          >
            <span aria-hidden>↻</span> View details
          </button>
        </div>

        {/* Check-in: tap or QR-scan-from-staff */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleTapCheckIn}
            disabled={stop.awarded}
            className={`inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest shadow-brut transition-pop hover:-translate-y-0.5 ${
              stop.awarded
                ? "bg-emerald-200/70 text-ink/70 cursor-default hover:translate-y-0"
                : "bg-coral text-cream"
            }`}
          >
            {stop.awarded ? "✓ Checked in" : "📍 Tap to check in"}
          </button>
          <button
            type="button"
            onClick={() => setShowQr((v) => !v)}
            aria-expanded={showQr}
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-cream px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-gold"
          >
            {showQr ? "Hide QR" : "Show QR for staff"}
          </button>
        </div>
        {showQr && (
          <div className="mt-2 inline-flex flex-col items-center gap-1 rounded-2xl border-2 border-ink bg-cream p-3 shadow-brut">
            <QRCodeSVG
              value={checkInUrl}
              size={132}
              bgColor="#FFF7EC"
              fgColor="#1B1B1B"
              level="M"
            />
            <span className="font-mono text-[9px] uppercase tracking-widest text-ink/60">
              scan at venue
            </span>
          </div>
        )}
        </div>
        {/* ─── BACK face: venue intel ─── */}
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-y-auto rounded-xl border-2 border-ink/30 bg-cream/95 p-3 shadow-brut">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className={`font-mono text-[9px] font-bold uppercase tracking-widest ${tone.label}`}>
                {typeLabel} — details
              </div>
              <div className="mt-0.5 font-display text-sm font-extrabold tracking-tight leading-snug">
                {stop.name}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFlipped(false)}
              className="shrink-0 inline-flex items-center gap-1 rounded-full border-2 border-ink bg-cream px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-widest hover:bg-gold transition-colors"
            >
              ← Back
            </button>
          </div>

          <div className="mt-2 text-[11px] space-y-1.5">
            {intelStatus === "loading" && (
              <div className="flex items-center gap-2 text-ink/60">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Fetching venue intel…</span>
              </div>
            )}
            {intelStatus === "not-found" && (
              <div className="text-ink/60 italic">No deeper intel on file for this spot yet.</div>
            )}
            {intelStatus === "error" && (
              <div className="text-red-600 font-medium">Something went wrong. Try again later.</div>
            )}
            {intelStatus === "success" && intel && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {intel.priceLevel && (
                  <div><span className="font-bold text-ink/60">Price:</span> {intel.priceLevel}</div>
                )}
                {intel.dressCode && (
                  <div><span className="font-bold text-ink/60">Dress:</span> {intel.dressCode}</div>
                )}
                {intel.signature && (
                  <div className="col-span-2"><span className="font-bold text-ink/60">Signature:</span> {intel.signature}</div>
                )}
                {intel.crowd && (
                  <div className="col-span-2"><span className="font-bold text-ink/60">Crowd:</span> {intel.crowd}</div>
                )}
                {intel.bestFor && (
                  <div><span className="font-bold text-ink/60">Best for:</span> {intel.bestFor}</div>
                )}
                {intel.waitTime && (
                  <div><span className="font-bold text-ink/60">Wait:</span> {intel.waitTime}</div>
                )}
                {intel.parking && !stop.parking && (
                  <div className="col-span-2"><span className="font-bold text-ink/60">🅿 Parking:</span> {intel.parking}</div>
                )}
                {intel.phone && (
                  <div className="col-span-2"><span className="font-bold text-ink/60">Phone:</span> <a href={`tel:${intel.phone}`} className="underline">{intel.phone}</a></div>
                )}
                {intel.address && !address && (
                  <div className="col-span-2"><span className="font-bold text-ink/60">Address:</span> {intel.address}</div>
                )}
                {intel.rating && (
                  <div><span className="font-bold text-ink/60">Rating:</span> {intel.rating}/5</div>
                )}
                <div className="col-span-2 mt-1 text-[9px] text-ink/40 uppercase tracking-widest">
                  Source: {intel.source === "local-kb" ? "Curated knowledge base" : "AI lookup"}
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Swap modal */}
      <VenuePickerModal
        open={swapOpen}
        onClose={() => setSwapOpen(false)}
        city={city ?? null}
        preferredCuisine={stop.category ?? stop.type ?? null}
        excludeIds={stop.venueId ? [stop.venueId] : []}
        title="Swap this stop"
        description={`Replacing "${stop.name}" — pick a new venue.`}
        onPick={handlePickSwap}
      />

      {/* Remove confirmation */}
      <AlertDialog open={confirmRemoveOpen} onOpenChange={setConfirmRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this stop?</AlertDialogTitle>
            <AlertDialogDescription>
              {stop.name} will be removed from your boarding pass. You can re-add a stop later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-red-600 text-cream hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Drive time chip ───────────────────────────────────────────────────
function DriveTimeChip({ minutes, destination }: { minutes: number; destination: string }) {
  return (
    <div className="ml-12 mb-3 -mt-2 inline-flex items-center gap-1.5 rounded-full border border-dashed border-ink/30 bg-cream px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/70">
      🚗 ~{minutes} min drive → {destination}
    </div>
  );
}

// ─── Field ─────────────────────────────────────────────────────────────
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink/60">
        {label}
      </div>
      <div className="mt-0.5 font-display text-base font-extrabold tracking-tight">{value}</div>
    </div>
  );
}

// ─── Booking modal ─────────────────────────────────────────────────────
function BookingModal({
  open,
  onClose,
  loop,
  reward,
}: {
  open: boolean;
  onClose: () => void;
  loop: ActiveLoop;
  reward: number;
}) {
  type Status = "idle" | "booking" | "booked";
  const navigate = useNavigate();
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [refs, setRefs] = useState<Record<string, string>>({});
  const [finalizing, setFinalizing] = useState(false);

  // Treat all stops as bookable; bookingType inferred from stop.bookingType or "reservation"
  const bookable = loop.stops.filter((s) => s.bookable !== false);
  const allBooked = bookable.length > 0 && bookable.every((s) => status[s.id] === "booked");

  function makeRef(stopId: string) {
    const tail =
      stopId
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(-3)
        .toUpperCase() || "STP";
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `CF-${tail}-${rand}`;
  }

  function bookOne(id: string) {
    setStatus((p) => ({ ...p, [id]: "booking" }));
    setTimeout(() => {
      const ref = makeRef(id);
      setRefs((p) => ({ ...p, [id]: ref }));
      setStatus((p) => ({ ...p, [id]: "booked" }));
    }, 1200);
  }

  function bookAll() {
    bookable.forEach((s, i) => setTimeout(() => bookOne(s.id), i * 600));
  }

  // Once every bookable stop is confirmed, persist booking to the loop and
  // navigate to the confirmation screen with the reference info.
  useEffect(() => {
    if (!allBooked || finalizing) return;
    setFinalizing(true);
    const planRef = `CF-${loop.id}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    const updated: ActiveLoop = {
      ...loop,
      booking: {
        ref: planRef,
        bookedAt: new Date().toISOString(),
        stops: refs,
      },
    };
    setActiveLoop(updated);
    logActivity({
      tripId: loop.id,
      tripTitle: `${loop.from} → ${loop.to}`,
      actor: "You",
      kind: "plan_started",
      message: `booked the full plan (${bookable.length} stops)`,
      detail: planRef,
    });
    toast.success("Plan booked!", { description: planRef });
    const t = setTimeout(() => {
      onClose();
      navigate({ to: "/confirmation" });
    }, 900);
    return () => clearTimeout(t);
  }, [allBooked, finalizing, loop, refs, navigate, onClose, bookable.length]);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Book this plan"
      className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-ink/60 p-0 sm:p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border-2 border-ink bg-cream shadow-brut-lg animate-scale-in max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-ink px-5 py-4 text-cream rounded-t-3xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-display text-lg font-extrabold tracking-tight">
                Book this plan
              </div>
              <div className="mt-0.5 text-[11px] opacity-75">Reserve everything in one tap</div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="grid h-8 w-8 place-items-center rounded-full border border-cream/30 hover:bg-cream/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { label: "Date", value: loop.date },
              { label: "Guests", value: String(loop.groupSize) },
              { label: "Conf.", value: loop.id },
            ].map((m) => (
              <div key={m.label}>
                <div className="font-mono text-[9px] uppercase tracking-widest opacity-60">
                  {m.label}
                </div>
                <div className="font-display text-[12px] font-extrabold truncate">{m.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stops list */}
        <div className="p-4 space-y-2">
          {bookable.map((stop, i) => {
            const kind = stopKind(stop, i, bookable.length);
            const s = status[stop.id] ?? "idle";
            const typeLabel =
              stop.bookingType === "parking"
                ? "Garage pre-pay"
                : stop.bookingType === "both"
                  ? "Reservation + Parking"
                  : "Table reservation";
            return (
              <div
                key={stop.id}
                className="flex items-center gap-3 rounded-2xl border-2 border-ink bg-card p-3"
              >
                <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-cream text-base shrink-0">
                  {stop.emoji ?? defaultEmoji(kind)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-sm font-extrabold tracking-tight truncate">
                    {stop.name}
                  </div>
                  <div className="text-[11px] text-ink/60 truncate">
                    {stop.time} · {typeLabel}
                    {refs[stop.id] && (
                      <span className="ml-1 font-mono text-ink/80">· {refs[stop.id]}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => bookOne(stop.id)}
                  disabled={s !== "idle"}
                  className={`shrink-0 rounded-lg px-3 py-1.5 font-mono text-[10px] font-bold tracking-widest transition-all ${
                    s === "booked"
                      ? "bg-ink text-cream"
                      : s === "booking"
                        ? "bg-coral/20 text-coral animate-pulse"
                        : "bg-coral text-cream hover:-translate-y-0.5"
                  }`}
                >
                  {s === "booked" ? "✓ BOOKED" : s === "booking" ? "BOOKING…" : "BOOK"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 pb-5">
          {allBooked ? (
            <div className="rounded-2xl border-2 border-ink bg-coral/10 p-4 text-center">
              <div className="text-2xl">🎊</div>
              <div className="mt-1 font-display text-base font-extrabold tracking-tight">
                Plan fully booked!
              </div>
              <div className="mt-0.5 text-[11px] text-ink/70">
                +{reward} Confetti earned on completion
              </div>
            </div>
          ) : (
            <button
              onClick={bookAll}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-coral px-4 py-3 text-sm font-bold text-cream shadow-brut transition-pop hover:-translate-y-0.5"
            >
              🎯 Book entire plan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Wallet QR modal (preserved) ───────────────────────────────────────
function WalletQrModal({
  url,
  onClose,
  pending = false,
}: {
  url: string;
  onClose: () => void;
  pending?: boolean;
}) {
  const qrWrapRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const headingId = useId();
  const descId = useId();
  const [statusMsg, setStatusMsg] = useState("");

  // Focus management: remember the trigger, focus close on open, restore on unmount.
  useEffect(() => {
    const previouslyFocused =
      typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null;
    closeBtnRef.current?.focus();
    return () => {
      previouslyFocused?.focus?.();
    };
  }, []);

  // ESC to close + Tab focus trap inside the dialog.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input, select, textarea',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handlePrint() {
    const svgEl = qrWrapRef.current?.querySelector("svg");
    if (!svgEl) {
      toast.error("Could not prepare print view");
      return;
    }
    trackWalletEvent("wallet_print_qr");
    // Inline the SVG at large size for crisp scanning from across the room.
    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("width", "560");
    clone.setAttribute("height", "560");
    const svgMarkup = clone.outerHTML;

    const win = window.open("", "_blank", "noopener,noreferrer,width=720,height=900");
    if (!win) {
      toast.error("Pop-up blocked — allow pop-ups to print");
      return;
    }
    win.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Confetti — Google Wallet pass</title>
<style>
  @page { margin: 16mm; }
  html, body { margin: 0; padding: 0; background: #FFF7EC; color: #1B1B1B;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  .wrap { max-width: 640px; margin: 24px auto; padding: 24px;
    border: 3px solid #1B1B1B; border-radius: 24px; text-align: center; }
  h1 { margin: 0 0 4px; font-size: 28px; font-weight: 900; letter-spacing: -0.02em; }
  .eyebrow { font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    text-transform: uppercase; letter-spacing: 0.18em; font-size: 11px;
    font-weight: 700; color: rgba(27,27,27,0.6); }
  p { font-size: 14px; line-height: 1.45; margin: 12px 0; }
  .qr { margin: 20px auto; padding: 16px; display: inline-block;
    border: 2px solid #1B1B1B; border-radius: 16px; background: #FFF7EC; }
  .url { font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px; word-break: break-all; padding: 12px;
    border: 2px dashed #1B1B1B; border-radius: 12px; background: #fff; }
  .btn { display: inline-block; margin-top: 16px; padding: 10px 18px;
    border: 2px solid #1B1B1B; border-radius: 999px; background: #1B1B1B;
    color: #FFF7EC; font-weight: 800; font-size: 13px; cursor: pointer; }
  @media print { .btn { display: none; } .wrap { border-width: 2px; } }
</style>
</head>
<body>
  <div class="wrap">
    <div class="eyebrow">/ confetti · google wallet</div>
    <h1>Scan from another device</h1>
    <p>Open your Android phone's camera and aim at the QR code. The pass will open in Google Wallet.</p>
    <div class="qr">${svgMarkup}</div>
    <div class="url">${url.replace(/[<&>]/g, (c) => ({ "<": "&lt;", "&": "&amp;", ">": "&gt;" })[c]!)}</div>
    <button class="btn" onclick="window.print()">Print this page</button>
  </div>
  <script>setTimeout(function(){ try { window.focus(); window.print(); } catch(e){} }, 300);</script>
</body>
</html>`);
    win.document.close();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      aria-describedby={descId}
      ref={dialogRef}
      className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl border-2 border-ink bg-cream p-6 shadow-brut-lg animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeBtnRef}
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border-2 border-ink bg-cream text-ink hover:bg-coral hover:text-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-coral" aria-hidden="true" />
          <h2
            id={headingId}
            className="font-display text-lg font-extrabold tracking-tight text-ink"
          >
            {pending ? "Google Wallet — preview" : "Scan to add to Google Wallet"}
          </h2>
        </div>
        {pending ? (
          <div className="mt-3 rounded-xl border-2 border-ink bg-gold/40 px-3 py-2">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink">
              ⚠ launching soon
            </p>
            <p id={descId} className="mt-1 text-xs leading-snug text-ink/80">
              Our Google Wallet issuer credentials aren't live yet, so this is a preview of how the
              hand-off will work. Once we're approved, the QR will sign you straight into your pass.
              Press Escape to close.
            </p>
          </div>
        ) : (
          <p id={descId} className="mt-1 text-xs text-ink/70">
            Open your Android phone's camera and point it at this QR code. The pass will open in
            Google Wallet for you to save. Press Escape to close.
          </p>
        )}
        <div
          ref={qrWrapRef}
          className={`mt-4 grid place-items-center rounded-2xl border-2 border-ink bg-cream p-4 ${pending ? "opacity-60" : ""}`}
          aria-hidden={pending ? "true" : undefined}
        >
          <QRCodeSVG
            value={url}
            size={208}
            bgColor="#FFF7EC"
            fgColor="#1B1B1B"
            level="M"
            includeMargin={false}
          />
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackWalletEvent("wallet_open_link_click")}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-coral px-4 py-3 text-sm font-bold text-cream shadow-brut transition-pop hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          <Wallet className="h-4 w-4" aria-hidden="true" /> Open save link in new tab
        </a>
        <button
          type="button"
          onClick={handlePrint}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-cream px-4 py-3 text-sm font-bold text-ink shadow-brut transition-pop hover:-translate-y-0.5 hover:bg-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          <Printer className="h-4 w-4" aria-hidden="true" /> Print large QR
        </button>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard?.writeText(url);
              trackWalletEvent("wallet_copy_link");
              setStatusMsg("Save link copied to clipboard");
              toast.success("Save link copied");
            } catch {
              setStatusMsg("Could not copy link — try again");
              toast.error("Could not copy link");
            }
          }}
          className="mt-2 w-full text-center font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60 hover:text-ink focus:outline-none focus-visible:text-ink focus-visible:underline"
        >
          Copy link instead
        </button>

        {/* Polite live region announces copy success/failure to screen readers. */}
        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {statusMsg}
        </div>
      </div>
    </div>
  );
}

