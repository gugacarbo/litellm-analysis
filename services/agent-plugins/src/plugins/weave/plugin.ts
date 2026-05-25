import type {
  SystemAgent,
  WeavePluginConfig,
} from "@lite-llm/agents-repository/schemas";
import {
  WEAVE_ANALYTICS_ENABLED_DEFAULT,
  WEAVE_ANALYTICS_USE_FINGERPRINT_DEFAULT,
  WEAVE_CONTINUATION_IDLE_ENABLED_DEFAULT,
  WEAVE_CONTINUATION_IDLE_TODO_PROMPT_DEFAULT,
  WEAVE_CONTINUATION_IDLE_WORK_DEFAULT,
  WEAVE_CONTINUATION_RECOVERY_COMPACTION_DEFAULT,
  WEAVE_LOG_LEVEL_DEFAULT,
  WEAVE_PERMISSION_QUESTION_DEFAULT,
  WEAVE_SCHEMA_URL_DEFAULT,
  WEAVE_SKILL_DIRECTORIES_DEFAULT,
  WEAVE_TMUX_ENABLED_DEFAULT,
} from "@lite-llm/agents-repository/schemas";
import type { IPlugin, TransformContext, TypedPluginRouting } from "../plugin";
import { normalizeAgentMappings } from "../plugin";
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
  skill_directories: string[];
  agents: Record<string, WeaveAgentOutput>;
  categories: Record<string, WeaveCategoryOutput>;
}

