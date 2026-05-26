import type { OpenCodePluginConfig } from "./plugin.config";

export const opencodePluginDefaults = {
  $schema: "https://opencode.ai/config.json",
  defaultModel: "",
  defaultTemperature: 0.2,
} satisfies Required<OpenCodePluginConfig>;
