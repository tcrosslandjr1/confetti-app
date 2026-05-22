import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  UtensilsCrossed,
  FolderOpen,
  DollarSign,
  Tag,
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BusinessPageShell } from "@/components/business/BusinessTabNav";
import {
  NoVenueClaim,
  VenueSwitcher,
  useManagedVenues,
} from "@/components/business/useManagedVenue";
import {
  listVenueMenu,
  upsertMenuCategory,
  upsertMenuItem,
  deleteMenuCategory,
  deleteMenuItem,
} from "@/lib/business-portal.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/business/menu")({
  beforeLoad: async () => {
    const { requireBusinessAccess } = await import("@/lib/business-guards");
    await requireBusinessAccess();
  },
  head: () => ({ meta: [{ title: "Menu — Confetti for Business" }] }),
  component: BusinessMenuPage,
});

function BusinessMenuPage() {
  const { venues, activeId, setActiveId, isLoading: venuesLoading } = useManagedVenues();

  if (venuesLoading) {
    return (
      <BusinessPageShell eyebrow="Menu" title="Menu Management">
        <div className="grid place-items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </BusinessPageShell>
    );
  }

  if (!venues.length) {
    return (
      <BusinessPageShell eyebrow="Menu" title="Menu Management">
        <NoVenueClaim />
      </BusinessPageShell>
    );
  }

  return (
    <BusinessPageShell
      eyebrow="Menu"
      title="Menu Management"
      description="Manage your menu items for passenger pre-orders"
      actions={
        <VenueSwitcher venues={venues} activeId={activeId} onChange={setActiveId} />
      }
    >
      {activeId && <MenuEditor venueId={activeId} />}
    </BusinessPageShell>
  );
}

/* ─── Menu Editor ─── */

function MenuEditor({ venueId }: { venueId: string }) {
  const fetchMenu = useServerFn(listVenueMenu);
  const queryClient = useQueryClient();
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["venue-menu", venueId],
    queryFn: () => fetchMenu({ venueId }),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="grid place-items-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const categories = data?.categories ?? [];
  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      {/* Category Management */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Categories</h2>
        <Button size="sm" variant="outline" onClick={() => setShowCategoryForm(true)}>
          <Plus className="mr-1 h-3 w-3" /> Add Category
        </Button>
      </div>

      {showCategoryForm && (
        <CategoryForm
          venueId={venueId}
          onClose={() => setShowCategoryForm(false)}
          onSuccess={() => {
            setShowCategoryForm(false);
            queryClient.invalidateQueries({ queryKey: ["venue-menu", venueId] });
          }}
        />
      )}

      {categories.length === 0 && !showCategoryForm && (
        <Card className="grid place-items-center border-dashed border-border p-8 text-center">
          <FolderOpen className="h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">No categories yet</p>
          <p className="text-xs text-muted-foreground">
            Add categories like "Cocktails", "Starters", "Mains"
          </p>
        </Card>
      )}

      {categories.map((cat) => (
        <CategorySection
          key={cat.id}
          category={cat}
          items={items.filter((i) => i.category_id === cat.id)}
          venueId={venueId}
          onEditItem={(item) => { setEditingItem(item); setShowItemForm(true); }}
        />
      ))}

      {/* Uncategorized items */}
      {items.filter((i) => !i.category_id).length > 0 && (
        <CategorySection
          category={{ id: null, name: "Uncategorized", sort_order: 999 }}
          items={items.filter((i) => !i.category_id)}
          venueId={venueId}
          onEditItem={(item) => { setEditingItem(item); setShowItemForm(true); }}
        />
      )}

      {/* Add Item Button */}
      <div className="pt-4">
        <Button onClick={() => { setEditingItem(null); setShowItemForm(true); }}>
          <Plus className="mr-1 h-4 w-4" /> Add Menu Item
        </Button>
      </div>

      {/* Item Form Modal */}
      {showItemForm && (
        <ItemForm
          venueId={venueId}
          categories={categories}
          existing={editingItem}
          onClose={() => { setShowItemForm(false); setEditingItem(null); }}
          onSuccess={() => {
            setShowItemForm(false);
            setEditingItem(null);
            queryClient.invalidateQueries({ queryKey: ["venue-menu", venueId] });
          }}
        />
      )}
    </div>
  );
}

/* ─── Category Section ─── */

