import { useState, useEffect, useRef } from "react";

// ─── Types ───────────────────────────────────────────────────────────
interface Stop {
  id: string;
  number: number;
  time: string;
  name: string;
  detail: string;
  neighborhood: string;
  address: string;
  bookable: boolean;
  bookingType: "reservation" | "activity" | "charging" | "none";
  apiProvider?: "opentable" | "resy" | "viator" | "mindbody" | "chargepoint";
  apiVenueId?: string;
}

interface ConfettiItinerary {
  code: string;
  passenger: string;
  date: string;
  partySize: number;
  departure: string;
  arrival: string;
  gate: string;
  boardingTime: string;
  seat: string;
  stops: Stop[];
}

// ─── Sample Data ─────────────────────────────────────────────────────
const nightOutItinerary: ConfettiItinerary = {
  code: "LP-95PYA",
  passenger: "GUEST",
  date: "May 11, 2026",
  partySize: 2,
  departure: "HOME",
  arrival: "NIGHT OUT",
  gate: "SHAW",
  boardingTime: "6:30 PM",
  seat: "2P",
  stops: [
    {
      id: "lilas-patio",
      number: 1,
      time: "6:30 PM",
      name: "Lila's Patio",
      detail: "Small plates",
      neighborhood: "Shaw",
      address: "1901 9th St NW, Washington, DC 20001",
      bookable: true,
      bookingType: "reservation",
      apiProvider: "resy",
      apiVenueId: "lilas-patio-dc",
    },
    {
      id: "mason-st-records",
      number: 2,
      time: "8:15 PM",
      name: "Mason St. Records",
      detail: "Vinyl + nat wine",
      neighborhood: "U Street",
      address: "2000 14th St NW, Washington, DC 20009",
      bookable: false,
      bookingType: "none",
    },
    {
      id: "aera-rooftop",
      number: 3,
      time: "10:00 PM",
      name: "Aera Rooftop",
      detail: "Nightcap",
      neighborhood: "Logan Circle",
      address: "1430 Rhode Island Ave NW, Washington, DC 20005",
      bookable: true,
      bookingType: "reservation",
      apiProvider: "opentable",
      apiVenueId: "aera-rooftop-dc",
    },
  ],
};

// ─── Barcode Component ───────────────────────────────────────────────
const Barcode = () => {
  const barsRef = useRef<number[]>([]);
  if (barsRef.current.length === 0) {
    barsRef.current = Array.from({ length: 60 }, () => Math.random());
  }
  return (
    <div className="flex items-end justify-center gap-[1.5px] h-14">
      {barsRef.current.map((r, i) => (
        <div
          key={i}
          className="bg-black rounded-[0.5px]"
          style={{
            width: r > 0.7 ? 3 : r > 0.3 ? 2 : 1,
            height: `${30 + r * 26}px`,
          }}
        />
      ))}
    </div>
  );
};

// ─── Tear Line ───────────────────────────────────────────────────────
const TearLine = () => (
  <div className="relative flex items-center my-5">
    {/* Left cutout */}
    <div className="absolute -left-6 w-5 h-5 rounded-full bg-[#F5F0E8]" />
    {/* Dashed line */}
    <div className="flex-1 mx-3 border-t-2 border-dashed border-[#D1C9B8]" />
    {/* Right cutout */}
    <div className="absolute -right-6 w-5 h-5 rounded-full bg-[#F5F0E8]" />
  </div>
);

