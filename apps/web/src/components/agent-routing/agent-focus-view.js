import { jsx as _jsx } from "react/jsx-runtime";
import { EntityFocusCard } from "./entity-focus-card";
export function AgentFocusView({
  loading,
  agents,
  models,
  getAgentConfigInfo,
  onOpenAgentConfig,
  onQuickModelChange,
}) {
  if (loading) {
    return _jsx("div", {
      className: "space-y-4",
      children: _jsx("div", {
        className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        children: Array.from({ length: 6 }).map((_, i) =>
          _jsx(
            "div",
            { className: "h-32 animate-pulse rounded-xl bg-muted" },
            i,
          ),
        ),
      }),
    });
  }
  return _jsx("div", {
    className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    children: agents.map((agent) =>
      _jsx(
        EntityFocusCard,
        {
          entityKey: agent.key,
          name: agent.name,
          description: agent.description,
          icon: agent.icon,
          configInfo: getAgentConfigInfo(agent.key),
          models: models,
          onOpenConfig: onOpenAgentConfig,
          onQuickModelChange: onQuickModelChange,
        },
        agent.key,
      ),
    ),
  });
}
