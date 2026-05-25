export const OPENCODE_SCHEMA_URL_DEFAULT = "https://opencode.ai/config.json";
export const OPENCODE_DEFAULT_MODEL_DEFAULT = "";
export const OPENCODE_DEFAULT_TEMPERATURE_DEFAULT = 0.2;

export const OPENAGENT_SCHEMA_URL_DEFAULT =
  "https://raw.githubusercontent.com/opensoft/oh-my-opencode/dev/assets/oh-my-opencode.schema.json";
export const OPENAGENT_COMMIT_FOOTER_DEFAULT = false;
export const OPENAGENT_INCLUDE_CO_AUTHORED_BY_DEFAULT = false;

export const VSCODE_SCHEMA_URL_DEFAULT =
  "https://raw.githubusercontent.com/opensoft/lite-llm-analytics/main/services/agent-plugins/src/plugins/vscode/schemas/vscode.schema.json";
export const VSCODE_COMMIT_LANGUAGE_DEFAULT = "Portuguese (Brazil)";
export const VSCODE_RETRY_ENABLED_DEFAULT = true;
export const VSCODE_MAX_RETRY_ATTEMPTS_DEFAULT = 3;

export const LITELLM_ALIAS_SCHEMA_URL_DEFAULT =
  "https://raw.githubusercontent.com/opensoft/lite-llm-analytics/main/services/agent-plugins/src/plugins/litellm-alias/schemas/litellm-alias.schema.json";
export const LITELLM_ALIAS_PREFIX_DEFAULT = "";
export const LITELLM_ALIAS_INCLUDE_AGENTS_DEFAULT = true;
export const LITELLM_ALIAS_INCLUDE_CATEGORIES_DEFAULT = true;
export const LITELLM_ALIAS_GLOBAL_FALLBACK_OVERRIDE_DEFAULT = "";

export const WEAVE_SCHEMA_URL_DEFAULT =
  "/home/gustavo/Apps/opencode-weave/schema/weave-config.schema.json";
export const WEAVE_LOG_LEVEL_DEFAULT = "INFO";
export const WEAVE_TMUX_ENABLED_DEFAULT = true;
export const WEAVE_ANALYTICS_ENABLED_DEFAULT = true;
export const WEAVE_ANALYTICS_USE_FINGERPRINT_DEFAULT = true;
export const WEAVE_CONTINUATION_RECOVERY_COMPACTION_DEFAULT = true;
export const WEAVE_CONTINUATION_IDLE_ENABLED_DEFAULT = true;
export const WEAVE_CONTINUATION_IDLE_WORK_DEFAULT = true;
export const WEAVE_CONTINUATION_IDLE_TODO_PROMPT_DEFAULT = true;
export const WEAVE_PERMISSION_QUESTION_DEFAULT = "allow";
export const WEAVE_SKILL_DIRECTORIES_DEFAULT = [
  "~/.agents/skills",
  "~/.claude/skills",
  "~/.opencode/skills",
] as const;
