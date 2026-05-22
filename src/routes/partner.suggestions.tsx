import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";
import { SuggestionForm } from "@/components/venue-suggestions/SuggestionForm";
import { SuggestionsList } from "@/components/venue-suggestions/SuggestionsList";
import {
  useVenueSuggestions,
  useCreateSuggestion,
  useUpdateSuggestion,
  useSubmitForReview,
  useArchiveSuggestion,
} from "@/hooks/use-venue-suggestions";
import type { VenueSuggestion, VenueSuggestionInput } from "@/types/venue-suggestion";

export const Route = createFileRoute("/partner/suggestions")({
  component: SuggestionsPage,
});

function SuggestionsPage() {
  // TODO: get venueId from partner auth context; hardcode placeholder for now
  const venueId = "demo-venue";

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<VenueSuggestion | null>(null);

  const { data: suggestions = [], isLoading } = useVenueSuggestions(venueId);
  const createMut = useCreateSuggestion();
  const updateMut = useUpdateSuggestion();
  const submitMut = useSubmitForReview();
  const archiveMut = useArchiveSuggestion();

  function handleCreate(input: VenueSuggestionInput) {
    createMut.mutate(input, {
      onSuccess: () => setShowForm(false),
    });
  }

  function handleUpdate(input: VenueSuggestionInput) {
    if (!editing) return;
    updateMut.mutate(
      { id: editing.id, venueId, updates: input },
      { onSuccess: () => setEditing(null) }
    );
  }

  function handleSubmit(id: string) {
    submitMut.mutate({ id, venueId });
  }

  function handleArchive(id: string) {
    archiveMut.mutate({ id, venueId });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-stone-800">Suggestions</h1>
          <p className="text-stone-500 text-sm mt-1">
            Share events, experiences, and promotions that Confetti will surface to users
          </p>
        </div>
        {!showForm && !editing && (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-[#E85D4A] hover:bg-[#d14e3d] text-white rounded-xl gap-2"
          >
            <Plus className="w-4 h-4" /> New suggestion
          </Button>
        )}
      </div>

      {/* Form (create or edit) */}
      {(showForm || editing) && (
        <SuggestionForm
          venueId={venueId}
          initial={editing ?? undefined}
          onSubmit={editing ? handleUpdate : handleCreate}
          onCancel={() => { setShowForm(false); setEditing(null); }}
          isLoading={createMut.isPending || updateMut.isPending}
        />
      )}

      {/* Stats strip */}
      {suggestions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Active", count: suggestions.filter(s => s.status === "active").length },
            { label: "Pending", count: suggestions.filter(s => s.status === "pending_review").length },
            { label: "Drafts", count: suggestions.filter(s => s.status === "draft").length },
            { label: "Total", count: suggestions.length },
          ].map(s => (
            <Card key={s.label} className="p-4 bg-white rounded-xl border border-stone-100 text-center">
              <div className="text-2xl font-bold text-stone-800">{s.count}</div>
              <div className="text-xs text-stone-400">{s.label}</div>
            </Card>
          ))}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Sparkles className="w-5 h-5 animate-pulse text-[#E85D4A]" />
          <span className="ml-2 text-stone-400 text-sm">Loading suggestions…</span>
        </div>
      ) : (
        <SuggestionsList
          suggestions={suggestions}
          onEdit={s => setEditing(s)}
          onSubmit={handleSubmit}
          onArchive={handleArchive}
        />
      )}
    </div>
  );
}
