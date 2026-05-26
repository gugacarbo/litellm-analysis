import type { PluginManifest } from "../../sdk";

export const litellmAliasManifest: PluginManifest<"litellm-alias"> = {
  id: "litellm-alias",
  displayName: "LiteLLM Router Aliases",
  version: 2,
  output: { fileName: "litellm-aliases.json" },
  $schema: "./schemas/litellm-alias.schema.json",
};
