import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, RefreshCw, Save, Instagram, Music2, Youtube, Loader2, Wand2, ShieldCheck, Link2, Unlink, CheckCircle2, AlertTriangle } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { loadPrefs, saveAboutMe, saveSocialHandles, saveSocialSignals, saveTasteProfile, type Prefs, type SocialHandles, type TasteProfile } from "@/lib/taste";
import { useServerFn } from "@tanstack/react-start";
import { startTiktokLink, disconnectTiktok, getMyLinkedAccounts } from "@/lib/tiktok-oauth.functions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const DATA_CONSENT_KEY = "confetti.dataSharingConsent.v1";

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

const PLATFORMS: Array<{ key: keyof SocialHandles; label: string; placeholder: string; Icon: typeof Instagram }> = [
  { key: "instagram", label: "Instagram", placeholder: "your.handle", Icon: Instagram },
  { key: "tiktok",    label: "TikTok",    placeholder: "yourhandle",  Icon: Music2 },
  { key: "youtube",   label: "YouTube",   placeholder: "@channel",    Icon: Youtube },
  { key: "pinterest", label: "Pinterest", placeholder: "yourboard",   Icon: Sparkles },
  { key: "spotify",   label: "Spotify",   placeholder: "username",    Icon: Music2 },
  { key: "x",         label: "X / Twitter", placeholder: "yourhandle", Icon: Sparkles },
];

