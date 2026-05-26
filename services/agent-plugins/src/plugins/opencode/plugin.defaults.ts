import {
  OPENCODE_DEFAULT_MODEL_DEFAULT,
  OPENCODE_DEFAULT_TEMPERATURE_DEFAULT,
  OPENCODE_SCHEMA_URL_DEFAULT,
  type OpenCodePluginConfig,
} from "@lite-llm/agents-repository/schemas";

export const opencodePluginDefaults: OpenCodePluginConfig = {
  $schema: OPENCODE_SCHEMA_URL_DEFAULT,
  defaultModel: OPENCODE_DEFAULT_MODEL_DEFAULT,
  defaultTemperature: OPENCODE_DEFAULT_TEMPERATURE_DEFAULT,
};
