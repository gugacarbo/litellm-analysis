import type { VsCodePluginConfig } from "./plugin.config";

export const vscodePluginDefaults = {
  $schema:
    "https://raw.githubusercontent.com/opensoft/lite-llm-analytics/main/services/agent-plugins/src/plugins/vscode/schemas/vscode.schema.json",
  commitLanguage: "Portuguese (Brazil)",
  retryEnabled: true,
  maxRetryAttempts: 3,
} as Required<VsCodePluginConfig>;
