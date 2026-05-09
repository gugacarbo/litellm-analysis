import type { PluginRoutingConfig } from "../types/routing.js";
import type { SystemAgent } from "../types/system-agent.js";

export const DEFAULT_DB_PATH = "@settings/agents.json";

const DEFAULT_OUTPUT_DIR = "data";

// Only opencode is built-in; openagent and vscode are external plugins
export const DEFAULT_FILE_PATHS = {
  db: DEFAULT_DB_PATH,
  opencode: "data/opencode.json",
} as const;

export interface FilePaths {
  db: string;
  opencode: string;
}

export function getFilePaths(baseDir?: string): FilePaths {
  const dir = baseDir ?? DEFAULT_OUTPUT_DIR;
  return {
    db: DEFAULT_DB_PATH,
    opencode: `${dir}/opencode.json`,
  };
}

// ── Default System Agents ──

const DEFAULT_SYSTEM_AGENTS: SystemAgent[] = [
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

const DEFAULT_ROUTING: PluginRoutingConfig = {
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
