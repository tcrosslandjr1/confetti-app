import { Share2, Send, Globe2, CalendarPlus, Download } from "lucide-react";

/**
 * What a user can do AFTER a plan is generated.
 * Mirrors docs/agents/confetti-plan-share-flow.md.
 */
export function PlanShareFlow() {
  return (
    <section className="border-b border-border bg-muted/30">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center gap-2">
          <Share2 className="h-4 w-4 text-primary" />
          <span className="font-display text-sm font-bold">After your plan is generated</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Action
            title="Share privately"
            icon={<Send className="h-4 w-4" />}
            rows={[["Send to", "Friends, partner, group chat"]]}
          />
          <Action
            title="Post publicly"
            icon={<Globe2 className="h-4 w-4" />}
            rows={[["Others can", "Like, remix, save, or ask to join"]]}
          />
          <Action
            title="Create invite"
            icon={<CalendarPlus className="h-4 w-4" />}
            rows={[["Includes", "Date, time, city, budget, dress code, RSVP"]]}
          />
          <Action
            title="Export"
            icon={<Download className="h-4 w-4" />}
            rows={[["Formats", "IG story, TikTok caption, text, calendar link"]]}
          />
        </div>
      </div>
    </section>
  );
}

function Action({
  title,
  icon,
  rows,
}: {
  title: string;
  icon: React.ReactNode;
  rows: [string, string][];
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-foreground">
        {icon}
        <span className="font-display text-sm font-bold">{title}</span>
      </div>
      <ul className="mt-3 space-y-2">
        {rows.map(([k, v]) => (
          <li key={k} className="text-xs">
            <p className="font-semibold text-foreground">{k}</p>
            <p className="text-muted-foreground">{v}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
