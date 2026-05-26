import type { PluginManifest } from "../../sdk";

export interface LitellmAliasOutput {
  $schema: string;
  model_group_alias: Record<string, string>;
}

export const litellmAliasManifest: PluginManifest<
  "litellm-alias",
  LitellmAliasOutput
> = {
  id: "litellm-alias",
  displayName: "LiteLLM Router Aliases",
  version: 2,
  output: { fileName: "litellm-aliases.json" },
  $schema:
    "https://raw.githubusercontent.com/opensoft/lite-llm-analytics/main/services/agent-plugins/src/plugins/litellm-alias/schemas/litellm-alias.schema.json",
};