function CategorySection({
  category,
  items,
  venueId,
  onEditItem,
}: {
  category: any;
  items: any[];
  venueId: string;
  onEditItem: (item: any) => void;
}) {
  const deleteCat = useServerFn(deleteMenuCategory);
  const deleteIt = useServerFn(deleteMenuItem);
  const queryClient = useQueryClient();

  const deleteCatMutation = useMutation({
    mutationFn: () => deleteCat({ venueId, categoryId: category.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venue-menu", venueId] });
      toast.success("Category deleted");
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => deleteIt({ venueId, itemId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venue-menu", venueId] });
      toast.success("Item deleted");
    },
  });

  return (
    <Card className="border-border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">{category.name}</h3>
        {category.id && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-red-600"
            disabled={deleteCatMutation.isPending}
            onClick={() => deleteCatMutation.mutate()}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No items in this category</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
            >
              <div className="flex items-center gap-3">
                {item.image_url ? (
                  <img src={item.image_url} alt="" className="h-10 w-10 rounded object-cover" />
                ) : (
                  <div className="grid h-10 w-10 place-items-center rounded bg-muted">
                    <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-emerald-700">
                      ${(item.price_cents / 100).toFixed(2)}
                    </span>
                    {item.dietary_tags?.length > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {item.dietary_tags.join(", ")}
                      </span>
                    )}
                    {!item.is_available && (
                      <span className="rounded bg-red-100 px-1 text-[10px] font-semibold text-red-700">
                        Unavailable
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="h-7" onClick={() => onEditItem(item)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-red-600"
                  disabled={deleteItemMutation.isPending}
                  onClick={() => deleteItemMutation.mutate(item.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ─── Category Form ─── */

function CategoryForm({
  venueId,
  onClose,
  onSuccess,
}: {
  venueId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const upsert = useServerFn(upsertMenuCategory);
  const [name, setName] = useState("");

  const mutation = useMutation({
    mutationFn: () => upsert({ venueId, name }),
    onSuccess: () => {
      toast.success("Category created");
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Card className="border-border p-4">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="text-xs font-semibold text-muted-foreground">Category Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Cocktails"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <Button size="sm" disabled={!name.trim() || mutation.isPending} onClick={() => mutation.mutate()}>
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}

/* ─── Item Form ─── */

function ItemForm({
  venueId,
  categories,
  existing,
  onClose,
  onSuccess,
}: {
  venueId: string;
  categories: any[];
  existing: any | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const upsert = useServerFn(upsertMenuItem);
  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [priceDollars, setPriceDollars] = useState(
    existing ? (existing.price_cents / 100).toFixed(2) : "",
  );
  const [categoryId, setCategoryId] = useState(existing?.category_id ?? "");
  const [isAvailable, setIsAvailable] = useState(existing?.is_available ?? true);
  const [dietaryTags, setDietaryTags] = useState(existing?.dietary_tags?.join(", ") ?? "");

  const mutation = useMutation({
    mutationFn: () =>
      upsert({
        venueId,
        id: existing?.id,
        name,
        description: description || undefined,
        price_cents: Math.round(parseFloat(priceDollars || "0") * 100),
        category_id: categoryId || null,
        is_available: isAvailable,
        dietary_tags: dietaryTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      }),
    onSuccess: () => {
      toast.success(existing ? "Item updated" : "Item created");
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Card className="border-2 border-ink p-5">
      <h3 className="mb-4 font-bold">{existing ? "Edit Item" : "New Menu Item"}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-muted-foreground">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Old Fashioned"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-muted-foreground">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Bourbon, bitters, sugar, orange peel"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Price ($) *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={priceDollars}
            onChange={(e) => setPriceDollars(e.target.value)}
            placeholder="14.00"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">
            Dietary Tags (comma-separated)
          </label>
          <input
            type="text"
            value={dietaryTags}
            onChange={(e) => setDietaryTags(e.target.value)}
            placeholder="vegan, gluten-free"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-2 pt-5">
          <input
            type="checkbox"
            id="available"
            checked={isAvailable}
            onChange={(e) => setIsAvailable(e.target.checked)}
          />
          <label htmlFor="available" className="text-sm">
            Available
          </label>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button disabled={!name.trim() || !priceDollars || mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
          {existing ? "Update" : "Add Item"}
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}
