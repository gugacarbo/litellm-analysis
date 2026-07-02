import type { SystemAgent } from "@lite-llm/agents-repository/schemas";

// ── Default System Agents ──

export const DEFAULT_AGENTS: SystemAgent[] = [
  {
    displayName: "Builder",
    icon: "🔧",
    description: "Agente padrão — execução geral de tarefas e construção",
    limits: { context: 200000, output: 32768 },
    model: "",
    config: { mode: "all" },
  },
  {
    displayName: "Planner",
    icon: "📋",
    description: "Modo planejamento — sem ferramentas de edição",
    limits: { context: 200000, output: 32768 },
    model: "",
    config: { mode: "subagent" },
  },
];
