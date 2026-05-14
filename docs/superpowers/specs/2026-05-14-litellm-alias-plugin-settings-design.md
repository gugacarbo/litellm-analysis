# LiteLLM Alias Plugin Settings Screen

## Context

The `LitellmAliasPlugin` generates `model_group_alias` configuration for LiteLLM's router. Currently it has no user-configurable settings — it generates aliases from all agents and categories with no customization. Users need the ability to control what gets included and how aliases are named.

## Design

### Configuration Options

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `aliasPrefix` | `string` | `""` | Text prepended to every generated alias key |
| `includeAgents` | `boolean` | `true` | Include agent-based aliases in output |
| `includeCategories` | `boolean` | `true` | Include category-based aliases in output |
| `globalFallbackOverride` | `string` | `""` | Override global fallback model (empty = use default) |

### Behavior

**`buildOutput()` changes:**
- If `aliasPrefix` is set (e.g., `"myprefix:"`), prepend it to every alias key before output
- If `includeAgents` is `false`, skip the agent alias generation loop
- If `includeCategories` is `false`, skip the category alias generation loop
- If `globalFallbackOverride` is non-empty, use it instead of `ctx.globalFallbackModel`

**`getInternalAgents()`:** remains `[]` — no agent mapping needed

**`getConfigSchema()`:** returns the 4 fields above

### UI

The existing plugin config page at `/plugins/litellm-alias` renders automatically via `PluginConfigForm` — no new components needed. The page already handles all field types (string inputs + boolean toggles).

### Files to Modify

| File | Change |
|------|--------|
| `packages/agents-manager/src/plugins/external/litellm-alias.plugin.ts` | Add `getConfigSchema()`, update `buildOutput()` to read config |

### Out of Scope

- New frontend components (existing `PluginConfigForm` suffices)
- Changing the `AliasDbWriter` interface
- Agent mapping UI (this plugin has no internal agents)
