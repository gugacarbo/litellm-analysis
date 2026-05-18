import type { SystemAgent } from "@lite-llm/agents-repository/schemas";
import { serverEnv } from "@lite-llm/config/server";

export const DEFAULT_AGENTS_PATH = `${serverEnv.SETTINGS_PATH}/agents/agents.jsonc`;

// ── Default System Agents ──

export const DEFAULT_AGENTS: SystemAgent[] = [
  {
    displayName: "Builder",
    icon: "🔧",
    description: "Agente padrão — execução geral de tarefas e construção",
    limits: { context: 200000, output: 32768 },
    model: "",
    fallbackModels: [],
    config: { mode: "all" },
  },
  {
    displayName: "Planner",
    icon: "📋",
    description: "Modo planejamento — sem ferramentas de edição",
    limits: { context: 200000, output: 32768 },
    model: "",
    fallbackModels: [],
    config: { mode: "subagent" },
  },
];
