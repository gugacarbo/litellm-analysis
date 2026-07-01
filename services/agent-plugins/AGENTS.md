# @LITE-LLM/AGENT-PLUGINS

**Generated:** 2026-07-01
**Commit:** 3029bcb

## OVERVIEW

`@lite-llm/agent-plugins` — OpenCode/OpenAgent/VS Code plugin system. Per-consumer config generators that transform a canonical DB row (from `@lite-llm/agents-manager`) into the target's config dialect (e.g. `opencode.json`, `vscode-oaicopilot.json`). Owns the `*.schema.json` generation pipeline for all plugins.

## STRUCTURE

```
services/agent-plugins/
├── src/
│   ├── index.ts                    # Public barrel
│   ├── factory.ts                  # Plugin factory + registration
│   ├── plugin-registry.ts          # Registry of all available plugins
│   ├── plugin-catalog.ts           # Catalog metadata (name, description, output format)
│   ├── plugin-config-schemas.ts    # Aggregated Zod schemas for all plugins
│   ├── sdk.ts                      # Plugin author SDK (helpers for writing new plugins)
│   ├── errors.ts                   # PluginError taxonomy
│   ├── helpers.ts                  # Shared utilities (path resolution, JSONC write)
│   ├── types.ts                    # PluginManifest, PluginOutput, PluginContext types
│   ├── lib/
│   │   └── schema-generator.ts     # Zod → JSON Schema generator (drives *.schema.json)
│   └── plugins/
│       ├── manifests/              # Manifest-only plugins (metadata, no output)
│       ├── model-alias/            # Alias resolution plugin (legacy)
│       ├── openagent/              # OpenAgent output format
│       ├── opencode/               # OpenCode output format
│       ├── vscode/                 # VS Code Copilot output format
│       └── weave/                  # Weave config output format
└── package.json
```

## WHERE TO LOOK

| Task                              | Location                                                | Notes                                                |
| --------------------------------- | ------------------------------------------------------- | ---------------------------------------------------- |
| Add a new consumer plugin         | `src/plugins/<name>/`                                   | Implement `Plugin<Input, Output>` from `sdk.ts`; register in `plugin-registry.ts` |
| Update plugin metadata            | `@settings/plugins/plugins.jsonc`                       | Regenerated schemas live next to it                   |
| Regenerate JSON schemas           | `pnpm generate:plugin-schemas`                         | Outputs to `@settings/plugins/*.schema.json`          |
| Ensure schemas are current         | `pnpm ensure:plugin-schemas`                           | Idempotent; safe in CI                               |
| Add a shared helper               | `src/helpers.ts` or `src/sdk.ts`                        | Helpers are pure functions                           |
| Change error taxonomy             | `src/errors.ts`                                         | Export `PluginError` subtypes                        |

## CONVENTIONS

- **Plugin contract**: implement the `Plugin<Input, Output>` interface from `sdk.ts`. Plugins are pure: input → output, no I/O
- **Output writes happen outside the plugin**: the plugin returns a structured `PluginOutput`; the consumer (e.g. `factory.ts`) writes to disk
- **Schema generation**: every plugin's Zod schema feeds `@settings/plugins/*.schema.json` via `lib/schema-generator.ts`. Generated files are read-only
- **Manifest-only plugins**: plugins without output (e.g. info banners) live in `plugins/manifests/`
- **No Express, no HTTP**: this is a config-generation library
- **Plugin isolation**: plugins do not import each other; cross-plugin composition happens in `factory.ts`

## ANTI-PATTERNS (THIS PROJECT)

- Do not edit `*.schema.json` files manually — update the Zod source and regenerate
- Do not add I/O inside plugins — return `PluginOutput`; the consumer writes
- Do not import between plugins — compose in `factory.ts`
- Do not add HTTP/Express primitives
- Do not add new top-level files to `src/` — extend existing modules or add to `plugins/`

## COMMANDS

```bash
pnpm --filter @lite-llm/agent-plugins build                    # ~10s
pnpm --filter @lite-llm/agent-plugins typecheck                # ~10s
pnpm --filter @lite-llm/agent-plugins test                     # ~10s
pnpm --filter @lite-llm/agent-plugins generate:plugin-schemas  # ~5s
pnpm --filter @lite-llm/agent-plugins ensure:plugin-schemas    # ~5s
```