import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, RefreshCw, Save, Instagram, Music2, Youtube, Loader2, Wand2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { loadPrefs, saveAboutMe, saveSocialHandles, saveSocialSignals, saveTasteProfile, type Prefs, type SocialHandles, type TasteProfile } from "@/lib/taste";

export const Route = createFileRoute("/me")({ component: MyVibe });

type Msg = { role: "user" | "assistant"; content: string };

const STARTER: Msg = {
  role: "assistant",
  content:
    "Hey! I'm here to learn what you actually love so the planner stops suggesting random stuff. Quick question to start — what's your age range and life stage? (e.g. 30s, married with two kids)",
};

function MyVibe() {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [messages, setMessages] = useState<Msg[]>([STARTER]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [aboutMe, setAboutMe] = useState("");
  const [savedAbout, setSavedAbout] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { nav({ to: "/auth" }); return; }
    loadPrefs().then((p) => { setPrefs(p); setAboutMe(p.about_me ?? ""); });
  }, [user, authLoading, nav]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    if (!text.trim() || busy || !prefs) return;
    const next: Msg[] = [...messages, { role: "user", content: text.trim() }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("taste-chat", {
        body: { messages: next, profile: prefs.taste_profile },
      });
      if (error) throw new Error(error.message);
      if (data?.profile) {
        await saveTasteProfile(data.profile as TasteProfile);
        setPrefs({ ...prefs, taste_profile: data.profile });
      }
      setMessages([...next, { role: "assistant", content: data?.message ?? "Got it." }]);
    } catch (e) {
      setMessages([...next, { role: "assistant", content: `Hmm, ${(e as Error).message}` }]);
    } finally {
      setBusy(false);
    }
  }

  async function persistAbout() {
    await saveAboutMe(aboutMe);
    setSavedAbout(true);
    setTimeout(() => setSavedAbout(false), 2000);
  }

  function reset() {
    setMessages([STARTER]);
  }

  if (!prefs) return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading…</div>;

  const t = prefs.taste_profile ?? {};
  const chips = [
    t.age_range && `🎂 ${t.age_range}`,
    t.life_stage && `💞 ${t.life_stage}`,
    t.energy && `⚡ ${t.energy.replace("_", " ")}`,
    ...(t.music_taste ?? []).map((m) => `🎵 ${m}`),
    ...(t.scene_keywords ?? []).map((s) => `✨ ${s}`),
    ...(t.loves ?? []).map((s) => `❤️ ${s}`),
    ...(t.avoid ?? []).map((s) => `🚫 ${s}`),
    ...(t.cities ?? []).map((s) => `📍 ${s}`),
  ].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        {/* Chat */}
        <section className="rounded-3xl border border-border bg-card shadow-card">
          <header className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-vibe shadow-pop">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </span>
              <div>
                <p className="font-display text-lg font-bold leading-none">Vibe coach</p>
                <p className="text-xs text-muted-foreground">Chat anytime — your profile updates as we go.</p>
              </div>
            </div>
            <button onClick={reset} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
              <RefreshCw className="h-3 w-3" /> New chat
            </button>
          </header>

          <div ref={scrollRef} className="h-[460px] space-y-4 overflow-y-auto p-5">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                }`}>{m.content}</div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">Thinking…</div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex gap-2 border-t border-border p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me about your vibe…"
              className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground hover:scale-105 transition-pop disabled:opacity-50"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>

        {/* Profile */}
        <aside className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
            <h2 className="font-display text-lg font-bold">Your taste profile</h2>
            <p className="mt-1 text-xs text-muted-foreground">Used by every AI suggestion.</p>
            {chips.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">Nothing yet — answer a few questions to seed your profile.</p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {chips.map((c, i) => (
                  <span key={i} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{c}</span>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
            <h2 className="font-display text-lg font-bold">In your own words</h2>
            <textarea
              value={aboutMe}
              onChange={(e) => setAboutMe(e.target.value)}
              rows={5}
              placeholder="e.g. Married, 40s, two kids under 10. We love jazz brunches, art museums, and long scenic drives. No loud bars."
              className="mt-3 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
            />
            <button
              onClick={persistAbout}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-bold text-background hover:scale-105 transition-pop"
            >
              <Save className="h-3.5 w-3.5" /> {savedAbout ? "Saved ✓" : "Save"}
            </button>
          </div>

          <SocialsCard prefs={prefs} onProfile={(p) => setPrefs({ ...prefs, taste_profile: p })} onPrefs={(np) => setPrefs(np)} />
        </aside>
      </div>
    </div>
  );
}
