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

import type { ModelAliasPluginConfig } from "./model-alias/config/config";
import type { OpenAgentPluginConfig } from "./openagent/config/config";
import type { OpenCodePluginConfig } from "./opencode/config/config";
import type { VsCodePluginConfig } from "./vscode/config/config";
import type { WeavePluginConfig } from "./weave/config/config";

export interface PluginConfigMap {
  opencode: OpenCodePluginConfig;
  openagent: OpenAgentPluginConfig;
  vscode: VsCodePluginConfig;
  "model-alias": ModelAliasPluginConfig;
  weave: WeavePluginConfig;
}

export type PluginConfigFor<TId extends keyof PluginConfigMap> =
  PluginConfigMap[TId];
