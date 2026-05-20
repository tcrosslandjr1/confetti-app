import { createLazyFileRoute } from "@tanstack/react-router";
import AgentControlCenter from "@/components/AgentControlCenter";

export const Route = createLazyFileRoute("/admin/agents")({
  component: AgentControlCenter,
});
