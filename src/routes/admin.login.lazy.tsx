import { createLazyFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Shield, ArrowLeft, Mail, Lock, Sparkles, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createLazyFileRoute("/admin/login")({
  component: AdminLoginPage,
});

type Step = "credentials" | "pin" | "set-pin";

function AdminLoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const destination = redirect ?? "/admin";
  const { user, isAdmin, loading } = useAuth();

  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already signed in & admin AND we're not mid-PIN flow, send through.
  useEffect(() => {
    if (loading || step !== "credentials") return;
    if (user && isAdmin) {
      // Check pin status before auto-bouncing
      void (async () => {
        const { data, error: rpcErr } = await supabase.rpc("admin_pin_status");
        if (rpcErr) return;
        const row = Array.isArray(data) ? data[0] : data;
        if (row?.has_pin) setStep("pin");
        else setStep("set-pin");
      })();
    }
  }, [user, isAdmin, loading, step]);

  const submitCredentials = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { data, error: signErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signErr) throw signErr;
      const uid = data.user?.id;
      if (!uid) throw new Error("Could not sign in");
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .eq("role", "admin")
        .maybeSingle();
      if (!roleRow) {
        await supabase.auth.signOut();
        throw new Error("This account does not have admin access. Customers should sign in at /auth.");
      }
      const { data: statusData, error: statusErr } = await supabase.rpc("admin_pin_status");
      if (statusErr) throw statusErr;
      const row = Array.isArray(statusData) ? statusData[0] : statusData;
      setStep(row?.has_pin ? "pin" : "set-pin");
    } catch (err: any) {
      setError(err?.message ?? "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  const submitPin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (!/^[0-9]{4,8}$/.test(pin)) throw new Error("PIN must be 4–8 digits.");
      const { data, error: rpcErr } = await supabase.rpc("verify_admin_pin", { _pin: pin });
      if (rpcErr) {
        const msg = rpcErr.message || "";
        if (msg.includes("locked")) throw new Error("Too many attempts. Locked for 15 minutes.");
        if (msg.includes("no_pin_set")) {
          setStep("set-pin");
          return;
        }
        throw rpcErr;
      }
      if (!data) throw new Error("Incorrect PIN.");
      navigate({ to: destination as never, replace: true });
    } catch (err: any) {
      setError(err?.message ?? "PIN check failed");
    } finally {
      setBusy(false);
    }
  };

  const submitSetPin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (!/^[0-9]{4,8}$/.test(pin)) throw new Error("PIN must be 4–8 digits.");
      if (pin !== pinConfirm) throw new Error("PINs do not match.");
      const { error: rpcErr } = await supabase.rpc("set_admin_pin", { _new_pin: pin });
      if (rpcErr) throw rpcErr;
      navigate({ to: destination as never, replace: true });
    } catch (err: any) {
      setError(err?.message ?? "Could not set PIN");
    } finally {
      setBusy(false);
    }
  };

  const cancelPin = async () => {
    await supabase.auth.signOut();
    setStep("credentials");
    setPin("");
    setPinConfirm("");
    setPassword("");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_20%_0%,hsl(var(--primary)/0.12),transparent_70%),radial-gradient(50%_40%_at_100%_20%,hsl(var(--accent)/0.10),transparent_70%)]" />

      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">
        <Link to="/" className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> back to Confetti
        </Link>

        <div className="mt-12 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-vibe shadow-pop">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display text-xl font-bold leading-none">Confetti</div>
            <div className="mt-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Admin console
            </div>
          </div>
        </div>

        <div className="mt-10 inline-flex items-center gap-1.5 self-start rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
          <Shield className="h-3 w-3" />
          {step === "credentials" ? "Restricted · staff only" : step === "pin" ? "Step 2 · PIN" : "Set your admin PIN"}
        </div>

        {step === "credentials" && (
          <>
            <h1 className="mt-4 font-display text-3xl font-bold leading-tight">Sign in to manage Confetti.</h1>
            <p className="mt-2 text-sm text-muted-foreground">Venues, users, bookings, integrations. Admin accounts only.</p>
            <form onSubmit={submitCredentials} className="mt-8 space-y-3">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@yourdomain.com" className="w-full rounded-2xl border border-border bg-card py-4 pl-11 pr-4 text-sm shadow-card outline-none ring-primary/40 transition focus:ring-2" />
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="password" required minLength={6} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-2xl border border-border bg-card py-4 pl-11 pr-4 text-sm shadow-card outline-none ring-primary/40 transition focus:ring-2" />
              </div>
              {error && <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
              <button disabled={busy} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-semibold text-primary-foreground shadow-pop transition-pop hover:brightness-105 active:scale-95 disabled:opacity-60">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Continue
              </button>
            </form>
          </>
        )}

        {step === "pin" && (
          <>
            <h1 className="mt-4 font-display text-3xl font-bold leading-tight">Enter your admin PIN.</h1>
            <p className="mt-2 text-sm text-muted-foreground">Second factor for admin access. 5 wrong attempts locks for 15 minutes.</p>
            <form onSubmit={submitPin} className="mt-8 space-y-3">
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="password" required inputMode="numeric" pattern="[0-9]{4,8}" maxLength={8} autoComplete="one-time-code" value={pin} onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ""))} placeholder="PIN (4–8 digits)" className="w-full rounded-2xl border border-border bg-card py-4 pl-11 pr-4 text-sm tracking-[0.4em] shadow-card outline-none ring-primary/40 transition focus:ring-2" autoFocus />
              </div>
              {error && <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
              <button disabled={busy} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-semibold text-primary-foreground shadow-pop transition-pop hover:brightness-105 active:scale-95 disabled:opacity-60">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Verify PIN
              </button>
              <button type="button" onClick={cancelPin} className="w-full py-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground">Sign out</button>
            </form>
          </>
        )}

        {step === "set-pin" && (
          <>
            <h1 className="mt-4 font-display text-3xl font-bold leading-tight">Set your admin PIN.</h1>
            <p className="mt-2 text-sm text-muted-foreground">Choose a 4–8 digit PIN. You'll need it every time you sign in.</p>
            <form onSubmit={submitSetPin} className="mt-8 space-y-3">
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="password" required inputMode="numeric" pattern="[0-9]{4,8}" maxLength={8} value={pin} onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ""))} placeholder="New PIN (4–8 digits)" className="w-full rounded-2xl border border-border bg-card py-4 pl-11 pr-4 text-sm tracking-[0.4em] shadow-card outline-none ring-primary/40 transition focus:ring-2" autoFocus />
              </div>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="password" required inputMode="numeric" pattern="[0-9]{4,8}" maxLength={8} value={pinConfirm} onChange={(e) => setPinConfirm(e.target.value.replace(/[^0-9]/g, ""))} placeholder="Confirm PIN" className="w-full rounded-2xl border border-border bg-card py-4 pl-11 pr-4 text-sm tracking-[0.4em] shadow-card outline-none ring-primary/40 transition focus:ring-2" />
              </div>
              {error && <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
              <button disabled={busy} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-semibold text-primary-foreground shadow-pop transition-pop hover:brightness-105 active:scale-95 disabled:opacity-60">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save PIN & continue
              </button>
              <button type="button" onClick={cancelPin} className="w-full py-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground">Sign out</button>
            </form>
          </>
        )}

        <p className="mt-6 text-xs text-muted-foreground">
          Customer?{" "}
          <Link to="/auth" className="font-semibold text-foreground underline underline-offset-2">
            Use the regular sign-in
          </Link>.
        </p>

        <div className="mt-auto pt-10 text-center text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
          All admin actions are audit-logged.
        </div>
      </div>
    </div>
  );
}
