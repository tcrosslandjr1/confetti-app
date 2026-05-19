import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/logs")({
  head: () => ({ meta: [{ title: "System & Error Logs — Admin" }] }),
});
