import type { PluginManifest } from "../../sdk";
import {
  type LitellmAliasPluginConfig,
  litellmAliasPluginConfigSchema,
} from "./plugin.config";
import { litellmAliasPluginDefaults } from "./plugin.defaults";

export interface LitellmAliasOutput {
  $schema: string;
  model_group_alias: Record<string, string>;
}

export const litellmAliasManifest: PluginManifest<
  "litellm-alias",
  LitellmAliasPluginConfig,
  LitellmAliasOutput
> = {
  id: "litellm-alias",
  displayName: "LiteLLM Router Aliases",
  version: 2,
  output: { fileName: "litellm-aliases.json" },
  capabilities: {
    usesAgents: true,
    usesCategories: true,
    usesModels: true,
  },
  internalAgents: [],
  configSchema: [
    {
      key: "aliasPrefix",
      type: "string",
      label: "Alias Prefix",
      required: false,
      default: litellmAliasPluginDefaults.aliasPrefix,
      placeholder: "e.g. prod:",
      description: "Text prepended to all generated alias names",
    },
    {
      key: "includeAgents",
      type: "boolean",
      label: "Include Agents",
      required: false,
      default: litellmAliasPluginDefaults.includeAgents,
      description: "Include agent-based aliases in output",
    },
    {
      key: "includeCategories",
      type: "boolean",
      label: "Include Categories",
      required: false,
      default: litellmAliasPluginDefaults.includeCategories,
      description: "Include category-based aliases in output",
    },
    {
      key: "globalFallbackOverride",
      type: "string",
      label: "Global Fallback Override",
      required: false,
      default: litellmAliasPluginDefaults.globalFallbackOverride,
      placeholder: "e.g. gpt-4o-mini",
      description: "Override global fallback model (empty = use default)",
    },
  ],
  configZodSchema: litellmAliasPluginConfigSchema,
};
