export const SETTING_KEYS = {
  DEFAULT_CREDENTIAL: "default_credential",
  HEALTH_CHECK_PROMPT: "health_check_prompt",
  ROUTER_SETTINGS: "router_settings",
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

export interface DefaultCredentialSetting {
  default_credential: string;
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
