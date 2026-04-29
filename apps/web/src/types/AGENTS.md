# apps/web/src/types/

## OVERVIEW

Shared TypeScript type definitions consumed by pages, components, and hooks. Contains domain types for agent routing, agent configs, and OpenAgent output format.

## STRUCTURE

```
types/
├── agent-routing.ts  # AgentConfig, CategoryConfig, AgentDefinition,
│                     # CategoryDefinition, AGENT_DEFINITIONS list,
│                     # CATEGORY_DEFINITIONS list
└── vitest.d.ts       # Vitest type declarations
```

## KEY TYPES

### agent-routing.ts

| Type | Purpose |
|------|---------|
| `AgentConfig` | Full agent configuration (model, fallbacks, skills, permissions, mode, etc.) |
| `CategoryConfig` | Category configuration (model, fallbacks, thinking, verbosity, etc.) |
| `AgentDefinition` | Agent metadata for UI display (key, name, description, icon) |
| `CategoryDefinition` | Category metadata for UI display (key, name, description) |
| `AgentRoutingConfig` | Alias map (`Record<string, string>`) |
| `OhMyOpenAgentConfig` | Top-level OpenAgent output format |

### Key Constants

| Constant | Purpose |
|----------|---------|
| `AGENT_DEFINITIONS` | Hardcoded list of agent metadata driving the Agents tab table. **Must be kept in sync with `db/db.json` agents.** Each entry has `key`, `name`, `description`, `icon`. |
| `CATEGORY_DEFINITIONS` | Hardcoded list of category metadata driving the Categories tab table. **Must be kept in sync with `db/db.json` categories.** Each entry has `key`, `name`, `description`. |

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new agent to UI | `agent-routing.ts` → `AGENT_DEFINITIONS` | Also add to `data/oh-my-agents.ts` and `db/db.json` |
| Add new category to UI | `agent-routing.ts` → `CATEGORY_DEFINITIONS` | Also add to `db/db.json` |
| Add agent config field | `agent-routing.ts` → `AgentConfig` | Mirrors `@litellm/shared` types |
| Change agent icon | `agent-routing.ts` → `AGENT_DEFINITIONS[i].icon` | Unicode emoji only |

## CONVENTIONS

- **Types are plain interfaces** — no Zod schemas here (those live in `@litellm/shared`)
- **AGENT_DEFINITIONS is the UI source of truth** — determines what appears in Agent Routing > Agents tab
- **Three places to update when adding agents**: `types/agent-routing.ts` (UI list), `data/oh-my-agents.ts` (static data), `db/db.json` (config source)
- **Types consumed by**: `pages/agent-routing/*`, `components/agent-routing/*`, `components/agent-config-editor.tsx`
- **No JSX or runtime logic** — types only

## ANTI-PATTERNS

- Don't add Zod schemas — use `@litellm/shared` for validation
- Don't forget to sync AGENT_DEFINITIONS when adding agents to db.json — agent won't appear in UI
- Don't add types here that belong in page directories — only shared types
