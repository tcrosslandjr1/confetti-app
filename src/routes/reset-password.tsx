import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — Confetti" },
      {
        name: "description",
        content: "Reset your Confetti account password securely.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [mode, setMode] = useState<"request" | "reset" | "success">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect recovery hash from Supabase password-reset redirect
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = new URLSearchParams(
      window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "",
    );
    const type = hash.get("type");
    if (type === "recovery") {
      setMode("reset");
      // Clean the hash so it doesn't persist on refresh
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const onRequestReset = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: reqErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (reqErr) throw reqErr;
      setMode("success");
    } catch (err: any) {
      setError(err?.message ?? "Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onUpdatePassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { error: updErr } = await supabase.auth.updateUser({ password });
      if (updErr) throw updErr;
      setMode("success");
    } catch (err: any) {
      setError(err?.message ?? "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-cream px-5 py-12">
      {/* Subtle background orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-gradient-vibe opacity-20 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,_oklch(0.78_0.18_60_/_0.35),_transparent_70%)] blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-display text-2xl font-bold text-ink hover:text-coral transition-colors"
          >
            <span className="inline-block h-8 w-8 rounded-lg bg-coral text-cream flex items-center justify-center text-lg">
              ★
            </span>
            Confetti
          </Link>
        </div>

        <div className="rounded-2xl border-2 border-ink bg-cream p-6 shadow-brut">
          {mode === "request" && (
            <>
              <h1 className="font-display text-2xl font-bold text-ink mb-2">Reset your password</h1>
              <p className="text-sm text-muted-foreground mb-6">
                Enter your email and we'll send you a link to create a new password.
              </p>

              <form onSubmit={onRequestReset} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="reset-email" className="text-sm font-medium text-ink">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="reset-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border-2 border-ink bg-cream pl-10 pr-4 py-3 text-sm text-ink placeholder:text-muted-foreground focus:border-coral focus:outline-none focus:ring-0 transition-colors"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full rounded-xl border-2 border-ink bg-coral px-4 py-3 text-sm font-bold text-cream shadow-brut transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>
            </>
          )}

          {mode === "reset" && (
            <>
              <h1 className="font-display text-2xl font-bold text-ink mb-2">Create new password</h1>
              <p className="text-sm text-muted-foreground mb-6">
                Enter a new password below. You'll be signed in automatically.
              </p>

              <form onSubmit={onUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="new-password" className="text-sm font-medium text-ink">
                    New password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="new-password"
                      type="password"
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full rounded-xl border-2 border-ink bg-cream pl-10 pr-4 py-3 text-sm text-ink placeholder:text-muted-foreground focus:border-coral focus:outline-none focus:ring-0 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirm-password" className="text-sm font-medium text-ink">
                    Confirm password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="confirm-password"
                      type="password"
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className="w-full rounded-xl border-2 border-ink bg-cream pl-10 pr-4 py-3 text-sm text-ink placeholder:text-muted-foreground focus:border-coral focus:outline-none focus:ring-0 transition-colors"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !password || !confirmPassword}
                  className="w-full rounded-xl border-2 border-ink bg-coral px-4 py-3 text-sm font-bold text-cream shadow-brut transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Updating…" : "Update password"}
                </button>
              </form>
            </>
          )}

          {mode === "success" && (
            <div className="text-center space-y-4 py-4">
              <CheckCircle className="mx-auto h-12 w-12 text-coral" />
              <h1 className="font-display text-2xl font-bold text-ink">
                {mode === "success" && !password ? "Check your email" : "Password updated"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {!password
                  ? "If an account exists with that email, you'll receive a password reset link shortly."
                  : "Your password has been updated successfully. You're all set."}
              </p>
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-cream px-6 py-3 text-sm font-bold text-ink shadow-brut transition-transform hover:-translate-y-0.5"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </div>
          )}

          {mode !== "success" && (
            <div className="mt-6 text-center">
              <Link
                to="/auth"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-ink transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
