import type { PluginManifest } from "../../sdk";

export interface VsCodeModelsOutput {
  $schema: string;
  "oaicopilot.commitLanguage": string;
  "oaicopilot.baseUrl": string;
  "oaicopilot.delay": number;
  "oaicopilot.readFileLines": number;
  "oaicopilot.retry": {
    enabled: boolean;
    max_attempts: number;
    interval_ms: number;
    status_codes: number[];
  };
  "oaicopilot.models": Array<{
    name: string;
    id: string;
    baseUrl: string;
    "request-options": { headers?: Record<string, string> };
    "model-settings"?: { "max-tokens"?: number };
  }>;
}

export const vsCodeManifest: PluginManifest<"vscode", VsCodeModelsOutput> = {
  id: "vscode",
  displayName: "VS Code OAICopilot",
  version: 2,
  output: { fileName: "vscode-oaicopilot.json" },
  $schema:
    "https://raw.githubusercontent.com/opensoft/lite-llm-analytics/main/services/agent-plugins/src/plugins/vscode/schemas/vscode.schema.json",
};
