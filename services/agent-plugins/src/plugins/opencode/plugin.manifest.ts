import type { PluginManifest } from "../../sdk";

export interface OpenCodeProviders {
  $schema: string;
  provider: Record<string, unknown>;
}

export const openCodeManifest: PluginManifest<"opencode", OpenCodeProviders> = {
  id: "opencode",
  displayName: "OpenCode AI SDK",
  version: 2,
  output: { fileName: "opencode.json" },
  $schema: "https://opencode.ai/config.json",
  internalAgents: [],
};