// ── Default model slot names (primary + 1 fallback) ──
const DEFAULT_MODEL_NAMES = ["gpt-5.5", "gpt-5.4"] as const;

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
    displayName: "Loom",
    description:
      "Main orchestrator — primary user-facing interface that understands requests, routes work, and coordinates results",
    color: "#4A90D9",
    category: "deep",
  },
  {
    id: "tapestry",
    displayName: "Tapestry",
    description:
      "Plan execution orchestrator — delegates plan tasks to Shuttle, verifies results, and tracks progress",
    color: "#D94A4A",
    category: "deep",
  },
  {
    id: "pattern",
    displayName: "Pattern",
    description: "Strategic planner — produces .weave/plans/ files",
    color: "#9B59B6",
    category: "deep",
  },
  {
    id: "shuttle",
    displayName: "Shuttle",
    description:
      "Domain specialist worker — handles delegated implementation and analysis tasks",
    color: "#E67E22",
    category: "deep",
  },
  {
    id: "thread",
    displayName: "Thread",
    description: "Codebase explorer — fast, read-only analysis and search",
    color: "#27AE60",
    category: "quick",
  },
  {
    id: "spindle",
    displayName: "Spindle",
    description: "External researcher — web fetching and research",
    color: "#F39C12",
    category: "quick",
  },
  {
    id: "weft",
    displayName: "Weft",
    description: "Quality reviewer and auditor",
    color: "#1ABC9C",
    category: "deep",
  },
  {
    id: "warp",
    displayName: "Warp",
    description: "Security auditor",
    color: "#E74C3C",
    category: "deep",
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
        default: WEAVE_SCHEMA_URL_DEFAULT,
        placeholder: "weave config schema URL",
        description: "JSON Schema URL for the generated weave config",
      },
      {
        key: "logLevel",
        type: "select",
        label: "Log Level",
        required: false,
        default: WEAVE_LOG_LEVEL_DEFAULT,
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
        default: WEAVE_TMUX_ENABLED_DEFAULT,
        description: "Enable tmux session management",
      },
      {
        key: "analyticsEnabled",
        type: "boolean",
        label: "Analytics Enabled",
        required: false,
        default: WEAVE_ANALYTICS_ENABLED_DEFAULT,
        description: "Enable usage analytics collection",
      },
      {
        key: "analyticsUseFingerprint",
        type: "boolean",
        label: "Analytics Use Fingerprint",
        required: false,
        default: WEAVE_ANALYTICS_USE_FINGERPRINT_DEFAULT,
        description: "Use fingerprint for analytics tracking",
      },
      {
        key: "continuationRecoveryCompaction",
        type: "boolean",
        label: "Continuation Recovery Compaction",
        required: false,
        default: WEAVE_CONTINUATION_RECOVERY_COMPACTION_DEFAULT,
        description: "Enable context compaction during recovery",
      },
      {
        key: "continuationIdleEnabled",
        type: "boolean",
        label: "Continuation Idle Enabled",
        required: false,
        default: WEAVE_CONTINUATION_IDLE_ENABLED_DEFAULT,
        description: "Enable idle continuation processing",
      },
      {
        key: "continuationIdleWork",
        type: "boolean",
        label: "Continuation Idle Work",
        required: false,
        default: WEAVE_CONTINUATION_IDLE_WORK_DEFAULT,
        description: "Allow work during idle periods",
      },
      {
        key: "continuationIdleTodoPrompt",
        type: "boolean",
        label: "Continuation Idle Todo Prompt",
        required: false,
        default: WEAVE_CONTINUATION_IDLE_TODO_PROMPT_DEFAULT,
        description: "Show todo prompt during idle",
      },
      {
        key: "permissionQuestion",
        type: "select",
        label: "Permission Question Behavior",
        required: false,
        default: WEAVE_PERMISSION_QUESTION_DEFAULT,
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
        default: [...WEAVE_SKILL_DIRECTORIES_DEFAULT],
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
    const schemaUrl = config.$schema ?? WEAVE_SCHEMA_URL_DEFAULT;

    const modelNames = ctx.modelNames ?? DEFAULT_MODEL_NAMES;

    const baseOutput: Omit<WeaveConfigOutput, "agents" | "categories"> = {
      $schema: schemaUrl,
      log_level: config.logLevel ?? WEAVE_LOG_LEVEL_DEFAULT,
      tmux: { enabled: config.tmuxEnabled ?? WEAVE_TMUX_ENABLED_DEFAULT },
      analytics: {
        enabled: config.analyticsEnabled ?? WEAVE_ANALYTICS_ENABLED_DEFAULT,
        use_fingerprint:
          config.analyticsUseFingerprint ??
          WEAVE_ANALYTICS_USE_FINGERPRINT_DEFAULT,
      },
      continuation: {
        recovery: {
          compaction:
            config.continuationRecoveryCompaction ??
            WEAVE_CONTINUATION_RECOVERY_COMPACTION_DEFAULT,
        },
        idle: {
          enabled:
            config.continuationIdleEnabled ??
            WEAVE_CONTINUATION_IDLE_ENABLED_DEFAULT,
          work:
            config.continuationIdleWork ?? WEAVE_CONTINUATION_IDLE_WORK_DEFAULT,
          workflow: true,
          todo_prompt:
            config.continuationIdleTodoPrompt ??
            WEAVE_CONTINUATION_IDLE_TODO_PROMPT_DEFAULT,
        },
      },
      skill_directories: config.skillDirectories ?? [
        ...WEAVE_SKILL_DIRECTORIES_DEFAULT,
      ],
    };

    // Agent routing: weaveAgentId -> systemAgentId (UI / plugins.jsonc format)
    const rawAgentMappings: Record<string, string | string[]> =
      (routing.routing?.agents as Record<string, string | string[]>) ?? {};
    const agentMappings = normalizeAgentMappings(rawAgentMappings);

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
      const systemAgentId = agentMappings[weaveAgent.id]?.[0];
      if (!systemAgentId) continue;

      const systemAgent = systemAgentMap.get(systemAgentId);
      if (!systemAgent) continue;

      const model = systemAgent.model ?? "";
      const models = model
        ? this.resolveModels(systemAgentId, modelNames, ctx)
        : [];

      outputAgents[weaveAgent.id] = {
        display_name: systemAgent.displayName ?? weaveAgent.displayName,
        model: models[0] ?? model,
        fallback_models: models.slice(1),
        temperature: systemAgent.config?.temperature ?? 0.2,
        color: systemAgent.config?.color ?? "",
        category: weaveAgent.category,
      };
    }

    // Build weave categories output from plugin routing config.
    // Categories are dynamic and only emitted when enabled in
    // routing.categories.
    const outputCategories: Record<string, WeaveCategoryOutput> = {};
    const categoryRouting = routing.routing?.categories ?? {};
    for (const [categoryId, enabled] of Object.entries(categoryRouting)) {
      if (!enabled) continue;

      const systemCat = ctx.allCategories?.[categoryId];
      if (!systemCat) continue;

      const catModel = systemCat.model ?? "";
      const models = catModel
        ? this.resolveModels(categoryId, modelNames, ctx)
        : [];

      outputCategories[categoryId] = {
        description: systemCat.description ?? "",
        model: models[0] ?? catModel,
        fallback_models: models.slice(1),
        temperature: systemCat.temperature ?? 0.2,
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
   * Resolve model slot names into aliased format: role/slot_name.
   * E.g., role="loom" + slots=["gpt-5.5","gpt-5.4"] → ["loom/gpt-5.5","loom/gpt-5.4"]
   */
  private resolveModels(
    role: string,
    modelNames: readonly string[],
    _ctx: TransformContext,
  ): string[] {
    return modelNames.map((slot) => `${role}/${slot}`);
  }
}
