import type { PluginManifest } from "../../sdk";
import {
  type OpenAgentPluginConfig,
  openAgentPluginConfigSchema,
} from "./plugin.config";
import { openagentPluginDefaults } from "./plugin.defaults";

export interface OpenAgentOutput {
  $schema: string;
  globalFallbackModel?: string;
  git_master: {
    commit_footer: boolean;
    include_co_authored_by: boolean;
  };
  agents: Record<string, Record<string, unknown>>;
  categories: Record<string, Record<string, unknown>>;
}

export const openAgentManifest: PluginManifest<
  "openagent",
  OpenAgentPluginConfig,
  OpenAgentOutput
> = {
  id: "openagent",
  displayName: "Oh My OpenAgent",
  version: 2,
  output: { fileName: "oh-my-openagent.json" },
  capabilities: {
    usesAgents: true,
    usesCategories: true,
    usesModels: false,
  },
  internalAgents: [
    {
      id: "default",
      displayName: "Default",
      description: "Default OpenAgent",
    },
  ],
  configSchema: [
    {
      key: "commitFooter",
      type: "boolean",
      label: "Commit Footer",
      required: false,
      default: openagentPluginDefaults.commitFooter,
      description: "Add footer to commit messages",
    },
    {
      key: "includeCoAuthoredBy",
      type: "boolean",
      label: "Include Co-Authored-By",
      required: false,
      default: openagentPluginDefaults.includeCoAuthoredBy,
      description: "Include co-authored-by trailer in commits",
    },
  ],
  configZodSchema: openAgentPluginConfigSchema,
};
