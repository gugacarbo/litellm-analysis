import type {
  PluginRouting,
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
  weavePluginConfigSchema,
} from "@lite-llm/agents-repository/schemas";
import { normalizeAgentMappings } from "../../helpers";
import type { PluginDefinition, PluginManifest } from "../../sdk";
import { weaveSchema } from "./plugin.schema";

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

const DEFAULT_MODEL_NAMES = ["gpt-5.5", "gpt-5.4"] as const;

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

function resolveModels(role: string, modelNames: readonly string[]): string[] {
  return modelNames.map((slot) => `${role}/${slot}`);
}

export const weaveManifest: PluginManifest<
  "weave",
  WeavePluginConfig,
  WeaveConfigOutput
> = {
  id: "weave",
  displayName: "OpenCode Weave",
  version: 2,
  output: { fileName: "weave-config.json" },
  capabilities: {
    usesAgents: true,
    usesCategories: true,
    usesModels: true,
  },
  internalAgents: WEAVE_AGENTS.map((a) => ({
    id: a.id,
    displayName: a.displayName,
    description: a.description,
  })),
  configSchema: [
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
  ],
  configZodSchema: weavePluginConfigSchema,
};

export function createWeavePlugin(): PluginDefinition<
  "weave",
  WeavePluginConfig,
  WeaveConfigOutput
> {
  return {
    manifest: weaveManifest,
    handlers: {
      build(input): WeaveConfigOutput {
        const config: WeavePluginConfig = input.routing.config ?? {};
        const schemaUrl = config.$schema ?? WEAVE_SCHEMA_URL_DEFAULT;

        const modelNames = input.context.modelNames ?? DEFAULT_MODEL_NAMES;

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
                config.continuationIdleWork ??
                WEAVE_CONTINUATION_IDLE_WORK_DEFAULT,
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

        const rawAgentMappings: Record<string, string | string[]> =
          (input.routing.routing?.agents as Record<
            string,
            string | string[]
          >) ?? {};
        const agentMappings = normalizeAgentMappings(rawAgentMappings);

        const systemAgentMap = new Map<string, SystemAgent>();
        for (const agent of input.agents) {
          const systemId = agent.id ?? agent.displayName ?? "";
          if (systemId) {
            systemAgentMap.set(systemId, agent);
          }
        }

        const outputAgents: Record<string, WeaveAgentOutput> = {};

        for (const weaveAgent of WEAVE_AGENTS) {
          const systemAgentId = agentMappings[weaveAgent.id]?.[0];
          if (!systemAgentId) continue;

          const systemAgent = systemAgentMap.get(systemAgentId);
          if (!systemAgent) continue;

          const model = systemAgent.model ?? "";
          const models = model ? resolveModels(systemAgentId, modelNames) : [];

          outputAgents[weaveAgent.id] = {
            display_name: systemAgent.displayName ?? weaveAgent.displayName,
            model: models[0] ?? model,
            fallback_models: models.slice(1),
            temperature: systemAgent.config?.temperature ?? 0.2,
            color: systemAgent.config?.color ?? "",
            category: weaveAgent.category,
          };
        }

        const outputCategories: Record<string, WeaveCategoryOutput> = {};
        const categoryRouting = input.routing.routing?.categories ?? {};
        for (const [categoryId, enabled] of Object.entries(categoryRouting)) {
          if (!enabled) continue;

          const systemCat = input.context.allCategories?.[categoryId];
          if (!systemCat) continue;

          const catModel = systemCat.model ?? "";
          const models = catModel ? resolveModels(categoryId, modelNames) : [];

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
      },
      validate(output): boolean {
        const result = weaveSchema.safeParse(output);
        if (!result.success) {
          console.error(
            "[WeavePlugin] Validation failed:",
            result.error.issues,
          );
        }
        return result.success;
      },
    },
  };
}

export class WeavePlugin {
  readonly id = weaveManifest.id;
  readonly name = weaveManifest.displayName;
  readonly version = weaveManifest.version;

  getInternalAgents() {
    return weaveManifest.internalAgents;
  }

  getConfigSchema() {
    return weaveManifest.configSchema;
  }

  buildOutput(
    agents: SystemAgent[],
    routing: PluginRouting,
    context: Parameters<
      ReturnType<typeof createWeavePlugin>["handlers"]["build"]
    >[0]["context"],
  ) {
    return createWeavePlugin().handlers.build({ agents, routing, context });
  }

  validate(output: unknown): boolean {
    return (
      createWeavePlugin().handlers.validate?.(output as WeaveConfigOutput) ??
      true
    );
  }

  getOutputFile(): string {
    return weaveManifest.output.fileName;
  }
}
