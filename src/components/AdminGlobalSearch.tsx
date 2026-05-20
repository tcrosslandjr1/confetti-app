import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarCheck,
  CornerDownLeft,
  Loader2,
  Search,
  Sparkles,
  Store,
  User,
  X,
} from "lucide-react";
import {
  adminGlobalSearch,
  type AdminSearchHit,
  type AdminSearchResults,
} from "@/lib/admin-search.functions";

type FlatHit = AdminSearchHit & { group: "Users" | "Events" | "Bookings" };

function flatten(results: AdminSearchResults | undefined): FlatHit[] {
  if (!results) return [];
  return [
    ...results.users.map((h) => ({ ...h, group: "Users" as const })),
    ...results.events.map((h) => ({ ...h, group: "Events" as const })),
    ...results.bookings.map((h) => ({ ...h, group: "Bookings" as const })),
  ];
}

function iconFor(type: AdminSearchHit["type"]) {
  switch (type) {
    case "user":
      return User;
    case "event":
      return Sparkles;
    case "booking":
      return CalendarCheck;
    default:
      return Store;
  }
}

export function AdminGlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const searchFn = useServerFn(adminGlobalSearch);

  const trimmed = query.trim();
  const enabled = open && trimmed.length >= 2;

  const { data, isFetching } = useQuery({
    queryKey: ["admin-global-search", trimmed],
    queryFn: () => searchFn({ data: { q: trimmed } }),
    enabled,
    staleTime: 15_000,
  });

  const flat = useMemo(() => flatten(data), [data]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  useEffect(() => {
    setActiveIdx(0);
  }, [trimmed]);

  const close = () => onOpenChange(false);

  const go = (hit: FlatHit) => {
    close();
    navigate({ to: hit.href as never });
  };

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (!flat.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => (i + 1) % flat.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => (i - 1 + flat.length) % flat.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const hit = flat[activeIdx];
        if (hit) go(hit);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, flat, activeIdx]);

  if (!open) return null;

  // Group hits with sticky group labels
  let runningIdx = -1;
  const grouped: { group: FlatHit["group"]; items: { hit: FlatHit; idx: number }[] }[] = [];
  for (const hit of flat) {
    runningIdx++;
    const last = grouped[grouped.length - 1];
    if (last && last.group === hit.group) {
      last.items.push({ hit, idx: runningIdx });
    } else {
      grouped.push({ group: hit.group, items: [{ hit, idx: runningIdx }] });
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] grid place-items-start bg-ink/40 px-4 pt-[10vh] backdrop-blur-sm"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Global admin search"
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border-2 border-ink bg-cream shadow-brut"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b-2 border-ink/10 px-3 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-ink/50" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users, events, bookings…"
            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-ink outline-none placeholder:text-ink/40"
            autoComplete="off"
            spellCheck={false}
          />
          {isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin text-ink/40" />
          ) : null}
          <button
            type="button"
            onClick={close}
            className="grid h-6 w-6 place-items-center rounded text-ink/50 hover:bg-ink/5 hover:text-ink"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {trimmed.length < 2 ? (
            <div className="px-4 py-10 text-center text-xs text-ink/50">
              Type at least 2 characters to search across users, events, and bookings.
            </div>
          ) : !data && isFetching ? (
            <div className="flex items-center justify-center px-4 py-10 text-xs text-ink/50">
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              Searching…
            </div>
          ) : flat.length === 0 ? (
            <div className="px-4 py-10 text-center text-xs text-ink/50">
              No results for <span className="font-bold text-ink">{trimmed}</span>
            </div>
          ) : (
            <div className="py-1">
              {grouped.map(({ group, items }) => (
                <div key={group}>
                  <div className="sticky top-0 z-10 bg-cream px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-ink/45">
                    {group}
                  </div>
                  {items.map(({ hit, idx }) => {
                    const Icon = iconFor(hit.type);
                    const active = idx === activeIdx;
                    return (
                      <button
                        key={`${hit.type}-${hit.id}`}
                        type="button"
                        onMouseEnter={() => setActiveIdx(idx)}
                        onClick={() => go(hit)}
                        className={`flex w-full items-center gap-3 px-3 py-2 text-left transition ${
                          active ? "bg-coral/15" : "hover:bg-ink/5"
                        }`}
                      >
                        <div
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border-2 border-ink ${
                            active ? "bg-coral text-cream" : "bg-cream text-ink"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-extrabold text-ink">
                            {hit.title}
                          </div>
                          {hit.subtitle ? (
                            <div className="truncate text-[10px] font-medium text-ink/55">
                              {hit.subtitle}
                            </div>
                          ) : null}
                        </div>
                        {active ? (
                          <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-ink/40" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t-2 border-ink/10 bg-cream/60 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-ink/45">
          <span className="flex items-center gap-2">
            <kbd className="rounded border border-ink/15 bg-cream px-1 py-0.5 text-ink/60">↑↓</kbd>
            Navigate
            <kbd className="rounded border border-ink/15 bg-cream px-1 py-0.5 text-ink/60">↵</kbd>
            Open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-ink/15 bg-cream px-1 py-0.5 text-ink/60">Esc</kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  );
}