function SocialsCard({ prefs, onProfile, onPrefs }: { prefs: Prefs; onProfile: (p: TasteProfile) => void; onPrefs: (p: Prefs) => void }) {
  const [handles, setHandles] = useState<SocialHandles>(prefs.social_handles ?? {});
  const [pasted, setPasted] = useState(prefs.social_signals ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [consent, setConsent] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(DATA_CONSENT_KEY) === "1";
  });

  function toggleConsent(v: boolean) {
    setConsent(v);
    if (typeof window !== "undefined") {
      if (v) window.localStorage.setItem(DATA_CONSENT_KEY, "1");
      else window.localStorage.removeItem(DATA_CONSENT_KEY);
    }
  }

  function update(k: keyof SocialHandles, v: string) {
    const clean = v.trim().replace(/^@/, "");
    setHandles({ ...handles, [k]: clean });
  }

  async function saveHandles() {
    if (!consent) { setMsg("Please accept the data sharing terms first."); return; }
    await saveSocialHandles(handles);
    onPrefs({ ...prefs, social_handles: handles });
    setMsg("Handles saved ✓");
    setTimeout(() => setMsg(null), 1800);
  }

  async function learn() {
    if (!consent) { setMsg("Please accept the data sharing terms first."); return; }
    if (!pasted.trim()) { setMsg("Paste your bio, top hashtags, or favorite creators first."); return; }
    setBusy(true);
    setMsg(null);
    try {
      await saveSocialHandles(handles);
      await saveSocialSignals(pasted);
      const { data, error } = await supabase.functions.invoke("social-learn", {
        body: { current: prefs.taste_profile, handles, pasted },
      });
      if (error) throw new Error(error.message);
      if (data?.profile) {
        await saveTasteProfile(data.profile);
        onProfile(data.profile);
      }
      onPrefs({ ...prefs, social_handles: handles, social_signals: pasted, taste_profile: data?.profile ?? prefs.taste_profile });
      setMsg(data?.summary ? `✨ ${data.summary}` : "Profile updated ✓");
    } catch (e) {
      setMsg(`Hmm, ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <h2 className="font-display text-lg font-bold">Connect your socials</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        We'll learn your aesthetic from your handles + what you actually post and like.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {PLATFORMS.map(({ key, label, placeholder, Icon }) => (
          <label key={key} className="flex items-center gap-2 rounded-xl border border-border bg-background px-2.5 py-1.5">
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground">{label}</span>
            <span className="text-muted-foreground/60">@</span>
            <input
              value={handles[key] ?? ""}
              onChange={(e) => update(key, e.target.value)}
              placeholder={placeholder}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </label>
        ))}
      </div>

      <label className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-background/60 p-3 text-xs">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => toggleConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
          aria-describedby="data-consent-help"
        />
        <span id="data-consent-help" className="leading-relaxed text-muted-foreground">
          <ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-primary" />
          I agree that Confettiplan's AI may use my social handles, pasted signals, photos of places I've
          been or want to go, and inferences from my most-engaged followers to learn my taste and
          personalize plans. I've read the{" "}
          <Link to="/data-terms" className="font-semibold text-foreground underline">
            data sharing terms
          </Link>
          .
        </span>
      </label>

      <button
        onClick={saveHandles}
        disabled={!consent}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Save className="h-3 w-3" /> Save handles
      </button>

      <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/40 p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Help the AI learn faster
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Paste your bio, top 10 hashtags, favorite creators, or recent captions. The more honest, the better the suggestions.
        </p>
        <textarea
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          rows={5}
          placeholder={"Bio: 'NYC · matcha addict · book girlies'\nHashtags: #cottagecore #naturalwine #slowliving\nCreators I follow: @camillerowe, @claireptak\nRecent post: weekend at a farm-to-table spot in the Hudson Valley..."}
          className="mt-2 w-full rounded-lg border border-border bg-background p-2.5 text-sm outline-none focus:border-primary"
        />
        <button
          onClick={learn}
          disabled={busy || !consent}
          className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-pop hover:scale-105 transition-pop disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Learning…</> : <><Wand2 className="h-3.5 w-3.5" /> Learn my vibe</>}
        </button>
      </div>

      {msg && <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs text-foreground/80">{msg}</p>}

      <TiktokConnect consent={consent} />

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Instagram OAuth is still pending Meta app review. For Instagram, your handle and pasted signals are what the AI uses for now.
      </p>
    </div>
  );
}

function TiktokConnect({ consent }: { consent: boolean }) {
  const startFn = useServerFn(startTiktokLink);
  const disconnectFn = useServerFn(disconnectTiktok);
  const listFn = useServerFn(getMyLinkedAccounts);
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Surface ?tiktok=connected | error from the OAuth callback redirect.
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const t = sp.get("tiktok");
    if (!t) return;
    if (t === "connected") setFlash({ ok: true, text: "TikTok connected." });
    else setFlash({ ok: false, text: `TikTok connection failed (${sp.get("reason") ?? t}).` });
    sp.delete("tiktok"); sp.delete("reason");
    const qs = sp.toString();
    window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["linked-accounts"],
    queryFn: () => listFn({}),
  });
  const tiktok = data?.accounts.find((a) => a.provider === "tiktok");

  const startMut = useMutation({
    mutationFn: () => startFn({ data: { redirectTo: "/me" } }),
    onSuccess: ({ url }) => { window.location.href = url; },
    onError: (e: Error) => setError(e.message),
  });

  const disconnectMut = useMutation({
    mutationFn: () => disconnectFn({}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["linked-accounts"] }),
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="mt-4 rounded-xl border border-border bg-background p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-foreground text-background">
            <Music2 className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-semibold">TikTok</div>
            <div className="truncate text-[11px] text-muted-foreground">
              {isLoading
                ? "Checking…"
                : tiktok
                ? `Connected as @${tiktok.username ?? tiktok.display_name ?? tiktok.provider_user_id}`
                : "Connect to let the AI learn from your favorites"}
            </div>
          </div>
        </div>

        {tiktok ? (
          <button
            onClick={() => disconnectMut.mutate()}
            disabled={disconnectMut.isPending}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            {disconnectMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unlink className="h-3 w-3" />}
            Disconnect
          </button>
        ) : (
          <button
            onClick={() => { setError(null); startMut.mutate(); }}
            disabled={!consent || startMut.isPending}
            title={!consent ? "Accept the data sharing terms first" : undefined}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            {startMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link2 className="h-3 w-3" />}
            Connect TikTok
          </button>
        )}
      </div>

      {flash && (
        <p className={`mt-2 inline-flex items-center gap-1.5 text-[11px] ${flash.ok ? "text-emerald-600" : "text-destructive"}`}>
          {flash.ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
          {flash.text}
        </p>
      )}
      {error && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-destructive">
          <AlertTriangle className="h-3 w-3" /> {error}
        </p>
      )}
    </div>
  );
}
