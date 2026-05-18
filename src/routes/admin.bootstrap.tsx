import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { Loader2, ShieldCheck, ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import { bootstrapAdmin } from "@/lib/admin-bootstrap.functions";

export const Route = createFileRoute("/admin/bootstrap")({
  head: () => ({
    meta: [
      { title: "Bootstrap admin — Confetti" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: BootstrapPage,
});

function BootstrapPage() {
  const run = useServerFn(bootstrapAdmin);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<
    | { kind: "ok"; userId: string }
    | { kind: "already" }
    | { kind: "missing" }
    | { kind: "error"; message: string }
    | null
  >(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const res = await run({ data: { email: email.trim() } });
      if (res.ok) setResult({ kind: "ok", userId: res.userId });
      else if (res.reason === "already_bootstrapped") setResult({ kind: "already" });
      else setResult({ kind: "missing" });
    } catch (err: any) {
      setResult({ kind: "error", message: err?.message ?? "Failed" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> back to site
        </Link>

        <div className="mt-12 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-primary/40 bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-display text-xl font-bold">Bootstrap admin</div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              One-time · self-disables
            </div>
          </div>
        </div>

        <h1 className="mt-10 font-display text-3xl font-bold leading-tight">
          Promote the first admin.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the email of an account that has already signed up. Once an admin exists, this
          page no longer grants access — subsequent calls are refused.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-3">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yourdomain.com"
            className="w-full rounded-2xl border border-border bg-card px-4 py-4 text-sm outline-none ring-primary/40 focus:ring-2"
          />
          <button
            disabled={busy || !email}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-semibold text-primary-foreground shadow-pop transition-pop active:scale-95 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Promote to admin
          </button>
        </form>

        {result?.kind === "ok" && (
          <div className="mt-6 flex items-start gap-2 rounded-xl border border-green-600/40 bg-green-500/10 px-3 py-3 text-sm text-green-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              Admin granted. Sign in at{" "}
              <Link to="/admin/login" className="font-semibold underline">
                /admin/login
              </Link>
              . This bootstrap page is now disabled.
            </div>
          </div>
        )}
        {result?.kind === "already" && (
          <div className="mt-6 flex items-start gap-2 rounded-xl border border-amber-600/40 bg-amber-500/10 px-3 py-3 text-sm text-amber-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>An admin already exists. Bootstrap is disabled.</div>
          </div>
        )}
        {result?.kind === "missing" && (
          <div className="mt-6 flex items-start gap-2 rounded-xl border border-amber-600/40 bg-amber-500/10 px-3 py-3 text-sm text-amber-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              No account found for that email. Sign up first at{" "}
              <Link to="/auth" className="font-semibold underline">
                /auth
              </Link>
              , then return here.
            </div>
          </div>
        )}
        {result?.kind === "error" && (
          <div className="mt-6 rounded-xl border border-red-600/40 bg-red-500/10 px-3 py-2 text-xs text-red-700">
            {result.message}
          </div>
        )}
      </div>
    </div>
  );
}
