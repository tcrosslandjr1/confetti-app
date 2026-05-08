import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { seedDemoAccounts } from "@/lib/seed-demo.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Concierge" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState<string | null>(null);
  const seedFn = useServerFn(seedDemoAccounts);

  const fillDemo = (which: "admin" | "customer") => {
    setMode("signin");
    setEmail(which === "admin" ? "admin@demo.local" : "customer@demo.local");
    setPassword("Demo1234!");
  };

  const onSeed = async () => {
    setSeeding(true);
    setSeedMsg(null);
    try {
      await seedFn({});
      setSeedMsg("Demo accounts ready. Click Admin or Customer below to fill the form.");
    } catch (e: any) {
      setSeedMsg(e?.message ?? "Seed failed");
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/" });
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 -z-10 opacity-40 [background:radial-gradient(circle_at_top,_oklch(0.72_0.21_355_/_0.4),_transparent_60%)]" />
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-vibe shadow-pop">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display text-lg font-bold leading-none">
              <span className="text-gradient">Concierge</span>
            </div>
            <div className="text-xs text-muted-foreground">Your DMV insider</div>
          </div>
        </div>

        <div className="mt-12">
          <h1 className="font-display text-3xl font-bold leading-tight">
            {mode === "signup" ? "Get your personal\nguide to the DMV" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signup"
              ? "Dining, nightlife, and curated experiences picked for your taste."
              : "Pick up where you left off."}
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-3">
          {mode === "signup" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-2xl border border-border bg-card px-4 py-4 text-sm outline-none ring-ring/30 focus:ring-2"
            />
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-2xl border border-border bg-card px-4 py-4 text-sm outline-none ring-ring/30 focus:ring-2"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-2xl border border-border bg-card px-4 py-4 text-sm outline-none ring-ring/30 focus:ring-2"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <button
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-vibe py-4 text-sm font-semibold text-primary-foreground shadow-pop transition-pop active:scale-95 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
          className="mt-6 text-center text-sm text-muted-foreground"
        >
          {mode === "signin" ? "Don't have an account? " : "Already have one? "}
          <span className="font-semibold text-foreground">
            {mode === "signin" ? "Sign up" : "Sign in"}
          </span>
        </button>

        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Wand2 className="h-3.5 w-3.5" /> Dev quick start
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            One-click seed two demo accounts so you can test the admin and customer views.
          </p>
          <button
            type="button"
            onClick={onSeed}
            disabled={seeding}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background py-2.5 text-xs font-semibold transition hover:bg-accent disabled:opacity-60"
          >
            {seeding && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {seeding ? "Creating…" : "Seed demo accounts"}
          </button>
          {seedMsg && <p className="mt-2 text-xs text-muted-foreground">{seedMsg}</p>}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemo("admin")}
              className="rounded-xl bg-primary/10 py-2 text-xs font-semibold text-primary hover:bg-primary/20"
            >
              Use Admin
            </button>
            <button
              type="button"
              onClick={() => fillDemo("customer")}
              className="rounded-xl bg-secondary py-2 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80"
            >
              Use Customer
            </button>
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Password for both: <span className="font-mono">Demo1234!</span>
          </p>
        </div>

        <div className="mt-auto pt-10 text-center text-xs text-muted-foreground">
          By continuing you agree to our terms.{" "}
          <Link to="/events" className="underline">Browse events</Link>
        </div>
      </div>
    </div>
  );
}
