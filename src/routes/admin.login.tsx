import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Shield, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin sign in — Concierge" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If an admin is already signed in, send them to the console.
  useEffect(() => {
    if (loading) return;
    if (user && isAdmin) navigate({ to: "/admin" });
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
        throw new Error(
          "This account does not have admin access. Customers should sign in at /auth."
        );
      }
      navigate({ to: "/admin" });
    } catch (err: any) {
      setError(err?.message ?? "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-widest text-zinc-500 hover:text-zinc-200"
        >
          <ArrowLeft className="h-3 w-3" /> back to site
        </Link>

        <div className="mt-12 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-coral/40 bg-coral/10">
            <Shield className="h-5 w-5 text-coral" />
          </div>
          <div>
            <div className="font-display text-xl font-bold">Admin Console</div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
              Restricted · staff only
            </div>
          </div>
        </div>

        <h1 className="mt-10 font-display text-3xl font-bold leading-tight">
          Sign in to manage Loop.
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Venues, users, bookings, integrations. Admin accounts only.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-3">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@yourdomain.com"
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-4 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none ring-coral/40 focus:ring-2"
          />
          <input
            type="password"
            required
            minLength={6}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-4 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none ring-coral/40 focus:ring-2"
          />
          {error && (
            <p className="rounded-xl border border-red-900/50 bg-red-950/40 px-3 py-2 text-xs text-red-300">
              {error}
            </p>
          )}
          <button
            disabled={busy}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-coral py-4 text-sm font-semibold text-zinc-950 shadow-pop transition-pop active:scale-95 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign in to admin
          </button>
        </form>

        <p className="mt-6 text-xs text-zinc-500">
          Customer?{" "}
          <Link to="/auth" className="font-semibold text-zinc-200 underline">
            Use the regular sign-in
          </Link>
          .
        </p>

        <div className="mt-auto pt-10 text-center text-[11px] font-mono uppercase tracking-widest text-zinc-600">
          All admin actions are audit-logged.
        </div>
      </div>
    </div>
  );
}
