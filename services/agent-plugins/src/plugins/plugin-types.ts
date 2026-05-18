export interface InternalAgent {
  id: string;
  displayName: string;
  description: string;
}

export interface ConfigField {
  key: string;
  type:
    | "string"
    | "number"
    | "boolean"
    | "select"
    | "password"
    | "multiselect"
    | "switch-group";
  label: string;
  required?: boolean;
  default?: unknown;
  options?: { value: string; label: string }[];
  placeholder?: string;
  description?: string;
}

import type { LitellmAliasConfig } from "./litellm-alias/schemas/generated/litellm-alias-config";
import type { OpenAgentConfig } from "./openagent/schemas/generated/openagent-config";
import type { OpenCodeConfig } from "./opencode/schemas/generated/opencode-config";
import type { VsCodeConfig } from "./vscode/schemas/generated/vscode-config";

export interface PluginConfigMap {
  opencode: OpenCodeConfig;
  openagent: OpenAgentConfig;
  vscode: VsCodeConfig;
  "litellm-alias": LitellmAliasConfig;
}

export type PluginConfigFor<TId extends keyof PluginConfigMap> =
  PluginConfigMap[TId];
