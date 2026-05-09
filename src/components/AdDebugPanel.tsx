import { useEffect, useState } from "react";
import { isAdDebugEnabled, subscribeAdDebug, type AdDebugEvent } from "@/lib/ad-debug";
import { Eye, X } from "lucide-react";

const MAX = 30;

function fmt(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, "0")}`;
}

export function AdDebugPanel() {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(true);
  const [events, setEvents] = useState<AdDebugEvent[]>([]);

  useEffect(() => {
    setEnabled(isAdDebugEnabled());
  }, []);

  useEffect(() => {
    if (!enabled) return;
    return subscribeAdDebug((e) => {
      setEvents((prev) => [e, ...prev].slice(0, MAX));
    });
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="pointer-events-auto fixed bottom-3 left-3 z-[9999] w-[340px] max-w-[calc(100vw-1.5rem)] rounded-xl border-2 border-foreground/20 bg-background/95 font-mono text-[11px] shadow-pop backdrop-blur">
      <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-widest">
          <Eye className="h-3.5 w-3.5" /> Ad debug
          <span className="ml-1 rounded bg-foreground/10 px-1.5 py-0.5 normal-case text-[10px] tracking-normal text-muted-foreground">
            {events.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setEvents([])}
            className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted"
          >
            clear
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted"
          >
            {open ? "hide" : "show"}
          </button>
          <button
            onClick={() => {
              window.localStorage.removeItem("confetti.debugAds");
              setEnabled(false);
            }}
            aria-label="Disable debug"
            className="rounded px-1 py-0.5 text-muted-foreground hover:bg-muted"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </header>
      {open && (
        <ul className="max-h-72 overflow-y-auto">
          {events.length === 0 && (
            <li className="px-3 py-3 text-muted-foreground">
              Waiting for impressions… scroll the marquee or interact with the page.
            </li>
          )}
          {events.map((e, i) => (
            <li
              key={i}
              className="grid grid-cols-[auto_1fr] gap-x-2 border-b border-border/50 px-3 py-1.5 last:border-b-0"
            >
              <span className="text-muted-foreground">{fmt(e.ts)}</span>
              <span className="truncate font-bold text-foreground">slot:{e.slot}</span>
              <span className="text-muted-foreground">{e.surface}</span>
              <span className="truncate text-foreground/80">
                {e.brand} · <span className="italic text-muted-foreground">{e.occasion}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      <footer className="border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground">
        toggle: <code>?debug=ads</code> / <code>?debug=ads-off</code>
      </footer>
    </div>
  );
}
