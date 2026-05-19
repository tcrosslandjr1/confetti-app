import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/business-claims")({
  head: () => ({ meta: [{ title: "Venue Claims — Admin" }] }),
});
