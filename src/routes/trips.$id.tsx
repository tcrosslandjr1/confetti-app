import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  Pencil,
  Trash2,
  Utensils,
  Wine,
  Camera,
  Activity,
  Car,
  Sparkles,
  ParkingCircle,
  Lightbulb,
  Quote,
  Stamp,
  Bus,
  Footprints,
  Bike,
  Navigation,
  Ticket,
  Hash,
  Users,
  Phone,
  Mail,
  Clock,
  FileText,
  ChevronDown,
  History,
  RotateCcw,
  Timer,
  Calendar,
  AlertTriangle,
  X,
  Shirt,
} from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import {
  buildAppleMapsDirectionsUrl,
  buildGoogleMapsDirectionsUrl,
  isAndroid,
  isAppleDevice,
  isIOS,
} from "@/lib/maps-links";
import { useAuth } from "@/lib/auth-context";
import {
  completeItinerary,
  deleteItinerary,
  getItinerary,
  updateStop,
  type Itinerary,
  type Stop,
  type TravelLeg,
} from "@/lib/itineraries";
import { LateRescheduleFab } from "@/components/LateRescheduleFab";
import { LiveElapsed } from "@/components/LiveElapsed";
import { BoardingPass } from "@/components/BoardingPass";
import { TripBuildingSkeleton } from "@/components/BoardingPassSkeleton";
import { PromotedSlot } from "@/components/PromotedSlot";
import {
  clearNotifications,
  formatUpdatedAt,
  loadNotifications,
  loadStatus,
  subscribeNotifications,
  subscribeStatus,
  type SentNotification,
  type TripStatus,
} from "@/lib/trip-status";
import { GooglePhotos } from "@/components/GooglePhotos";
import { VibeFilter } from "@/components/VibeFilter";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import {
  CROWD_LABEL,
  DRESS_LABEL,
  NOISE_LABEL,
  inferStopVibe,
  loadVibePrefs,
  matchLevel,
  saveVibePrefs,
  vibeMatchScore,
  type VibePrefs,
} from "@/lib/vibe";

export const Route = createFileRoute("/trips/$id")({
  component: TripDetail,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center">
      <Link to="/trips" className="text-primary underline">
        Back to trips
      </Link>
    </div>
  ),
});

const BUILDING_MSGS = [
  "Scouting the best spots in town…",
  "Checking real reviews & ratings…",
  "Mapping out your perfect route…",
  "Verifying hours & availability…",
  "Picking hidden gems just for you…",
  "Almost there — polishing your day…",
];

const CAT_ICONS: Record<string, typeof Utensils> = {
  meal: Utensils,
  drinks: Wine,
  scenic: Camera,
  activity: Activity,
  travel: Car,
  other: Sparkles,
};

