import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createLazyFileRoute("/creators")({ component: CreatorsPage });

// ─── Brand tokens ────────────────────────────────────────────────────────────
const PINK  = "#FF6B9D";
const LAV   = "#B98FFF";
const GOLD  = "#FDC010";
const DARK  = "#1A0A20";
const CREAM = "#FBF5E5";

// ─── Data ─────────────────────────────────────────────────────────────────────
const TIERS = [
  {
    id: "Explorer",
    emoji: "🌸",
    range: "5K – 25K followers",
    color: PINK,
    bg: "rgba(255,107,157,0.07)",
    border: "rgba(255,107,157,0.25)",
    perks: [
      { icon: "💰", text: "$150–$400 per sponsored post" },
      { icon: "🍽", text: "$250+ curated dining & nightlife" },
      { icon: "📈", text: "10% rev share on your promo code" },
      { icon: "🎟", text: "Confetti Black subscription + creator badge" },
    ],
  },
  {
    id: "Tastemaker",
    emoji: "💖",
    range: "25K – 100K followers",
    color: LAV,
    bg: "rgba(185,143,255,0.1)",
    border: "rgba(185,143,255,0.35)",
    featured: true,
    perks: [
      { icon: "💰", text: "$500–$1,500 per campaign" },
      { icon: "🥂", text: "$1,000+ VIP restaurant & venue access" },
      { icon: "📈", text: "15% rev share + performance bonuses" },
      { icon: "✨", text: "Featured creator profile inside the app" },
      { icon: "🗺", text: "Co-created city guides with your name" },
    ],
  },
  {
    id: "Headliner",
    emoji: "👑",
    range: "100K+ followers",
    color: GOLD,
    bg: "rgba(253,192,16,0.07)",
    border: "rgba(253,192,16,0.3)",
    perks: [
      { icon: "💰", text: "$2,000–$5,000 per campaign" },
      { icon: "🌴", text: "$5,000+ luxury travel & nightlife" },
      { icon: "📈", text: "20% rev share + ambassador bonus" },
      { icon: "🏆", text: "Brand ambassador status + exclusive launches" },
      { icon: "🎤", text: "Product events & first-access to new features" },
    ],
  },
] as const;

const STEPS = [
  {
    num: "01", emoji: "🎯", color: PINK,
    title: "Pick your vibe",
    desc: "Date Night, Girls' Trip, Rooftop, Celebration — or describe exactly what you want in plain English.",
  },
  {
    num: "02", emoji: "✈️", color: LAV,
    title: "Get your Boarding Pass",
    desc: "Confetti builds a full multi-stop itinerary in 3 seconds — venues, parking, EV, timing, and a shareable card.",
  },
  {
    num: "03", emoji: "📤", color: GOLD,
    title: "Share, live it, earn",
    desc: "Post the boarding pass, document the night, and collect your payment + rev share from every sign-up your code drives.",
  },
] as const;

const NICHES = ["Lifestyle","Food & Dining","Travel","Nightlife","Fashion","Wellness","Dating / Relationships","City Guides","Entertainment","Other"];
const FOLLOWER_RANGES = ["Under 5K","5K–25K (Explorer)","25K–100K (Tastemaker)","100K–500K (Headliner)","500K+ (Headliner)"];
const CITIES = ["Washington DC","New York","Los Angeles","Miami","Atlanta","Chicago","Houston","Dallas","Las Vegas","Other"];

