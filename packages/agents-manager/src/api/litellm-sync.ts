// ── LiteLLM Model Sync ──
// Syncs real models from db.json to LiteLLM proxy.

import { upsertModelToLiteLLM } from "./litellm-sync/http.js";
import { buildModelUpsertPayload } from "./litellm-sync/payload.js";
import { getStorage } from "./singleton.js";

export interface LiteLLMSyncOptions {
  skipSync?: boolean;
}

export async function syncToLiteLLM(
  options?: LiteLLMSyncOptions,
): Promise<number> {
  if (options?.skipSync) {
    return 0;
  }

  const storage = getStorage();
  if (!storage) {
    console.warn("[agents-manager] Storage not initialized, skipping sync");
    return 0;
  }

  const config = await storage.read();

  if (!config.litellm?.baseUrl || !config.litellm?.apiKey) {
    console.warn(
      "[agents-manager] No LiteLLM configuration found, skipping sync",
    );
    return 0;
  }

  const modelPayloads = Object.entries(config.models || {}).map(
    ([modelName, spec]) => buildModelUpsertPayload(modelName, spec),
  );

  let synced = 0;
  const total = modelPayloads.length;
  const errors: Array<{ model: string; error: string }> = [];

  for (const payload of modelPayloads) {
    try {
      await upsertModelToLiteLLM(
        config.litellm.baseUrl,
        config.litellm.apiKey,
        payload,
      );
      synced++;
    } catch (error) {
      errors.push({
        model: payload.model_name,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (errors.length > 0) {
    console.error(
      `[agents-manager] Failed to sync ${errors.length} models to LiteLLM:`,
      errors,
    );
  }

  console.log(`[agents-manager] Synced ${synced}/${total} models to LiteLLM`);
  return synced;
}
