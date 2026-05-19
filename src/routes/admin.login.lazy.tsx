import { createLazyFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Shield, ArrowLeft, Mail, Lock, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createLazyFileRoute("/admin/login")({
  component: AdminLoginPage,
});

function AdminLoginPage() {
    const navigate = useNavigate();
    const { user, isAdmin, loading } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        if (loading)
            return;
        if (user && isAdmin)
            navigate({ to: "/admin" });
    }, [user, isAdmin, loading, navigate]);
    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setBusy(true);
        try {
            const { data, error: signErr } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });
            if (signErr)
                throw signErr;
            const uid = data.user?.id;
            if (!uid)
                throw new Error("Could not sign in");
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
            navigate({ to: "/admin" });
        }
        catch (err: any) {
            setError(err?.message ?? "Sign in failed");
        }
        finally {
            setBusy(false);
        }
    };
    return (<div className="min-h-screen bg-background text-foreground">
      {/* Soft warm wash to match the public site */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_20%_0%,hsl(var(--primary)/0.12),transparent_70%),radial-gradient(50%_40%_at_100%_20%,hsl(var(--accent)/0.10),transparent_70%)]"/>

      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">
        <Link to="/" className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-3 w-3"/> back to Confetti
        </Link>

        <div className="mt-12 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-vibe shadow-pop">
            <Sparkles className="h-5 w-5 text-primary-foreground"/>
          </div>
          <div>
            <div className="font-display text-xl font-bold leading-none">Confetti</div>
            <div className="mt-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Admin console
            </div>
          </div>
        </div>

        <div className="mt-10 inline-flex items-center gap-1.5 self-start rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
          <Shield className="h-3 w-3"/> Restricted · staff only
        </div>

        <h1 className="mt-4 font-display text-3xl font-bold leading-tight">
          Sign in to manage Confetti.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Venues, users, bookings, integrations. Admin accounts only.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-3">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@yourdomain.com" className="w-full rounded-2xl border border-border bg-card py-4 pl-11 pr-4 text-sm shadow-card outline-none ring-primary/40 transition focus:ring-2"/>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
            <input type="password" required minLength={6} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-2xl border border-border bg-card py-4 pl-11 pr-4 text-sm shadow-card outline-none ring-primary/40 transition focus:ring-2"/>
          </div>
          {error && (<p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>)}
          <button disabled={busy} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-semibold text-primary-foreground shadow-pop transition-pop hover:brightness-105 active:scale-95 disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin"/>}
            Sign in to admin
          </button>
        </form>

        <p className="mt-6 text-xs text-muted-foreground">
          Customer?{" "}
          <Link to="/auth" className="font-semibold text-foreground underline underline-offset-2">
            Use the regular sign-in
          </Link>
          .
        </p>

        <div className="mt-auto pt-10 text-center text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
          All admin actions are audit-logged.
        </div>
      </div>
    </div>);
}
