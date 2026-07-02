import type { ISettingsService } from "../services/settings.service.js";
import type { RouterSettingsValue } from "../types/settings.js";

export async function getDefaultProvider(
  settingsService: ISettingsService,
): Promise<string | null> {
  return settingsService.getDefaultProvider();
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
