import { serverEnv } from "@lite-llm/config/server";
import type { SystemAgent } from "@lite-llm/agents-repository/schemas";

export const DEFAULT_DB_PATH = serverEnv.AGENTS_CONFIG_PATH;

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
  {
    displayName: "Explorer",
    icon: "🔍",
    description: "Explorador — navega e mapeia a base de código",
    limits: { context: 200000, output: 32768 },
    model: "",
    fallbackModels: [],
    config: { mode: "subagent" },
  },
  {
    displayName: "Reviewer",
    icon: "✅",
    description: "Revisor — auditoria de qualidade e consistência",
    limits: { context: 200000, output: 32768 },
    model: "",
    fallbackModels: [],
    config: { mode: "subagent" },
  },
  {
    displayName: "Architect",
    icon: "🏛️",
    description: "Arquiteto — decisões de arquitetura e design",
    limits: { context: 200000, output: 32768 },
    model: "",
    fallbackModels: [],
    config: { mode: "subagent" },
  },
  {
    displayName: "Writer",
    icon: "✍️",
    description: "Escritor — documentação, textos e prosa técnica",
    limits: { context: 200000, output: 32768 },
    model: "",
    fallbackModels: [],
    config: {},
  },
];
