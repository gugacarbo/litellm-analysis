import {
  VSCODE_COMMIT_LANGUAGE_DEFAULT,
  VSCODE_MAX_RETRY_ATTEMPTS_DEFAULT,
  VSCODE_RETRY_ENABLED_DEFAULT,
  VSCODE_SCHEMA_URL_DEFAULT,
  type VsCodePluginConfig,
} from "@lite-llm/agents-repository/schemas";

export const vscodePluginDefaults: VsCodePluginConfig = {
  $schema: VSCODE_SCHEMA_URL_DEFAULT,
  commitLanguage: VSCODE_COMMIT_LANGUAGE_DEFAULT,
  retryEnabled: VSCODE_RETRY_ENABLED_DEFAULT,
  maxRetryAttempts: VSCODE_MAX_RETRY_ATTEMPTS_DEFAULT,
};
