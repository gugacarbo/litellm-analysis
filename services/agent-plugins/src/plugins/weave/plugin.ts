import type {
  SystemAgent,
  WeavePluginConfig,
} from "@lite-llm/agents-repository/schemas";
import type { IPlugin, TransformContext, TypedPluginRouting } from "../plugin";
import type {
  ConfigField,
  InternalAgent,
  PluginConfigFor,
} from "../plugin-types";
import { weaveOutputSchema } from "./schemas/generated/weave-output.zod";

// ── Weave output types ──

interface WeaveAgentOutput {
  display_name: string;
  model: string;
  fallback_models: string[];
  temperature: number;
  color: string;
  category?: string;
}

interface WeaveCategoryOutput {
  description: string;
  model: string;
  fallback_models: string[];
  temperature: number;
}

interface WeaveConfigOutput {
  $schema: string;
  log_level: string;
  tmux: { enabled: boolean };
  analytics: { enabled: boolean; use_fingerprint: boolean };
  continuation: {
    recovery: { compaction: boolean };
    idle: {
      enabled: boolean;
      work: boolean;
      workflow: boolean;
      todo_prompt: boolean;
    };
  };
  permission: { question: string };
  skill_directories: string[];
  agents: Record<string, WeaveAgentOutput>;
  categories: Record<string, WeaveCategoryOutput>;
}

// ── Default model slot names (primary + 2 fallbacks) ──
const DEFAULT_MODEL_NAMES = ["gpt-5.5", "gpt-5.4", "gpt-5.3"] as const;

// ── Weave internal agents ──
const WEAVE_AGENTS: {
  id: string;
  displayName: string;
  description: string;
  color: string;
  category: string;
}[] = [
  {
    id: "loom",
    displayName: "Loom (Orquestrador Principal)",
    description:
      "Main orchestrator — primary user-facing interface that understands requests, routes work, and coordinates results",
    color: "#4A90D9",
    category: "deep",
  },
  {
    id: "tapestry",
    displayName: "Tapestry (Orquestrador de Execução)",
    description:
      "Plan execution orchestrator — delegates plan tasks to Shuttle, verifies results, and tracks progress",
    color: "#D94A4A",
    category: "deep",
  },
  {
    id: "pattern",
    displayName: "Pattern (Planejador Estratégico)",
    description: "Strategic planner — produces .weave/plans/ files",
    color: "#9B59B6",
    category: "deep",
  },
  {
    id: "shuttle",
    displayName: "Shuttle (Especialista de Domínio)",
    description:
      "Domain specialist worker — handles delegated implementation and analysis tasks",
    color: "#E67E22",
    category: "deep",
  },
  {
    id: "thread",
    displayName: "Thread (Explorador de Código)",
    description: "Codebase explorer — fast, read-only analysis and search",
    color: "#27AE60",
    category: "quick",
  },
  {
    id: "spindle",
    displayName: "Spindle (Pesquisador Externo)",
    description: "External researcher — web fetching and research",
    color: "#F39C12",
    category: "quick",
  },
  {
    id: "weft",
    displayName: "Weft (Revisor de Qualidade)",
    description: "Quality reviewer and auditor",
    color: "#1ABC9C",
    category: "deep",
  },
  {
    id: "warp",
    displayName: "Warp (Auditor de Segurança)",
    description: "Security auditor",
    color: "#E74C3C",
    category: "deep",
  },
];

// ── Weave categories ──
const WEAVE_CATEGORIES: {
  id: string;
  description: string;
  temperature: number;
}[] = [
  {
    id: "deep",
    description: "Autonomous goal-oriented problem solving.",
    temperature: 0.2,
  },
  {
    id: "quick",
    description: "Fast handling for small and low-complexity tasks.",
    temperature: 0.1,
  },
  {
    id: "visual-engineering",
    description: "Frontend, UI/UX, styling, and visual implementation.",
    temperature: 0.3,
  },
  {
    id: "writing",
    description: "Technical writing, documentation, and clear communication.",
    temperature: 0.2,
  },
];

