import type { PluginManifest } from "../../sdk";
import {
  vsCodePluginConfigSchema,
  type VsCodePluginConfig,
} from "./plugin.config";
import { vscodePluginDefaults } from "./plugin.defaults";

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

export const vsCodeManifest: PluginManifest<
  "vscode",
  VsCodePluginConfig,
  VsCodeModelsOutput
> = {
  id: "vscode",
  displayName: "VS Code OAICopilot",
  version: 2,
  output: { fileName: "vscode-oaicopilot.json" },
  capabilities: {
    usesAgents: false,
    usesCategories: false,
    usesModels: true,
  },
  internalAgents: [],
  configSchema: [
    {
      key: "commitLanguage",
      type: "string",
      label: "Commit Language",
      required: false,
      default: vscodePluginDefaults.commitLanguage,
      description: "Language for commit messages",
    },
    {
      key: "retryEnabled",
      type: "boolean",
      label: "Enable Retry",
      required: false,
      default: vscodePluginDefaults.retryEnabled,
      description: "Enable retry on failed requests",
    },
    {
      key: "maxRetryAttempts",
      type: "number",
      label: "Max Retry Attempts",
      required: false,
      default: vscodePluginDefaults.maxRetryAttempts,
      description: "Maximum number of retry attempts",
    },
  ],
  configZodSchema: vsCodePluginConfigSchema,
};
