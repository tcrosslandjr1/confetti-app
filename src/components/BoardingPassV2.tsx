import { useEffect, useMemo, useRef, useState } from "react";

export type EvInfo = {
  network: string;
  spec: string;
  time: string;
  detail: string;
};

export type BoardingStop = {
  type: "departure" | "layover" | "destination";
  time: string;
  name: string;
  detail: string;
  emoji: string;
  parkingInfo?: { primary: string; secondary?: string };
  sundayParking?: string;
  appleMapUrl?: string;
  googleMapUrl?: string;
  tags?: string[];
  evInfo?: EvInfo;
  driveTo?: { minutes: number; toLabel: string };
};

export type BoardingPassData = {
  flightCode: string;
  occasionEmoji: string;
  occasionLabel: string;
  date: string;
  passengers: string;
  day: string;
  origin: { code: string; name: string };
  destination: { code: string; name: string };
  vibes: { emoji: string; label: string }[];
  stops: BoardingStop[];
  stats: { stops: number; hoods: number; duration: string; evReady: boolean };
  reward: number;
  passengerName: string;
};

const STOP_COLORS = {
  departure: { bg: "#EDE9FE", text: "#6C3CE1", glow: "108, 60, 225" },
  layover: { bg: "#FEF3C7", text: "#B45309", glow: "245, 158, 11" },
  destination: { bg: "#DCFCE7", text: "#15803D", glow: "34, 197, 94" },
} as const;

export const sampleMothersDayData: BoardingPassData = {
  flightCode: "CNFT-MOM-0510",
  occasionEmoji: "💐",
  occasionLabel: "Mother's Day Experience",
  date: "MAY 10",
  passengers: "2 GUESTS",
  day: "SUNDAY",
  origin: { code: "GTN", name: "Georgetown" },
  destination: { code: "CPH", name: "Capitol Hill" },
  vibes: [
    { emoji: "🌸", label: "Celebration" },
    { emoji: "🍽", label: "Foodie" },
    { emoji: "🛍", label: "Shopping" },
    { emoji: "💚", label: "Eco" },
  ],
  stops: [
    {
      type: "departure",
      time: "10:30 AM",
      name: "Brunch at Fiola Mare",
      detail: "Georgetown waterfront · Italian seafood",
      emoji: "🥂",
      parkingInfo: {
        primary: "Valet at entrance · $20",
        secondary: "3050 K St NW · Garage at Washington Harbour",
      },
      sundayParking: "Free street meter parking · meters not enforced Sundays",
      appleMapUrl: "maps://maps.apple.com/?daddr=3050+K+St+NW+Washington+DC&dirflg=d",
      googleMapUrl: "https://www.google.com/maps/dir/?api=1&destination=3050+K+St+NW+Washington+DC",
      tags: ["Celebration", "~90 min"],
      driveTo: { minutes: 12, toLabel: "CITYCENTERDC" },
    },
    {
      type: "layover",
      time: "12:15 PM",
      name: "EV Charge + Stroll · CityCenterDC",
      detail: "Designer boutiques · charge break",
      emoji: "⚡",
      parkingInfo: {
        primary: "CityCenterDC Garage · $8/hr",
        secondary: "825 10th St NW · Validated 2hrs with purchase",
      },
      appleMapUrl: "maps://maps.apple.com/?daddr=CityCenterDC+Washington+DC&dirflg=d",
      googleMapUrl: "https://www.google.com/maps/dir/?api=1&destination=CityCenterDC+Washington+DC",
      tags: ["⚡ DC Fast Charging", "~45 min total"],
      evInfo: {
        network: "EVgo",
        spec: "DC Fast · up to 200 kW",
        time: "~25 min to 80%",
        detail: "7 stalls · CCS / CHAdeMO · P1 & P2 levels",
      },
      driveTo: { minutes: 9, toLabel: "CAPITOL HILL" },
    },
    {
      type: "destination",
      time: "1:30 PM",
      name: "Eastern Market + Gardens",
      detail: "Capitol Hill · flowers & artisan finds",
      emoji: "🌟",
      parkingInfo: {
        primary: "Street parking on 7th St SE",
        secondary: "Alt: Hine garage at 700 Penn Ave SE",
      },
      sundayParking: "Free street meter parking · meters not enforced Sundays",
      appleMapUrl: "maps://maps.apple.com/?daddr=Eastern+Market+Washington+DC&dirflg=d",
      googleMapUrl:
        "https://www.google.com/maps/dir/?api=1&destination=Eastern+Market+Washington+DC",
      tags: ["Celebration", "Foodie", "~2 hrs"],
    },
  ],
  stats: { stops: 3, hoods: 3, duration: "8h", evReady: true },
  reward: 250,
  passengerName: "TYRONE",
};

