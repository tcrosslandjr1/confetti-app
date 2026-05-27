import { useState, useEffect, useRef } from "react";

// ─── Types ───────────────────────────────────────────────────────────
interface Stop {
  id: string;
  type: "departure" | "layover" | "destination";
  emoji: string;
  time: string;
  name: string;
  detail: string;
  parking: { primary: string; secondary: string };
  sundayParking: string;
  address: string;
  tags: { label: string; variant: "vibe" | "ev" | "time" }[];
  ev?: { brand: string; spec: string; chargeTime: string; sub: string };
  driveAfter?: { minutes: number; destination: string };
  bookable: boolean;
  bookingType: "reservation" | "parking" | "both";
}

interface ConfettiItinerary {
  code: string;
  occasion: string;
  occasionEmoji: string;
  date: string;
  day: string;
  passengers: number;
  departure: { code: string; name: string };
  destination: { code: string; name: string };
  vibes: string[];
  stops: Stop[];
  stats: { stops: number; hoods: number; duration: string; evReady: boolean };
  confettiPoints: number;
  userName: string;
}

// ─── Sample Data (Mother's Day Confetti) ─────────────────────────────────
const mothersDayPlan: ConfettiItinerary = {
  code: "CNFT-MOM-0510",
  occasion: "Mother's Day Experience",
  occasionEmoji: "💐",
  date: "MAY 10, 2026",
  day: "SUNDAY",
  passengers: 1,
  departure: { code: "GTN", name: "Georgetown" },
  destination: { code: "CPH", name: "Capitol Hill" },
  vibes: ["🌸 Celebration", "🍽 Foodie", "🛍 Shopping", "💚 Eco"],
  stops: [
    {
      id: "fiola-mare",
      type: "departure",
      emoji: "🥂",
      time: "10:30 AM",
      name: "Brunch at Fiola Mare",
      detail: "Georgetown waterfront · Italian seafood",
      parking: {
        primary: "Valet at entrance · $20",
        secondary: "31st St & waterfront · or Colonial Garage @ 3000 K St NW",
      },
      sundayParking: "Free street meter parking · meters not enforced Sundays",
      address: "3050 K St NW, Washington, DC 20007",
      tags: [{ label: "Celebration", variant: "vibe" }],
      driveAfter: { minutes: 12, destination: "CITYCENTERDC" },
      bookable: true,
      bookingType: "reservation",
    },
    {
      id: "citycenter-dc",
      type: "layover",
      emoji: "⚡",
      time: "1:00 PM",
      name: "EV Charge + Shopping",
      detail: "CityCenterDC · Browse boutiques while you charge",
      parking: {
        primary: "Self-park garage · ~$12 weekend",
        secondary: "Enter via 9th St · EV chargers on P2 Aisle 9 · Open 5 AM–2 AM",
      },
      sundayParking: "Free street meters nearby · garage recommended for EV charging",
      address: "825 10th St NW, Washington, DC 20001",
      ev: {
        brand: "EVgo",
        spec: "DC Fast · up to 200 kW",
        chargeTime: "~25 min to 80%",
        sub: "7 stalls · CCS / CHAdeMO · P1 & P2 levels",
      },
      tags: [
        { label: "⚡ DC Fast Charging", variant: "ev" },
        { label: "~45 min total", variant: "time" },
      ],
      driveAfter: { minutes: 15, destination: "CAPITOL HILL" },
      bookable: true,
      bookingType: "parking",
    },
    {
      id: "bistro-du-jour",
      type: "destination",
      emoji: "🌟",
      time: "6:30 PM",
      name: "Dinner at Bistro du Jour",
      detail: "Capitol Hill · French bistro · Royal Sonesta Hotel",
      parking: {
        primary: "Hotel valet · $65 or day rate $30",
        secondary: "20 Massachusetts Ave NW · Capitol Crossing Garage @ 250 Mass Ave",
      },
      sundayParking: "Free street meter parking all day · skip the valet, park free!",
      address: "20 Massachusetts Ave NW, Washington, DC 20001",
      tags: [{ label: "Romantic", variant: "vibe" }],
      bookable: true,
      bookingType: "reservation",
    },
  ],
  stats: { stops: 3, hoods: 3, duration: "8h", evReady: true },
  confettiPoints: 250,
  userName: "TYRONE",
};

