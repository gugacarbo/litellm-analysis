import {
  getDefaultCredential,
  getHealthCheckPrompt,
  getRouterSettings,
} from "@lite-llm/analytics-service/queries";
import type { ISettingsService } from "../services/settings.service.js";
import {
  createEmptyLegacyImportSummary,
  type LegacyImportOptions,
  type LegacyImportPhaseSummary,
} from "../types/legacy-import.js";
import { SETTING_KEYS } from "../types/settings.js";

export interface LegacyConfigReader {
  getDefaultCredential(): Promise<string | null>;
  getHealthCheckPrompt(): Promise<string | null>;
  getRouterSettings(): Promise<Record<string, unknown> | null>;
}

export type LegacyConfigQueryFn = (
  paramName: string,
) => Promise<{ param_value: unknown } | undefined>;

export interface LegacyConfigSource {
  defaultCredential: string | null;
  healthCheckPrompt: string | null;
  routerSettings: Record<string, unknown> | null;
}

export interface LegacyConfigAdapterOptions extends LegacyImportOptions {
  settingsService: ISettingsService;
  reader?: LegacyConfigReader;
}

export interface LegacySettingRow {
  key: string;
  value: unknown;
}

function createDefaultLegacyConfigReader(): LegacyConfigReader {
  return {
    getDefaultCredential,
    getHealthCheckPrompt,
    getRouterSettings,
  };
}

export function extractDefaultCredential(paramValue: unknown): string | null {
  if (!paramValue || typeof paramValue !== "object") {
    return null;
  }
  const value = (paramValue as Record<string, unknown>).default_credential;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function extractHealthCheckPrompt(paramValue: unknown): string | null {
  if (!paramValue || typeof paramValue !== "object") {
    return null;
  }
  const prompt = (paramValue as Record<string, unknown>).health_check_prompt;
  if (typeof prompt !== "string") {
    return null;
  }
  const normalized = prompt.trim();
  return normalized ? normalized : null;
}

function configQueryFnToReader(query: LegacyConfigQueryFn): LegacyConfigReader {
  return {
    async getDefaultCredential() {
      const row = await query(SETTING_KEYS.DEFAULT_CREDENTIAL);
      return extractDefaultCredential(row?.param_value);
    },
    async getHealthCheckPrompt() {
      const row = await query("general_settings");
      return extractHealthCheckPrompt(row?.param_value);
    },
    async getRouterSettings() {
      const row = await query(SETTING_KEYS.ROUTER_SETTINGS);
      if (!row?.param_value || typeof row.param_value !== "object") {
        return null;
      }
      return structuredClone(row.param_value as Record<string, unknown>);
    },
  };
}

function normalizeLegacyConfigReader(
  source?: LegacyConfigReader | LegacyConfigQueryFn,
): LegacyConfigReader {
  if (!source) {
    return createDefaultLegacyConfigReader();
  }
  if (typeof source === "function") {
    return configQueryFnToReader(source);
  }
  return source;
}

export async function readLegacyConfigSource(
  source?: LegacyConfigReader | LegacyConfigQueryFn,
): Promise<LegacyConfigSource> {
  const reader = normalizeLegacyConfigReader(source);
  return {
    defaultCredential: await reader.getDefaultCredential(),
    healthCheckPrompt: await reader.getHealthCheckPrompt(),
    routerSettings: await reader.getRouterSettings(),
  };
}

export function buildSettingsRows(
  source: LegacyConfigSource,
): LegacySettingRow[] {
  const rows: LegacySettingRow[] = [];

  if (source.defaultCredential) {
    rows.push({
      key: SETTING_KEYS.DEFAULT_CREDENTIAL,
      value: { default_credential: source.defaultCredential },
    });
  }

  if (source.healthCheckPrompt) {
    rows.push({
      key: SETTING_KEYS.HEALTH_CHECK_PROMPT,
      value: { health_check_prompt: source.healthCheckPrompt },
    });
  }

  if (source.routerSettings) {
    rows.push({
      key: SETTING_KEYS.ROUTER_SETTINGS,
      value: structuredClone(source.routerSettings),
    });
  }

  return rows;
}

type UpsertOutcome = "inserted" | "updated" | "skipped";

async function upsertDefaultCredential(
  settingsService: ISettingsService,
  credentialName: string,
  options: LegacyImportOptions,
): Promise<UpsertOutcome> {
  const existing = await settingsService.getDefaultCredential();
  if (existing !== null && !options.force) {
    return "skipped";
  }
  if (options.dryRun) {
    return existing === null ? "inserted" : "updated";
  }
  await settingsService.setDefaultCredential(credentialName);
  return existing === null ? "inserted" : "updated";
}

async function upsertHealthCheckPrompt(
  settingsService: ISettingsService,
  prompt: string,
  options: LegacyImportOptions,
): Promise<UpsertOutcome> {
  const existing = await settingsService.getHealthCheckPrompt();
  if (existing !== null && !options.force) {
    return "skipped";
  }
  if (options.dryRun) {
    return existing === null ? "inserted" : "updated";
  }
  await settingsService.setHealthCheckPrompt(prompt);
  return existing === null ? "inserted" : "updated";
}

async function upsertRouterSettings(
  settingsService: ISettingsService,
  value: Record<string, unknown>,
  options: LegacyImportOptions,
): Promise<UpsertOutcome> {
  const existing = await settingsService.getRouterSettings();
  if (existing !== null && !options.force) {
    return "skipped";
  }
  if (options.dryRun) {
    return existing === null ? "inserted" : "updated";
  }
  await settingsService.setRouterSettings(structuredClone(value));
  return existing === null ? "inserted" : "updated";
}

function applyOutcome(
  summary: LegacyImportPhaseSummary,
  outcome: UpsertOutcome,
): void {
  if (outcome === "inserted") {
    summary.inserted += 1;
  } else if (outcome === "updated") {
    summary.updated += 1;
  } else {
    summary.skipped += 1;
  }
}

export async function importLegacyConfig(
  options: LegacyConfigAdapterOptions,
): Promise<LegacyImportPhaseSummary> {
  const reader = options.reader ?? createDefaultLegacyConfigReader();
  const { settingsService, dryRun = false, force = false } = options;
  const importOptions: LegacyImportOptions = { dryRun, force };
  const summary = createEmptyLegacyImportSummary();

  try {
    const defaultCredential = await reader.getDefaultCredential();
    if (defaultCredential) {
      applyOutcome(
        summary,
        await upsertDefaultCredential(
          settingsService,
          defaultCredential,
          importOptions,
        ),
      );
    }
  } catch (error) {
    summary.errors.push({
      key: SETTING_KEYS.DEFAULT_CREDENTIAL,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const healthCheckPrompt = await reader.getHealthCheckPrompt();
    if (healthCheckPrompt) {
      applyOutcome(
        summary,
        await upsertHealthCheckPrompt(
          settingsService,
          healthCheckPrompt,
          importOptions,
        ),
      );
    }
  } catch (error) {
    summary.errors.push({
      key: SETTING_KEYS.HEALTH_CHECK_PROMPT,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const routerSettings = await reader.getRouterSettings();
    if (routerSettings) {
      applyOutcome(
        summary,
        await upsertRouterSettings(
          settingsService,
          routerSettings,
          importOptions,
        ),
      );
    }
  } catch (error) {
    summary.errors.push({
      key: SETTING_KEYS.ROUTER_SETTINGS,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  return summary;
}
