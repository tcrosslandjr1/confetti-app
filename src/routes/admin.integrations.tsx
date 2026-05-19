import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/integrations")({
  head: () => ({ meta: [{ title: "Integrations — Admin" }] }),
});
