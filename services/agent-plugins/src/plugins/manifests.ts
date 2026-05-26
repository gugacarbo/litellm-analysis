import type { PluginManifest } from "../sdk";
import { litellmAliasManifest } from "./litellm-alias/plugin.manifest";
import { openAgentManifest } from "./openagent/plugin.manifest";
import { openCodeManifest } from "./opencode/plugin.manifest";
import { vsCodeManifest } from "./vscode/plugin.manifest";
import { weaveManifest } from "./weave/plugin.manifest";

function normalizeManifestSchema<TId extends string>(
  manifest: PluginManifest<TId>,
): PluginManifest<TId> {
  const schema = manifest.$schema;
  if (
    schema.startsWith("http://") ||
    schema.startsWith("https://") ||
    schema.startsWith("file://") ||
    schema.startsWith("/")
  ) {
    return manifest;
  }

  return {
    ...manifest,
    $schema: new URL(
      schema,
      new URL(`./${manifest.id}/`, import.meta.url),
    ).toString(),
  };
}

export const pluginManifests = [
  normalizeManifestSchema(openCodeManifest),
  normalizeManifestSchema(openAgentManifest),
  normalizeManifestSchema(vsCodeManifest),
  normalizeManifestSchema(litellmAliasManifest),
  normalizeManifestSchema(weaveManifest),
] as const;