// ─── Stop Card ───────────────────────────────────────────────────────
const StopCard = ({
  stop,
  isLast,
  revealed,
}: {
  stop: Stop;
  isLast: boolean;
  revealed: boolean;
}) => (
  <div
    className="flex gap-4 transition-all duration-500"
    style={{
      opacity: revealed ? 1 : 0,
      transform: revealed ? "translateY(0)" : "translateY(12px)",
    }}
  >
    {/* Timeline */}
    <div className="flex flex-col items-center">
      <div className="w-7 h-7 rounded-full border-2 border-[#2C2C2C] bg-white flex items-center justify-center text-xs font-bold text-[#2C2C2C]">
        {stop.number}
      </div>
      {!isLast && (
        <div className="flex-1 w-0 border-l-2 border-dashed border-[#C8C0B0] mt-1" />
      )}
    </div>

    {/* Card */}
    <div className="flex-1 bg-[#F0ECE3] rounded-xl px-4 py-3 mb-4 border border-[#E0D9CC]">
      <div className="flex items-baseline gap-2">
        <span className="font-bold text-[#2C2C2C] text-base" style={{ fontFamily: "'Space Mono', monospace" }}>
          {stop.name}
        </span>
        <span className="text-xs text-[#8A8070] font-mono">{stop.time}</span>
      </div>
      <div className="text-sm text-[#6B6358] mt-0.5">
        {stop.detail} · {stop.neighborhood}
      </div>
    </div>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────
const ConfettiBoardingPass = ({
  itinerary = nightOutItinerary,
}: {
  itinerary?: ConfettiItinerary;
}) => {
  const [revealedStops, setRevealedStops] = useState<Set<number>>(new Set());
  const [headerRevealed, setHeaderRevealed] = useState(false);
  const [bodyRevealed, setBodyRevealed] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setHeaderRevealed(true), 200));
    timers.push(setTimeout(() => setBodyRevealed(true), 500));
    itinerary.stops.forEach((stop, i) => {
      timers.push(
        setTimeout(() => {
          setRevealedStops((prev) => new Set(prev).add(i));
        }, 800 + i * 300)
      );
    });
    return () => timers.forEach(clearTimeout);
  }, [itinerary.stops]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600;700&display=swap');
      `}</style>

      <div
        className="max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl"
        style={{
          fontFamily: "'Inter', sans-serif",
          background: "#F5F0E8",
          border: "3px solid #2C2C2C",
        }}
      >
        {/* ── Header (black band) ── */}
        <div
          className="px-6 pt-5 pb-4 transition-all duration-700"
          style={{
            background: "#2C2C2C",
            opacity: headerRevealed ? 1 : 0,
            transform: headerRevealed ? "translateY(0)" : "translateY(-20px)",
          }}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <span className="text-lg">✈</span>
              <span
                className="text-sm tracking-[0.25em] text-white font-bold"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                BOARDING PASS
              </span>
            </div>
            <span
              className="text-sm text-[#A09A90] font-mono"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              {itinerary.code}
            </span>
          </div>

          <div className="flex justify-between items-end mt-3">
            <div>
              <div className="text-[10px] tracking-[0.2em] text-[#A09A90] uppercase">
                Passenger
              </div>
              <div className="text-xl font-bold text-white">
                {itinerary.passenger}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] tracking-[0.2em] text-[#A09A90] uppercase">
                Date · Party
              </div>
              <div className="text-base font-bold text-white">
                {itinerary.date} · {itinerary.partySize}
              </div>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div
          className="px-6 pt-6 pb-5 transition-all duration-700"
          style={{
            opacity: bodyRevealed ? 1 : 0,
            transform: bodyRevealed ? "translateY(0)" : "translateY(12px)",
          }}
        >
          {/* Route */}
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="text-3xl font-black text-[#2C2C2C] tracking-tight">
                {itinerary.departure}
              </div>
              <div className="text-[10px] tracking-[0.2em] text-[#8A8070] uppercase">
                Departure
              </div>
            </div>

            <div className="flex items-center gap-1 mx-4">
              <div className="w-10 border-t-2 border-dashed border-[#C8C0B0]" />
              <span className="text-[#C97B5A] text-lg">✈</span>
              <div className="w-10 border-t-2 border-dashed border-[#C8C0B0]" />
            </div>

            <div className="text-right">
              <div className="text-3xl font-black text-[#2C2C2C] tracking-tight">
                {itinerary.arrival}
              </div>
              <div className="text-[10px] tracking-[0.2em] text-[#8A8070] uppercase">
                Arrival
              </div>
            </div>
          </div>

          {/* Gate / Boarding / Seat badge */}
          <div
            className="mt-5 rounded-xl px-5 py-3 flex justify-between items-center border-2 border-dashed border-[#D4C9A8]"
            style={{ background: "#F5EDCF" }}
          >
            <div>
              <div className="text-[10px] tracking-[0.15em] text-[#8A8070] uppercase font-semibold">
                Gate
              </div>
              <div
                className="text-xl font-bold text-[#2C2C2C]"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                {itinerary.gate}
              </div>
            </div>
            <div>
              <div className="text-[10px] tracking-[0.15em] text-[#8A8070] uppercase font-semibold">
                Boarding
              </div>
              <div
                className="text-xl font-bold text-[#2C2C2C]"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                {itinerary.boardingTime}
              </div>
            </div>
            <div>
              <div className="text-[10px] tracking-[0.15em] text-[#8A8070] uppercase font-semibold">
                Seat
              </div>
              <div
                className="text-xl font-bold text-[#2C2C2C]"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                {itinerary.seat}
              </div>
            </div>
          </div>
        </div>

        {/* ── Tear Line ── */}
        <div className="px-3">
          <TearLine />
        </div>

        {/* ── Itinerary ── */}
        <div className="px-6 pb-4">
          <div
            className="text-[11px] tracking-[0.2em] text-[#8A8070] uppercase font-semibold mb-4"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            Itinerary · {itinerary.stops.length} Stops
          </div>

          {itinerary.stops.map((stop, i) => (
            <StopCard
              key={stop.id}
              stop={stop}
              isLast={i === itinerary.stops.length - 1}
              revealed={revealedStops.has(i)}
            />
          ))}
        </div>

        {/* ── Barcode ── */}
        <div className="px-6 pb-5">
          <div className="rounded-xl border-2 border-[#2C2C2C] p-4 bg-white">
            <Barcode />
          </div>
          <div
            className="text-center mt-3 text-xs tracking-[0.25em] text-[#8A8070]"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            {itinerary.code} · CONFETTI
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfettiBoardingPass;
