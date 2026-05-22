import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, GripVertical, Flame, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/partner/menu")({
  component: MenuPage,
});

type Item = {
  name: string;
  desc: string;
  price: string;
  tags: string[];
  popular?: boolean;
  available: boolean;
};
type Category = { name: string; hours: string; items: Item[] };

const MENU: Category[] = [
  {
    name: "Brunch",
    hours: "9 AM – 3 PM",
    items: [
      {
        name: "Chicken & Waffles",
        desc: "Buttermilk fried chicken, maple, hot honey",
        price: "$24",
        tags: ["Popular"],
        popular: true,
        available: true,
      },
      {
        name: "Avocado Toast",
        desc: "Heirloom tomato, microgreens, sourdough",
        price: "$16",
        tags: ["V", "GF opt."],
        available: true,
      },
      {
        name: "Truffle Eggs Benedict",
        desc: "House english muffin, black truffle hollandaise",
        price: "$22",
        tags: [],
        available: false,
      },
    ],
  },
  {
    name: "Dinner Small Plates",
    hours: "5 PM – 10 PM",
    items: [
      {
        name: "Burrata Toast",
        desc: "Stone fruit, basil oil, sea salt",
        price: "$18",
        tags: ["V"],
        popular: true,
        available: true,
      },
      {
        name: "Salmon Crudo",
        desc: "Yuzu kosho, cucumber, shiso",
        price: "$24",
        tags: ["GF"],
        available: true,
      },
      {
        name: "Wagyu Sliders",
        desc: "Aged cheddar, pickled onion, brioche",
        price: "$28",
        tags: [],
        available: true,
      },
    ],
  },
  {
    name: "Cocktails",
    hours: "All day",
    items: [
      {
        name: "Sundae Spritz",
        desc: "House signature: aperol, grapefruit, prosecco",
        price: "$16",
        tags: [],
        popular: true,
        available: true,
      },
      {
        name: "Mezcal Margarita",
        desc: "Smoked salt, hibiscus, lime",
        price: "$17",
        tags: [],
        available: true,
      },
    ],
  },
];

function MenuPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState<string>("Brunch");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">Menu editor</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Toggle availability, tag dietary info, set Confetti pricing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            POS synced 2m ago
          </div>
          <Button onClick={() => navigate({ to: "/partner/menu" })}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add category
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {MENU.map((cat) => {
          const isOpen = open === cat.name;
          return (
            <Card key={cat.name} className="overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? "" : cat.name)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-accent/30"
              >
                <div className="text-left">
                  <div className="font-semibold">{cat.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Available {cat.hours} · {cat.items.length} items
                  </div>
                </div>
                <Badge variant="outline">{isOpen ? "Collapse" : "Expand"}</Badge>
              </button>
              {isOpen && (
                <div className="border-t border-border/60 divide-y divide-border/60">
                  {cat.items.map((item) => (
                    <div key={item.name} className="px-5 py-4 flex items-center gap-4">
                      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-orange-200 to-pink-200 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="font-medium">{item.name}</div>
                          {item.popular && (
                            <Badge className="bg-primary/10 text-primary border-0 gap-1 text-[10px]">
                              <Flame className="h-3 w-3" />
                              Popular
                            </Badge>
                          )}
                          {item.tags.map((t) => (
                            <Badge key={t} variant="outline" className="text-[10px]">
                              {t}
                            </Badge>
                          ))}
                        </div>
                        <div className="text-sm text-muted-foreground truncate mt-0.5">
                          {item.desc}
                        </div>
                      </div>
                      <Input defaultValue={item.price} className="w-20" />
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{item.available ? "Available" : "86'd"}</span>
                        <Switch defaultChecked={item.available} />
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/partner/menu" })}>
                        Edit
                      </Button>
                    </div>
                  ))}
                  <div className="px-5 py-3">
                    <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/partner/menu" })}>
                      <Plus className="h-4 w-4 mr-1.5" />
                      Add item
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
