import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const SearchParams = z.object({
  mode: z.enum(["signup", "login"]).optional(),
});

export const Route = createFileRoute("/business/signup")({
  validateSearch: (s) => SearchParams.parse(s),
  component: BusinessSignupPage,
  head: () => ({
    meta: [
      { title: "Create your business account — Confetti" },
      { name: "description", content: "Sign up to manage your venue on Confetti." },
    ],
  }),
});

function BusinessSignupPage() {
  const { mode = "signup" } = useSearch({ from: "/business/signup" });
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const isSignup = mode === "signup";

  async function handleGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/business/claim`,
    });
    if (result.error) {
      toast.error(result.error.message ?? "Google sign‑in failed");
      setBusy(false);
      return;
    }
    if (!result.redirected) navigate({ to: "/business/claim" });
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/business/claim` },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/business/claim" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Link to="/business" className="mb-8 text-sm text-muted-foreground hover:text-foreground">
        ← Back to Confetti for Business
      </Link>
      <h1 className="text-3xl font-bold tracking-tight">
        {isSignup ? "Create your business account" : "Welcome back"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {isSignup ? "Start your venue claim in under a minute." : "Sign in to manage your venue."}
      </p>

      <div className="mt-8 space-y-4">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogle}
          disabled={busy}
        >
          Continue with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <form onSubmit={handleEmail} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Business email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="manager@yourvenue.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {isSignup ? "Create account" : "Sign in"}
          </Button>
        </form>

        <p className="pt-2 text-center text-sm text-muted-foreground">
          {isSignup ? (
            <>
              Already have an account?{" "}
              <Link to="/business/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </>
          ) : (
            <>
              New to Confetti?{" "}
              <Link to="/business/signup" className="font-medium text-primary hover:underline">
                Create an account
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
