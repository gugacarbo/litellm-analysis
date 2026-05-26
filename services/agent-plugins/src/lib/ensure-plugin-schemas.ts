import { registeredPluginSchemas } from "./plugin-schemas";
import { generatePluginSchema } from "./schema-generator";

export async function ensurePluginSchemas(): Promise<void> {
  for (const spec of registeredPluginSchemas) {
    await generatePluginSchema(spec);
  }
}
