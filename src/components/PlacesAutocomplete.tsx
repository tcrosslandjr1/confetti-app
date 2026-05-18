import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Loader2, MapPin, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export type PlaceDetails = {
  placeId: string;
  name: string | null;
  formattedAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  neighborhood: string | null;
  websiteUri: string | null;
  googleMapsUri: string | null;
  phone: string | null;
  types: string[];
};

type Suggestion = {
  placeId: string;
  primaryText: string;
  secondaryText: string;
  fullText: string;
  types: string[];
};

type Props = {
  value: string;
  onChange: (text: string) => void;
  /** Called when a suggestion is picked. Receives full place details (geocoded). */
  onSelect?: (place: PlaceDetails) => void;
  placeholder?: string;
  /** Restrict to a place type: 'establishment' for venues, 'geocode' for addresses, etc. */
  types?: string[];
  /** ISO 3166-1 alpha-2 country code (e.g. 'us'). */
  country?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  /** Show a leading map-pin icon (true) or search icon (false). */
  variant?: "venue" | "address";
};

/** Generate a Google Places session token (UUID v4). */
function newSessionToken() {
  return crypto.randomUUID();
}

/**
 * Reusable Google Places autocomplete input.
 * Calls the `google-places` edge function for autocomplete + details
 * so the API key stays server-side.
 */
export function PlacesAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  types,
  country,
  className = "",
  disabled,
  id,
  variant = "venue",
}: Props) {
  const reactId = useId();
  const inputId = id ?? `places-${reactId}`;
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const sessionTokenRef = useRef<string>(newSessionToken());
  const wrapRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchSuggestions = useCallback(
    async (input: string) => {
      if (!input || input.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("google-places", {
          body: {
            autocomplete: {
              input,
              sessionToken: sessionTokenRef.current,
              types,
              country,
            },
          },
        });
        if (ctrl.signal.aborted) return;
        if (error) {
          setSuggestions([]);
          return;
        }
        setSuggestions((data?.suggestions as Suggestion[]) ?? []);
        setActiveIdx(0);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    },
    [types, country],
  );

  // Debounce input → suggestions
  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(() => fetchSuggestions(value), 220);
    return () => clearTimeout(handle);
  }, [value, open, fetchSuggestions]);

  // Outside click closes
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const pick = useCallback(
    async (s: Suggestion) => {
      onChange(s.primaryText || s.fullText);
      setOpen(false);
      setSuggestions([]);
      if (!onSelect) {
        sessionTokenRef.current = newSessionToken();
        return;
      }
      setResolving(true);
      try {
        const { data } = await supabase.functions.invoke("google-places", {
          body: {
            details: { placeId: s.placeId, sessionToken: sessionTokenRef.current },
          },
        });
        if (data && !data.error) {
          onSelect(data as PlaceDetails);
        }
      } finally {
        setResolving(false);
        sessionTokenRef.current = newSessionToken(); // new session after a selection
      }
    },
    [onChange, onSelect],
  );

  const Icon = variant === "venue" ? MapPin : Search;

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-within:ring-2 focus-within:ring-ring">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          id={inputId}
          type="text"
          value={value}
          disabled={disabled || resolving}
          placeholder={
            placeholder ?? (variant === "venue" ? "Search a venue…" : "Search an address…")
          }
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!open) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIdx((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter") {
              if (suggestions[activeIdx]) {
                e.preventDefault();
                pick(suggestions[activeIdx]);
              }
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${inputId}-list`}
        />
        {(loading || resolving) && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {!loading && !resolving && value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setSuggestions([]);
            }}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Clear"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && suggestions.length > 0 && (
        <ul
          id={`${inputId}-list`}
          role="listbox"
          className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-md border border-border bg-popover p-1 text-sm shadow-lg"
        >
          {suggestions.map((s, i) => (
            <li key={s.placeId} role="option" aria-selected={i === activeIdx}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // keep focus in input
                  pick(s);
                }}
                onMouseEnter={() => setActiveIdx(i)}
                className={`flex w-full items-start gap-2 rounded px-2 py-2 text-left transition ${
                  i === activeIdx ? "bg-accent text-accent-foreground" : "hover:bg-accent/60"
                }`}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex flex-col">
                  <span className="font-medium leading-tight">{s.primaryText}</span>
                  {s.secondaryText && (
                    <span className="text-xs text-muted-foreground leading-tight">
                      {s.secondaryText}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PlacesAutocomplete;
