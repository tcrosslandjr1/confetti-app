import { MapPin, Sparkles, DollarSign, Clock } from "lucide-react";

export type VenueCardData = {
  name?: string;
  neighborhood?: string;
  cuisine?: string;
  price?: string;
  vibe?: string;
  why?: string;
  book?: string;
  best_for?: string[];
};

export function VenueCard({ data }: { data: VenueCardData }) {
  if (!data?.name) return null;
  return (
    <div className="my-2 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="bg-gradient-vibe/10 flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <div className="truncate font-display text-base font-bold leading-tight">{data.name}</div>
          {(data.cuisine || data.neighborhood) && (
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              {data.neighborhood && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {data.neighborhood}
                </span>
              )}
              {data.cuisine && <span>· {data.cuisine}</span>}
            </div>
          )}
        </div>
        {data.price && (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground">
            {data.price}
          </span>
        )}
      </div>
      <div className="space-y-2 px-4 py-3 text-sm">
        {data.vibe && (
          <div className="flex items-start gap-2 text-muted-foreground">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="text-foreground/90">{data.vibe}</span>
          </div>
        )}
        {data.why && <p className="text-foreground/90">{data.why}</p>}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {data.best_for?.map((b) => (
            <span key={b} className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              {b}
            </span>
          ))}
        </div>
        {data.book && (
          <div className="mt-1 flex items-center gap-1.5 border-t border-border pt-2 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" /> {data.book}
          </div>
        )}
      </div>
    </div>
  );
}

/** Parse markdown into segments: text and venue cards. Handles streaming (incomplete blocks shown as text). */
export type Segment =
  | { kind: "text"; text: string }
  | { kind: "venue"; data: VenueCardData };

export function parseAssistantContent(content: string): Segment[] {
  if (!content) return [{ kind: "text", text: "" }];
  const segments: Segment[] = [];
  const re = /```venue\s*([\s\S]*?)```/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    if (m.index > last) segments.push({ kind: "text", text: content.slice(last, m.index) });
    try {
      const data = JSON.parse(m[1].trim()) as VenueCardData;
      segments.push({ kind: "venue", data });
    } catch {
      segments.push({ kind: "text", text: m[0] });
    }
    last = m.index + m[0].length;
  }
  // Trailing text — but suppress an incomplete ```venue block that's still streaming
  const tail = content.slice(last);
  const openIdx = tail.lastIndexOf("```venue");
  if (openIdx !== -1 && tail.indexOf("```", openIdx + 8) === -1) {
    if (openIdx > 0) segments.push({ kind: "text", text: tail.slice(0, openIdx) });
    // Skip the incomplete block while it streams in
  } else if (tail) {
    segments.push({ kind: "text", text: tail });
  }
  return segments;
}
