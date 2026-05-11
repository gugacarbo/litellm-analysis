import type {
  PluginRoutingConfig,
  SystemAgent,
} from "@lite-llm/agents-repository/schema";

export const DEFAULT_DB_PATH = "@storage/agents.json";

// ── Default System Agents ──

export const DEFAULT_AGENTS: SystemAgent[] = [
  {
    displayName: "Builder",
    icon: "🔧",
    description: "Agente padrão — execução geral de tarefas e construção",
    modelIdStrategy: "prefix-version",
    limits: { context: 200000, output: 32768 },
    model: "",
    fallbackModels: [],
    config: { mode: "all" },
  },
  {
    displayName: "Planner",
    icon: "📋",
    description: "Modo planejamento — sem ferramentas de edição",
    modelIdStrategy: "prefix-version",
    limits: { context: 200000, output: 32768 },
    model: "",
    fallbackModels: [],
    config: { mode: "subagent" },
  },
  {
    displayName: "Explorer",
    icon: "🔍",
    description: "Explorador — navega e mapeia a base de código",
    modelIdStrategy: "prefix-version",
    limits: { context: 200000, output: 32768 },
    model: "",
    fallbackModels: [],
    config: { mode: "subagent" },
  },
  {
    displayName: "Reviewer",
    icon: "✅",
    description: "Revisor — auditoria de qualidade e consistência",
    modelIdStrategy: "prefix-version",
    limits: { context: 200000, output: 32768 },
    model: "",
    fallbackModels: [],
    config: { mode: "subagent" },
  },
  {
    displayName: "Architect",
    icon: "🏛️",
    description: "Arquiteto — decisões de arquitetura e design",
    modelIdStrategy: "prefix-version",
    limits: { context: 200000, output: 32768 },
    model: "",
    fallbackModels: [],
    config: { mode: "subagent" },
  },
  {
    displayName: "Writer",
    icon: "✍️",
    description: "Escritor — documentação, textos e prosa técnica",
    modelIdStrategy: "prefix-version",
    limits: { context: 200000, output: 32768 },
    model: "",
    fallbackModels: [],
    config: {},
  },
];

// ── Default Plugin Routing ──

export const DEFAULT_ROUTING: PluginRoutingConfig = {
  version: 1,
  plugins: {
    opencode: {
      enabled: true,
      outputFile: "opencode.json",
      agents: {},
    },
    openagent: {
      enabled: false,
      outputFile: "oh-my-openagent.json",
      agents: {},
    },
    vscode: {
      enabled: false,
      outputFile: "vscode-oaicopilot.json",
      agents: {},
    },
  },
};
