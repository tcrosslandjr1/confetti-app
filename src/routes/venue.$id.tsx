import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Star,
  Sparkles,
  ChevronLeft,
  Minus,
  Plus,
  Check,
  Clock,
  Users,
  Calendar as CalendarIcon,
  Share2,
  CalendarPlus,
  Loader2,
  ShieldCheck,
  Volume2,
  Shirt,
  Flame,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getSampleVenue } from "@/lib/sample-venues";
import { X } from "lucide-react";

export const Route = createFileRoute("/venue/$id")({
  head: () => ({ meta: [{ title: "Reserve — Confetti" }] }),
  component: VenueBookingPage,
});

type Venue = {
  id: string;
  name: string;
  category: string | null;
  neighborhood: string | null;
  address: string | null;
  image_url: string | null;
  description: string | null;
  rating: number | null;
  price_level: number | null;
  tags: string[];
  source: "venues" | "viral_venues";
  city: string | null;
};

const FALLBACK_PHOTO =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&auto=format&fit=crop";

const MENU_HIGHLIGHTS = [
  { name: "Truffle Burrata", desc: "house focaccia, hot honey", price: "$24" },
  { name: "Wagyu Sliders (3)", desc: "smoked gouda, pickles", price: "$32" },
  { name: "Spicy Margarita Flight", desc: "jalapeño, mezcal, blanco", price: "$28" },
  { name: "Chocolate Soufflé", desc: "20-min wait, worth it", price: "$16" },
];

const DETAILS = [
  { icon: Shirt, label: "Dress code", value: "Smart casual" },
  { icon: Volume2, label: "Noise level", value: "Loud & lively" },
  { icon: Users, label: "Best for", value: "Date night · 2–6" },
  { icon: Flame, label: "Vibe peak", value: "9:30–11:30 PM" },
];

// ---------------- Page ----------------

