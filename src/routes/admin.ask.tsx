import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/ask")({
  validateSearch: (search: Record<string, unknown>): { agentId?: string } => {
    const raw = typeof search.agentId === "string" ? search.agentId : undefined;
    const safe = raw && /^[a-zA-Z0-9_-]+$/.test(raw) ? raw : undefined;
    return { agentId: safe };
  },
});
