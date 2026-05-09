import type {
  AgentEntry,
  CategoryEntry,
  DbConfig,
} from "@lite-llm/agents-repository/repository";
import type { IPlugin, PluginEntry, TransformContext } from "../plugin";

const CURRENT_VERSION = 1;

interface OpenAgentConfig {
  $schema: string;
  globalFallbackModel?: string;
  git_master: {
    commit_footer: boolean;
    include_co_authored_by: boolean;
  };
  agents: Record<string, PluginEntry>;
  categories: Record<string, PluginEntry>;
}

export class OpenAgentPlugin implements IPlugin {
  readonly id = "openagent";
  readonly name = "Oh My OpenAgent";
  readonly version = CURRENT_VERSION;
  readonly outputFile = "oh-my-openagent.json";
  readonly builtin = false;

  transformEntry(
    entry: AgentEntry | CategoryEntry,
    ctx: TransformContext,
  ): PluginEntry {
    const result: PluginEntry = {};

    if ("color" in entry) {
      result.color = entry.color;
    }
    if ("disable" in entry) {
      result.disable = entry.disable;
    }
    if ("tools" in entry) {
      result.tools = entry.tools;
    }
    if ("mode" in entry) {
      result.mode = entry.mode;
    }

    // Model references use prefix/version format
    result.model = `${ctx.entryKey}/gpt-5.5`;

    if (entry.fallbackModels?.length) {
      result.fallback_models = entry.fallbackModels.map(
        (m) => `${ctx.entryKey}/${m}`,
      );
    }

    if (entry.description) {
      result.description = entry.description;
    }

    // Copy category-specific fields
    if ("thinking" in entry) {
      result.thinking = entry.thinking;
    }
    if ("reasoningEffort" in entry) {
      result.reasoningEffort = entry.reasoningEffort;
    }
    if ("textVerbosity" in entry) {
      result.textVerbosity = entry.textVerbosity;
    }
    if ("maxTokens" in entry) {
      result.maxTokens = entry.maxTokens;
    }

    return result;
  }

  transformModel(): undefined {
    // OpenAgent doesn't export models separately
    return undefined;
  }

  preprocess(config: DbConfig): OpenAgentConfig {
    return {
      $schema:
        "https://raw.githubusercontent.com/opensoft/oh-my-opencode/dev/assets/oh-my-opencode.schema.json",
      globalFallbackModel: config.globalFallbackModel,
      git_master: {
        commit_footer: false,
        include_co_authored_by: false,
      },
      agents: {},
      categories: {},
    };
  }

  buildOutput(config: DbConfig, _context: TransformContext): OpenAgentConfig {
    const output = this.preprocess(config) as OpenAgentConfig;

    // Transform agents
    for (const [key, entry] of Object.entries(config.agents)) {
      output.agents[key] = this.transformEntry(entry, {
        entryKey: key,
        entryType: "agent",
        allModels: config.models,
        globalFallbackModel: config.globalFallbackModel,
        litellmConfig: config.litellm,
        resolvedModels: new Map(),
      });
    }

    // Transform categories
    for (const [key, entry] of Object.entries(config.categories)) {
      output.categories[key] = this.transformEntry(entry, {
        entryKey: key,
        entryType: "category",
        allModels: config.models,
        globalFallbackModel: config.globalFallbackModel,
        litellmConfig: config.litellm,
        resolvedModels: new Map(),
      });
    }

    return output;
  }

  getOutputFile(): string {
    return this.outputFile;
  }
}