function VenueBookingPage() {
  const { id } = Route.useParams();
  const [venue, setVenue] = useState<Venue | null | undefined>(undefined);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [dir, setDir] = useState<1 | -1>(1);
  const [modalOpen, setModalOpen] = useState(false);

  // Booking selections
  const [dateIdx, setDateIdx] = useState(2);
  const [time, setTime] = useState<string | null>("8:00 PM");
  const [party, setParty] = useState(2);
  const [notes, setNotes] = useState("");
  const confirmationCode = useMemo(
    () => "CF-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const sample = getSampleVenue(id);
    (async () => {
      let v: any = null;
      let source: "venues" | "viral_venues" = "venues";
      if (isUuid) {
        const venuesRes = await supabase
          .from("venues")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        if (venuesRes.data) {
          v = venuesRes.data;
        } else {
          const viralRes = await supabase
            .from("viral_venues")
            .select("*")
            .eq("id", id)
            .maybeSingle();
          if (viralRes.data) {
            v = viralRes.data;
            source = "viral_venues";
          }
        }
      }
      if (cancelled) return;
      if (v) {
        setVenue({
          id: v.id,
          name: v.name,
          category: v.category ?? null,
          neighborhood: v.neighborhood ?? null,
          address: (v as any).address ?? null,
          image_url: v.image_url ?? null,
          description: v.description ?? null,
          rating: (v as any).rating ?? 4.8,
          price_level: (v as any).price_level ?? 3,
          tags: Array.isArray((v as any).tags) ? (v as any).tags : [],
          source,
          city: (v as any).city ?? null,
        });
      } else if (sample) {
        setVenue({
          id: sample.id,
          name: sample.name,
          category: sample.category,
          neighborhood: sample.neighborhood,
          address: sample.address,
          image_url: null,
          description: sample.description,
          rating: sample.rating,
          price_level: sample.price_level,
          tags: sample.tags,
          source: "venues",
          city: sample.city,
        });
      } else {
        // Final fallback so the flow remains usable even without a row.
        setVenue({
          id,
          name: "Le Petit Salon",
          category: "Cocktail bar",
          neighborhood: "West Village",
          address: "247 W 10th St, New York",
          image_url: FALLBACK_PHOTO,
          description: "An intimate cocktail bar with a hidden garden patio.",
          rating: 4.8,
          price_level: 3,
          tags: ["date night", "cocktails", "intimate"],
          source: "venues",
          city: "New York",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const go = (next: 1 | 2 | 3 | 4) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (venue === undefined) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream">
        <Loader2 className="h-6 w-6 animate-spin text-coral" />
      </div>
    );
  }
  if (venue === null) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream">
        <div className="text-center">
          <p className="font-display text-xl">Venue not found</p>
          <Link to="/discover" className="mt-3 inline-block text-coral underline">
            Browse venues
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-cream">
      <AuroraBackground />
      <StepHeader step={step} onBack={() => (step === 1 ? window.history.back() : go((step - 1) as 1 | 2 | 3))} />

      <div className="relative mx-auto max-w-2xl px-4 pb-32 pt-2 sm:px-6">
        <div key={step} className={dir === 1 ? "animate-[slide-in-right_.32s_ease-out]" : "animate-[fade-in_.32s_ease-out]"}>
          {step === 1 && <StepVenue venue={venue} onReserve={() => setModalOpen(true)} />}
          {step === 2 && (
            <StepTime
              venue={venue}
              dateIdx={dateIdx}
              setDateIdx={setDateIdx}
              time={time}
              setTime={setTime}
              party={party}
              setParty={setParty}
              notes={notes}
              setNotes={setNotes}
              onNext={() => time && go(3)}
            />
          )}
          {step === 3 && (
            <StepConfirm
              venue={venue}
              dateIdx={dateIdx}
              time={time ?? "—"}
              party={party}
              code={confirmationCode}
              onPay={() => go(4)}
            />
          )}
          {step === 4 && (
            <StepDone
              venue={venue}
              dateIdx={dateIdx}
              time={time ?? "—"}
              party={party}
              code={confirmationCode}
            />
          )}
        </div>
      </div>

      <ReservationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        venue={venue}
        dateIdx={dateIdx}
        setDateIdx={setDateIdx}
        time={time}
        setTime={setTime}
        party={party}
        setParty={setParty}
        notes={notes}
        setNotes={setNotes}
        code={confirmationCode}
      />
    </div>
  );
}

// ---------------- Background ----------------

function AuroraBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-gradient-vibe opacity-25 blur-3xl animate-[pulse_9s_ease-in-out_infinite]" />
      <div className="absolute top-1/3 -right-40 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,_oklch(0.72_0.14_200_/_0.45),_transparent_70%)] blur-3xl animate-[pulse_11s_ease-in-out_infinite]" />
      <div className="absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-[radial-gradient(circle,_oklch(0.72_0.21_355_/_0.35),_transparent_70%)] blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
      <div
        className="absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          color: "oklch(0.2 0 0)",
        }}
      />
    </div>
  );
}

// ---------------- Step header ----------------

function StepHeader({ step, onBack }: { step: number; onBack: () => void }) {
  const labels = ["Venue", "Time", "Confirm", "You're in"];
  return (
    <div className="sticky top-0 z-30 border-b-2 border-ink bg-cream/85 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3 sm:px-6">
        <button
          onClick={onBack}
          className="grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-white text-ink shadow-brut transition-pop active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          aria-label="Back"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex flex-1 items-center gap-1.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-1 items-center gap-1.5">
              <div
                className={`h-1.5 flex-1 rounded-full border border-ink ${
                  i <= step ? "bg-coral" : "bg-white"
                }`}
              />
            </div>
          ))}
        </div>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ink/70">
          {step}/4 · {labels[step - 1]}
        </span>
      </div>
    </div>
  );
}

// ---------------- Step 1: Venue Detail ----------------

