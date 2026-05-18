import { createFileRoute } from "@tanstack/react-router";
import { Fragment } from "react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

export const Route = createFileRoute("/partner/calendar")({
  component: CalendarPage,
});

type Status = "open" | "limited" | "full" | "closed";
const STATUS_COLOR: Record<Status, string> = {
  open: "bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/40",
  limited: "bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40",
  full: "bg-red-500/20 hover:bg-red-500/30 border-red-500/40",
  closed: "bg-muted/60 hover:bg-muted border-border",
};

const HOURS = ["5 PM", "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM", "12 AM"];
const DAYS = ["Mon 19", "Tue 20", "Wed 21", "Thu 22", "Fri 23", "Sat 24", "Sun 25"];

// deterministic mock
function statusFor(d: number, h: number): Status {
  if (h === 0 || h === 7) return "closed";
  if (d >= 4 && h >= 3 && h <= 5) return "full";
  if (d >= 4 && h >= 2 && h <= 6) return "limited";
  if (d === 6 && h >= 5) return "limited";
  return "open";
}

function CalendarPage() {
  const [view, setView] = useState<"day" | "week" | "month">("week");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">Calendar & availability</h1>
          <p className="text-muted-foreground text-sm mt-1">Click any slot to block, unblock, or add a note.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border bg-card overflow-hidden">
            {(["day", "week", "month"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-sm capitalize ${view === v ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
              >
                {v}
              </button>
            ))}
          </div>
          <BlockDialog />
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
            <div className="font-medium">May 19 — May 25, 2026</div>
            <Button variant="ghost" size="icon"><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="flex items-center gap-3 text-xs">
            {(["open", "limited", "full", "closed"] as Status[]).map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-sm border ${STATUS_COLOR[s]}`} />
                <span className="capitalize text-muted-foreground">{s}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[700px] grid grid-cols-[60px_repeat(7,1fr)] gap-1">
            <div />
            {DAYS.map((d) => (
              <div key={d} className="text-xs font-medium text-center text-muted-foreground py-1">{d}</div>
            ))}
            {HOURS.map((h, hi) => (
              <>
                <div key={`h-${hi}`} className="text-xs text-muted-foreground text-right pr-2 py-2">{h}</div>
                {DAYS.map((_, di) => {
                  const s = statusFor(di, hi);
                  return (
                    <button
                      key={`${di}-${hi}`}
                      className={`h-10 rounded border transition-colors ${STATUS_COLOR[s]}`}
                      title={`${DAYS[di]} ${HOURS[hi]} — ${s}`}
                    />
                  );
                })}
              </>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

function BlockDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-1.5" />Block time</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Block a time slot</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Block type</Label>
            <Select defaultValue="private">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private event</SelectItem>
                <SelectItem value="maint">Maintenance / closed</SelectItem>
                <SelectItem value="staff">Staff only</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>From</Label><Input type="datetime-local" /></div>
            <div className="space-y-1.5"><Label>To</Label><Input type="datetime-local" /></div>
          </div>
          <div className="space-y-1.5">
            <Label>Recurring</Label>
            <Select defaultValue="once">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="once">One-time</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Affected areas</Label>
            <Select defaultValue="all">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="indoor">Indoor</SelectItem>
                <SelectItem value="outdoor">Outdoor</SelectItem>
                <SelectItem value="bar">Bar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full">Create block</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
