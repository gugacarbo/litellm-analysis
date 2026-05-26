import type { PluginManifest } from "../../sdk";

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

export const openAgentManifest: PluginManifest<"openagent"> = {
  id: "openagent",
  displayName: "Oh My OpenAgent",
  version: 2,
  output: { fileName: "oh-my-openagent.json" },
  $schema:
    "https://raw.githubusercontent.com/opensoft/oh-my-opencode/dev/assets/oh-my-opencode.schema.json",
  internalAgents: [
    {
      id: "default",
      displayName: "Default",
      description: "Default OpenAgent",
    },
  ],
};
