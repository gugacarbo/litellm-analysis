# apps/web/src/types/

## OVERVIEW

Shared TypeScript type definitions consumed by pages, components, and hooks. Contains domain types for agent routing, agent configs, and OpenAgent output format.

## STRUCTURE

```
types/
├── agent-routing.ts  # AgentConfig, CategoryConfig, AgentDefinition,
│                     # CategoryDefinition, AgentRoutingConfig,
│                     # OhMyOpenAgentConfig
└── vitest.d.ts       # Vitest type declarations
```

## KEY TYPES

### agent-routing.ts

| Type                  | Purpose                                                                      |
| --------------------- | ---------------------------------------------------------------------------- |
| `AgentConfig`         | Full agent configuration (model, fallbacks, skills, permissions, mode, etc.) |
| `CategoryConfig`      | Category configuration (model, fallbacks, thinking, verbosity, etc.)         |
| `AgentDefinition`     | Agent metadata for UI display (key, name, description, icon)                 |
| `CategoryDefinition`  | Category metadata for UI display (key, name, description)                    |
| `AgentRoutingConfig`  | Alias map (`Record<string, string>`)                                         |
| `OhMyOpenAgentConfig` | Top-level OpenAgent output format                                            |

## WHERE TO LOOK

| Task                   | Location                           | Notes                           |
| ---------------------- | ---------------------------------- | ------------------------------- |
| Add agent config field | `agent-routing.ts` → `AgentConfig` | Mirrors `@litellm/shared` types |

## CONVENTIONS

- **Types are plain interfaces** — no Zod schemas here (those live in `@litellm/shared`)
- **Agent/category metadata comes from the API** — fetched via Agent Catalog API
- **Types consumed by**: `pages/agent-routing/*`, `components/agent-routing/*`, `components/agent-config-editor.tsx`
- **No JSX or runtime logic** — types only

## ANTI-PATTERNS

- Don't add Zod schemas — use `@litellm/shared` for validation
- Don't forget to sync AGENT_DEFINITIONS when adding agents to db.json — agent won't appear in UI
- Don't add types here that belong in page directories — only shared types