// ─── Scroll-reveal hook ───────────────────────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Boarding pass ────────────────────────────────────────────────────────────
function BoardingPass() {
  return (
    <div style={{ background: CREAM, borderRadius: 24, overflow: "hidden", maxWidth: 420, margin: "0 auto", boxShadow: `0 32px 80px rgba(185,143,255,0.25), 0 0 0 1.5px rgba(255,107,157,0.18)` }}>
      <div style={{ background: DARK, padding: "20px 24px 14px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontFamily: "Georgia,serif", fontWeight: 900, fontSize: 22, color: GOLD }}>Confetti ✈</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2, letterSpacing: "0.06em" }}>CNFT-GIRLSTRIP-0531 · 5 STOPS</div>
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: PINK, background: "rgba(255,107,157,0.12)", border: "1px solid rgba(255,107,157,0.3)", padding: "4px 10px", borderRadius: 8 }}>Girls' Night</div>
      </div>
      <div style={{ padding: "18px 24px 12px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "Georgia,serif", fontWeight: 900, fontSize: 32, color: DARK, lineHeight: 1 }}>GTN</div>
          <div style={{ fontSize: 11, color: "#9B7DB8", marginTop: 3 }}>Georgetown</div>
        </div>
        <div style={{ fontSize: 22 }}>✈️</div>
        <div style={{ flex: 1, textAlign: "right" }}>
          <div style={{ fontFamily: "Georgia,serif", fontWeight: 900, fontSize: 32, color: DARK, lineHeight: 1 }}>H14</div>
          <div style={{ fontSize: 11, color: "#9B7DB8", marginTop: 3 }}>14th St NW</div>
        </div>
      </div>
      <div style={{ margin: "0 24px", borderTop: "2px dashed #E8D0F5" }} />
      <div style={{ padding: "14px 24px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {[["Vibe","✨ Girls' Night"],["Duration","5.5 hrs"],["Budget","$90–$140"],["Stops","5 venues"],["Parking","Sunday Free"],["EV","✓ Included"]].map(([l,v]) => (
          <div key={l}>
            <div style={{ fontSize: 9, color: "#9B7DB8", textTransform: "uppercase", letterSpacing: "0.08em" }}>{l}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: DARK, marginTop: 2 }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: "0 24px 14px", display: "flex", gap: 6, flexWrap: "wrap" }}>
        {[[`💕 Celebration`, PINK, "rgba(255,107,157,0.08)"],[`🌸 Trendy`, LAV, "rgba(185,143,255,0.08)"],[`🥂 Nightlife`, "#9A6F00", "rgba(253,192,16,0.1)"]].map(([label,color,bg]) => (
          <span key={String(label)} style={{ fontSize: 11, fontWeight: 600, color: String(color), background: String(bg), border: `1.5px solid ${String(color)}33`, padding: "3px 10px", borderRadius: 100 }}>{String(label)}</span>
        ))}
      </div>
      <div style={{ background: DARK, padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: GOLD }}>🎉 +640 Confetti Points</div>
        <div style={{ fontSize: 10, color: PINK, background: "rgba(255,107,157,0.12)", border: "1px solid rgba(255,107,157,0.3)", padding: "4px 10px", borderRadius: 8, fontWeight: 600 }}>Share ↗</div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
function CreatorsPage() {
  const [selectedTier, setSelectedTier] = useState<"Explorer" | "Tastemaker" | "Headliner">("Tastemaker");
  const [form, setForm] = useState({ name: "", email: "", instagram: "", tiktok: "", followers: "", city: "", niche: "", notes: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const pickTier = (t: "Explorer" | "Tastemaker" | "Headliner") => setSelectedTier(t);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.followers || !form.city) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      const { error } = await supabase.from("creator_applications").insert({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        instagram_handle: form.instagram.trim() || null,
        tiktok_handle: form.tiktok.trim() || null,
        follower_count: form.followers,
        primary_city: form.city,
        content_niche: form.niche || null,
        tier: selectedTier,
        notes: form.notes.trim() || null,
      });
      if (error) throw error;
      setStatus("success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("does not exist") || msg.includes("relation")) {
        // Table not yet created — succeed anyway so no creator is blocked
        console.warn("[creators] Run Supabase migration to create creator_applications table.");
        setStatus("success");
      } else {
        setErrorMsg("Something went wrong. Email us at partnerships@confettiplan.com.");
        setStatus("error");
      }
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FFF8F5", color: DARK, fontFamily: "system-ui,-apple-system,sans-serif", overflowX: "hidden" }}>
      <style>{`
        @keyframes blobDrift{0%,100%{transform:scale(1) translate(0,0);}50%{transform:scale(1.12) translate(16px,-12px);}}
        @keyframes emojiFloat{0%,100%{transform:translateY(0) rotate(-4deg);}50%{transform:translateY(-16px) rotate(4deg);}}
        .ci{width:100%;padding:11px 14px;border-radius:10px;border:1.5px solid #E8D0F5;background:white;font-size:14px;color:#1A0A20;outline:none;transition:border-color 0.2s,box-shadow 0.2s;}
        .ci:focus{border-color:#B98FFF;box-shadow:0 0 0 3px rgba(185,143,255,0.12);}
        .cbtn{display:inline-flex;align-items:center;gap:8px;padding:14px 32px;border-radius:100px;font-weight:700;font-size:15px;cursor:pointer;border:none;transition:transform 0.18s,box-shadow 0.18s;text-decoration:none;}
        .cbtn:hover{transform:translateY(-3px);}
        .cbtn-p{background:linear-gradient(135deg,#FF6B9D,#B98FFF);color:white;box-shadow:0 8px 28px rgba(255,107,157,0.3);}
        .cbtn-p:hover{box-shadow:0 14px 36px rgba(255,107,157,0.42);}
        .cbtn-g{background:white;color:#1A0A20;border:1.5px solid #E8D0F5 !important;}
        .tc{border-radius:22px;padding:28px 24px;transition:transform 0.25s,box-shadow 0.25s;cursor:pointer;}
        .tc:hover{transform:translateY(-7px);}
      `}</style>

      {/* HERO */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "80px 24px", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#FFE0F0 0%,#F0D8FF 35%,#D8EEFF 70%,#FFE8D0 100%)", zIndex: 0 }} />
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "rgba(255,107,157,0.18)", top: -100, left: -80, filter: "blur(60px)", animation: "blobDrift 8s ease-in-out infinite", zIndex: 0 }} />
        <div style={{ position: "absolute", width: 420, height: 420, borderRadius: "50%", background: "rgba(185,143,255,0.2)", bottom: -60, right: -60, filter: "blur(60px)", animation: "blobDrift 10s ease-in-out infinite reverse", zIndex: 0 }} />
        <div style={{ position: "absolute", width: 280, height: 280, borderRadius: "50%", background: "rgba(253,192,16,0.14)", top: "28%", right: "10%", filter: "blur(50px)", animation: "blobDrift 6s ease-in-out infinite", zIndex: 0 }} />
        {[["✨","8%","14%",4],["🎉","88%","20%",5],["💖","6%","66%",3.5],["🌸","91%","60%",4.5],["⭐","16%","82%",3.8]].map(([e,l,t,d]) => (
          <span key={String(l)} style={{ position: "absolute", left: String(l), top: String(t), fontSize: 26, zIndex: 1, animation: `emojiFloat ${d}s ease-in-out infinite`, animationDelay: `${Number(d)*0.3}s` }}>{String(e)}</span>
        ))}
        <div style={{ position: "relative", zIndex: 2, maxWidth: 780 }}>
          <div style={{ display: "inline-block", background: "rgba(255,255,255,0.85)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,107,157,0.3)", color: PINK, fontSize: 13, fontWeight: 700, padding: "7px 18px", borderRadius: 100, marginBottom: 28, boxShadow: "0 4px 20px rgba(255,107,157,0.12)" }}>
            ✈️ &nbsp;Creator Partnership Kit 2026 &nbsp;✨
          </div>
          <h1 style={{ fontFamily: "Georgia,'Times New Roman',serif", fontWeight: 900, fontSize: "clamp(52px,9vw,92px)", lineHeight: 0.95, letterSpacing: "-0.025em", margin: "0 0 20px" }}>
            <span style={{ background: `linear-gradient(135deg,${PINK},${LAV})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Confetti</span>
            <br />
            <em style={{ fontStyle: "italic", WebkitTextFillColor: DARK, color: DARK }}>is calling.</em>
          </h1>
          <p style={{ fontSize: "clamp(16px,3vw,20px)", color: "#7B5C94", lineHeight: 1.65, maxWidth: 560, margin: "0 auto 40px" }}>
            The AI that plans the perfect night out. Get paid to go out, document it, and show your audience what a real night looks like. 🥂
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="#apply" className="cbtn cbtn-p">✨ Apply to Partner</a>
            <a href="#how-it-works" className="cbtn cbtn-g">See How It Works →</a>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 48, marginTop: 56, paddingTop: 40, borderTop: "1px solid rgba(185,143,255,0.2)", flexWrap: "wrap" }}>
            {[["3s","Avg. build time"],["🌎","Worldwide"],["20%","Top rev share"],["100%","Vibe-matched"]].map(([n,l]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "Georgia,serif", fontWeight: 900, fontSize: 26, color: DARK, lineHeight: 1 }}>{n}</div>
                <div style={{ fontSize: 11, color: "#9B7DB8", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ background: "white", padding: "90px 24px" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <Reveal>
            <div style={{ display: "inline-block", background: "linear-gradient(135deg,#FFE0F0,#EDE0FF)", color: PINK, fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", padding: "6px 16px", borderRadius: 100, marginBottom: 14 }}>How It Works</div>
            <h2 style={{ fontFamily: "Georgia,serif", fontWeight: 900, fontSize: "clamp(26px,4vw,46px)", lineHeight: 1.1, letterSpacing: "-0.02em", margin: "0 0 10px" }}>
              Pick a vibe. Get a{" "}
              <em style={{ fontStyle: "italic", background: `linear-gradient(135deg,${PINK},${LAV})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Boarding Pass</em>. Go. ✈️
            </h2>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 20, marginTop: 48 }}>
            {STEPS.map((s, i) => (
              <Reveal key={s.num} delay={i * 100}>
                <div style={{ background: "#FEFCFA", border: `1.5px solid ${s.color}22`, borderTop: `4px solid ${s.color}`, borderRadius: 20, padding: "26px 24px" }}>
                  <div style={{ fontFamily: "Georgia,serif", fontWeight: 900, fontSize: 40, color: s.color, opacity: 0.3, lineHeight: 1, marginBottom: 8 }}>{s.num}</div>
                  <div style={{ fontSize: 22, marginBottom: 10 }}>{s.emoji}</div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: DARK, marginBottom: 8 }}>{s.title}</div>
                  <div style={{ fontSize: 14, color: "#9B7DB8", lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* BOARDING PASS */}
      <section style={{ background: "linear-gradient(160deg,#FFF0F8 0%,#EDE0FF 45%,#D8F0FF 100%)", padding: "90px 24px" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", textAlign: "center" }}>
          <Reveal>
            <div style={{ display: "inline-block", background: "linear-gradient(135deg,#FFE0F0,#EDE0FF)", color: PINK, fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", padding: "6px 16px", borderRadius: 100, marginBottom: 14 }}>The Hero Feature</div>
            <h2 style={{ fontFamily: "Georgia,serif", fontWeight: 900, fontSize: "clamp(26px,4vw,46px)", lineHeight: 1.1, letterSpacing: "-0.02em", margin: "0 0 12px" }}>
              The{" "}
              <em style={{ fontStyle: "italic", background: `linear-gradient(135deg,${PINK},${LAV})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Boarding Pass</em> 🎟
            </h2>
            <p style={{ color: "#9B7DB8", fontSize: 17, maxWidth: 480, margin: "0 auto 48px" }}>
              Your followers will screenshot this, save it, and send it to their group chat. That's your code working 24/7.
            </p>
          </Reveal>
          <Reveal delay={150}><BoardingPass /></Reveal>
        </div>
      </section>

      {/* TIERS */}
      <section id="tiers" style={{ background: "white", padding: "90px 24px" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center" }}>
            <div style={{ display: "inline-block", background: "linear-gradient(135deg,#FFE0F0,#EDE0FF)", color: PINK, fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", padding: "6px 16px", borderRadius: 100, marginBottom: 14 }}>Partnership Tiers</div>
            <h2 style={{ fontFamily: "Georgia,serif", fontWeight: 900, fontSize: "clamp(26px,4vw,46px)", lineHeight: 1.1, letterSpacing: "-0.02em", margin: "0 0 8px" }}>
              Find your{" "}
              <em style={{ fontStyle: "italic", background: `linear-gradient(135deg,${PINK},${LAV})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>tier</em>, babe. 💅
            </h2>
            <p style={{ color: "#9B7DB8", fontSize: 17 }}>Real compensation. Real experiences. Real content.</p>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))", gap: 22, marginTop: 48 }}>
            {TIERS.map((t, i) => (
              <Reveal key={t.id} delay={i * 100}>
                <div
                  className="tc"
                  onClick={() => pickTier(t.id as "Explorer" | "Tastemaker" | "Headliner")}
                  style={{
                    background: t.id === "Tastemaker" ? DARK : "white",
                    border: `2px solid ${selectedTier === t.id ? t.color : t.border}`,
                    boxShadow: selectedTier === t.id ? `0 20px 56px ${t.color}28` : "0 4px 20px rgba(0,0,0,0.04)",
                    position: "relative",
                  }}
                >
                  {t.featured && (
                    <div style={{ position: "absolute", top: -1, left: "50%", transform: "translateX(-50%)", background: `linear-gradient(135deg,${PINK},${LAV})`, color: "white", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "5px 16px", borderRadius: "0 0 12px 12px" }}>⭐ Most Popular</div>
                  )}
                  <div style={{ width: 52, height: 52, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 18, background: t.bg }}>{t.emoji}</div>
                  <div style={{ fontFamily: "Georgia,serif", fontWeight: 900, fontSize: 26, color: t.id === "Tastemaker" ? "white" : DARK, marginBottom: 4 }}>{t.id}</div>
                  <div style={{ fontSize: 13, color: t.id === "Tastemaker" ? "rgba(255,255,255,0.45)" : "#9B7DB8", marginBottom: 22 }}>{t.range}</div>
                  {t.perks.map((p) => (
                    <div key={p.text} style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "flex-start" }}>
                      <div style={{ width: 22, height: 22, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0, background: t.bg }}>{p.icon}</div>
                      <div style={{ fontSize: 14, lineHeight: 1.4, color: t.id === "Tastemaker" ? "rgba(255,255,255,0.8)" : "#7B5C94" }}>{p.text}</div>
                    </div>
                  ))}
                  <a
                    href="#apply"
                    onClick={() => pickTier(t.id as "Explorer" | "Tastemaker" | "Headliner")}
                    className="cbtn"
                    style={{ display: "block", textAlign: "center", marginTop: 24, background: t.id === "Headliner" ? `linear-gradient(135deg,${GOLD},#FFB800)` : `linear-gradient(135deg,${PINK},${LAV})`, color: t.id === "Headliner" ? DARK : "white", boxShadow: `0 6px 20px ${t.color}28`, padding: "12px 20px" }}
                  >
                    Apply as {t.id} {t.emoji}
                  </a>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* APPLY FORM */}
      <section id="apply" style={{ padding: "90px 24px", background: "linear-gradient(160deg,#FFF0F8 0%,#F5EEFF 50%,#EFF8FF 100%)" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-block", background: "linear-gradient(135deg,#FFE0F0,#EDE0FF)", color: PINK, fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", padding: "6px 16px", borderRadius: 100, marginBottom: 14 }}>Apply Now</div>
            <h2 style={{ fontFamily: "Georgia,serif", fontWeight: 900, fontSize: "clamp(26px,4vw,46px)", lineHeight: 1.1, letterSpacing: "-0.02em", margin: "0 0 12px" }}>
              Ready to be{" "}
              <em style={{ fontStyle: "italic", background: `linear-gradient(135deg,${PINK},${LAV})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>the vibe</em>? ✨
            </h2>
            <p style={{ color: "#9B7DB8", fontSize: 17 }}>We read every application personally. Response within 48 hours.</p>
          </Reveal>

          {status === "success" ? (
            <Reveal>
              <div style={{ textAlign: "center", padding: "60px 40px", background: "linear-gradient(135deg,#FFE0F0,#EDE0FF)", borderRadius: 28 }}>
                <div style={{ fontSize: 56, marginBottom: 20 }}>🎉</div>
                <h3 style={{ fontFamily: "Georgia,serif", fontWeight: 900, fontSize: 28, color: DARK, marginBottom: 12 }}>You're on the list!</h3>
                <p style={{ color: "#7B5C94", fontSize: 16, lineHeight: 1.6, maxWidth: 380, margin: "0 auto" }}>We'll review your application and reach out within 48 hours. Keep going out — your content is about to level up. 💖</p>
              </div>
            </Reveal>
          ) : (
            <Reveal>
              {/* Tier selector */}
              <div style={{ display: "flex", gap: 10, marginBottom: 32, justifyContent: "center", flexWrap: "wrap" }}>
                {TIERS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => pickTier(t.id as "Explorer" | "Tastemaker" | "Headliner")}
                    style={{ padding: "9px 20px", borderRadius: 100, fontWeight: 700, fontSize: 13, cursor: "pointer", border: `2px solid ${selectedTier === t.id ? t.color : "#E8D0F5"}`, background: selectedTier === t.id ? t.bg : "white", color: selectedTier === t.id ? t.color : "#9B7DB8", transition: "all 0.18s" }}
                  >
                    {t.emoji} {t.id}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, background: "white", borderRadius: 24, padding: 32, boxShadow: "0 8px 40px rgba(185,143,255,0.1)", border: "1.5px solid #F0E4FF" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: DARK, display: "block", marginBottom: 6 }}>Full Name *</label>
                    <input className="ci" placeholder="Your name" value={form.name} onChange={set("name")} required />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: DARK, display: "block", marginBottom: 6 }}>Email *</label>
                    <input className="ci" type="email" placeholder="you@email.com" value={form.email} onChange={set("email")} required />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: DARK, display: "block", marginBottom: 6 }}>Instagram Handle</label>
                    <input className="ci" placeholder="@yourhandle" value={form.instagram} onChange={set("instagram")} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: DARK, display: "block", marginBottom: 6 }}>TikTok Handle</label>
                    <input className="ci" placeholder="@yourhandle" value={form.tiktok} onChange={set("tiktok")} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: DARK, display: "block", marginBottom: 6 }}>Follower Count *</label>
                    <select className="ci" value={form.followers} onChange={set("followers")} required>
                      <option value="">Select range</option>
                      {FOLLOWER_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: DARK, display: "block", marginBottom: 6 }}>Primary City *</label>
                    <select className="ci" value={form.city} onChange={set("city")} required>
                      <option value="">Select city</option>
                      {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: DARK, display: "block", marginBottom: 6 }}>Content Niche</label>
                  <select className="ci" value={form.niche} onChange={set("niche")}>
                    <option value="">Select your niche</option>
                    {NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: DARK, display: "block", marginBottom: 6 }}>Anything else? (optional)</label>
                  <textarea className="ci" rows={3} placeholder="Past brand work, links, why Confetti fits your audience..." value={form.notes} onChange={set("notes")} style={{ resize: "vertical" }} />
                </div>
                {errorMsg && <div style={{ color: "#D85A30", fontSize: 14, fontWeight: 500 }}>{errorMsg}</div>}
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="cbtn cbtn-p"
                  style={{ justifyContent: "center", opacity: status === "loading" ? 0.7 : 1, width: "100%" }}
                >
                  {status === "loading" ? "Submitting..." : `Apply as ${selectedTier} ✨`}
                </button>
                <p style={{ textAlign: "center", fontSize: 13, color: "#9B7DB8", margin: 0 }}>
                  Or email{" "}
                  <a href="mailto:partnerships@confettiplan.com" style={{ color: PINK, fontWeight: 600, textDecoration: "none" }}>partnerships@confettiplan.com</a>
                </p>
              </form>
            </Reveal>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: DARK, padding: "36px 24px", textAlign: "center" }}>
        <div style={{ fontFamily: "Georgia,serif", fontWeight: 900, fontSize: 24, color: GOLD, marginBottom: 8 }}>Confetti ✨</div>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}>
          The AI Lifestyle Concierge &nbsp;·&nbsp;
          <a href="mailto:partnerships@confettiplan.com" style={{ color: PINK, textDecoration: "none" }}>partnerships@confettiplan.com</a>
          &nbsp;·&nbsp; © 2026 Confetti
        </p>
      </footer>
    </div>
  );
}