// ─── Barcode Component ───────────────────────────────────────────────
const Barcode = ({ code }: { code: string }) => {
  const pattern = [3,1,2,1,4,1,1,3,2,1,1,2,3,1,4,1,2,1,1,3,1,2,4,1,1,2,1,3,2,1,1,4,3,1,2,1,1,2,3,1,1,4,2,1,3,1,1,2,4,1,1,3,2,1];
  const heights = useRef(pattern.map(() => 20 + Math.random() * 28));

  return (
    <div className="text-center px-7 pt-5 pb-7">
      <div className="flex justify-center gap-[2px] mb-2 h-12 items-end">
        {pattern.map((w, i) => (
          <div
            key={i}
            className="rounded-[1px]"
            style={{
              width: `${w}px`,
              height: `${heights.current[i]}px`,
              backgroundColor: "#1a1a2e",
            }}
          />
        ))}
      </div>
      <span
        className="text-[10px] text-gray-400 tracking-[3px]"
        style={{ fontFamily: "'Space Mono', monospace" }}
      >
        {code}
      </span>
    </div>
  );
};

// ─── Tear Divider Component ──────────────────────────────────────────
const TearDivider = () => (
  <div className="relative h-8 flex items-center">
    <div className="absolute -left-4 w-8 h-8 rounded-full" style={{ background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 40%, #16213e 100%)" }} />
    <div className="absolute -right-4 w-8 h-8 rounded-full" style={{ background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 40%, #16213e 100%)" }} />
    <hr className="w-full border-0 border-t-2 border-dashed border-gray-200 mx-5" />
  </div>
);

// ─── Stop Card Component ─────────────────────────────────────────────
const typeStyles = {
  departure: { markerBg: "bg-purple-100", typeColor: "text-purple-600" },
  layover: { markerBg: "bg-amber-100", typeColor: "text-amber-600" },
  destination: { markerBg: "bg-green-100", typeColor: "text-green-600" },
};

const tagStyles = {
  vibe: "bg-purple-50 text-purple-600",
  ev: "bg-emerald-50 text-emerald-600",
  time: "bg-amber-50 text-amber-600",
};

const StopCard = ({
  stop,
  isLast,
  index,
}: {
  stop: Stop;
  isLast: boolean;
  index: number;
}) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 800 + index * 600);
    return () => clearTimeout(timer);
  }, [index]);

  const styles = typeStyles[stop.type];
  const typeLabel =
    stop.type === "departure"
      ? "Departure"
      : stop.type === "layover"
      ? "Layover"
      : "Destination";

  const appleUrl = `https://maps.apple.com/?daddr=${encodeURIComponent(stop.address)}&dirflg=d`;
  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(stop.address)}`;

  return (
    <div
      className={`flex items-start gap-3.5 mb-4 relative transition-all duration-500 ${
        visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3"
      }`}
    >
      {/* Marker */}
      <div
        className={`w-9 h-9 rounded-[10px] flex items-center justify-center text-base shrink-0 relative ${styles.markerBg}`}
        style={{
          animation: visible
            ? `pulse-${stop.type} 2.5s ease-in-out 0.5s infinite`
            : "none",
        }}
      >
        {stop.emoji}
        {!isLast && (
          <div className="absolute top-[38px] left-1/2 -translate-x-1/2 w-0.5 h-6 bg-gray-200" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pt-0.5">
        <div
          className={`text-[9px] font-bold tracking-[2px] uppercase mb-0.5 ${styles.typeColor}`}
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          {typeLabel} — {stop.time}
        </div>
        <div className="text-[15px] font-bold text-gray-900 mb-0.5">
          {stop.name}
        </div>
        <div className="text-[11px] text-gray-400 leading-snug">
          {stop.detail}
        </div>

        {/* EV Detail */}
        {stop.ev && (
          <>
            <div className="flex items-center gap-2 mt-1.5 px-2.5 py-1.5 bg-green-50 border border-green-200 rounded-lg">
              <span
                className="text-[11px] font-bold text-white bg-[#00A94F] px-2 py-0.5 rounded tracking-wide"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                {stop.ev.brand}
              </span>
              <span className="text-[10px] font-semibold text-green-600 pl-2 border-l border-green-200">
                {stop.ev.spec}
              </span>
              <span className="text-[10px] text-gray-500 pl-2 border-l border-green-200">
                {stop.ev.chargeTime}
              </span>
            </div>
            <div className="text-[10px] text-gray-500 mt-1 pl-0.5">
              {stop.ev.sub}
            </div>
          </>
        )}

        {/* Parking */}
        <div className="flex items-start gap-2 mt-1.5 px-2.5 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm shrink-0 mt-px">🅿</span>
          <div className="flex flex-col gap-0.5">
            <span
              className="text-[10px] font-bold text-blue-800 tracking-wide"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              {stop.parking.primary}
            </span>
            <span className="text-[9px] text-gray-500 leading-snug">
              {stop.parking.secondary}
            </span>
          </div>
        </div>

        {/* Sunday Parking */}
        <div className="flex items-center gap-2 mt-1 px-2.5 py-1 rounded-lg border border-emerald-300" style={{ background: "linear-gradient(135deg, #ECFDF5, #D1FAE5)" }}>
          <span
            className="text-[9px] font-bold text-white bg-emerald-600 px-1.5 py-0.5 rounded tracking-wider shrink-0"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            SUN
          </span>
          <span className="text-[9px] font-semibold text-emerald-900 leading-snug">
            {stop.sundayParking}
          </span>
        </div>

        {/* Nav Buttons */}
        <div className="flex gap-2 mt-2">
          <a
            href={appleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[9px] font-bold text-white tracking-wide border border-gray-600 active:scale-95 transition-transform no-underline"
            style={{
              fontFamily: "'Space Mono', monospace",
              background: "linear-gradient(135deg, #1a1a2e, #2d2d44)",
            }}
          >
            <span className="text-xs">🍎</span> Apple Maps
          </a>
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[9px] font-bold text-white tracking-wide border border-blue-500 active:scale-95 transition-transform no-underline"
            style={{
              fontFamily: "'Space Mono', monospace",
              background: "linear-gradient(135deg, #4285F4, #5B9BF5)",
            }}
          >
            <span className="text-xs">📍</span> Google Maps
          </a>
        </div>

        {/* Tags */}
        <div className="flex gap-1.5 mt-1.5 flex-wrap">
          {stop.tags.map((tag, i) => (
            <span
              key={i}
              className={`text-[9px] font-semibold px-2 py-0.5 rounded-md tracking-wide ${tagStyles[tag.variant]}`}
            >
              {tag.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Drive Time Chip ─────────────────────────────────────────────────
const DriveTimeChip = ({
  minutes,
  destination,
  index,
}: {
  minutes: number;
  destination: string;
  index: number;
}) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1400 + index * 600);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      className={`flex items-center justify-center gap-1.5 ml-[50px] my-1.5 px-3 py-1 bg-gray-50 border border-dashed border-gray-300 rounded-full w-fit transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
      }`}
    >
      <span className="text-[11px]">🚗</span>
      <span
        className="text-[9px] font-semibold text-gray-500 tracking-wide"
        style={{ fontFamily: "'Space Mono', monospace" }}
      >
        ~{minutes} MIN DRIVE → {destination}
      </span>
    </div>
  );
};

// ─── Book This Plan Modal ────────────────────────────────────────────
const BookingModal = ({
  open,
  onClose,
  loop,
}: {
  open: boolean;
  onClose: () => void;
  loop: ConfettiItinerary;
}) => {
  const [bookingStatus, setBookingStatus] = useState<
    Record<string, "idle" | "booking" | "booked">
  >({});
  const [allBooked, setAllBooked] = useState(false);

  const handleBook = (stopId: string) => {
    setBookingStatus((prev) => ({ ...prev, [stopId]: "booking" }));
    // Simulate booking API call
    setTimeout(() => {
      setBookingStatus((prev) => {
        const next = { ...prev, [stopId]: "booked" as const };
        const bookableStops = loop.stops.filter((s) => s.bookable);
        if (bookableStops.every((s) => next[s.id] === "booked")) {
          setAllBooked(true);
        }
        return next;
      });
    }, 1500);
  };

  const handleBookAll = () => {
    loop.stops
      .filter((s) => s.bookable)
      .forEach((stop, i) => {
        setTimeout(() => handleBook(stop.id), i * 800);
      });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div
          className="px-7 pt-6 pb-5 text-white relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #6C3CE1 0%, #8B5CF6 50%, #A78BFA 100%)",
          }}
        >
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-white/10 rounded-full" />
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold">Book This Plan</h2>
              <p className="text-white/70 text-xs mt-0.5">
                Reserve everything in one tap
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition"
            >
              ✕
            </button>
          </div>
          <div
            className="flex gap-4 pt-3 border-t border-white/20 text-[10px] tracking-[2px] text-white/50"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            <div>
              <div>DATE</div>
              <div className="text-white font-bold text-xs mt-0.5">
                {loop.date}
              </div>
            </div>
            <div>
              <div>GUESTS</div>
              <div className="text-white font-bold text-xs mt-0.5">
                {loop.passengers}
              </div>
            </div>
            <div>
              <div>CONFETTI</div>
              <div className="text-yellow-300 font-bold text-xs mt-0.5">
                {loop.code}
              </div>
            </div>
          </div>
        </div>

        {/* Stops List */}
        <div className="px-7 py-5 max-h-[50vh] overflow-y-auto">
          {loop.stops
            .filter((s) => s.bookable)
            .map((stop, i) => {
              const status = bookingStatus[stop.id] || "idle";
              return (
                <div
                  key={stop.id}
                  className={`flex items-center gap-3 p-3 rounded-xl mb-3 border transition-all duration-300 ${
                    status === "booked"
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${typeStyles[stop.type].markerBg}`}
                  >
                    {stop.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-900 truncate">
                      {stop.name}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      {stop.time} ·{" "}
                      {stop.bookingType === "reservation"
                        ? "Table reservation"
                        : stop.bookingType === "parking"
                        ? "Garage pre-pay"
                        : "Reservation + Parking"}
                    </div>
                  </div>
                  <button
                    onClick={() => handleBook(stop.id)}
                    disabled={status !== "idle"}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide transition-all shrink-0 ${
                      status === "booked"
                        ? "bg-emerald-500 text-white"
                        : status === "booking"
                        ? "bg-purple-100 text-purple-600 animate-pulse"
                        : "bg-purple-600 text-white hover:bg-purple-700 active:scale-95"
                    }`}
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  >
                    {status === "booked"
                      ? "✓ BOOKED"
                      : status === "booking"
                      ? "BOOKING..."
                      : "BOOK"}
                  </button>
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <div className="px-7 pb-6">
          {allBooked ? (
            <div className="text-center py-4">
              <div className="text-3xl mb-2">🎊</div>
              <div className="font-bold text-gray-900">Plan Fully Booked!</div>
              <div className="text-xs text-gray-500 mt-1">
                +{loop.confettiPoints} Confetti earned on completion
              </div>
            </div>
          ) : (
            <button
              onClick={handleBookAll}
              className="w-full py-3 rounded-xl text-white font-bold text-sm tracking-wide active:scale-[0.98] transition-transform"
              style={{
                fontFamily: "'Space Mono', monospace",
                background: "linear-gradient(135deg, #6C3CE1 0%, #8B5CF6 100%)",
              }}
            >
              🎯 BOOK ENTIRE PLAN
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────
const ConfettiBoardingPass = () => {
  const loop = mothersDayPlan;
  const [bookingOpen, setBookingOpen] = useState(false);

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        @keyframes pulse-departure {
          0%, 100% { box-shadow: 0 0 0 0 rgba(108, 60, 225, 0.3); }
          50% { box-shadow: 0 0 0 10px rgba(108, 60, 225, 0); }
        }
        @keyframes pulse-layover {
          0%, 100% { box-shadow: 0 0 0 0 rgba(217, 119, 6, 0.3); }
          50% { box-shadow: 0 0 0 10px rgba(217, 119, 6, 0); }
        }
        @keyframes pulse-destination {
          0%, 100% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.3); }
          50% { box-shadow: 0 0 0 10px rgba(22, 163, 74, 0); }
        }
      `}</style>

      <div
        className="min-h-screen flex flex-col items-center justify-center font-sans px-5 py-10"
        style={{
          background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 40%, #16213e 100%)",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* Boarding Pass Card */}
        <div className="w-full max-w-[420px] bg-white rounded-3xl overflow-hidden shadow-2xl relative animate-in fade-in slide-in-from-bottom-5 duration-700">
          {/* ── Header ── */}
          <div
            className="px-7 pt-6 pb-5 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #6C3CE1 0%, #8B5CF6 50%, #A78BFA 100%)",
            }}
          >
            <div className="absolute -top-10 -right-10 w-[120px] h-[120px] bg-white/[.08] rounded-full" />

            <div className="flex justify-between items-start mb-4">
              <div>
                <div
                  className="text-[28px] font-bold text-white tracking-[4px] uppercase"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  CONFETTI
                  <span className="inline-block w-2.5 h-2.5 bg-yellow-300 rounded-full ml-1 align-super text-[0]">
                    .
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur border border-white/20 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white tracking-wide mt-1">
                  <span className="text-sm">{loop.occasionEmoji}</span>
                  {loop.occasion}
                </div>
              </div>
              <div
                className="text-right text-[11px] text-white/70 tracking-[2px]"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                ITINERARY
                <strong className="block text-sm text-yellow-300 tracking-[3px] mt-0.5">
                  {loop.code}
                </strong>
              </div>
            </div>

            <div className="flex gap-5 pt-3.5 mt-3.5 border-t border-white/15">
              {[
                { label: "DATE", value: loop.date },
                { label: "PASSENGERS", value: String(loop.passengers) },
                { label: "DAY", value: loop.day },
              ].map((m) => (
                <div key={m.label} className="flex flex-col gap-0.5">
                  <span
                    className="text-[8px] text-white/50 tracking-[2px]"
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  >
                    {m.label}
                  </span>
                  <span
                    className="text-[13px] text-white font-bold tracking-wider"
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  >
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Route ── */}
          <div className="flex items-center justify-between px-7 pt-7 pb-5">
            <div className="text-center">
              <div className="text-[9px] text-purple-400 font-bold tracking-[2px] uppercase mb-1.5">
                Departure
              </div>
              <div
                className="text-4xl font-bold text-gray-900 tracking-[3px] leading-none"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                {loop.departure.code}
              </div>
              <div className="text-[11px] text-gray-400 font-medium mt-1 tracking-wide uppercase">
                {loop.departure.name}
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center px-3 relative">
              <div
                className="w-full h-0.5 relative"
                style={{
                  background: "linear-gradient(90deg, #6C3CE1, #e5e5ea, #6C3CE1)",
                }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 bg-yellow-300 rounded-full border-[3px] border-white shadow-lg flex items-center justify-center text-xs">
                  ⚡
                </div>
                <div className="absolute top-1/2 right-[15%] -translate-y-1/2 text-base text-purple-600">
                  ✈
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-[9px] text-purple-400 font-bold tracking-[2px] uppercase mb-1.5">
                Destination
              </div>
              <div
                className="text-4xl font-bold text-gray-900 tracking-[3px] leading-none"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                {loop.destination.code}
              </div>
              <div className="text-[11px] text-gray-400 font-medium mt-1 tracking-wide uppercase">
                {loop.destination.name}
              </div>
            </div>
          </div>

          {/* ── Vibe Pills ── */}
          <div className="flex gap-2 justify-center px-7 pb-1.5 flex-wrap">
            {loop.vibes.map((v) => (
              <span
                key={v}
                className="text-[10px] font-semibold px-3 py-1 rounded-full text-purple-600 tracking-wide"
                style={{
                  background: "linear-gradient(135deg, #EDE9FE, #F3E8FF)",
                }}
              >
                {v}
              </span>
            ))}
          </div>

          {/* ── Tear Line ── */}
          <TearDivider />

          {/* ── Stops ── */}
          <div className="px-7 pt-2 pb-6">
            <div
              className="text-[9px] font-bold text-gray-400 tracking-[2px] uppercase mb-4"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              Flight Plan
            </div>
            {loop.stops.map((stop, i) => (
              <div key={stop.id}>
                <StopCard
                  stop={stop}
                  isLast={i === loop.stops.length - 1}
                  index={i}
                />
                {stop.driveAfter && (
                  <DriveTimeChip
                    minutes={stop.driveAfter.minutes}
                    destination={stop.driveAfter.destination}
                    index={i}
                  />
                )}
              </div>
            ))}
          </div>

          {/* ── Tear Line 2 ── */}
          <TearDivider />

          {/* ── Stats ── */}
          <div className="grid grid-cols-4 gap-2 px-7 py-4">
            {[
              { value: String(loop.stats.stops), label: "Stops" },
              { value: String(loop.stats.hoods), label: "Hoods" },
              { value: loop.stats.duration, label: "Duration" },
              { value: "⚡", label: "EV Ready" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div
                  className="text-lg font-bold text-gray-900 leading-none"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  {s.value}
                </div>
                <div className="text-[8px] text-gray-400 font-semibold tracking-[1.5px] uppercase mt-1">
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* ── Confetti Reward ── */}
          <div
            className="mx-7 rounded-xl px-4 py-3.5 flex items-center justify-between"
            style={{
              background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🎊</span>
              <div className="text-[11px] font-semibold text-amber-800 leading-snug">
                Complete this plan to earn
                <strong className="block text-[13px] text-amber-900">
                  Confetti Reward
                </strong>
              </div>
            </div>
            <span
              className="text-[22px] font-bold text-amber-600"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              +{loop.confettiPoints}
            </span>
          </div>

          {/* ── Book This Plan Button ── */}
          <div className="px-7 pt-4">
            <button
              onClick={() => setBookingOpen(true)}
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm tracking-wider active:scale-[0.98] transition-all shadow-lg hover:shadow-xl"
              style={{
                fontFamily: "'Space Mono', monospace",
                background: "linear-gradient(135deg, #6C3CE1 0%, #8B5CF6 100%)",
              }}
            >
              🎯 BOOK THIS PLAN
            </button>
          </div>

          {/* ── Barcode ── */}
          <Barcode code={`${loop.code}-${loop.userName}`} />
        </div>
      </div>

      {/* ── Booking Modal ── */}
      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        loop={loop}
      />
    </>
  );
};

export default ConfettiBoardingPass;
