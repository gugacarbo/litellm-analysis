import type { PluginManifest } from "../../../sdk";

export const modelAliasManifest: PluginManifest<"model-alias"> = {
  id: "model-alias",
  displayName: "Model Aliases",
  version: 2,
  output: { fileName: "model-aliases.json" },
  $schema: "./schemas/model-alias.schema.json",
};
