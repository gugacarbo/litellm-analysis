import { pluginManifests } from "../plugins/manifests";

/**
 * Plugin schema registry — derived from plugin manifests.
 *
 * Each entry maps a pluginId to its $schema URL (read from the manifest)
 * and the output path where the generated Zod schema file will be written.
 */
export type RegisteredPluginSchema = {
  pluginId: string;
  /** $schema URL read from the plugin manifest */
  schemaUrl: string;
  /** Relative path (from package root) where the generated plugin.schema.ts will be written */
  generatedSchemaPath: string;
};

export const registeredPluginSchemas: RegisteredPluginSchema[] =
  pluginManifests.map((manifest) => ({
    pluginId: manifest.id,
    schemaUrl: manifest.$schema,
    generatedSchemaPath: `src/plugins/${manifest.id}/plugin.schema.ts`,
  }));
