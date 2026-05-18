import { ArrowDownWideNarrow, ArrowUpWideNarrow, CalendarRange, Filter, X } from "lucide-react";

export type SortOrder = "newest" | "oldest";

export type DateRange = {
  from: string; // YYYY-MM-DD or ""
  to: string;
};

export type LogFilterState = {
  query: string;
  sort: SortOrder;
  range: DateRange;
};

export const EMPTY_FILTERS: LogFilterState = {
  query: "",
  sort: "newest",
  range: { from: "", to: "" },
};

type Props = {
  value: LogFilterState;
  onChange: (next: LogFilterState) => void;
  placeholder?: string;
  className?: string;
};

export function LogFilterBar({ value, onChange, placeholder = "Search…", className = "" }: Props) {
  const dirty =
    value.query.trim() !== "" ||
    value.sort !== "newest" ||
    value.range.from !== "" ||
    value.range.to !== "";

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <label className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs">
        <Filter className="h-3 w-3 text-muted-foreground" />
        <input
          value={value.query}
          onChange={(e) => onChange({ ...value, query: e.target.value })}
          placeholder={placeholder}
          className="w-44 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
        />
      </label>

      <label className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs">
        <CalendarRange className="h-3 w-3 text-muted-foreground" />
        <input
          type="date"
          value={value.range.from}
          onChange={(e) => onChange({ ...value, range: { ...value.range, from: e.target.value } })}
          className="bg-transparent text-xs outline-none"
          aria-label="From date"
        />
        <span className="text-muted-foreground">→</span>
        <input
          type="date"
          value={value.range.to}
          onChange={(e) => onChange({ ...value, range: { ...value.range, to: e.target.value } })}
          className="bg-transparent text-xs outline-none"
          aria-label="To date"
        />
      </label>

      <button
        type="button"
        onClick={() => onChange({ ...value, sort: value.sort === "newest" ? "oldest" : "newest" })}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:border-ink"
        title={`Sort: ${value.sort}`}
      >
        {value.sort === "newest" ? (
          <ArrowDownWideNarrow className="h-3 w-3" />
        ) : (
          <ArrowUpWideNarrow className="h-3 w-3" />
        )}
        {value.sort === "newest" ? "Newest first" : "Oldest first"}
      </button>

      {dirty && (
        <button
          type="button"
          onClick={() => onChange(EMPTY_FILTERS)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:border-ink hover:text-ink"
        >
          <X className="h-3 w-3" /> Reset
        </button>
      )}
    </div>
  );
}

/** Apply search + date-range + sort to a list of dated rows. */
export function applyLogFilters<T>(
  rows: T[],
  filters: LogFilterState,
  opts: {
    getDate: (row: T) => string; // ISO
    getText: (row: T) => string;
  },
): T[] {
  const q = filters.query.trim().toLowerCase();
  const fromTs = filters.range.from ? new Date(filters.range.from + "T00:00:00").getTime() : null;
  const toTs = filters.range.to ? new Date(filters.range.to + "T23:59:59").getTime() : null;

  const filtered = rows.filter((r) => {
    if (q && !opts.getText(r).toLowerCase().includes(q)) return false;
    if (fromTs !== null || toTs !== null) {
      const t = new Date(opts.getDate(r)).getTime();
      if (Number.isNaN(t)) return false;
      if (fromTs !== null && t < fromTs) return false;
      if (toTs !== null && t > toTs) return false;
    }
    return true;
  });

  return filtered.sort((a, b) => {
    const ta = new Date(opts.getDate(a)).getTime();
    const tb = new Date(opts.getDate(b)).getTime();
    return filters.sort === "newest" ? tb - ta : ta - tb;
  });
}
