import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChefHat, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/partner/orders")({
  component: OrdersPage,
});

type Status = "Pending" | "Confirmed" | "Preparing" | "Ready" | "Picked Up" | "Cancelled";
const STATUS_FLOW: Status[] = ["Pending", "Confirmed", "Preparing", "Ready", "Picked Up"];

const STYLE: Record<Status, string> = {
  Pending: "border-amber-500/40 text-amber-700 dark:text-amber-400",
  Confirmed: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
  Preparing: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30",
  Ready: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  "Picked Up": "bg-muted text-muted-foreground",
  Cancelled: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
};

const ORDERS: Array<{
  id: string;
  time: string;
  guest: string;
  items: string;
  total: string;
  status: Status;
  link?: string;
}> = [
  {
    id: "#3421",
    time: "6:30 PM",
    guest: "@maya.k",
    items: "2× Chicken & Waffles, 1× Mimosa Pitcher",
    total: "$74.00",
    status: "Pending",
    link: "R-9821",
  },
  {
    id: "#3422",
    time: "6:45 PM",
    guest: "@dan",
    items: "1× Salmon Crudo, 1× Burrata Toast",
    total: "$48.00",
    status: "Confirmed",
    link: "R-9824",
  },
  {
    id: "#3423",
    time: "7:00 PM",
    guest: "@theo",
    items: "3× Margarita, 1× Truffle Fries",
    total: "$62.00",
    status: "Preparing",
  },
  {
    id: "#3424",
    time: "7:10 PM",
    guest: "@aliyahg",
    items: "Tasting menu × 6",
    total: "$420.00",
    status: "Preparing",
    link: "R-9830",
  },
  {
    id: "#3425",
    time: "7:25 PM",
    guest: "@jess",
    items: "2× Wagyu Slider, 1× Old Fashioned",
    total: "$88.00",
    status: "Ready",
  },
];

function OrdersPage() {
  const [tab, setTab] = useState<"list" | "kds">("list");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">Orders</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {ORDERS.length} active orders in the queue
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as never)}>
        <TabsList>
          <TabsTrigger value="list">List view</TabsTrigger>
          <TabsTrigger value="kds">
            <ChefHat className="h-4 w-4 mr-1.5" />
            Kitchen display
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Linked res.</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ORDERS.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">{o.id}</TableCell>
                    <TableCell>{o.time}</TableCell>
                    <TableCell>{o.guest}</TableCell>
                    <TableCell className="max-w-[300px] truncate text-muted-foreground">
                      {o.items}
                    </TableCell>
                    <TableCell className="font-medium">{o.total}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STYLE[o.status]}>
                        {o.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{o.link || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost">
                        Advance <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="kds">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {ORDERS.filter((o) => o.status !== "Picked Up" && o.status !== "Cancelled").map((o) => {
              const i = STATUS_FLOW.indexOf(o.status);
              const next = STATUS_FLOW[i + 1];
              return (
                <Card key={o.id} className="p-4 flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-xs text-muted-foreground">{o.id}</div>
                    <Badge variant="outline" className={STYLE[o.status]}>
                      {o.status}
                    </Badge>
                  </div>
                  <div className="mt-2 text-3xl font-semibold tabular-nums">{o.time}</div>
                  <div className="text-sm mt-1">{o.guest}</div>
                  <div className="mt-3 text-base leading-snug flex-1">{o.items}</div>
                  <div className="mt-3 font-semibold">{o.total}</div>
                  {next && (
                    <Button size="lg" className="mt-3 w-full text-base">
                      Mark {next}
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
