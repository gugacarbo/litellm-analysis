import type { PluginManifest } from "../../sdk";

export interface OpenCodeProviders {
  $schema: string;
  provider: Record<string, unknown>;
}

export const openCodeManifest: PluginManifest<"opencode"> = {
  id: "opencode",
  displayName: "OpenCode AI SDK",
  $schema: "./schemas/opencode.schema.json",
  output: { fileName: "opencode.json" },
  internalAgents: [],
  version: 2,
};
