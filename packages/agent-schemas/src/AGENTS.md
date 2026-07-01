# @LITE-LLM/AGENT-SCHEMAS/SRC

**Generated:** 2026-07-01
**Commit:** 3029bcb

## OVERVIEW

`@lite-llm/agent-schemas` — shared TypeScript types for agent/category configuration. Source of truth for interfaces consumed by `@lite-llm/agents-manager` and `apps/web/src/shared/types/`. Migration note: previously known as `@lite-llm/shared`; the old `AgentConfig`/`CategoryConfig` types were removed in favor of `SystemAgent` (see `index.ts`).

## STRUCTURE

```
packages/agent-schemas/src/
├── index.ts             # Public barrel — 4 type exports
├── types/
│   └── agent-config.ts  # AgentExtraConfig, PluginRouting, PluginRoutingRule, SystemAgent
└── (no Zod schemas — types only; runtime validation is in repositories/*)
```

## KEY TYPES

| Type                  | Purpose                                                              |
| --------------------- | -------------------------------------------------------------------- |
| `AgentExtraConfig`    | Per-agent extra config (model, fallbacks, thinking, permissions)     |
| `PluginRouting`       | Routing rule container                                                |
| `PluginRoutingRule`   | Single routing rule (match criteria → target agent)                   |
| `SystemAgent`         | Canonical agent record consumed by agents-manager services            |

## WHERE TO LOOK

| Task                              | Location                          | Notes                                    |
| --------------------------------- | --------------------------------- | ---------------------------------------- |
| Add an agent config field         | `types/agent-config.ts`           | Add to `AgentExtraConfig` or `SystemAgent`|
| Add a routing rule type           | `types/agent-config.ts`           | Extend `PluginRoutingRule`               |
| Add a subpath export              | `package.json` → `exports`        | Use `"./types/*"` pattern                |

## CONVENTIONS

- **Types only — no Zod schemas.** Runtime validation lives in `repositories/agents-repository`/`repositories/models-repository`.
- **Mirrored in web app**: `apps/web/src/shared/types/` mirrors these types without runtime imports (avoids Zod in browser bundle).
- **`SystemAgent` replaces legacy `AgentConfig`/`CategoryConfig`**: do not reintroduce old types.
- **No I/O**: this package has no runtime file operations.

## ANTI-PATTERNS (THIS PROJECT)

- Do not add Zod schemas here — runtime validation is in repositories
- Do not duplicate types in consuming packages — import from here
- Do not reintroduce `AgentConfig`/`CategoryConfig` — use `SystemAgent`
- Do not add `as any` in type definitions — proper typing required