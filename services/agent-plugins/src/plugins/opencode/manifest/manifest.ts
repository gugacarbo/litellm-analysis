import type { PluginManifest } from "../../../sdk";

export const openCodeManifest: PluginManifest<"opencode"> = {
  id: "opencode",
  displayName: "OpenCode AI SDK",
  $schema: "./schemas/opencode.schema.json",
  output: { fileName: "opencode.json" },
  internalAgents: [],
  version: 2,
};
