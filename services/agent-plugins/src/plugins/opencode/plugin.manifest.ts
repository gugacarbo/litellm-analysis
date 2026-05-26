import type { PluginManifest } from "../../sdk";
import {
  openCodePluginConfigSchema,
  type OpenCodePluginConfig,
} from "./plugin.config";
import { opencodePluginDefaults } from "./plugin.defaults";

export interface OpenCodeProviders {
  $schema: string;
  provider: Record<string, unknown>;
}

export const openCodeManifest: PluginManifest<
  "opencode",
  OpenCodePluginConfig,
  OpenCodeProviders
> = {
  id: "opencode",
  displayName: "OpenCode AI SDK",
  version: 2,
  output: { fileName: "opencode.json" },
  capabilities: {
    usesAgents: true,
    usesCategories: true,
    usesModels: true,
  },
  internalAgents: [],
  configSchema: [
    {
      key: "defaultModel",
      type: "string",
      label: "Default Model",
      required: false,
      default: opencodePluginDefaults.defaultModel,
      placeholder: "e.g. gpt-4",
      description: "Model to use when a system agent has no model configured",
    },
    {
      key: "defaultTemperature",
      type: "number",
      label: "Default Temperature",
      required: false,
      default: opencodePluginDefaults.defaultTemperature,
      description:
        "Default sampling temperature for agents without one configured",
    },
  ],
  configZodSchema: openCodePluginConfigSchema,
};