function Barcode({ code }: { code: string }) {
  const bars = useMemo(() => {
    // deterministic-ish per-render but consistent within mount
    const arr: { w: number; h: number }[] = [];
    for (let i = 0; i < 64; i++) {
      arr.push({
        w: 1 + Math.floor(Math.random() * 4),
        h: 20 + Math.floor(Math.random() * 28),
      });
    }
    return arr;
  }, []);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-end gap-[2px] h-12">
        {bars.map((b, i) => (
          <div key={i} style={{ width: b.w, height: b.h, background: "#1a1a2e" }} />
        ))}
      </div>
      <div
        className="text-[10px] text-[#1a1a2e]/70"
        style={{ fontFamily: "'Space Mono', ui-monospace, monospace", letterSpacing: "3px" }}
      >
        {code}
      </div>
    </div>
  );
}

const mono: React.CSSProperties = {
  fontFamily: "'Space Mono', ui-monospace, monospace",
};

export function BoardingPassV2({ data = sampleMothersDayData }: { data?: BoardingPassData }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <style>{`
        @keyframes bpSlideUp { from { opacity:0; transform: translateY(40px);} to {opacity:1; transform:translateY(0);} }
        @keyframes bpReveal { from { opacity:0; transform: scale(.6);} to {opacity:1; transform:scale(1);} }
        @keyframes bpSlideLeft { from { opacity:0; transform: translateX(-20px);} to {opacity:1; transform:translateX(0);} }
        @keyframes bpFade { from {opacity:0;} to {opacity:1;} }
        @keyframes bpGrow { from { transform: scaleY(0); } to { transform: scaleY(1);} }
        @keyframes bpPulsePurple { 0%,100% { box-shadow: 0 0 0 0 rgba(108,60,225,0.45);} 50% { box-shadow: 0 0 0 10px rgba(108,60,225,0);} }
        @keyframes bpPulseAmber { 0%,100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.45);} 50% { box-shadow: 0 0 0 10px rgba(245,158,11,0);} }
        @keyframes bpPulseGreen { 0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.45);} 50% { box-shadow: 0 0 0 10px rgba(34,197,94,0);} }
        .bp-card { animation: bpSlideUp 0.6s cubic-bezier(0.34,1.56,0.64,1) both; }
        .bp-marker { animation: bpReveal 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
        .bp-marker-purple { animation: bpReveal 0.5s cubic-bezier(0.34,1.56,0.64,1) both, bpPulsePurple 2.4s ease-in-out 1s infinite; }
        .bp-marker-amber { animation: bpReveal 0.5s cubic-bezier(0.34,1.56,0.64,1) both, bpPulseAmber 2.4s ease-in-out 1.6s infinite; }
        .bp-marker-green { animation: bpReveal 0.5s cubic-bezier(0.34,1.56,0.64,1) both, bpPulseGreen 2.4s ease-in-out 2.2s infinite; }
        .bp-content { animation: bpSlideLeft 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
        .bp-tags { animation: bpFade 0.4s ease both; }
        .bp-connector { transform-origin: top; animation: bpGrow 0.4s ease both; }
        .bp-drive { animation: bpFade 0.5s ease both; }
        @media (max-width: 460px) {
          .bp-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      <div
        ref={rootRef}
        className={`bp-card mx-auto w-full max-w-md overflow-hidden rounded-[28px] bg-white`}
        style={{
          boxShadow: "0 20px 60px -20px rgba(0,0,0,0.18), 0 8px 24px -12px rgba(0,0,0,0.08)",
          opacity: mounted ? undefined : 0,
        }}
      >
        {/* HEADER */}
        <div
          className="relative px-6 pt-6 pb-5 text-white"
          style={{
            background: "linear-gradient(135deg, #6C3CE1 0%, #8B5CF6 50%, #A78BFA 100%)",
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div
              className="flex items-center"
              style={{ ...mono, fontSize: 28, letterSpacing: "4px", fontWeight: 700 }}
            >
              CONFETTI.
              <span
                className="ml-1 inline-block h-2 w-2 rounded-full"
                style={{ background: "#FCD34D" }}
              />
            </div>
            <div className="text-right">
              <div style={{ ...mono, fontSize: 11, opacity: 0.85, letterSpacing: "2px" }}>
                ITINERARY
              </div>
              <div
                style={{
                  ...mono,
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#FCD34D",
                  letterSpacing: "1px",
                }}
              >
                {data.flightCode}
              </div>
            </div>
          </div>

          <div
            className="mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm"
            style={{
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              borderColor: "rgba(255,255,255,0.35)",
            }}
          >
            <span>{data.occasionEmoji}</span>
            <span className="font-medium">{data.occasionLabel}</span>
          </div>

          <div
            className="mt-5 grid grid-cols-3 gap-2 border-t pt-3"
            style={{ borderColor: "rgba(255,255,255,0.25)" }}
          >
            {[
              { k: "DATE", v: data.date },
              { k: "PASSENGERS", v: data.passengers },
              { k: "DAY", v: data.day },
            ].map((m) => (
              <div key={m.k}>
                <div style={{ ...mono, fontSize: 9, opacity: 0.7, letterSpacing: "2px" }}>
                  {m.k}
                </div>
                <div style={{ ...mono, fontSize: 13, fontWeight: 700, marginTop: 2 }}>{m.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ROUTE */}
        <div className="px-6 pt-6 pb-4 bg-white">
          <div className="flex items-end justify-between gap-3">
            <div className="text-left">
              <div style={{ ...mono, fontSize: 9, color: "#6C3CE1", letterSpacing: "2px" }}>
                DEPARTURE
              </div>
              <div
                style={{
                  ...mono,
                  fontSize: 36,
                  fontWeight: 700,
                  color: "#1a1a2e",
                  lineHeight: 1,
                  marginTop: 4,
                }}
              >
                {data.origin.code}
              </div>
              <div className="mt-1 text-xs text-[#1a1a2e]/60">{data.origin.name}</div>
            </div>

            <div
              className="relative flex-1 mx-2 mb-3 h-[2px]"
              style={{
                background: "linear-gradient(90deg, #6C3CE1 0%, #FCD34D 50%, #22C55E 100%)",
              }}
            >
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 grid h-6 w-6 place-items-center rounded-full text-xs"
                style={{ background: "#FCD34D", color: "#1a1a2e" }}
              >
                ⚡
              </div>
              <div
                className="absolute -top-2 text-base"
                style={{ left: "75%", transform: "translateX(-50%)" }}
              >
                ✈
              </div>
            </div>

            <div className="text-right">
              <div style={{ ...mono, fontSize: 9, color: "#15803D", letterSpacing: "2px" }}>
                DESTINATION
              </div>
              <div
                style={{
                  ...mono,
                  fontSize: 36,
                  fontWeight: 700,
                  color: "#1a1a2e",
                  lineHeight: 1,
                  marginTop: 4,
                }}
              >
                {data.destination.code}
              </div>
              <div className="mt-1 text-xs text-[#1a1a2e]/60">{data.destination.name}</div>
            </div>
          </div>

          {/* Vibes */}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {data.vibes.map((v) => (
              <div
                key={v.label}
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  background: "linear-gradient(135deg, #EDE9FE 0%, #F3E8FF 100%)",
                  color: "#6C3CE1",
                }}
              >
                {v.emoji} {v.label}
              </div>
            ))}
          </div>
        </div>

        {/* TEAR LINE */}
        <div className="relative h-6">
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full"
            style={{ background: "#fdf6ee", marginLeft: -8 }}
          />
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full"
            style={{ background: "#fdf6ee", marginRight: -8 }}
          />
          <div
            className="absolute left-4 right-4 top-1/2"
            style={{
              borderTop: "2px dashed #e5e5ea",
            }}
          />
        </div>

        {/* STOPS */}
        <div className="px-6 pt-2 pb-6 bg-white">
          {data.stops.map((stop, i) => {
            const colors = STOP_COLORS[stop.type];
            const markerClass =
              stop.type === "departure"
                ? "bp-marker-purple"
                : stop.type === "layover"
                  ? "bp-marker-amber"
                  : "bp-marker-green";
            const markerDelay = 0.8 + i * 0.6;
            const contentDelay = markerDelay + 0.2;
            return (
              <div key={i}>
                <div className="flex gap-3">
                  {/* Marker column */}
                  <div className="flex flex-col items-center">
                    <div
                      className={markerClass}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: colors.bg,
                        display: "grid",
                        placeItems: "center",
                        fontSize: 18,
                        animationDelay: `${markerDelay}s`,
                      }}
                    >
                      {stop.emoji}
                    </div>
                    {i < data.stops.length - 1 && (
                      <div
                        className="bp-connector mt-1 flex-1"
                        style={{
                          width: 2,
                          background: "#e5e5ea",
                          minHeight: 24,
                          animationDelay: `${markerDelay + 0.4}s`,
                        }}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div
                    className="bp-content flex-1 pb-5"
                    style={{ animationDelay: `${contentDelay}s` }}
                  >
                    <div
                      style={{
                        ...mono,
                        fontSize: 9,
                        color: colors.text,
                        letterSpacing: "1.5px",
                        textTransform: "uppercase",
                      }}
                    >
                      {stop.type} — {stop.time}
                    </div>
                    <div className="mt-1 font-bold" style={{ fontSize: 15, color: "#1a1a2e" }}>
                      {stop.name}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[#1a1a2e]/60">{stop.detail}</div>

                    {stop.parkingInfo && (
                      <div
                        className="mt-3 rounded-xl p-3"
                        style={{
                          background: "#EFF6FF",
                          border: "1px solid #BFDBFE",
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <div className="text-sm">🅿</div>
                          <div className="flex-1">
                            <div
                              style={{
                                ...mono,
                                fontSize: 12,
                                fontWeight: 700,
                                color: "#1E40AF",
                              }}
                            >
                              {stop.parkingInfo.primary}
                            </div>
                            {stop.parkingInfo.secondary && (
                              <div className="mt-0.5 text-[11px] text-[#1a1a2e]/60">
                                {stop.parkingInfo.secondary}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {stop.sundayParking && (
                      <div
                        className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2"
                        style={{
                          background: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
                          border: "1px solid #A7F3D0",
                        }}
                      >
                        <span
                          className="rounded-full px-2 py-0.5 text-[9px] font-bold text-white"
                          style={{ background: "#15803D", ...mono, letterSpacing: "1px" }}
                        >
                          SUN
                        </span>
                        <span className="text-[11px] text-[#15803D]">{stop.sundayParking}</span>
                      </div>
                    )}

                    {stop.evInfo && (
                      <div
                        className="mt-3 rounded-xl p-3"
                        style={{
                          background: "#F0FDF4",
                          border: "1px solid #BBF7D0",
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="rounded-md px-2 py-0.5 text-[10px] font-bold text-white"
                            style={{ background: "#15803D" }}
                          >
                            {stop.evInfo.network}
                          </span>
                          <span
                            style={{ ...mono, fontSize: 11, color: "#15803D", fontWeight: 700 }}
                          >
                            {stop.evInfo.spec}
                          </span>
                        </div>
                        <div
                          className="mt-1"
                          style={{ ...mono, fontSize: 12, fontWeight: 700, color: "#1a1a2e" }}
                        >
                          {stop.evInfo.time}
                        </div>
                        <div className="mt-0.5 text-[11px] text-[#1a1a2e]/60">
                          {stop.evInfo.detail}
                        </div>
                      </div>
                    )}

                    {(stop.appleMapUrl || stop.googleMapUrl) && (
                      <div
                        className="bp-tags mt-3 grid grid-cols-2 gap-2"
                        style={{ animationDelay: `${contentDelay + 0.3}s` }}
                      >
                        {stop.appleMapUrl && (
                          <a
                            href={stop.appleMapUrl}
                            className="rounded-xl px-3 py-2 text-center text-white"
                            style={{
                              background: "linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)",
                              ...mono,
                              fontSize: 11,
                              fontWeight: 700,
                              letterSpacing: "1px",
                            }}
                          >
                            APPLE MAPS
                          </a>
                        )}
                        {stop.googleMapUrl && (
                          <a
                            href={stop.googleMapUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl px-3 py-2 text-center text-white"
                            style={{
                              background: "linear-gradient(135deg, #4285F4 0%, #5B9BF5 100%)",
                              ...mono,
                              fontSize: 11,
                              fontWeight: 700,
                              letterSpacing: "1px",
                            }}
                          >
                            GOOGLE MAPS
                          </a>
                        )}
                      </div>
                    )}

                    {stop.tags && stop.tags.length > 0 && (
                      <div
                        className="bp-tags mt-3 flex flex-wrap gap-1.5"
                        style={{ animationDelay: `${contentDelay + 0.3}s` }}
                      >
                        {stop.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full px-2.5 py-1 text-[10px] font-medium"
                            style={{ background: "#F3F4F6", color: "#374151" }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Drive chip */}
                {stop.driveTo && i < data.stops.length - 1 && (
                  <div
                    className="bp-drive ml-12 my-1 inline-flex items-center gap-2 rounded-full px-3 py-1"
                    style={{
                      background: "#F9FAFB",
                      border: "1px dashed #d1d5db",
                      animationDelay: `${contentDelay + 0.5}s`,
                    }}
                  >
                    <span>🚗</span>
                    <span
                      style={{
                        ...mono,
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#374151",
                        letterSpacing: "1.5px",
                      }}
                    >
                      ~{stop.driveTo.minutes} MIN DRIVE → {stop.driveTo.toLabel}
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Stats Footer */}
          <div
            className="bp-stats-grid mt-4 grid gap-3 rounded-2xl p-4"
            style={{
              gridTemplateColumns: "repeat(4, 1fr)",
              background: "#FAFAF7",
              border: "1px solid #ececec",
            }}
          >
            {[
              { v: data.stats.stops.toString(), l: "Stops" },
              { v: data.stats.hoods.toString(), l: "Hoods" },
              { v: data.stats.duration, l: "Duration" },
              { v: data.stats.evReady ? "⚡" : "—", l: "EV Ready" },
            ].map((s) => (
              <div key={s.l} className="text-center">
                <div
                  style={{
                    ...mono,
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#1a1a2e",
                  }}
                >
                  {s.v}
                </div>
                <div
                  style={{
                    ...mono,
                    fontSize: 8,
                    letterSpacing: "1.5px",
                    color: "#1a1a2e",
                    opacity: 0.6,
                    textTransform: "uppercase",
                    marginTop: 2,
                  }}
                >
                  {s.l}
                </div>
              </div>
            ))}
          </div>

          {/* Reward */}
          <div
            className="mt-4 flex items-center justify-between rounded-2xl px-4 py-3"
            style={{
              background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
              border: "1px solid #FCD34D",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">🎊</div>
              <div className="text-[13px] font-medium text-[#78350F]">
                Complete this plan to earn Confetti Reward
              </div>
            </div>
            <div
              style={{
                ...mono,
                fontSize: 22,
                fontWeight: 700,
                color: "#B45309",
              }}
            >
              +{data.reward}
            </div>
          </div>

          {/* Barcode */}
          <div className="mt-6">
            <Barcode code={`${data.flightCode}-${data.passengerName}`} />
          </div>
        </div>
      </div>
    </>
  );
}

export default BoardingPassV2;
