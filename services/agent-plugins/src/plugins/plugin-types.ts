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

import type { LitellmAliasPluginConfig } from "./litellm-alias/plugin.config";
import type { OpenAgentPluginConfig } from "./openagent/plugin.config";
import type { OpenCodePluginConfig } from "./opencode/plugin.config";
import type { VsCodePluginConfig } from "./vscode/plugin.config";
import type { WeavePluginConfig } from "./weave/plugin.config";

export interface PluginConfigMap {
  opencode: OpenCodePluginConfig;
  openagent: OpenAgentPluginConfig;
  vscode: VsCodePluginConfig;
  "litellm-alias": LitellmAliasPluginConfig;
  weave: WeavePluginConfig;
}

export type PluginConfigFor<TId extends keyof PluginConfigMap> =
  PluginConfigMap[TId];