function StepVenue({ venue, onReserve }: { venue: Venue; onReserve: () => void }) {
  const photo = venue.image_url || FALLBACK_PHOTO;
  const price = "$".repeat(Math.max(1, Math.min(4, venue.price_level || 3)));

  return (
    <div className="space-y-5">
      {/* HERO */}
      <div className="relative isolate overflow-hidden rounded-3xl border-2 border-ink shadow-brut">
        <img
          src={photo}
          alt={venue.name}
          className="aspect-[5/4] w-full object-cover sm:aspect-[16/10]"
        />
        {/* Plum -> Indigo gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(26,16,37,0.15) 0%, rgba(26,16,37,0.55) 55%, rgba(15,23,41,0.9) 100%)",
          }}
        />
        {/* Gold Confetti Exclusive badge */}
        <div className="absolute left-4 top-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-gradient-gold px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink shadow-brut">
            <Sparkles className="h-3 w-3" /> Confetti Exclusive
          </span>
        </div>

        {/* Venue info on hero */}
        <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono uppercase tracking-widest opacity-90">
            <span>{venue.category || "Cocktail bar"}</span>
            <span className="opacity-50">·</span>
            <span>{venue.neighborhood || venue.city || "Downtown"}</span>
          </div>
          <h1
            className="mt-2 font-display leading-[1.02] tracking-tight"
            style={{ fontSize: "32px", fontWeight: 900 }}
          >
            {venue.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/60 bg-gradient-to-r from-amber-400/25 to-amber-200/10 px-2.5 py-1 backdrop-blur-md">
              <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
              <span className="font-extrabold tracking-tight text-white">
                {(venue.rating ?? 4.8).toFixed(1)}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-white/60">
                842 reviews
              </span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/10 px-2.5 py-1 font-mono text-[11px] tracking-wider backdrop-blur-md">
              <span className="text-emerald-300">{price}</span>
              <span className="text-white/40">{"$".repeat(4 - price.length)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-coral/60 bg-coral/20 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-white backdrop-blur-md">
              <span className="relative grid h-2 w-2 place-items-center">
                <span className="absolute inset-0 animate-ping rounded-full bg-coral/70" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-coral" />
              </span>
              7 tables left tonight
            </span>
            <div className="flex w-full flex-wrap gap-1.5 pt-1">
              {(venue.tags?.length ? venue.tags : ["date night", "cocktails", "intimate"])
                .slice(0, 4)
                .map((t) => (
                  <span
                    key={t}
                    className="rounded-md border border-white/25 bg-white/5 px-2 py-0.5 font-mono text-[10px] lowercase tracking-wide text-white/90 backdrop-blur-md"
                  >
                    #{t.replace(/\s+/g, "-")}
                  </span>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendation glass card */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-ink bg-white/70 p-5 shadow-brut backdrop-blur">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-teal" />
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border-2 border-ink bg-cream shadow-brut">
            <Sparkles className="h-4 w-4 text-coral" />
          </span>
          <div className="space-y-1.5">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-teal">
              Why Confetti picked this
            </p>
            <p className="text-sm leading-relaxed text-ink/85">
              You loved <span className="font-semibold">Maison Pickle</span> and{" "}
              <span className="font-semibold">Attaboy</span>. {venue.name} hits the same intimate-but-buzzy
              note — low-lit booths, a bartender who actually asks what you're feeling, and a hidden
              patio for after-dinner.
            </p>
          </div>
        </div>
      </div>

      {/* 2x2 details grid */}
      <div className="grid grid-cols-2 gap-3">
        {DETAILS.map((d) => (
          <div
            key={d.label}
            className="rounded-2xl border-2 border-ink bg-white p-4 shadow-brut"
          >
            <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
              <d.icon className="h-3.5 w-3.5 text-coral" /> {d.label}
            </div>
            <p className="mt-1 font-display text-lg font-bold leading-tight">{d.value}</p>
          </div>
        ))}
      </div>

      {/* Menu highlights */}
      <div className="rounded-2xl border-2 border-ink bg-white p-5 shadow-brut">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-extrabold">Menu highlights</h2>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
            chef's picks
          </span>
        </div>
        <ul className="mt-3 divide-y divide-ink/10">
          {MENU_HIGHLIGHTS.map((m) => (
            <li key={m.name} className="flex items-start justify-between gap-3 py-3">
              <div>
                <p className="font-semibold text-ink">{m.name}</p>
                <p className="text-sm text-ink/60">{m.desc}</p>
              </div>
              <span className="shrink-0 font-mono text-sm font-bold text-coral">{m.price}</span>
            </li>
          ))}
        </ul>
      </div>

      <GradientCTA onClick={onReserve} label="Reserve a Spot" />
    </div>
  );
}

// ---------------- Step 2: Pick Your Time ----------------

const TIMES = [
  "5:30 PM",
  "6:00 PM",
  "6:30 PM",
  "7:00 PM",
  "7:30 PM",
  "8:00 PM",
  "8:30 PM",
  "9:00 PM",
  "9:30 PM",
  "10:00 PM",
  "10:30 PM",
  "11:00 PM",
];
const UNAVAILABLE = new Set(["6:00 PM", "7:30 PM", "10:30 PM"]);

function StepTime({
  venue,
  dateIdx,
  setDateIdx,
  time,
  setTime,
  party,
  setParty,
  notes,
  setNotes,
  onNext,
}: {
  venue: Venue;
  dateIdx: number;
  setDateIdx: (n: number) => void;
  time: string | null;
  setTime: (t: string) => void;
  party: number;
  setParty: (n: number) => void;
  notes: string;
  setNotes: (s: string) => void;
  onNext: () => void;
}) {
  const dates = useMemo(() => buildDates(14), []);
  const scrollerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-5">
      <div>
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-ink/60">
          Pick your time
        </p>
        <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight">
          When works for <span className="text-gradient">{venue.name.split(" ")[0]}</span>?
        </h2>
      </div>

      {/* Date chips */}
      <div className="-mx-4 sm:-mx-6">
        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-2 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {dates.map((d, i) => {
            const selected = i === dateIdx;
            return (
              <button
                key={d.iso}
                onClick={() => setDateIdx(i)}
                className={`flex min-w-[68px] shrink-0 snap-start flex-col items-center gap-0.5 rounded-2xl border-2 border-ink px-3 py-3 shadow-brut transition-pop active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
                  selected ? "bg-coral text-white" : "bg-white text-ink"
                }`}
              >
                <span
                  className={`font-mono text-[10px] font-bold uppercase tracking-widest ${
                    selected ? "text-white/85" : "text-ink/60"
                  }`}
                >
                  {d.dow}
                </span>
                <span className="font-display text-xl font-extrabold leading-none">{d.day}</span>
                <span
                  className={`font-mono text-[10px] uppercase ${
                    selected ? "text-white/85" : "text-ink/50"
                  }`}
                >
                  {d.mon}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time grid */}
      <div className="rounded-2xl border-2 border-ink bg-white p-4 shadow-brut">
        <div className="mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-coral" />
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
            Available times
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {TIMES.map((t) => {
            const unavail = UNAVAILABLE.has(t);
            const selected = t === time;
            return (
              <button
                key={t}
                disabled={unavail}
                onClick={() => setTime(t)}
                className={`rounded-xl border-2 px-2 py-3 text-sm font-bold transition-pop ${
                  unavail
                    ? "cursor-not-allowed border-ink/20 bg-ink/5 text-ink/30 line-through"
                    : selected
                      ? "border-ink bg-teal text-white shadow-brut"
                      : "border-ink bg-white text-ink hover:-translate-y-0.5 hover:shadow-brut"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Party size */}
      <div className="rounded-2xl border-2 border-ink bg-white p-4 shadow-brut">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
              Party size
            </p>
            <p className="mt-0.5 font-display text-2xl font-extrabold">
              {party} <span className="text-base font-normal text-ink/60">{party === 1 ? "guest" : "guests"}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-label="Decrease party size"
              onClick={() => setParty(Math.max(1, party - 1))}
              className="grid h-11 w-11 place-items-center rounded-full border-2 border-ink bg-cream text-ink shadow-brut transition-pop active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              aria-label="Increase party size"
              onClick={() => setParty(Math.min(20, party + 1))}
              className="grid h-11 w-11 place-items-center rounded-full border-2 border-ink bg-ink text-cream shadow-brut transition-pop active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Special requests */}
      <div className="rounded-2xl border-2 border-ink bg-white p-4 shadow-brut">
        <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
          Special requests
        </label>
        <textarea
          rows={3}
          maxLength={280}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Birthday? Allergies? Booth preference?"
          className="mt-2 w-full resize-none rounded-xl border-2 border-ink bg-cream px-3 py-2.5 text-sm outline-none transition focus:-translate-y-0.5 focus:shadow-brut"
        />
        <div className="mt-1 text-right font-mono text-[10px] text-ink/40">{notes.length}/280</div>
      </div>

      <GradientCTA
        onClick={onNext}
        label="Review Booking"
        disabled={!time}
      />
    </div>
  );
}

// ---------------- Step 3: Confirm ----------------

function StepConfirm({
  venue,
  dateIdx,
  time,
  party,
  code,
  onPay,
}: {
  venue: Venue;
  dateIdx: number;
  time: string;
  party: number;
  code: string;
  onPay: () => void;
}) {
  const date = useMemo(() => buildDates(14)[dateIdx], [dateIdx]);
  const deposit = 25 * party;
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    setPaying(true);
    await new Promise((r) => setTimeout(r, 900));
    setPaying(false);
    onPay();
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-ink/60">
          Final look
        </p>
        <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight">
          Confirm your <span className="text-gradient">reservation</span>
        </h2>
      </div>

      {/* Boarding-pass style preview card */}
      <div className="overflow-hidden rounded-3xl border-2 border-ink shadow-brut">
        {/* Dark header */}
        <div
          className="relative p-5 text-white"
          style={{
            background:
              "linear-gradient(135deg, #1A1025 0%, #2A1845 55%, #0F1729 100%)",
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-white/70">
                Confetti Reservation
              </p>
              <p className="mt-2 font-display text-2xl font-extrabold leading-tight">
                {venue.name}
              </p>
              <p className="mt-0.5 text-sm text-white/70">
                {venue.neighborhood || venue.city || "Downtown"}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-gold px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-ink">
              <Sparkles className="h-3 w-3" /> VIP
            </span>
          </div>
        </div>

        {/* Tear notches */}
        <div className="relative h-0">
          <div className="absolute -left-2 -top-2 h-4 w-4 rounded-full bg-cream" />
          <div className="absolute -right-2 -top-2 h-4 w-4 rounded-full bg-cream" />
          <div className="absolute inset-x-3 -top-0 border-t-2 border-dashed border-ink/30" />
        </div>

        {/* Glass body */}
        <div className="grid grid-cols-2 gap-px bg-ink/15">
          <PassCell label="Date" value={`${date.dow}, ${date.mon} ${date.day}`} icon={CalendarIcon} />
          <PassCell label="Time" value={time} icon={Clock} />
          <PassCell label="Party" value={`${party} ${party === 1 ? "guest" : "guests"}`} icon={Users} />
          <PassCell label="Table" value="Booth · garden side" icon={Sparkles} />
          <div className="col-span-2 bg-white p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
              Confirmation
            </p>
            <p className="mt-1 font-mono text-lg font-bold tracking-[0.25em] text-ink">{code}</p>
          </div>
        </div>
      </div>

      {/* Deposit notice */}
      <div className="rounded-2xl border-2 border-ink bg-white p-4 shadow-brut">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl border-2 border-ink bg-cream shadow-brut">
            <ShieldCheck className="h-4 w-4 text-teal" />
          </span>
          <div className="text-sm">
            <p className="font-semibold">$25 deposit per guest</p>
            <p className="text-ink/60">
              ${deposit} total. Fully credited toward your bill. Refundable up to 24h before.
            </p>
          </div>
        </div>
      </div>

      {/* Cancellation policy */}
      <div className="rounded-2xl border-2 border-dashed border-ink/40 bg-cream/60 p-4 text-xs text-ink/70">
        <span className="font-bold text-ink">Cancellation:</span> Free up to 24 hours before. After
        that the deposit is forfeit. Reschedule any time from your boarding pass.
      </div>

      <GradientCTA
        onClick={handlePay}
        label={paying ? "Processing…" : `Confirm & Pay $${deposit}`}
        disabled={paying}
        leading={paying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      />
    </div>
  );
}

function PassCell({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: any;
}) {
  return (
    <div className="bg-white p-4">
      <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
        <Icon className="h-3 w-3 text-coral" />
        {label}
      </div>
      <p className="mt-1 font-display text-base font-bold leading-tight">{value}</p>
    </div>
  );
}

// ---------------- Step 4: Confirmation (cream boarding pass) ----------------

function StepDone({
  venue,
  dateIdx,
  time,
  party,
  code,
}: {
  venue: Venue;
  dateIdx: number;
  time: string;
  party: number;
  code: string;
}) {
  const date = useMemo(() => buildDates(14)[dateIdx], [dateIdx]);
  const [showXp, setShowXp] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowXp(true), 350);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative space-y-5">
      {/* Confetti particles */}
      <ConfettiRain />

      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-teal px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-brut">
          <Check className="h-3.5 w-3.5" /> You're in
        </span>
        <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight">
          See you {date.dow}, <span className="text-gradient">{time}</span>
        </h2>
        <p className="mt-1 text-sm text-ink/60">
          We sent your boarding pass to your wallet & inbox.
        </p>
      </div>

      {/* Cream boarding pass */}
      <div
        className="relative overflow-hidden rounded-3xl border-2 border-ink shadow-brut-lg"
        style={{ backgroundColor: "#F5F0E8" }}
      >
        {/* Charcoal header */}
        <div className="relative bg-[#2A2620] p-5 text-cream">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-cream/70">
                Confetti · Boarding Pass
              </p>
              <p className="mt-2 font-display text-2xl font-extrabold leading-tight">
                {venue.name}
              </p>
              <p className="mt-0.5 text-sm text-cream/70">
                {venue.neighborhood || venue.city || "Downtown"}
              </p>
            </div>
            <Sparkles className="h-5 w-5 text-amber-300" />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-cream">
            <PassMini label="Date" value={`${date.mon} ${date.day}`} />
            <PassMini label="Time" value={time} />
            <PassMini label="Party" value={`${party}`} />
          </div>
        </div>

        {/* Tear line */}
        <div className="relative h-6 bg-[#F5F0E8]">
          <div className="absolute -left-3 top-0 h-6 w-6 rounded-full bg-cream" />
          <div className="absolute -right-3 top-0 h-6 w-6 rounded-full bg-cream" />
          <div className="absolute inset-x-4 top-1/2 border-t-2 border-dashed border-ink/30" />
        </div>

        {/* Stub body */}
        <div className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
                Confirmation
              </p>
              <p className="mt-1 font-mono text-xl font-bold tracking-[0.25em] text-ink">{code}</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-gradient-gold px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-ink">
              VIP
            </span>
          </div>

          {/* Barcode */}
          <Barcode value={code} />
          <p className="text-center font-mono text-[10px] uppercase tracking-[0.3em] text-ink/50">
            Show at door · skip-the-line
          </p>
        </div>
      </div>

      {/* XP Toast */}
      <div
        className={`pointer-events-none fixed inset-x-0 top-20 z-40 mx-auto max-w-xs px-4 transition-all duration-500 ${
          showXp ? "translate-y-0 opacity-100" : "-translate-y-6 opacity-0"
        }`}
      >
        <div className="flex items-center gap-3 rounded-2xl border-2 border-ink bg-gradient-gold p-3 text-ink shadow-brut-lg">
          <Sparkles className="h-5 w-5" />
          <div className="flex-1">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest">
              Confetti earned
            </p>
            <p className="font-display text-lg font-extrabold leading-none">+75 XP</p>
          </div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest opacity-70">
            +1 booking
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => toast.success("Added to your calendar")}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-white py-4 font-mono text-xs font-bold uppercase tracking-[0.18em] text-ink shadow-brut transition-pop hover:-translate-y-0.5 hover:shadow-brut-lg active:translate-y-0 active:shadow-none"
        >
          <CalendarPlus className="h-4 w-4" /> Add to Calendar
        </button>
        <button
          onClick={() => {
            const url = typeof window !== "undefined" ? window.location.href : "";
            if (navigator.share) {
              navigator.share({ title: venue.name, text: `Joining me at ${venue.name}?`, url }).catch(() => {});
            } else {
              navigator.clipboard?.writeText(url);
              toast.success("Link copied — share it with your crew");
            }
          }}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-ink py-4 font-mono text-xs font-bold uppercase tracking-[0.18em] text-cream shadow-brut transition-pop hover:-translate-y-0.5 hover:shadow-brut-lg active:translate-y-0 active:shadow-none"
        >
          <Share2 className="h-4 w-4" /> Share with Crew
        </button>
      </div>

      <Link
        to="/discover"
        className="block text-center font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-ink/60 underline-offset-4 hover:underline"
      >
        Browse more spots →
      </Link>
    </div>
  );
}

// ---------------- Reservation Modal ----------------

function ReservationModal({
  open,
  onClose,
  venue,
  dateIdx,
  setDateIdx,
  time,
  setTime,
  party,
  setParty,
  notes,
  setNotes,
  code,
}: {
  open: boolean;
  onClose: () => void;
  venue: Venue;
  dateIdx: number;
  setDateIdx: (n: number) => void;
  time: string | null;
  setTime: (t: string) => void;
  party: number;
  setParty: (n: number) => void;
  notes: string;
  setNotes: (s: string) => void;
  code: string;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const dates = useMemo(() => buildDates(14), []);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setConfirmed(false);
  }, [open]);

  const handleConfirm = () => {
    if (!time) {
      toast.error("Pick a time first");
      return;
    }
    setConfirmed(true);
    toast.success("Reservation confirmed!");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      {/* Modal panel */}
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border-2 border-ink bg-cream shadow-brut-lg animate-[slide-in-up_.28s_ease-out]">
        <h2 className="sr-only">Reserve at {venue.name}</h2>
        {!confirmed ? (
          <div className="space-y-5 p-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink/60">
                  Reserve a table
                </p>
                <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight">
                  {venue.name}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-ink bg-white font-bold shadow-brut transition-pop"
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Date chips */}
            <div>
              <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
                <CalendarIcon className="mr-1 inline h-3 w-3" /> Choose a date
              </p>
              <div
                ref={scrollerRef}
                className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {dates.map((d, i) => {
                  const selected = i === dateIdx;
                  return (
                    <button
                      key={d.iso}
                      onClick={() => setDateIdx(i)}
                      className={`flex min-w-[68px] shrink-0 snap-start flex-col items-center gap-0.5 rounded-2xl border-2 border-ink px-3 py-3 shadow-brut transition-pop active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
                        selected ? "bg-coral text-white" : "bg-white text-ink"
                      }`}
                    >
                      <span className={`font-mono text-[10px] font-bold uppercase tracking-widest ${selected ? "text-white/85" : "text-ink/60"}`}>
                        {d.dow}
                      </span>
                      <span className="font-display text-xl font-extrabold leading-none">{d.day}</span>
                      <span className={`font-mono text-[10px] uppercase ${selected ? "text-white/85" : "text-ink/50"}`}>
                        {d.mon}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time grid */}
            <div>
              <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
                <Clock className="mr-1 inline h-3 w-3" /> Available times
              </p>
              <div className="grid grid-cols-3 gap-2">
                {TIMES.map((t) => {
                  const unavail = UNAVAILABLE.has(t);
                  const selected = t === time;
                  return (
                    <button
                      key={t}
                      disabled={unavail}
                      onClick={() => setTime(t)}
                      className={`rounded-xl border-2 px-2 py-3 text-sm font-bold transition-pop ${
                        unavail
                          ? "cursor-not-allowed border-ink/20 bg-ink/5 text-ink/30 line-through"
                          : selected
                            ? "border-ink bg-teal text-white shadow-brut"
                            : "border-ink bg-white text-ink hover:-translate-y-0.5 hover:shadow-brut"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Party size */}
            <div className="rounded-2xl border-2 border-ink bg-white p-4 shadow-brut">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-coral" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
                    Party size
                  </span>
                </div>
                <div className="inline-flex items-center gap-2">
                  <button
                    onClick={() => setParty(Math.max(1, party - 1))}
                    className="grid h-8 w-8 place-items-center rounded-full border-2 border-ink bg-cream font-bold shadow-brut transition-pop active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                    aria-label="Decrease"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-6 text-center font-display text-lg font-extrabold">{party}</span>
                  <button
                    onClick={() => setParty(Math.min(20, party + 1))}
                    className="grid h-8 w-8 place-items-center rounded-full border-2 border-ink bg-cream font-bold shadow-brut transition-pop active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                    aria-label="Increase"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
                Special requests (optional)
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Allergies, seating preference, celebration…"
                className="min-h-[80px] w-full rounded-2xl border-2 border-ink bg-white p-3 text-sm text-ink placeholder:text-ink/40 shadow-brut focus:outline-none focus:ring-2 focus:ring-coral"
              />
            </div>

            {/* Confirm CTA */}
            <GradientCTA
              onClick={handleConfirm}
              label="Confirm Reservation"
              disabled={!time}
              leading={<ShieldCheck className="h-4 w-4" />}
            />
          </div>
        ) : (
          <div className="space-y-5 p-5 text-center">
            <ConfettiRain />
            <div className="relative z-10 mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-ink bg-gradient-to-br from-coral to-violet-500 text-white shadow-brut">
              <Check className="h-7 w-7" />
            </div>
            <div>
              <h3 className="font-display text-2xl font-extrabold tracking-tight">You're in!</h3>
              <p className="mt-1 text-sm text-ink/70">
                {venue.name} · {dates[dateIdx]?.dow} {dates[dateIdx]?.day} {dates[dateIdx]?.mon} at {time}
              </p>
            </div>
            <div className="rounded-2xl border-2 border-ink bg-white p-4 shadow-brut">
              <div className="flex items-center justify-between">
                <PassMini label="Confirmation" value={code} />
                <PassMini label="Party of" value={String(party)} />
              </div>
            </div>
            <button
              onClick={onClose}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-white py-3.5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-ink shadow-brut transition-pop hover:-translate-y-0.5 hover:shadow-brut active:translate-y-0 active:shadow-none"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PassMini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] opacity-70">
        {label}
      </p>
      <p className="mt-0.5 font-display text-lg font-extrabold leading-none">{value}</p>
    </div>
  );
}

function Barcode({ value }: { value: string }) {
  const bars = useMemo(() => {
    let seed = 0;
    for (const c of value) seed = (seed * 31 + c.charCodeAt(0)) % 9973;
    return Array.from({ length: 56 }, (_, i) => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return 1 + (seed % 4); // width 1..4
    });
  }, [value]);
  return (
    <div className="flex h-14 items-end gap-[2px] rounded-md bg-white p-2">
      {bars.map((w, i) => (
        <span
          key={i}
          className="block h-full bg-ink"
          style={{ width: `${w}px`, opacity: w === 1 ? 0.6 : 1 }}
        />
      ))}
    </div>
  );
}

function ConfettiRain() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 24 }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        dur: 1.8 + Math.random() * 1.4,
        color: ["#F05537", "#FFC857", "#1FB6A8", "#7C3AED", "#D1410C"][
          Math.floor(Math.random() * 5)
        ],
        rot: Math.random() * 360,
      })),
    [],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-4 z-20 h-64 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute -top-4 block h-2 w-2 rounded-sm"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            transform: `rotate(${p.rot}deg)`,
            animation: `confetti-fall ${p.dur}s cubic-bezier(.3,.7,.4,1) ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

// ---------------- Shared ----------------

function GradientCTA({
  onClick,
  label,
  disabled,
  leading,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  leading?: React.ReactNode;
}) {
  return (
    <div className="sticky bottom-4 z-20 mt-4">
      <button
        onClick={onClick}
        disabled={disabled}
        className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-ink py-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-white shadow-brut-lg transition-pop hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(95deg, #F05537 0%, #E94584 45%, #7C3AED 100%)",
          backgroundSize: "180% 100%",
        }}
      >
        <span
          aria-hidden
          className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            backgroundImage:
              "linear-gradient(95deg, #7C3AED 0%, #E94584 45%, #F05537 100%)",
          }}
        />
        <span className="relative inline-flex items-center gap-2">
          {leading}
          {label}
          <span aria-hidden>→</span>
        </span>
      </button>
    </div>
  );
}

function buildDates(n: number) {
  const now = new Date();
  const dows = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const mons = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    return {
      iso: d.toISOString().slice(0, 10),
      dow: i === 0 ? "Today" : i === 1 ? "Tmrw" : dows[d.getDay()],
      day: String(d.getDate()),
      mon: mons[d.getMonth()],
    };
  });
}
