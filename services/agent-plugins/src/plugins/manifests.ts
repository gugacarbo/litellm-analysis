import type { PluginManifest } from "../sdk";
import { litellmAliasManifest } from "./litellm-alias/manifest/manifest";
import { openAgentManifest } from "./openagent/manifest/manifest";
import { openCodeManifest } from "./opencode/manifest/manifest";
import { vsCodeManifest } from "./vscode/manifest/manifest";
import { weaveManifest } from "./weave/manifest/manifest";

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
