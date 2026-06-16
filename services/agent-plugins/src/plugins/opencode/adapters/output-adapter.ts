import { normalizeAgentMappings } from "../../../helpers";
import type { PluginRoutingFor, PluginRuntimeContext } from "../../../sdk";
import type { SystemAgent } from "../../../types";
import type { OpenCodePluginConfig } from "../config/config";
import type { OpencodeSchemaType } from "../plugin.schema";
import { agentAdapter } from "./agent-adapter";
import { modelAdapter } from "./model-adapter";

const DEFAULT_MODEL_NAME = "gpt-5.5";

function addRolePrimaryModel(
  target: Record<string, unknown>,
  role: string,
  displayName: string,
  primaryModelId: string,
  modelName: string,
  context: PluginRuntimeContext,
): void {
  const spec = context.allModels[primaryModelId];
  if (!spec) return;

  target[`${role}/${modelName}`] = modelAdapter(
    `${role}/${modelName}`,
    modelName,
    displayName,
    spec,
  );
}

export interface BuildOpenCodeOutputInput {
  agents: SystemAgent[];
  routing: PluginRoutingFor<OpenCodePluginConfig>;
  context: PluginRuntimeContext;
  config: OpenCodePluginConfig;
}

export function adaptOpenCodeOutput(
  input: BuildOpenCodeOutputInput,
): OpencodeSchemaType {
  const { agents, routing, context, config } = input;
  const configDefaultModel = config.model ?? "";
  const modelName =
    (context.modelNames ?? [DEFAULT_MODEL_NAME])[0] ?? DEFAULT_MODEL_NAME;
  const outputProvider: NonNullable<OpencodeSchemaType["provider"]> = {};

  const output = {
    $schema: config.$schema,
    provider: outputProvider,
  };

  const providerOpts = {
    npm: "@ai-sdk/openai-compatible",
    options: {
      baseURL: context.modelProxyConfig.baseUrl,
      apiKey: context.modelProxyConfig.apiKey,
    },
  };

  const localProxyModels: Record<string, Record<string, unknown>> = {};
  for (const [key, spec] of Object.entries(context.allModels)) {
    localProxyModels[key] = modelAdapter(key, key, spec.displayName, spec);
  }

  output.provider["local-proxy"] = {
    name: "Local Model Proxy",
    ...providerOpts,
    models: localProxyModels,
  };

  const rawEnabledAgents: Record<string, string | string[]> =
    (routing.routing?.agents as Record<string, string | string[]>) ?? {};
  const enabledAgents = normalizeAgentMappings(rawEnabledAgents);
  const llmAgentsModels: Record<string, Record<string, unknown>> = {};

  for (const agent of agents) {
    const adaptedAgent = agentAdapter(
      agent,
      enabledAgents,
      configDefaultModel,
      context,
    );
    if (!adaptedAgent) continue;

    addRolePrimaryModel(
      llmAgentsModels,
      adaptedAgent.role,
      adaptedAgent.displayName,
      adaptedAgent.primaryModelId,
      modelName,
      context,
    );
  }

  if (Object.keys(llmAgentsModels).length > 0) {
    output.provider["llm-agents"] = {
      ...providerOpts,
      models: llmAgentsModels,
    };
  }

  const categoryRouting = routing.routing?.categories ?? {};
  const hasExplicitCategoryRouting = Object.keys(categoryRouting).length > 0;
  if (context.allCategories && Object.keys(context.allCategories).length > 0) {
    const llmCategoriesModels: Record<string, Record<string, unknown>> = {};

    for (const [categoryName, category] of Object.entries(
      context.allCategories,
    )) {
      if (hasExplicitCategoryRouting && !categoryRouting[categoryName])
        continue;

      const primaryModelId =
        category.model || configDefaultModel || categoryName;
      addRolePrimaryModel(
        llmCategoriesModels,
        categoryName,
        categoryName,
        primaryModelId,
        modelName,
        context,
      );
    }

    if (Object.keys(llmCategoriesModels).length > 0) {
      output.provider["llm-categories"] = {
        ...providerOpts,
        models: llmCategoriesModels,
      };
    }
  }

  const globalFallbackId = context.globalFallbackModel;
  if (globalFallbackId) {
    const globalSpec = context.allModels[globalFallbackId];
    if (globalSpec) {
      const globalFallbackEntry = modelAdapter(
        `global-fallback/${modelName}`,
        modelName,
        "Global Fallback",
        globalSpec,
      );
      const globalFallbackEntryId = String(globalFallbackEntry.id);

      output.provider["global-fallback"] = {
        ...providerOpts,
        models: {
          [globalFallbackEntryId]: globalFallbackEntry,
        },
      };
    }
  }

  return output;
}
