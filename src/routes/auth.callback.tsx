import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase's detectSessionInUrl:true picks up the token/code from the URL
    // automatically. We just wait for the SIGNED_IN event then send them in.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        subscription.unsubscribe();
        navigate({ to: "/app", replace: true });
      }
    });

    // Fallback: if already signed in or no event fires in 3s, redirect anyway
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        subscription.unsubscribe();
        navigate({ to: "/app", replace: true });
      }
    });

    const t = setTimeout(() => {
      subscription.unsubscribe();
      navigate({ to: "/app", replace: true });
    }, 3000);

    return () => {
      clearTimeout(t);
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-mocha-dark">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-cream/20 border-t-coral" />
        <p className="font-mono text-xs uppercase tracking-widest text-cream/50">Signing you in…</p>
      </div>
    </div>
  );
}
