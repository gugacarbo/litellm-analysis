import type { PluginManifest } from "../../../sdk";

export const vsCodeManifest: PluginManifest<"vscode"> = {
  id: "vscode",
  displayName: "VS Code OAICopilot",
  version: 2,
  output: { fileName: "vscode-oaicopilot.json" },
  $schema: "./schemas/vscode.schema.json",
};
