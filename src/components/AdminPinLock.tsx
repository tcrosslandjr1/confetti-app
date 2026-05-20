import { useEffect, useRef, useState, type FormEvent } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { logPinUnlockAttempt } from "@/lib/admin-audit.functions";

// Hardcoded console PIN. Note: this is a UX gate on the admin shell — it is
// NOT a security boundary. RLS + the `admin` role still gate all real data
// access on the server. The PIN keeps the console from rendering if someone
// walks up to an unlocked, signed-in laptop.
const ADMIN_PIN = "236166";
const PIN_LENGTH = ADMIN_PIN.length;
const UNLOCK_KEY = "confetti.admin.pin.unlocked.v1";
const LOCKOUT_KEY = "confetti.admin.pin.lockout.v1";
const MAX_ATTEMPTS = 5;
// Progressive backoff: 1st lockout 5min, 2nd 10min, 3rd+ 15min
const LOCKOUT_LADDER_MS = [5, 10, 15].map((m) => m * 60_000);

type LockoutState = {
  attempts: number;
  lockoutCount: number;
  lockedUntil: number; // epoch ms, 0 = not locked
};

function readLockout(): LockoutState {
  if (typeof window === "undefined") return { attempts: 0, lockoutCount: 0, lockedUntil: 0 };
  try {
    const raw = window.localStorage.getItem(LOCKOUT_KEY);
    if (!raw) return { attempts: 0, lockoutCount: 0, lockedUntil: 0 };
    const parsed = JSON.parse(raw) as LockoutState;
    return {
      attempts: Number(parsed.attempts) || 0,
      lockoutCount: Number(parsed.lockoutCount) || 0,
      lockedUntil: Number(parsed.lockedUntil) || 0,
    };
  } catch {
    return { attempts: 0, lockoutCount: 0, lockedUntil: 0 };
  }
}

function writeLockout(state: LockoutState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCKOUT_KEY, JSON.stringify(state));
  } catch {
    /* noop */
  }
}

export function isAdminUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(UNLOCK_KEY) === "1";
  } catch {
    return false;
  }
}

export function lockAdmin() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(UNLOCK_KEY);
  } catch {
    /* noop */
  }
}

export function AdminPinLock({
  email,
  onUnlock,
}: {
  email?: string | null;
  onUnlock: () => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const logPinFn = useServerFn(logPinUnlockAttempt);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = async (value: string) => {
    if (value.length !== PIN_LENGTH) return;
    const nextAttempt = attempts + 1;
    const success = value === ADMIN_PIN;

    // Log every attempt (success or failure)
    try {
      await logPinFn({
        data: {
          success,
          attemptNumber: nextAttempt,
          ip: typeof window !== "undefined" ? undefined : undefined,
          userAgent: typeof window !== "undefined" ? window.navigator.userAgent : undefined,
        },
      });
    } catch {
      // Don't block unlock if audit logging fails
    }

    if (success) {
      try {
        window.sessionStorage.setItem(UNLOCK_KEY, "1");
      } catch {
        /* noop */
      }
      setError(null);
      onUnlock();
      return;
    }
    setAttempts(nextAttempt);
    setError("Incorrect PIN. Try again.");
    setShake(true);
    setPin("");
    window.setTimeout(() => setShake(false), 400);
    inputRef.current?.focus();
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(pin);
  };

  const onChange = (raw: string) => {
    const cleaned = raw.replace(/\D/g, "").slice(0, PIN_LENGTH);
    setPin(cleaned);
    setError(null);
    if (cleaned.length === PIN_LENGTH) {
      // Auto-submit on full PIN
      submit(cleaned);
    }
  };

  const dots = Array.from({ length: PIN_LENGTH }, (_, i) => i < pin.length);

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-gradient-to-br from-cream via-background to-cream/60 px-4">
      {/* Decorative orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 h-[400px] w-[400px] rounded-full bg-coral/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-gold/30 blur-3xl"
      />

      <form
        onSubmit={onSubmit}
        className={`relative w-full max-w-sm space-y-6 rounded-3xl border-2 border-ink bg-cream/95 p-7 shadow-brut backdrop-blur ${
          shake ? "animate-[wiggle_0.35s_ease-in-out]" : ""
        }`}
      >
        <style>{`@keyframes wiggle{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}`}</style>

        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl border-2 border-ink bg-gradient-to-br from-coral via-orange-400 to-gold text-cream shadow-brut">
            <Lock className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink/55">
              Admin · Locked
            </div>
            <h1 className="font-display text-xl font-extrabold leading-tight tracking-tight text-ink">
              Enter console PIN
            </h1>
          </div>
        </div>

        {email ? (
          <div className="flex items-center gap-2 rounded-xl border border-ink/10 bg-cream px-3 py-2">
            <ShieldCheck className="h-4 w-4 text-coral" />
            <div className="min-w-0 flex-1 truncate text-xs font-bold text-ink">{email}</div>
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-ink/55">
              Signed in
            </span>
          </div>
        ) : null}

        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2">
            {dots.map((filled, i) => (
              <span
                key={i}
                className={`h-3.5 w-3.5 rounded-full border-2 border-ink transition-all ${
                  filled ? "scale-110 bg-coral" : "bg-cream"
                }`}
              />
            ))}
          </div>

          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            value={pin}
            onChange={(e) => onChange(e.target.value)}
            aria-label="Admin PIN"
            placeholder="• • • • • •"
            className="w-full rounded-xl border-2 border-ink bg-cream px-4 py-3 text-center font-mono text-xl tracking-[0.5em] text-ink outline-none placeholder:text-ink/25 focus:border-coral focus:shadow-brut"
          />

          {error ? (
            <p className="text-center text-xs font-bold text-coral" role="alert">
              {error}
              {attempts >= 3 ? " · Sign out if this isn't you." : ""}
            </p>
          ) : (
            <p className="text-center font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45">
              Six-digit code · auto submits
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={pin.length !== PIN_LENGTH}
          className="w-full rounded-xl border-2 border-ink bg-coral px-4 py-3 text-sm font-extrabold uppercase tracking-wide text-cream shadow-brut transition hover:translate-y-[1px] hover:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          Unlock console
        </button>

        <p className="text-center font-mono text-[9px] uppercase tracking-[0.18em] text-ink/40">
          Console stays unlocked until this tab closes
        </p>
      </form>
    </div>
  );
}
