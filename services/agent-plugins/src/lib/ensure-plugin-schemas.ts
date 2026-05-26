import { registeredPluginSchemas } from "./plugin-schemas";
import {
  generatePluginSchema,
  shouldGeneratePluginSchema,
} from "./schema-generator";

export async function ensurePluginSchemas(): Promise<void> {
  for (const spec of registeredPluginSchemas) {
    const shouldGenerate = await shouldGeneratePluginSchema(spec);
    if (!shouldGenerate) {
      continue;
    }

    await generatePluginSchema(spec);
  }
}
