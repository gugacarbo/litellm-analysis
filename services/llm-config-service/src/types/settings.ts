export const SETTING_KEYS = {
  DEFAULT_PROVIDER: "default_provider",
  HEALTH_CHECK_PROMPT: "health_check_prompt",
  OPENAI_OAUTH_CONNECTION: "openai_oauth_connection",
  ROUTER_SETTINGS: "router_settings",
  DASHBOARD_AGENTS: "dashboard.agents",
  DASHBOARD_PLUGINS: "dashboard.plugins",
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

export interface DefaultProviderSetting {
  default_provider: string;
}

export interface HealthCheckPromptSetting {
  health_check_prompt: string;
}

export type RouterSettingsValue = Record<string, unknown>;

export interface ModelProxySettingRecord {
  id: string;
  key: string;
  value: unknown;
  createdAt: Date;
  updatedAt: Date;
}