export class WeavePlugin implements IPlugin<"weave"> {
  readonly id = "weave";
  readonly name = "OpenCode Weave";
  readonly version = 1;
  readonly outputFile = "weave-config.json";

  getInternalAgents(): InternalAgent[] {
    return WEAVE_AGENTS.map((a) => ({
      id: a.id,
      displayName: a.displayName,
      description: a.description,
    }));
  }

  getConfigSchema(): ConfigField[] {
    return [
      {
        key: "$schema",
        type: "string",
        label: "Schema URL",
        required: false,
        default:
          "https://raw.githubusercontent.com/pgermishuys/opencode-weave/refs/heads/main/schema/weave-config.schema.json",
        placeholder: "weave config schema URL",
        description: "JSON Schema URL for the generated weave config",
      },
      {
        key: "logLevel",
        type: "select",
        label: "Log Level",
        required: false,
        default: "INFO",
        options: ["DEBUG", "INFO", "WARN", "ERROR"].map((v) => ({
          value: v,
          label: v,
        })),
        description: "Logging verbosity level for Weave",
      },
      {
        key: "tmuxEnabled",
        type: "boolean",
        label: "Tmux Enabled",
        required: false,
        default: true,
        description: "Enable tmux session management",
      },
      {
        key: "analyticsEnabled",
        type: "boolean",
        label: "Analytics Enabled",
        required: false,
        default: true,
        description: "Enable usage analytics collection",
      },
      {
        key: "analyticsUseFingerprint",
        type: "boolean",
        label: "Analytics Use Fingerprint",
        required: false,
        default: true,
        description: "Use fingerprint for analytics tracking",
      },
      {
        key: "continuationRecoveryCompaction",
        type: "boolean",
        label: "Continuation Recovery Compaction",
        required: false,
        default: true,
        description: "Enable context compaction during recovery",
      },
      {
        key: "continuationIdleEnabled",
        type: "boolean",
        label: "Continuation Idle Enabled",
        required: false,
        default: true,
        description: "Enable idle continuation processing",
      },
      {
        key: "continuationIdleWork",
        type: "boolean",
        label: "Continuation Idle Work",
        required: false,
        default: true,
        description: "Allow work during idle periods",
      },
      {
        key: "continuationIdleTodoPrompt",
        type: "boolean",
        label: "Continuation Idle Todo Prompt",
        required: false,
        default: true,
        description: "Show todo prompt during idle",
      },
      {
        key: "permissionQuestion",
        type: "select",
        label: "Permission Question Behavior",
        required: false,
        default: "allow",
        options: [
          { value: "allow", label: "Allow" },
          { value: "deny", label: "Deny" },
          { value: "ask", label: "Ask" },
        ],
        description: "Default behavior for permission questions",
      },
      {
        key: "skillDirectories",
        type: "multiselect",
        label: "Skill Directories",
        required: false,
        default: ["~/.agents/skills", "~/.claude/skills", "~/.opencode/skills"],
        options: [
          { value: "~/.agents/skills", label: "~/.agents/skills" },
          { value: "~/.claude/skills", label: "~/.claude/skills" },
          { value: "~/.opencode/skills", label: "~/.opencode/skills" },
        ],
        description: "Directories to scan for skills",
      },
    ];
  }

