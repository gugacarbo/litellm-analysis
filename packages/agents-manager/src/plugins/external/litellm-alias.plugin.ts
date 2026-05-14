import type {
  PluginRouting,
  SystemAgent,
} from "@lite-llm/agents-repository/schemas";
import {
  generateLitellmAliases,
  sortAliasesByDefinitionOrder,
} from "@lite-llm/models-manager";
import type { IPlugin, TransformContext } from "../plugin.js";
import type { ConfigField, InternalAgent } from "../plugin-types.js";

export interface AliasDbWriter {
  updateAliases(aliases: Record<string, string>): Promise<void>;
}

interface LitellmAliasOutput {
  model_group_alias: Record<string, string>;
}

type AgentWithId = SystemAgent & { id: string };

export class LitellmAliasPlugin implements IPlugin {
  readonly id = "litellm-alias";
  readonly name = "LiteLLM Router Aliases";
  readonly version = 1;
  readonly outputFile = "litellm-aliases.json";

  private dbWriter?: AliasDbWriter;

  constructor(dbWriter?: AliasDbWriter) {
    this.dbWriter = dbWriter;
  }

  getInternalAgents(): InternalAgent[] {
    return [];
  }

  getConfigSchema(): ConfigField[] {
    return [];
  }

  getOutputFile(): string {
    return this.outputFile;
  }

  buildOutput(
    agents: SystemAgent[],
    _routing: PluginRouting,
    ctx: TransformContext,
  ): LitellmAliasOutput {
    const aliases: Record<string, string> = {};
    const globalFallback = ctx.globalFallbackModel;

    for (const agent of agents as AgentWithId[]) {
      Object.assign(
        aliases,
        generateLitellmAliases(
          agent.id,
          agent.model || "",
          agent.fallbackModels,
          globalFallback,
        ),
      );
    }

    for (const [key, category] of Object.entries(ctx.allCategories ?? {})) {
      Object.assign(
        aliases,
        generateLitellmAliases(
          key,
          category.model || "",
          category.fallbackModels,
          globalFallback,
        ),
      );
    }

    return {
      model_group_alias: sortAliasesByDefinitionOrder(aliases),
    };
  }

  async afterExport(output: unknown): Promise<void> {
    if (!this.dbWriter) return;

    try {
      const { model_group_alias } = output as LitellmAliasOutput;
      await this.dbWriter.updateAliases(model_group_alias);
    } catch (error) {
      console.error(
        `[LitellmAliasPlugin] Failed to sync aliases to DB: ${error}`,
      );
    }
  }
}
