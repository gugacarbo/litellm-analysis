import type { LitellmAliasPluginConfig } from "./plugin.config";

export const litellmAliasPluginDefaults: Required<LitellmAliasPluginConfig> = {
  $schema:
    "https://raw.githubusercontent.com/opensoft/lite-llm-analytics/main/services/agent-plugins/src/plugins/litellm-alias/schemas/litellm-alias.schema.json",
  aliasPrefix: "",
  includeAgents: true,
  includeCategories: true,
  globalFallbackOverride: "",
};
