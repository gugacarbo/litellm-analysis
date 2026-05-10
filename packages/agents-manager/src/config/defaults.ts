import type {
  PluginRoutingConfig,
  SystemAgent,
} from "@lite-llm/agents-repository/schema";

export const DEFAULT_DB_PATH = "@storage/agents.jsonc";

// ── Default System Agents ──

export const DEFAULT_SYSTEM_AGENTS: SystemAgent[] = [
  {
    id: "builder",
    displayName: "Builder",
    icon: "🔧",
    description: "Agente padrão — execução geral de tarefas e construção",
    versions: [
      {
        id: "latest",
        displayName: "Latest",
        modelIdStrategy: "prefix-version",
        limits: { context: 200000, output: 32768 },
      },
      {
        id: "stable",
        displayName: "Stable",
        modelIdStrategy: "prefix-version",
        limits: { context: 200000, output: 32768 },
      },
    ],
    model: "",
    fallbackModels: [],
    enabledPlugins: ["opencode"],
    config: { mode: "all" },
  },
  {
    id: "planner",
    displayName: "Planner",
    icon: "📋",
    description: "Modo planejamento — sem ferramentas de edição",
    versions: [
      {
        id: "latest",
        displayName: "Latest",
        modelIdStrategy: "prefix-version",
        limits: { context: 200000, output: 32768 },
      },
    ],
    model: "",
    fallbackModels: [],
    enabledPlugins: ["opencode"],
    config: { mode: "subagent" },
  },
  {
    id: "explorer",
    displayName: "Explorer",
    icon: "🔍",
    description: "Explorador — navega e mapeia a base de código",
    versions: [
      {
        id: "latest",
        displayName: "Latest",
        modelIdStrategy: "prefix-version",
        limits: { context: 200000, output: 32768 },
      },
    ],
    model: "",
    fallbackModels: [],
    enabledPlugins: ["opencode"],
    config: { mode: "subagent" },
  },
  {
    id: "reviewer",
    displayName: "Reviewer",
    icon: "✅",
    description: "Revisor — auditoria de qualidade e consistência",
    versions: [
      {
        id: "latest",
        displayName: "Latest",
        modelIdStrategy: "prefix-version",
        limits: { context: 200000, output: 32768 },
      },
    ],
    model: "",
    fallbackModels: [],
    enabledPlugins: ["opencode"],
    config: { mode: "subagent" },
  },
  {
    id: "architect",
    displayName: "Architect",
    icon: "🏛️",
    description: "Arquiteto — decisões de arquitetura e design",
    versions: [
      {
        id: "latest",
        displayName: "Latest",
        modelIdStrategy: "prefix-version",
        limits: { context: 200000, output: 32768 },
      },
    ],
    model: "",
    fallbackModels: [],
    enabledPlugins: ["opencode"],
    config: { mode: "subagent" },
  },
  {
    id: "writer",
    displayName: "Writer",
    icon: "✍️",
    description: "Escritor — documentação, textos e prosa técnica",
    versions: [
      {
        id: "latest",
        displayName: "Latest",
        modelIdStrategy: "prefix-version",
        limits: { context: 200000, output: 32768 },
      },
    ],
    model: "",
    fallbackModels: [],
    enabledPlugins: ["opencode"],
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
