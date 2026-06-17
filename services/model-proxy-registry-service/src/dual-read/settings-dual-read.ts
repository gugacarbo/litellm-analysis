import {
  getDefaultCredential,
  getHealthCheckPrompt,
  getRouterSettings,
} from "@lite-llm/analytics-service/queries";
import type { ISettingsService } from "../services/settings.service.js";
import type { RouterSettingsValue } from "../types/settings.js";

export async function getDefaultCredentialWithFallback(
  settingsService: ISettingsService,
): Promise<string | null> {
  const fromRegistry = await settingsService.getDefaultCredential();
  if (fromRegistry) {
    return fromRegistry;
  }

  try {
    return await getDefaultCredential();
  } catch {
    return null;
  }
}

export async function getHealthCheckPromptWithFallback(
  settingsService: ISettingsService,
): Promise<string | null> {
  const fromRegistry = await settingsService.getHealthCheckPrompt();
  if (fromRegistry) {
    return fromRegistry;
  }

  try {
    return await getHealthCheckPrompt();
  } catch {
    return null;
  }
}

export async function getRouterSettingsWithFallback(
  settingsService: ISettingsService,
): Promise<RouterSettingsValue | null> {
  const fromRegistry = await settingsService.getRouterSettings();
  if (fromRegistry) {
    return fromRegistry;
  }

  try {
    const legacy = await getRouterSettings();
    return legacy as RouterSettingsValue | null;
  } catch {
    return null;
  }
}
