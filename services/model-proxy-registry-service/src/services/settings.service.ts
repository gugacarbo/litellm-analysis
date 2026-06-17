import type { Prisma, PrismaClient } from "@lite-llm/model-proxy-repository";
import { SettingsRepository } from "../repositories/settings-repository.js";
import {
  type DefaultCredentialSetting,
  type HealthCheckPromptSetting,
  type ModelProxySettingRecord,
  type RouterSettingsValue,
  SETTING_KEYS,
  type SettingKey,
} from "../types/settings.js";

export interface SettingsServiceOptions {
  prisma?: PrismaClient;
  repository?: SettingsRepository;
}

function readStringField(value: unknown, field: string): string | undefined {
  if (
    value !== null &&
    typeof value === "object" &&
    field in value &&
    typeof (value as Record<string, unknown>)[field] === "string"
  ) {
    return (value as Record<string, string>)[field];
  }
  return undefined;
}

export interface ISettingsService {
  getByKey(key: SettingKey): Promise<ModelProxySettingRecord | null>;
  list(): Promise<ModelProxySettingRecord[]>;
  upsertByKey(
    key: SettingKey,
    value: unknown,
  ): Promise<ModelProxySettingRecord>;
  deleteByKey(key: SettingKey): Promise<boolean>;
  getDefaultCredential(): Promise<string | null>;
  setDefaultCredential(credentialName: string): Promise<void>;
  deleteDefaultCredential(): Promise<boolean>;
  getHealthCheckPrompt(): Promise<string | null>;
  setHealthCheckPrompt(prompt: string): Promise<void>;
  getRouterSettings(): Promise<RouterSettingsValue | null>;
  setRouterSettings(value: RouterSettingsValue): Promise<void>;
}

export class SettingsService implements ISettingsService {
  private readonly repository: SettingsRepository;

  constructor(options: SettingsServiceOptions = {}) {
    this.repository =
      options.repository ??
      new SettingsRepository(
        options.prisma ??
          (() => {
            throw new Error("SettingsService requires prisma or repository");
          })(),
      );
  }

  async getByKey(key: SettingKey): Promise<ModelProxySettingRecord | null> {
    return this.repository.findByKey(key);
  }

  async list(): Promise<ModelProxySettingRecord[]> {
    return this.repository.list();
  }

  async upsertByKey(
    key: SettingKey,
    value: unknown,
  ): Promise<ModelProxySettingRecord> {
    return this.repository.upsert(key, value as never);
  }

  async deleteByKey(key: SettingKey): Promise<boolean> {
    return this.repository.deleteByKey(key);
  }

  async getDefaultCredential(): Promise<string | null> {
    const row = await this.repository.findByKey(
      SETTING_KEYS.DEFAULT_CREDENTIAL,
    );
    if (!row) {
      return null;
    }
    return readStringField(row.value, "default_credential") ?? null;
  }

  async setDefaultCredential(credentialName: string): Promise<void> {
    const trimmed = credentialName.trim();
    if (!trimmed) {
      throw new Error("default_credential must be a non-empty string");
    }
    const value: DefaultCredentialSetting = {
      default_credential: trimmed,
    };
    await this.repository.upsert(
      SETTING_KEYS.DEFAULT_CREDENTIAL,
      value as unknown as Prisma.InputJsonValue,
    );
  }

  async deleteDefaultCredential(): Promise<boolean> {
    return this.repository.deleteByKey(SETTING_KEYS.DEFAULT_CREDENTIAL);
  }

  async getHealthCheckPrompt(): Promise<string | null> {
    const row = await this.repository.findByKey(
      SETTING_KEYS.HEALTH_CHECK_PROMPT,
    );
    if (!row) {
      return null;
    }
    return readStringField(row.value, "health_check_prompt") ?? null;
  }

  async setHealthCheckPrompt(prompt: string): Promise<void> {
    const trimmed = prompt.trim();
    if (!trimmed) {
      throw new Error("health_check_prompt must be a non-empty string");
    }
    const value: HealthCheckPromptSetting = {
      health_check_prompt: trimmed,
    };
    await this.repository.upsert(
      SETTING_KEYS.HEALTH_CHECK_PROMPT,
      value as unknown as Prisma.InputJsonValue,
    );
  }

  async getRouterSettings(): Promise<RouterSettingsValue | null> {
    const row = await this.repository.findByKey(SETTING_KEYS.ROUTER_SETTINGS);
    if (!row || row.value === null || typeof row.value !== "object") {
      return null;
    }
    return row.value as RouterSettingsValue;
  }

  async setRouterSettings(value: RouterSettingsValue): Promise<void> {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("router_settings must be a JSON object");
    }
    await this.repository.upsert(
      SETTING_KEYS.ROUTER_SETTINGS,
      value as unknown as Prisma.InputJsonValue,
    );
  }
}