function TripDetail() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [data, setData] = useState<{ itinerary: Itinerary; stops: Stop[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [tripStatus, setTripStatus] = useState<TripStatus | null>(null);
  const [notifications, setNotifications] = useState<SentNotification[]>([]);
  const [vibePrefs, setVibePrefs] = useState<VibePrefs>(() => loadVibePrefs());

  function updateVibePrefs(next: VibePrefs) {
    setVibePrefs(next);
    saveVibePrefs(next);
  }

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTrip = useCallback(() => {
    return getItinerary(id)
      .then((d) => {
        setData(d);
        // If the itinerary was being built and is now ready, stop polling
        if (d.itinerary.source !== "building" && pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
        return d;
      });
  }, [id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      nav({ to: "/auth" });
      return;
    }
    fetchTrip()
      .then((d) => {
        // Start polling if still building
        if (d.itinerary.source === "building") {
          pollRef.current = setInterval(() => {
            fetchTrip().catch(() => {}); // silently retry
          }, 2500);
        }
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
  }, [id, user, authLoading, nav, fetchTrip]);

  useEffect(() => {
    setTripStatus(loadStatus(id));
    setNotifications(loadNotifications(id));
    const u1 = subscribeStatus(id, () => setTripStatus(loadStatus(id)));
    const u2 = subscribeNotifications(id, () => setNotifications(loadNotifications(id)));
    return () => {
      u1();
      u2();
    };
  }, [id]);

  async function setStatus(stopId: string, status: Stop["booking_status"]) {
    if (!data) return;
    setData({
      ...data,
      stops: data.stops.map((s) => (s.id === stopId ? { ...s, booking_status: status } : s)),
    });
    try {
      await updateStop(stopId, { booking_status: status });
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  async function saveNotes(stopId: string, user_notes: string) {
    if (!data) return;
    setData({
      ...data,
      stops: data.stops.map((s) => (s.id === stopId ? { ...s, user_notes } : s)),
    });
    try {
      await updateStop(stopId, { user_notes });
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  async function saveReservation(stopId: string, patch: Partial<Stop>) {
    if (!data) return;
    setData({ ...data, stops: data.stops.map((s) => (s.id === stopId ? { ...s, ...patch } : s)) });
    try {
      await updateStop(stopId, patch);
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  async function removeTrip() {
    if (!confirm("Delete this trip?")) return;
    try {
      await deleteItinerary(id);
      nav({ to: "/trips" });
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  async function completeDay() {
    try {
      if (!data?.itinerary.completed_at) await completeItinerary(id);
      nav({ to: "/trips/$id/passport", params: { id } });
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  const [buildMsgIdx, setBuildMsgIdx] = useState(0);
  const isBuilding = data?.itinerary.source === "building";
  useEffect(() => {
    if (!isBuilding) return;
    const id2 = setInterval(() => setBuildMsgIdx((i) => (i + 1) % BUILDING_MSGS.length), 2800);
    return () => clearInterval(id2);
  }, [isBuilding]);

  if (loading)
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <TripBuildingSkeleton message="Loading your trip…" />
      </div>
    );
  if (err)
    return (
      <div className="grid min-h-screen place-items-center">
        <p className="text-destructive">{err}</p>
      </div>
    );
  if (!data) return null;

  // Show skeleton while the background build is still running
  if (isBuilding) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <TripBuildingSkeleton message={BUILDING_MSGS[buildMsgIdx]} />
      </div>
    );
  }

  const { itinerary: it, stops } = data;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Boarding pass header */}
      <section className="mx-auto max-w-4xl px-4 pt-8 sm:px-6 lg:px-8">
        <Link
          to="/trips"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All trips
        </Link>
        <div className="mt-4">
          <BoardingPass
            itinerary={it}
            stops={stops}
            onChange={(patch) => setData({ ...data, itinerary: { ...it, ...patch } as Itinerary })}
          />
        </div>

        <PromotedSlot
          placement="itinerary_boost"
          surface={`trip_${id}`}
          variant="boost"
          className="mt-4"
        />

        {it.summary && <p className="mt-5 max-w-2xl text-sm text-muted-foreground">{it.summary}</p>}

        {tripStatus &&
          (tripStatus.minutesLate > 0 || tripStatus.cancelled || tripStatus.rescheduledAt) && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              {tripStatus.cancelled && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-2.5 py-1 font-semibold text-rose-700">
                  <X className="h-3 w-3" /> Cancelled · {formatUpdatedAt(tripStatus.updatedAt)} ·{" "}
                  <LiveElapsed since={tripStatus.updatedAt} />
                </span>
              )}
              {tripStatus.rescheduledAt && !tripStatus.cancelled && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/15 px-2.5 py-1 font-semibold text-sky-700">
                  <Calendar className="h-3 w-3" /> Rescheduled ·{" "}
                  {new Date(tripStatus.rescheduledAt).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              )}
              {tripStatus.minutesLate > 0 && !tripStatus.cancelled && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 font-semibold text-amber-700">
                  <span className="relative inline-flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                  </span>
                  Running ~{tripStatus.minutesLate} min late ·{" "}
                  {formatUpdatedAt(tripStatus.updatedAt)} ·{" "}
                  <LiveElapsed since={tripStatus.updatedAt} />
                </span>
              )}
            </div>
          )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={completeDay}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-pop hover:scale-105 transition-pop"
          >
            <Stamp className="h-3.5 w-3.5" />{" "}
            {it.completed_at ? "View passport" : "Complete day → Passport"}
          </button>
          <Link
            to="/teams/new"
            search={{ fromTrip: it.id }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
          >
            <Users className="h-3.5 w-3.5" /> Plan team event from this trip
          </Link>
          <button
            onClick={removeTrip}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      </section>

      {/* Timeline */}
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <VibeFilter prefs={vibePrefs} onChange={updateVibePrefs} />
        </div>
        <ol className="relative space-y-6 border-l-2 border-dashed border-border pl-6">
          {stops.map((s, i) => {
            const Icon = CAT_ICONS[s.category as string] ?? Sparkles;
            const leg = (s.travel_from_prev ?? null) as TravelLeg | null;
            const prev = i > 0 ? stops[i - 1] : null;
            return (
              <li key={s.id} className="relative">
                {leg && prev && <TravelLegCard leg={leg} from={prev} to={s} />}
                <span className="absolute -left-[34px] grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-pop">
                  <Icon className="h-5 w-5" />
                </span>
                <article className="rounded-2xl border border-border bg-card p-5 shadow-card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Stop {i + 1} · {s.category}
                        {s.start_time && ` · ${s.start_time.slice(0, 5)}`}
                        {s.duration_minutes && ` · ${s.duration_minutes} min`}
                      </p>
                      <h3 className="mt-1 font-display text-xl font-bold">{s.name}</h3>
                    </div>
                    <BookingPill
                      status={s.booking_status as Stop["booking_status"]}
                      onChange={(st) => s.id && setStatus(s.id, st)}
                    />
                  </div>

                  <GooglePhotos
                    venue={s.name}
                    address={s.address}
                    className="mt-3 overflow-hidden rounded-xl"
                    variant="strip"
                    hideEmpty
                  />

                  <VibeRow stop={s} prefs={vibePrefs} />

                  {s.description && <p className="mt-3 text-sm text-foreground">{s.description}</p>}

                  <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                    {s.address && (
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{s.address}</span>
                      </div>
                    )}
                    {s.est_cost && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-semibold">{s.est_cost}</span>
                      </div>
                    )}
                  </div>

                  {s.what_to_do && (
                    <div className="mt-3 rounded-xl bg-muted p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        What to do / order
                      </p>
                      <p className="mt-1 text-sm">{s.what_to_do}</p>
                    </div>
                  )}

                  {Array.isArray(s.review_snippets) && s.review_snippets.length > 0 && (
                    <div className="mt-3 rounded-xl border border-border/60 bg-background p-3">
                      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <Quote className="h-3.5 w-3.5" /> What people say{" "}
                        <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold normal-case">
                          AI summary
                        </span>
                      </p>
                      <ul className="mt-2 space-y-1.5 text-sm italic text-foreground/80">
                        {s.review_snippets.map((r, idx) => (
                          <li key={idx}>"{r}"</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {s.parking && (
                    <div className="mt-3 flex gap-3 rounded-xl bg-muted/60 p-3">
                      <ParkingCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <div className="text-sm">
                        <p className="font-semibold capitalize">
                          {s.parking.type} · {s.parking.cost}
                        </p>
                        <p className="text-muted-foreground">{s.parking.access}</p>
                      </div>
                    </div>
                  )}

                  {s.dress_code && (
                    <div className="mt-3 flex gap-3 rounded-xl border border-border/60 bg-background p-3">
                      <Shirt className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <div className="text-sm">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Dress code
                        </p>
                        <p className="mt-0.5 font-medium">{s.dress_code}</p>
                      </div>
                    </div>
                  )}

                  {Array.isArray(s.tips) && s.tips.length > 0 && (
                    <div className="mt-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3">
                      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                        <Lightbulb className="h-3.5 w-3.5" /> Insider tips
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-950 dark:text-amber-100">
                        {s.tips.map((t, idx) => (
                          <li key={idx}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {s.booking_url && (
                      <a
                        href={s.booking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background hover:scale-105 transition-pop"
                      >
                        Book on {s.booking_provider ?? "site"}{" "}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>

                  <ReservationEditor stop={s} onSave={(p) => s.id && saveReservation(s.id, p)} />
                  <NotesEditor
                    initial={s.user_notes ?? ""}
                    onSave={(v) => s.id && saveNotes(s.id, v)}
                  />
                </article>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Notification history */}
      <section className="mx-auto max-w-4xl px-4 pb-32 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
          <header className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 p-4 sm:px-5">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-foreground/10 text-foreground">
                <History className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Notification history
                </p>
                <p className="mt-0.5 text-sm font-semibold">
                  {notifications.length === 0
                    ? "Nothing sent yet"
                    : `${notifications.length} message${notifications.length === 1 ? "" : "s"} sent`}
                </p>
              </div>
            </div>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  clearNotifications(id);
                  toast.success("History cleared");
                }}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
              >
                <RotateCcw className="h-3 w-3" /> Clear
              </button>
            )}
          </header>
          {notifications.length === 0 ? (
            <p className="p-5 text-xs text-muted-foreground">
              Use the floating button to notify venues when you're running late, rescheduling, or
              cancelling. Every message lands here with a timestamp.
            </p>
          ) : (
            <ol className="divide-y divide-border">
              {notifications.map((n) => {
                const tone =
                  n.kind === "late"
                    ? "bg-amber-500/15 text-amber-700"
                    : n.kind === "reschedule"
                      ? "bg-sky-500/15 text-sky-700"
                      : "bg-rose-500/15 text-rose-700";
                const Icon =
                  n.kind === "late" ? Timer : n.kind === "reschedule" ? Calendar : AlertTriangle;
                return (
                  <li key={n.id} className="flex items-start gap-3 p-4 sm:px-5">
                    <span
                      className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${tone}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-sm font-semibold">{n.venue}</p>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(n.sentAt).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{n.message}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-4xl px-4 sm:px-6 lg:px-8">
        <ActivityFeed
          tripId={id}
          title="Group activity"
          emptyHint="Once your group starts checking in, swapping stops or rescheduling, you'll see who did what here."
        />
      </section>

      <LateRescheduleFab
        tripId={id}
        partyName={it.title}
        groupSize={Math.max(1, stops.length)}
        stops={stops.map((s) => ({
          time: formatTimeLabel(s.start_time),
          name: s.name,
          durationMin: s.duration_minutes ?? undefined,
        }))}
      />
    </div>
  );
}

function formatTimeLabel(t?: string | null): string {
  if (!t) return "12:00 PM";
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return t;
  let h = parseInt(m[1], 10);
  const mer = h >= 12 ? "PM" : "AM";
  h = ((h + 11) % 12) + 1;
  return `${h}:${m[2]} ${mer}`;
}

function BookingPill({
  status,
  onChange,
}: {
  status: Stop["booking_status"];
  onChange: (s: Stop["booking_status"]) => void;
}) {
  const opts: Array<{ k: Stop["booking_status"]; label: string; cls: string }> = [
    { k: "unbooked", label: "Unbooked", cls: "bg-muted text-muted-foreground" },
    { k: "pending", label: "Pending", cls: "bg-amber-100 text-amber-900" },
    { k: "confirmed", label: "Confirmed", cls: "bg-emerald-100 text-emerald-900" },
  ];
  const cur = opts.find((o) => o.k === status) ?? opts[0];
  return (
    <select
      value={cur.k}
      onChange={(e) => onChange(e.target.value as Stop["booking_status"])}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${cur.cls} cursor-pointer`}
    >
      {opts.map((o) => (
        <option key={o.k} value={o.k}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function NotesEditor({ initial, onSave }: { initial: string; onSave: (v: string) => void }) {
  const [val, setVal] = useState(initial);
  const [editing, setEditing] = useState(false);
  return (
    <div className="mt-3">
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={val}
            onChange={(e) => setVal(e.target.value)}
            rows={2}
            placeholder="Confirmation #, party size, special requests..."
            className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                onSave(val);
                setEditing(false);
              }}
              className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
            >
              Save
            </button>
            <button
              onClick={() => {
                setVal(initial);
                setEditing(false);
              }}
              className="rounded-full border border-border px-3 py-1 text-xs font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-3 w-3" /> {val ? "Edit notes" : "Add notes"}
          {val && (
            <span className="ml-2 italic font-normal opacity-80">
              — "{val.slice(0, 60)}
              {val.length > 60 ? "..." : ""}"
            </span>
          )}
        </button>
      )}
    </div>
  );
}

function ReservationEditor({
  stop,
  onSave,
}: {
  stop: Stop;
  onSave: (patch: Partial<Stop>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [ref, setRef] = useState(stop.booking_ref ?? "");
  const [party, setParty] = useState<string>(stop.party_size ? String(stop.party_size) : "");
  const [time, setTime] = useState(stop.reservation_time?.slice(0, 5) ?? "");
  const [phone, setPhone] = useState(stop.contact_phone ?? "");
  const [email, setEmail] = useState(stop.contact_email ?? "");
  const [note, setNote] = useState(stop.confirmation_note ?? "");

  const filled =
    stop.booking_ref ||
    stop.party_size ||
    stop.reservation_time ||
    stop.contact_phone ||
    stop.contact_email ||
    stop.confirmation_note;

  function save() {
    onSave({
      booking_ref: ref || null,
      party_size: party ? Number(party) : null,
      reservation_time: time ? `${time}:00` : null,
      contact_phone: phone || null,
      contact_email: email || null,
      confirmation_note: note || null,
      booking_status: stop.booking_status === "unbooked" ? "pending" : stop.booking_status,
    });
    setOpen(false);
  }

  return (
    <div className="mt-3 rounded-xl border border-border/70 bg-background">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
      >
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Ticket className="h-3.5 w-3.5 text-primary" /> Reservation details
          {filled ? (
            <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-900 normal-case">
              Saved
            </span>
          ) : (
            <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold normal-case">
              Add
            </span>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {!open && filled && (
        <div className="grid gap-1 px-3 pb-3 text-sm text-muted-foreground sm:grid-cols-2">
          {stop.booking_ref && (
            <span className="inline-flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5" />{" "}
              <span className="font-mono text-foreground">{stop.booking_ref}</span>
            </span>
          )}
          {stop.party_size && (
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> Party of {stop.party_size}
            </span>
          )}
          {stop.reservation_time && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> {stop.reservation_time.slice(0, 5)}
            </span>
          )}
          {stop.contact_phone && (
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" /> {stop.contact_phone}
            </span>
          )}
          {stop.contact_email && (
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> {stop.contact_email}
            </span>
          )}
          {stop.confirmation_note && (
            <span className="inline-flex items-center gap-1.5 sm:col-span-2">
              <FileText className="h-3.5 w-3.5" /> {stop.confirmation_note}
            </span>
          )}
        </div>
      )}
      {open && (
        <div className="space-y-3 border-t border-border/70 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <ResField label="Confirmation #" icon={<Hash className="h-3.5 w-3.5" />}>
              <input
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                placeholder="ABC-12345"
                className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 font-mono text-sm outline-none focus:border-primary"
              />
            </ResField>
            <ResField label="Party size" icon={<Users className="h-3.5 w-3.5" />}>
              <input
                type="number"
                min={1}
                value={party}
                onChange={(e) => setParty(e.target.value)}
                placeholder="2"
                className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary"
              />
            </ResField>
            <ResField label="Reservation time" icon={<Clock className="h-3.5 w-3.5" />}>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary"
              />
            </ResField>
            <ResField label="Phone" icon={<Phone className="h-3.5 w-3.5" />}>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary"
              />
            </ResField>
            <ResField label="Email" icon={<Mail className="h-3.5 w-3.5" />}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="confirmations@..."
                className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary"
              />
            </ResField>
          </div>
          <ResField label="Note" icon={<FileText className="h-3.5 w-3.5" />}>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Special requests, dress code, allergies..."
              className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary"
            />
          </ResField>
          <div className="flex gap-2">
            <button
              onClick={save}
              className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
            >
              Save reservation
            </button>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ResField({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </span>
      {children}
    </label>
  );
}

const MODE_META: Record<string, { Icon: typeof Car; label: string; cls: string }> = {
  walk: {
    Icon: Footprints,
    label: "Walk",
    cls: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  },
  bike: {
    Icon: Bike,
    label: "Bike",
    cls: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  },
  car: {
    Icon: Car,
    label: "Drive",
    cls: "bg-blue-100 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200",
  },
  transit: {
    Icon: Bus,
    label: "Transit",
    cls: "bg-violet-100 text-violet-900 dark:bg-violet-950/40 dark:text-violet-200",
  },
  lyft: {
    Icon: Car,
    label: "Lyft",
    cls: "bg-pink-100 text-pink-900 dark:bg-pink-950/40 dark:text-pink-200",
  },
  uber: { Icon: Car, label: "Uber", cls: "bg-foreground text-background" },
  rideshare: { Icon: Car, label: "Rideshare", cls: "bg-foreground text-background" },
};

function TravelLegCard({ leg, from, to }: { leg: TravelLeg; from: Stop; to: Stop }) {
  const meta = MODE_META[leg.mode] ?? MODE_META.car;
  const Icon = meta.Icon;
  const fromQ = encodeURIComponent(from.address ?? from.name);
  const toQ = encodeURIComponent(to.address ?? to.name);

  // Deep links
  const links: Array<{ label: string; href: string }> = [];
  if (leg.mode === "uber" || leg.mode === "rideshare") {
    links.push({
      label: "Open Uber",
      href: `https://m.uber.com/ul/?action=setPickup&pickup[formatted_address]=${fromQ}&dropoff[formatted_address]=${toQ}`,
    });
  }
  if (leg.mode === "lyft" || leg.mode === "rideshare") {
    links.push({
      label: "Open Lyft",
      href: `https://ride.lyft.com/ridetype?destination[address]=${toQ}`,
    });
  }
  const travelMode: "walking" | "driving" | "transit" | "bicycling" =
    leg.mode === "transit"
      ? "transit"
      : leg.mode === "walk"
        ? "walking"
        : leg.mode === "bike"
          ? "bicycling"
          : "driving";
  const fromPlace = { name: from.name, address: from.address };
  const toPlace = { name: to.name, address: to.address };
  const apple = buildAppleMapsDirectionsUrl([fromPlace, toPlace], travelMode, { native: isIOS() });
  const google = buildGoogleMapsDirectionsUrl([fromPlace, toPlace], travelMode, {
    native: isAndroid(),
  });
  // Order: preferred map first
  if (isAppleDevice()) {
    links.push({ label: "Apple Maps", href: apple });
    links.push({ label: "Google Maps", href: google });
  } else {
    links.push({ label: "Google Maps", href: google });
    links.push({ label: "Apple Maps", href: apple });
  }

  return (
    <div className="mb-4 ml-2 flex items-start gap-3 rounded-xl border border-dashed border-border/70 bg-muted/30 p-3 text-sm">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${meta.cls}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          {meta.label} · {leg.durationMinutes} min
          {leg.distance && <span className="text-muted-foreground"> · {leg.distance}</span>}
          {leg.estCost && <span className="text-muted-foreground"> · {leg.estCost}</span>}
        </p>
        <p className="mt-0.5 text-muted-foreground">{leg.instructions}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold hover:bg-muted"
            >
              <Navigation className="h-3 w-3" /> {l.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export function VibeRow({ stop, prefs }: { stop: Stop; prefs: VibePrefs }) {
  const inferred = inferStopVibe(stop);
  const score = vibeMatchScore(inferred, prefs);
  const level = matchLevel(score);

  const tone =
    level === "match"
      ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100"
      : level === "near"
        ? "border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
        : "border-rose-300 bg-rose-50 text-rose-900 dark:bg-rose-950/30 dark:text-rose-100";
  const label =
    level === "match" ? "Vibe match" : level === "near" ? "Close to your vibe" : "Off your vibe";

  const chip = (active: boolean, text: string, Icon: typeof Users) => (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-background text-muted-foreground"
      }`}
    >
      <Icon className="h-3 w-3" /> {text}
    </span>
  );

  return (
    <div
      data-testid="vibe-row"
      className={`mt-3 flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 ${tone}`}
    >
      <span className="text-[11px] font-bold uppercase tracking-wider">
        {label} · {score}%
      </span>
      {chip(inferred.crowd === prefs.crowd, CROWD_LABEL[inferred.crowd], Users)}
      {chip(inferred.noise === prefs.noise, NOISE_LABEL[inferred.noise], Sparkles)}
      {chip(inferred.dress === prefs.dress, DRESS_LABEL[inferred.dress], Shirt)}
    </div>
  );
}
