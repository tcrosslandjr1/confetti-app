/**
 * React Query hooks for venue suggestions.
 * Used by both the venue dashboard and the Tonight feed.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getVenueSuggestions,
  createSuggestion,
  updateSuggestion,
  submitForReview,
  archiveSuggestion,
  approveSuggestion,
  getPendingSuggestions,
  getTonightFeed,
  type TonightFeedFilters,
} from "@/lib/api/venue-suggestions";
import type { VenueSuggestionInput, SuggestionStatus } from "@/types/venue-suggestion";

// ─── Keys ───────────────────────────────────────────────────

export const suggestionKeys = {
  all: ["venue-suggestions"] as const,
  venue: (venueId: string) => [...suggestionKeys.all, "venue", venueId] as const,
  pending: () => [...suggestionKeys.all, "pending"] as const,
  tonight: (filters?: TonightFeedFilters) => ["tonight-feed", filters] as const,
};

// ─── Venue Dashboard Hooks ──────────────────────────────────

export function useVenueSuggestions(venueId: string) {
  return useQuery({
    queryKey: suggestionKeys.venue(venueId),
    queryFn: () => getVenueSuggestions(venueId),
    enabled: Boolean(venueId),
  });
}

export function useCreateSuggestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: VenueSuggestionInput) => createSuggestion(input),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: suggestionKeys.venue(variables.venueId) });
    },
  });
}

export function useUpdateSuggestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; venueId: string; updates: Partial<VenueSuggestionInput> & { status?: SuggestionStatus } }) =>
      updateSuggestion(params.id, params.updates),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: suggestionKeys.venue(variables.venueId) });
      qc.invalidateQueries({ queryKey: suggestionKeys.pending() });
    },
  });
}

export function useSubmitForReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; venueId: string }) => submitForReview(params.id),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: suggestionKeys.venue(variables.venueId) });
      qc.invalidateQueries({ queryKey: suggestionKeys.pending() });
    },
  });
}

export function useArchiveSuggestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; venueId: string }) => archiveSuggestion(params.id),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: suggestionKeys.venue(variables.venueId) });
    },
  });
}

// ─── Admin Hooks ────────────────────────────────────────────

export function usePendingSuggestions() {
  return useQuery({
    queryKey: suggestionKeys.pending(),
    queryFn: getPendingSuggestions,
  });
}

export function useApproveSuggestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveSuggestion(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: suggestionKeys.pending() });
      qc.invalidateQueries({ queryKey: suggestionKeys.all });
    },
  });
}

// ─── Tonight Feed Hooks ─────────────────────────────────────

export function useTonightFeed(filters: TonightFeedFilters = {}) {
  return useQuery({
    queryKey: suggestionKeys.tonight(filters),
    queryFn: () => getTonightFeed(filters),
    staleTime: 60_000, // 1 minute — feed should feel fresh
  });
}