  buildOutput(
    agents: SystemAgent[],
    routing: TypedPluginRouting<PluginConfigFor<"weave">>,
    ctx: TransformContext,
  ): WeaveConfigOutput {
    const config: WeavePluginConfig = (routing.config ??
      {}) as WeavePluginConfig;
    const schemaUrl =
      config.$schema ??
      "https://raw.githubusercontent.com/pgermishuys/opencode-weave/refs/heads/main/schema/weave-config.schema.json";

    const modelNames = ctx.modelNames ?? DEFAULT_MODEL_NAMES;

    const baseOutput: Omit<WeaveConfigOutput, "agents" | "categories"> = {
      $schema: schemaUrl,
      log_level: config.logLevel ?? "INFO",
      tmux: { enabled: config.tmuxEnabled ?? true },
      analytics: {
        enabled: config.analyticsEnabled ?? true,
        use_fingerprint: config.analyticsUseFingerprint ?? true,
      },
      continuation: {
        recovery: { compaction: config.continuationRecoveryCompaction ?? true },
        idle: {
          enabled: config.continuationIdleEnabled ?? true,
          work: config.continuationIdleWork ?? true,
          workflow: true,
          todo_prompt: config.continuationIdleTodoPrompt ?? true,
        },
      },
      permission: { question: config.permissionQuestion ?? "allow" },
      skill_directories: config.skillDirectories ?? [
        "~/.agents/skills",
        "~/.claude/skills",
        "~/.opencode/skills",
      ],
    };

    // Build agent routing map: systemAgentId -> weaveAgentId
    const agentMappings = routing.routing?.agents ?? {};

    // Build a map of system agents by id for fast lookup
    const systemAgentMap = new Map<string, SystemAgent>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const agent of agents as any[]) {
      // SystemAgent has id field at top level
      const systemId: string =
        ((agent as Record<string, unknown>).id as string) ??
        agent.displayName ??
        "";
      if (systemId) systemAgentMap.set(systemId, agent);
    }

    // Build weave agents output
    const outputAgents: Record<string, WeaveAgentOutput> = {};

    for (const weaveAgent of WEAVE_AGENTS) {
      // Find which system agent is mapped to this weave agent
      const entry = Object.entries(agentMappings).find(
        ([, weaveId]) => weaveId === weaveAgent.id,
      );
      if (!entry) continue;

      const systemAgentId = entry[0];
      const systemAgent = systemAgentMap.get(systemAgentId);
      if (!systemAgent) continue;

      const model = systemAgent.model ?? "";
      const models = model ? this.resolveModels(model, modelNames, ctx) : [];

      outputAgents[weaveAgent.id] = {
        display_name: systemAgent.displayName ?? weaveAgent.displayName,
        model: models[0] ?? model,
        fallback_models: models.slice(1),
        temperature: systemAgent.config?.temperature ?? 0.2,
        color: systemAgent.config?.color || weaveAgent.color,
        category: weaveAgent.category,
      };
    }

    // Build weave categories output
    const outputCategories: Record<string, WeaveCategoryOutput> = {};

    for (const weaveCat of WEAVE_CATEGORIES) {
      const systemCat = ctx.allCategories?.[weaveCat.id];
      const catModel = systemCat?.model ?? "";

      const models = catModel
        ? this.resolveModels(catModel, modelNames, ctx)
        : [];

      outputCategories[weaveCat.id] = {
        description: systemCat?.description ?? weaveCat.description,
        model: models[0] ?? catModel,
        fallback_models: models.slice(1),
        temperature:
          ((systemCat as Record<string, unknown>)?.temperature as number) ??
          weaveCat.temperature,
      };
    }

    return {
      ...baseOutput,
      agents: outputAgents,
      categories: outputCategories,
    };
  }

  getOutputFile(): string {
    return this.outputFile;
  }

  validate(output: unknown): boolean {
    const result = weaveOutputSchema.safeParse(output);
    if (!result.success) {
      console.error("[WeavePlugin] Validation failed:", result.error.issues);
    }
    return result.success;
  }

  /**
   * Resolve a primary model into an array of [primary, ...fallbacks]
   * using the standard model slot naming convention.
   */
  private resolveModels(
    primaryModel: string,
    modelNames: readonly string[],
    _ctx: TransformContext,
  ): string[] {
    if (!primaryModel) return [];
    const parts = primaryModel.split("/");
    const base = parts[parts.length - 2] ?? "";
    const name = parts[parts.length - 1] ?? primaryModel;

    return modelNames.map((slot, i) => {
      if (i === 0) return primaryModel;
      // Construct fallback: base/provider + slot name
      if (base) return `${base}/${slot}`;
      return slot;
    });
  }
}
