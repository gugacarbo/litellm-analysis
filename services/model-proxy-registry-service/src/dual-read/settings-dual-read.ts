import type { ISettingsService } from "../services/settings.service.js";
import type { RouterSettingsValue } from "../types/settings.js";

export async function getDefaultCredential(
  settingsService: ISettingsService,
): Promise<string | null> {
  return settingsService.getDefaultCredential();
}

export async function getHealthCheckPrompt(
  settingsService: ISettingsService,
): Promise<string | null> {
  return settingsService.getHealthCheckPrompt();
}

export async function getRouterSettings(
  settingsService: ISettingsService,
): Promise<RouterSettingsValue | null> {
  return settingsService.getRouterSettings();
}
