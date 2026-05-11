import { forwardRef } from "react";

export type StopShareData = {
  venue: string;
  vibe: string;
  time: string;
  address?: string;
  neighborhood?: string;
  rating: string;
  priceLevel: number;
  knownFor: string;
  popularAvailability: {
    time: string;
    level: "open" | "limited" | "few" | "full";
    seatsLeft: number;
  }[];
  peakTime: string;
  dishes: string[];
  vibeProfile: { crowd: string; noise: string; dress: string; lighting: string; music: string };
  dietary: string[];
  isUsual?: boolean;
};

const LEVEL_COPY: Record<string, string> = {
  open: "Plenty open",
  limited: "Filling up",
  few: "Few left",
  full: "Booked out",
};
const LEVEL_DOT: Record<string, string> = {
  open: "#16a34a",
  limited: "#d4a017",
  few: "#e85a4f",
  full: "#9ca3af",
};

export const StopShareCard = forwardRef<HTMLDivElement, { data: StopShareData }>(
  ({ data }, ref) => {
    const profile = [
      ["CROWD", data.vibeProfile.crowd],
      ["NOISE", data.vibeProfile.noise],
      ["DRESS", data.vibeProfile.dress],
      ["LIGHTING", data.vibeProfile.lighting],
      ["MUSIC", data.vibeProfile.music],
    ];
    return (
      <div
        ref={ref}
        style={{
          width: 1080,
          minHeight: 1350,
          background: "#FAF6EF",
          color: "#1B1B1B",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Helvetica Neue', sans-serif",
          padding: 56,
          boxSizing: "border-box",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Bold corner block */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 280,
            height: 280,
            background: "#E85A4F",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 280,
            height: 280,
            padding: 28,
            boxSizing: "border-box",
            textAlign: "right",
            color: "#FAF6EF",
          }}
        >
          <div
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, monospace",
              fontSize: 16,
              letterSpacing: 4,
              opacity: 0.85,
            }}
          >
            STOP CARD
          </div>
          <div style={{ fontWeight: 900, fontSize: 96, lineHeight: 1, marginTop: 16 }}>
            {data.time.replace(/\s/g, "")}
          </div>
          <div
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: 14,
              letterSpacing: 3,
              marginTop: 12,
              opacity: 0.9,
            }}
          >
            {"$".repeat(Math.max(1, data.priceLevel))} · ★ {data.rating}
          </div>
        </div>

        {/* Header */}
        <div
          style={{
            fontFamily: "ui-monospace, monospace",
            fontSize: 14,
            letterSpacing: 6,
            color: "#1B1B1B99",
          }}
        >
          TONIGHT'S LINEUP
        </div>
        <div
          style={{
            fontWeight: 900,
            fontSize: 88,
            lineHeight: 0.95,
            marginTop: 18,
            maxWidth: 720,
            letterSpacing: -2,
          }}
        >
          {data.venue}
        </div>
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 22,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span
            style={{
              border: "2px solid #1B1B1B",
              borderRadius: 999,
              padding: "8px 18px",
              fontFamily: "ui-monospace, monospace",
              fontSize: 14,
              letterSpacing: 3,
              textTransform: "uppercase",
              background: "#F5C518",
            }}
          >
            {data.vibe}
          </span>
          {data.isUsual && (
            <span
              style={{
                border: "2px solid #1B1B1B",
                borderRadius: 999,
                padding: "8px 18px",
                fontFamily: "ui-monospace, monospace",
                fontSize: 14,
                letterSpacing: 3,
                textTransform: "uppercase",
                background: "#1B1B1B",
                color: "#FAF6EF",
              }}
            >
              ★ Your usual
            </span>
          )}
          {(data.address || data.neighborhood) && (
            <span
              style={{ fontFamily: "ui-monospace, monospace", fontSize: 16, color: "#1B1B1BCC" }}
            >
              {[data.address, data.neighborhood].filter(Boolean).join(" · ")}
            </span>
          )}
        </div>

        {/* Vibe profile grid */}
        <div style={{ marginTop: 56 }}>
          <div
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: 13,
              letterSpacing: 5,
              color: "#1B1B1B99",
            }}
          >
            THE VIBE
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 12,
              marginTop: 16,
            }}
          >
            {profile.map(([k, v]) => (
              <div
                key={k}
                style={{
                  border: "2px solid #1B1B1B",
                  background: "#FFFDF8",
                  borderRadius: 18,
                  padding: 18,
                  minHeight: 120,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    fontFamily: "ui-monospace, monospace",
                    fontSize: 11,
                    letterSpacing: 3,
                    color: "#1B1B1B80",
                  }}
                >
                  {k}
                </div>
                <div style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.15 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular booked + dishes */}
        <div style={{ marginTop: 44, display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 24 }}>
          <div
            style={{
              border: "2px solid #1B1B1B",
              background: "#FFFDF8",
              borderRadius: 24,
              padding: 26,
            }}
          >
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}
            >
              <div
                style={{
                  fontFamily: "ui-monospace, monospace",
                  fontSize: 13,
                  letterSpacing: 4,
                  color: "#1B1B1B99",
                }}
              >
                POPULAR BOOKED
              </div>
              <div
                style={{
                  fontFamily: "ui-monospace, monospace",
                  fontSize: 11,
                  letterSpacing: 3,
                  color: "#1B1B1B66",
                }}
              >
                LIVE
              </div>
            </div>
            <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
              {data.popularAvailability.map((slot) => {
                const isPeak = slot.time === data.peakTime;
                return (
                  <div
                    key={slot.time}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      border: `2px solid ${isPeak ? "#1B1B1B" : "#1B1B1B33"}`,
                      background: isPeak ? "#F5C518" : "#FAF6EF",
                      borderRadius: 14,
                      padding: "14px 18px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span
                        style={{
                          display: "inline-block",
                          width: 12,
                          height: 12,
                          borderRadius: 999,
                          background: LEVEL_DOT[slot.level],
                        }}
                      />
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: 22,
                          fontFamily: "ui-monospace, monospace",
                          letterSpacing: 1,
                        }}
                      >
                        {isPeak ? "★ " : ""}
                        {slot.time}
                      </span>
                    </div>
                    <span
                      style={{
                        fontFamily: "ui-monospace, monospace",
                        fontSize: 14,
                        letterSpacing: 2,
                        textTransform: "uppercase",
                        color: "#1B1B1BCC",
                      }}
                    >
                      {slot.level === "few"
                        ? `Only ${slot.seatsLeft} left`
                        : LEVEL_COPY[slot.level]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              border: "2px solid #1B1B1B",
              background: "#1B1B1B",
              color: "#FAF6EF",
              borderRadius: 24,
              padding: 26,
            }}
          >
            <div
              style={{
                fontFamily: "ui-monospace, monospace",
                fontSize: 13,
                letterSpacing: 4,
                opacity: 0.7,
              }}
            >
              MOST ORDERED
            </div>
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
              {data.dishes.slice(0, 3).map((dish) => (
                <div key={dish} style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                  <span style={{ fontWeight: 900, fontSize: 28, color: "#F5C518" }}>·</span>
                  <span style={{ fontWeight: 700, fontSize: 22, lineHeight: 1.25 }}>{dish}</span>
                </div>
              ))}
            </div>
            {data.dietary.length > 0 && (
              <>
                <div
                  style={{
                    fontFamily: "ui-monospace, monospace",
                    fontSize: 12,
                    letterSpacing: 3,
                    opacity: 0.6,
                    marginTop: 22,
                  }}
                >
                  DIETARY
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                  {data.dietary.slice(0, 4).map((d) => (
                    <span
                      key={d}
                      style={{
                        border: "1px solid #FAF6EF66",
                        borderRadius: 999,
                        padding: "4px 12px",
                        fontFamily: "ui-monospace, monospace",
                        fontSize: 12,
                        letterSpacing: 2,
                        textTransform: "uppercase",
                      }}
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </>
            )}
            <div
              style={{
                fontFamily: "ui-monospace, monospace",
                fontSize: 12,
                letterSpacing: 3,
                opacity: 0.6,
                marginTop: 22,
              }}
            >
              KNOWN FOR
            </div>
            <div style={{ fontWeight: 700, fontSize: 18, marginTop: 6 }}>{data.knownFor}</div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            left: 56,
            right: 56,
            bottom: 40,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "ui-monospace, monospace",
            fontSize: 13,
            letterSpacing: 4,
            color: "#1B1B1B99",
            borderTop: "2px solid #1B1B1B",
            paddingTop: 18,
          }}
        >
          <span>BUILT BY YOUR NIGHT WIZARD</span>
          <span>★ ★ ★</span>
          <span>SHARE → PLAN → SHOW UP</span>
        </div>
      </div>
    );
  },
);
StopShareCard.displayName = "StopShareCard";
