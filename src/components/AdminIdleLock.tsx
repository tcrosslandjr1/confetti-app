import { useEffect, useRef, useState } from "react";
import { Lock, Timer } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { logPinIdleLock } from "@/lib/admin-audit.functions";

const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const WARNING_THRESHOLD_MS = 30 * 1000; // warn 30s before lock

const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keypress",
  "keydown",
  "scroll",
  "touchstart",
  "click",
  "wheel",
];

export function AdminIdleLock({
  onLock,
  email,
}: {
  onLock: () => void;
  email?: string | null;
}) {
  const [warningVisible, setWarningVisible] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const lastActivityRef = useRef(Date.now());
  const lockTriggeredRef = useRef(false);
  const logIdleLockFn = useServerFn(logPinIdleLock);

  // Bump activity timestamp on any user interaction
  useEffect(() => {
    const bump = () => {
      lastActivityRef.current = Date.now();
      if (warningVisible) {
        setWarningVisible(false);
      }
    };
    ACTIVITY_EVENTS.forEach((e) => document.addEventListener(e, bump, { passive: true }));
    return () => {
      ACTIVITY_EVENTS.forEach((e) => document.removeEventListener(e, bump));
    };
  }, [warningVisible]);

  // Main idle checker — runs every second
  useEffect(() => {
    const id = window.setInterval(() => {
      const idleMs = Date.now() - lastActivityRef.current;
      const timeLeft = Math.ceil((IDLE_TIMEOUT_MS - idleMs) / 1000);

      if (idleMs >= IDLE_TIMEOUT_MS) {
        if (!lockTriggeredRef.current) {
          lockTriggeredRef.current = true;
          // Log the idle lock event (best-effort)
          try {
            void logIdleLockFn({
              data: {
                userAgent:
                  typeof window !== "undefined" ? window.navigator.userAgent : undefined,
              },
            });
          } catch {
            /* noop */
          }
          onLock();
        }
        return;
      }

      const shouldWarn = idleMs > IDLE_TIMEOUT_MS - WARNING_THRESHOLD_MS;
      if (shouldWarn) {
        setWarningVisible(true);
        setSecondsRemaining(Math.max(0, timeLeft));
      } else {
        setWarningVisible(false);
      }
    }, 1000);

    return () => window.clearInterval(id);
  }, [onLock, logIdleLockFn]);

  const handleStayActive = () => {
    lastActivityRef.current = Date.now();
    setWarningVisible(false);
  };

  if (!warningVisible) return null;

  const urgent = secondsRemaining <= 10;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[90] animate-in slide-in-from-bottom-2 duration-300"
      role="alert"
      aria-live="polite"
    >
      <div
        className={`mx-auto mb-4 flex max-w-lg items-center gap-3 rounded-2xl border-2 px-4 py-3 shadow-brut backdrop-blur transition-colors ${
          urgent
            ? "border-coral bg-coral/15"
            : "border-ink bg-cream/95"
        }`}
      >
        <div
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border-2 ${
            urgent
              ? "border-coral bg-coral text-cream"
              : "border-ink bg-cream text-ink"
          }`}
        >
          {urgent ? (
            <Lock className="h-4 w-4" strokeWidth={2.5} />
          ) : (
            <Timer className="h-4 w-4" strokeWidth={2.5} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-extrabold text-ink">
            Console will lock in{" "}
            <span
              className={`font-mono ${
                urgent ? "text-coral" : "text-ink"
              }`}
            >
              {secondsRemaining}s
            </span>
          </div>
          <div className="text-[10px] font-medium text-ink/60">
            Due to inactivity. Move mouse or press any key to stay active.
          </div>
        </div>
        <button
          type="button"
          onClick={handleStayActive}
          className="shrink-0 rounded-xl border-2 border-ink bg-coral px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-cream shadow-brut transition hover:translate-y-[1px] hover:shadow-none"
        >
          Stay active
        </button>
      </div>
    </div>
  );
}
