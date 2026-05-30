import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { verifyAdminPin } from "@/lib/admin-pin.functions";

const PIN_KEY = "confetti.admin.pinOk";

/**
 * Shared admin PIN gate.
 *
 * Verifies the PIN server-side via the `verify_admin_pin` Supabase RPC.
 * On success, sets a sessionStorage flag so the user doesn't have to
 * re-enter the PIN on every navigation within the same session.
 */
export function AdminPinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const submit = async () => {
    if (loading || pin.length < 4) return;
    setLoading(true);
    setError(false);

    try {
      const result = await verifyAdminPin({ data: { pin } });
      if (result.verified) {
        sessionStorage.setItem(PIN_KEY, "1");
        onUnlock();
      } else {
        setError(true);
        setPin("");
      }
    } catch {
      setError(true);
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border-2 border-border bg-card p-8 text-center shadow-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-primary/10">
          <Lock className="h-7 w-7 text-primary" />
        </div>
        <h1 className="font-display text-2xl font-black tracking-tight">Admin Verification</h1>
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) => {
              setError(false);
              setPin(e.target.value.replace(/\D/g, ""));
            }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="••••••"
            className={`w-full rounded-xl border-2 bg-muted/30 px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] focus:outline-none ${
              error ? "border-destructive" : "border-border focus:border-primary"
            }`}
            disabled={loading}
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {error && <p className="text-sm font-bold text-destructive">Wrong PIN</p>}
        <button
          onClick={submit}
          disabled={pin.length < 4 || loading}
          className="w-full rounded-xl bg-primary px-4 py-3 font-mono text-sm font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-40"
        >
          {loading ? "Verifying…" : "Unlock"}
        </button>
      </div>
    </div>
  );
}

/** Check if the admin PIN was already verified this session. */
export function isAdminPinVerified(): boolean {
  try {
    return sessionStorage.getItem(PIN_KEY) === "1";
  } catch {
    return false;
  }
}
