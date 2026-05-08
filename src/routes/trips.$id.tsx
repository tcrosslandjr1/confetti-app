import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, Check, ExternalLink, MapPin, Pencil, Trash2, Utensils, Wine, Camera, Activity, Car, Sparkles, ParkingCircle, Lightbulb, Quote, Stamp } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/lib/auth-context";
import { completeItinerary, deleteItinerary, getItinerary, updateStop, type Itinerary, type Stop } from "@/lib/itineraries";

export const Route = createFileRoute("/trips/$id")({
  component: TripDetail,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center"><Link to="/trips" className="text-primary underline">Back to trips</Link></div>
  ),
});

const CAT_ICONS: Record<string, typeof Utensils> = {
  meal: Utensils, drinks: Wine, scenic: Camera, activity: Activity, travel: Car, other: Sparkles,
};

function TripDetail() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [data, setData] = useState<{ itinerary: Itinerary; stops: Stop[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { nav({ to: "/auth" }); return; }
    getItinerary(id).then(setData).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }, [id, user, authLoading, nav]);

  async function setStatus(stopId: string, status: Stop["booking_status"]) {
    if (!data) return;
    setData({ ...data, stops: data.stops.map((s) => s.id === stopId ? { ...s, booking_status: status } : s) });
    try { await updateStop(stopId, { booking_status: status }); } catch (e) { setErr((e as Error).message); }
  }

  async function saveNotes(stopId: string, user_notes: string) {
    if (!data) return;
    setData({ ...data, stops: data.stops.map((s) => s.id === stopId ? { ...s, user_notes } : s) });
    try { await updateStop(stopId, { user_notes }); } catch (e) { setErr((e as Error).message); }
  }

  async function removeTrip() {
    if (!confirm("Delete this trip?")) return;
    try { await deleteItinerary(id); nav({ to: "/trips" }); } catch (e) { setErr((e as Error).message); }
  }

  async function completeDay() {
    try {
      if (!data?.itinerary.completed_at) await completeItinerary(id);
      nav({ to: "/trips/$id/passport", params: { id } });
    } catch (e) { setErr((e as Error).message); }
  }

  if (loading) return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading...</div>;
  if (err) return <div className="grid min-h-screen place-items-center"><p className="text-destructive">{err}</p></div>;
  if (!data) return null;

  const { itinerary: it, stops } = data;
  const confirmedCount = stops.filter((s) => s.booking_status === "confirmed").length;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="bg-gradient-warm/40 border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <Link to="/trips" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> All trips
          </Link>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">{it.title}</h1>
          {it.summary && <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{it.summary}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {it.date && <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> {new Date(it.date).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</span>}
            {it.city && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {it.city}</span>}
            {it.est_total_cost && <span className="inline-flex items-center gap-1.5">💵 {it.est_total_cost}</span>}
            <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> {confirmedCount}/{stops.length} confirmed</span>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={completeDay} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-pop hover:scale-105 transition-pop">
              <Stamp className="h-3.5 w-3.5" /> {it.completed_at ? "View passport" : "Complete day → Passport"}
            </button>
            <button onClick={removeTrip} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <ol className="relative space-y-6 border-l-2 border-dashed border-border pl-6">
          {stops.map((s, i) => {
            const Icon = CAT_ICONS[s.category as string] ?? Sparkles;
            return (
              <li key={s.id} className="relative">
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
                    <BookingPill status={s.booking_status as Stop["booking_status"]} onChange={(st) => s.id && setStatus(s.id, st)} />
                  </div>

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
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">What to do / order</p>
                      <p className="mt-1 text-sm">{s.what_to_do}</p>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {s.booking_url && (
                      <a href={s.booking_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background hover:scale-105 transition-pop">
                        Book on {s.booking_provider ?? "site"} <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>

                  <NotesEditor initial={s.user_notes ?? ""} onSave={(v) => s.id && saveNotes(s.id, v)} />
                </article>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

function BookingPill({ status, onChange }: { status: Stop["booking_status"]; onChange: (s: Stop["booking_status"]) => void }) {
  const opts: Array<{ k: Stop["booking_status"]; label: string; cls: string }> = [
    { k: "unbooked", label: "Unbooked", cls: "bg-muted text-muted-foreground" },
    { k: "pending",  label: "Pending",  cls: "bg-amber-100 text-amber-900" },
    { k: "confirmed", label: "Confirmed", cls: "bg-emerald-100 text-emerald-900" },
  ];
  const cur = opts.find((o) => o.k === status) ?? opts[0];
  return (
    <select value={cur.k} onChange={(e) => onChange(e.target.value as Stop["booking_status"])}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${cur.cls} cursor-pointer`}>
      {opts.map((o) => (<option key={o.k} value={o.k}>{o.label}</option>))}
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
          <textarea value={val} onChange={(e) => setVal(e.target.value)} rows={2}
            placeholder="Confirmation #, party size, special requests..."
            className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary" />
          <div className="flex gap-2">
            <button onClick={() => { onSave(val); setEditing(false); }} className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Save</button>
            <button onClick={() => { setVal(initial); setEditing(false); }} className="rounded-full border border-border px-3 py-1 text-xs font-semibold">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
          <Pencil className="h-3 w-3" /> {val ? "Edit notes" : "Add notes"}
          {val && <span className="ml-2 italic font-normal opacity-80">— "{val.slice(0, 60)}{val.length > 60 ? "..." : ""}"</span>}
        </button>
      )}
    </div>
  );
}
