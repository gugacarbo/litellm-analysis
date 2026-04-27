# packages/shared/src/

## OVERVIEW
Shared TypeScript types and Zod schemas for agent/category configuration. Single source of truth for config interfaces consumed by `@lite-llm/agents-manager`.

## STRUCTURE

```
shared/src/
├── types/
│   └── agent-config.ts  # AgentConfig, CategoryConfig, Zod schemas
└── index.ts             # Barrel: 7 type exports + 6 schema exports
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add config type | `types/agent-config.ts` | Add interface + Zod schema |
| Add permission type | `types/agent-config.ts` | `Permission` interface |
| Change schema validation | `types/agent-config.ts` | Zod schemas exported alongside types |
| Add subpath export | `package.json` → `exports` | Use `"./types/*"` pattern |

## KEY TYPES

| Type | Purpose |
|------|---------|
| `AgentConfig` | Single agent definition (name, model, permissions) |
| `CategoryConfig` | Agent category grouping |
| `AgentConfigFile` | Full config file (agents + categories) |
| `OhMyOpenAgentConfig` | OpenAgent output format |
| `Permission` | Agent permission flags |
| `Thinking` | Thinking mode configuration |
| `GitMaster` | Git master configuration |

## KEY SCHEMAS

| Schema | Validates |
|--------|-----------|
| `agentConfigSchema` | `AgentConfig` |
| `categoryConfigSchema` | `CategoryConfig` |
| `agentConfigFileSchema` | `AgentConfigFile` |
| `ohMyOpenAgentConfigSchema` | `OhMyOpenAgentConfig` |
| `permissionSchema` | `Permission` |
| `thinkingSchema` | `Thinking` |

## CONVENTIONS

- Types and schemas defined together in `agent-config.ts`
- Zod schemas exported alongside TypeScript types
- Uses `zod` v3 for schema validation
- No I/O — types only, no file operations

## ANTI-PATTERNS

- Don't add file I/O — this package is types/schemas only
- Don't duplicate types in consuming packages — import from here
- Don't use `as any` in schema definitions — use proper Zod typing
