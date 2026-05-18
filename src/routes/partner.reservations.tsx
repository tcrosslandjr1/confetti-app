import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Search } from "lucide-react";

export const Route = createFileRoute("/partner/reservations")({
  component: ReservationsPage,
});

type Status = "Pending" | "Confirmed" | "Seated" | "Completed" | "No-Show" | "Cancelled";
const STATUS_STYLE: Record<Status, string> = {
  Pending: "border-amber-500/40 text-amber-700 dark:text-amber-400",
  Confirmed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  Seated: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
  Completed: "bg-muted text-muted-foreground",
  "No-Show": "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
  Cancelled: "bg-muted text-muted-foreground",
};

const ROWS: Array<{ id: string; time: string; guest: string; party: number; status: Status; source: string; deposit: string; notes: string }> = [
  { id: "1", time: "Tonight 6:30 PM", guest: "@maya.k", party: 4, status: "Confirmed", source: "Itinerary", deposit: "$100", notes: "Anniversary" },
  { id: "2", time: "Tonight 7:00 PM", guest: "@aliyahg", party: 6, status: "Pending", source: "Party Room", deposit: "$150", notes: "Birthday — needs high chair" },
  { id: "3", time: "Tonight 7:15 PM", guest: "@theo", party: 2, status: "Confirmed", source: "Itinerary", deposit: "$50", notes: "" },
  { id: "4", time: "Tonight 8:00 PM", guest: "@noor", party: 8, status: "Pending", source: "Itinerary", deposit: "$200", notes: "Vegetarian options" },
  { id: "5", time: "Tonight 9:30 PM", guest: "@dan", party: 2, status: "Confirmed", source: "Direct", deposit: "$50", notes: "" },
  { id: "6", time: "Tomorrow 1:00 PM", guest: "@jess", party: 4, status: "Confirmed", source: "Itinerary", deposit: "$100", notes: "" },
  { id: "7", time: "Yesterday 8:00 PM", guest: "@kai", party: 3, status: "No-Show", source: "Direct", deposit: "$75", notes: "Charged no-show fee" },
];

function ReservationsPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (id: string) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const pendingCount = ROWS.filter((r) => r.status === "Pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">Reservations</h1>
          <p className="text-muted-foreground text-sm mt-1">{ROWS.length} total · {pendingCount} pending</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Download className="h-4 w-4 mr-1.5" />Export CSV</Button>
          <Button>Confirm all pending ({pendingCount})</Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search guest, notes…" />
          </div>
          <Select defaultValue="all"><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Confirmed">Confirmed</SelectItem>
            <SelectItem value="Seated">Seated</SelectItem>
            <SelectItem value="No-Show">No-Show</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent></Select>
          <Select defaultValue="any"><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent>
            <SelectItem value="any">Any source</SelectItem>
            <SelectItem value="itinerary">Itinerary</SelectItem>
            <SelectItem value="direct">Direct</SelectItem>
            <SelectItem value="party">Party Room</SelectItem>
          </SelectContent></Select>
          <Input type="date" className="w-44" />
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"><Checkbox checked={selected.length === ROWS.length} onCheckedChange={(c) => setSelected(c ? ROWS.map((r) => r.id) : [])} /></TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>Party</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Deposit</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ROWS.map((r) => (
                <TableRow key={r.id}>
                  <TableCell><Checkbox checked={selected.includes(r.id)} onCheckedChange={() => toggle(r.id)} /></TableCell>
                  <TableCell className="font-medium whitespace-nowrap">{r.time}</TableCell>
                  <TableCell>{r.guest}</TableCell>
                  <TableCell>{r.party}</TableCell>
                  <TableCell><Badge variant="outline" className={STATUS_STYLE[r.status]}>{r.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{r.source}</TableCell>
                  <TableCell>{r.deposit}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">{r.notes || "—"}</TableCell>
                  <TableCell className="text-right">
                    {r.status === "Pending" ? (
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="default">Confirm</Button>
                        <Button size="sm" variant="ghost">Decline</Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost">Details</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
